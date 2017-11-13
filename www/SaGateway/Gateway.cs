using System;
using System.ServiceModel;
using System.Collections.Concurrent;
using System.ServiceModel.Channels;

namespace www
{
    internal static class Gateway
    {
        const int OPERATION_TIMEOUT_MIN = 10;
        static ConcurrentDictionary<string, ChannelFactory> _factories = new ConcurrentDictionary<string, ChannelFactory>();
        static public void CloseAllChannels()
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

            if (!_factories.ContainsKey(endpoint))
                lock (_factories)
                {
                    if (!_factories.ContainsKey(endpoint))
                    {
                        var binding = GetBinding(new Uri(endpoint));
                        _factories[endpoint] = new ChannelFactory<T>(binding, new EndpointAddress(endpoint));
                    }
                }

            return (ChannelFactory<T>)_factories[endpoint];
        }

        static Binding GetBinding(Uri uri)
        {
            Binding binding = null;
            switch (uri.Scheme)
            {
                case "net.tcp":
                    {
                        binding = new NetTcpBinding();
                        ((NetTcpBinding)binding).MaxReceivedMessageSize = 214748364;
                        ((NetTcpBinding) binding).ReceiveTimeout = TimeSpan.FromSeconds(30);
                        break;
                    }

                case "http":
                    {
                        binding = new BasicHttpBinding();
                        ((BasicHttpBinding)binding).MaxReceivedMessageSize = 214748364;
                        ((BasicHttpBinding)binding).ReceiveTimeout = TimeSpan.FromSeconds(30);
                        break;
                    }
                case "https":
                    {
                        binding = new BasicHttpsBinding();
                        ((BasicHttpsBinding)binding).MaxReceivedMessageSize = 214748364;
                        ((BasicHttpsBinding)binding).ReceiveTimeout = TimeSpan.FromSeconds(30);
                        break;
                    }
                case "net.pipe":
                    {
                        binding = new NetNamedPipeBinding();
                        ((NetNamedPipeBinding)binding).MaxReceivedMessageSize = 214748364;
                        ((NetNamedPipeBinding)binding).ReceiveTimeout = TimeSpan.FromSeconds(30);
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
