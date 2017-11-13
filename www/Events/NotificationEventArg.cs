using System;
using Anbr.Web.SA.CoreLogic.Model;

namespace www.Events
{
    public class NotificationEventArg: EventArgs
    {
        public NotificationReasonEnum NotificationReason { get; set; }
        public int TaskID { get; set; }
    }
}
