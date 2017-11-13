using System;
using System.Runtime.Remoting.Messaging;
using System.Threading;
using Anbr.Web.SA.CoreLogic;

namespace www.Events
{
    public class Cron
    {
        public static int CRON_DISPATCH_INTERVAL_MIN = 30;
        public delegate void ExecuteEvent();

        private static Cron _instance;
        public Timer Timer { get; private set; }

        public static Cron Instance => _instance ?? (_instance = new Cron());

        protected Cron()
        {
        }

        public void Start()
        {
            if (Timer != null) return;

            Timer = new Timer(CronCallback, null, TimeSpan.FromSeconds(0), TimeSpan.FromMinutes(CRON_DISPATCH_INTERVAL_MIN));
        }

        public void Stop()
        {
            if (Timer == null) return;

            Timer.Change(Timeout.Infinite, Timeout.Infinite);
            Timer.Dispose();
            Timer = null;
        }

        static void ApplicationErrorInternal(Exception ex)
        {
            LogBL.Write("cron", ex.ToString());
        }

        private void CronCallback(object state)
        {
            try
            {
                var caller = new ExecuteEvent(EventHandlers.CleanTemporaryData);
                caller.BeginInvoke(EventComplete, null);
            }
            catch (Exception ex)
            {
                ApplicationErrorInternal(ex);
            }
        }

        private void EventComplete(IAsyncResult result)
        {
            try
            {
                AsyncResult async = (AsyncResult)result;
                ExecuteEvent caller = (ExecuteEvent)async.AsyncDelegate;
                caller.EndInvoke(result);
            }
            catch (Exception ex)
            {
                ApplicationErrorInternal(ex);
            }
        }
    }
}