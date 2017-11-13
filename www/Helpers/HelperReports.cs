using System;
using System.Web;
using System.Web.Hosting;
using ABS.WReportsProcessing.Contracts;
using Anbr.Web.SA.CoreLogic;
using ANBR.Web.ExternalCore.Common;
using ANBR.Web.ExternalCore.Contract;
using www.SaGateway;

namespace www.Helpers
{
    public static class HelperReports
    {
        public static ModelReportABSGeneral WReportModelGet(int objectId, ContextData context)
        {
            if (objectId <= 0) throw new ArgumentOutOfRangeException(nameof(objectId));

            //objectId = 697843; //697856;
            WReportsAPIProxy proxy = Root.ProxyGetWReports();

            context = context ?? new ContextData
            {
                DBID = Scope.GetCurrentDBID(),
                Language = Root.GetCurrentLang(),
                ID = WebSaUtilities.GetCurrentUserID()
            };
            var model = proxy.GenerateWReportDefault(objectId, context);

            return model;
        }

        public static Uri WReportGetPDF(int objectId, string html)
        {
            if (objectId <= 0) throw new ArgumentOutOfRangeException(nameof(objectId));

            //objectId = 697843; //697856;
            WebWorkerAPIProxy proxy = Root.ProxyGetWorker();
            var localPath = proxy.HtmlpageToPdfLocalPath("Здесь будет наименование отчета", html);

            string path = System.IO.Path.Combine(HostingEnvironment.MapPath(Root.GetFolder_Temp()));
            string dateFolder = DateTime.Now.ToString("yyyyMMdd");
            string tempPath = System.IO.Path.Combine(path, "WReport", dateFolder);
            System.IO.Directory.CreateDirectory(tempPath);
            string fn = Guid.NewGuid().ToString();
            string fileNameOut = System.IO.Path.Combine(tempPath, fn + ".pdf");


            System.IO.File.Copy(localPath, fileNameOut, true);

            return new Uri(Root.GetFolder_Temp() + "WReport/" + dateFolder + "/" + fn + ".pdf", UriKind.Relative);
        }
    }
}