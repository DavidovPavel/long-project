using System;
using System.IO;
using System.Threading;
using System.Web.Hosting;
using Anbr.Web.SA.CoreLogic;
using ANBR.Helpful.Misc.Uniclasses;

namespace www.Events
{
    public class EventHandlers
    {
        public static void CleanTemporaryData()
        {
            try
            {
                // ReSharper disable once AssignNullToNotNullAttribute
                string tempFolder = Path.Combine(HostingEnvironment.MapPath(Root.GetFolder_Temp()), "WReport");
                var _ = new ServiceCleanTemporaryData(new[] { tempFolder }, Timeout.InfiniteTimeSpan,
                    (s, it) => it != ServiceCleanTemporaryData.ItemType.File || s.EndsWith(".pdf"));
            }
            catch (Exception e)
            {
                LogBL.Write("error", e.ToString());
            }
        }
    }
}