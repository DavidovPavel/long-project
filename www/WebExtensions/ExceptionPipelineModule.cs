using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNet.SignalR.Hubs;

namespace www.WebExtensions
{
    public class ExceptionPipelineModule : HubPipelineModule
    {
        private readonly TraceSource trace = new TraceSource("HubExceptions");

        protected override void OnIncomingError(ExceptionContext exceptionContext,
            IHubIncomingInvokerContext invokerContext)
        {
            //1. log
            try
            {
                MethodDescriptor method = invokerContext.MethodDescriptor;
                trace.TraceError("Exception thrown by: {0}.{1}({2}):{3}", method.Hub.Name, method.Name,
                    String.Join(", ", invokerContext.Args), exceptionContext.Error);
            }
            catch
            {
            }

            //2. inform client of exception if you want
            try
            {
                invokerContext.Hub.Clients.Caller.notifyOfException();
            }
            catch
            {
            }

        }
    }
}
