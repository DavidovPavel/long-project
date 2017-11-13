using System;
using System.Collections.Concurrent;
using System.ServiceModel;
using System.ServiceModel.Channels;
using System.ServiceModel.Description;
using System.Xml;

namespace www.SaGateway
{
    public static class WCFHelper
    {
        const int OPERATION_TIMEOUT_MIN = 10;
        static readonly ConcurrentDictionary<string, ChannelFactory> _factories = new ConcurrentDictionary<string, ChannelFactory>();

        public static void CloseAllChannels()
        {
            lock (_factories)
            {
                foreach (var item in _factories)
                    item.Value.Close();

                _factories.Clear();
            }
        }

        static ChannelFactory<T> GetChannelFactory<T>(string endpoint)
        {
            // ReSharper disable once InconsistentlySynchronizedField
            if (!_factories.ContainsKey(endpoint))
                lock (_factories)
                {
                    if (!_factories.ContainsKey(endpoint))
                    {
                        var binding = GetBinding(new Uri(endpoint));

                        var factoryDataService = new ChannelFactory<T>(binding, new EndpointAddress(endpoint));

                        foreach (OperationDescription operation in factoryDataService.Endpoint.Contract.Operations)
                            foreach (var behavior in operation.Behaviors)
                            {
                                var b = behavior as DataContractSerializerOperationBehavior;
                                if (b != null)
                                    b.MaxItemsInObjectGraph = int.MaxValue;
                            }

                        _factories[endpoint] = factoryDataService;
                    }
                }

            // ReSharper disable once InconsistentlySynchronizedField
            return (ChannelFactory<T>)_factories[endpoint];
        }

        static Binding GetBinding(Uri uri)
        {
            Binding binding = null;
            switch (uri.Scheme)
            {
                case "net.tcp":
                    {
                        binding = new NetTcpBinding() { ReaderQuotas = new XmlDictionaryReaderQuotas() { MaxStringContentLength = int.MaxValue, MaxArrayLength = int.MaxValue } };
                        ((NetTcpBinding)binding).MaxReceivedMessageSize = 214748364;
                        break;
                    }

                case "http":
                    {
                        binding = new BasicHttpBinding() { ReaderQuotas = new XmlDictionaryReaderQuotas() { MaxStringContentLength = int.MaxValue, MaxArrayLength = int.MaxValue } };
                        ((BasicHttpBinding)binding).MaxReceivedMessageSize = 214748364;
                        break;
                    }
                case "https":
                    {
                        binding = new BasicHttpsBinding() { ReaderQuotas = new XmlDictionaryReaderQuotas() { MaxStringContentLength = int.MaxValue, MaxArrayLength = int.MaxValue } };
                        ((BasicHttpsBinding)binding).MaxReceivedMessageSize = 214748364;
                        break;
                    }
                case "net.pipe":
                    {
                        binding = new NetNamedPipeBinding() { ReaderQuotas = new XmlDictionaryReaderQuotas() { MaxStringContentLength = int.MaxValue, MaxArrayLength = int.MaxValue } };
                        ((NetNamedPipeBinding)binding).MaxReceivedMessageSize = 214748364;
                        break;
                    }
            }

            return binding;
        }

        public static T ServiceRef<T>(string endpoint) where T : class
        {
            var factory = GetChannelFactory<T>(endpoint);
            try
            {
                var channel = factory.CreateChannel();
                ((IContextChannel)channel).OperationTimeout = TimeSpan.FromMinutes(OPERATION_TIMEOUT_MIN);

                return channel;
            }
            catch
            {
                factory.Abort();

                throw;
            }
        }

        public static T ServiceRef<T>(Uri endpoint) where T : class
        {
            return ServiceRef<T>(endpoint.OriginalString);
        }

    }
}