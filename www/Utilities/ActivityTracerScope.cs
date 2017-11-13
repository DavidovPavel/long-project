using System;
using System.Diagnostics;

namespace www.Utilities
{
    public class ActivityTracerScope : IDisposable
    {
        private readonly Guid oldActivityId;
        private readonly TraceSource ts;
        private readonly string activityName;
        private readonly string _activityData;

        public ActivityTracerScope(TraceSource ts, string activityName, string activityData = null)
        {
            Guid newActivityId = Guid.NewGuid();
            this.ts = ts;
            oldActivityId = Trace.CorrelationManager.ActivityId;
            this.activityName = activityName;
            _activityData = activityData;

            if (oldActivityId != Guid.Empty)
                ts.TraceTransfer(0, String.Format("{0}::Starting new activity...", _activityData), newActivityId);

            Trace.CorrelationManager.ActivityId = newActivityId;
            ts.TraceEvent(TraceEventType.Start, 0, activityName);
        }

        public void Dispose()
        {
            if (oldActivityId != Guid.Empty)
                ts.TraceTransfer(0, String.Format("{0}::Finished activity...", _activityData), oldActivityId);

            ts.TraceEvent(TraceEventType.Stop, 0, activityName);
            Trace.CorrelationManager.ActivityId = oldActivityId;
        }
    }
}
