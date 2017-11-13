using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using www.Models;
using ANBR.SemanticArchive.SDK.ObjectModel;
using www.SaGateway;
using ANBR.SemanticArchive.SDK.MetaModel;
using System.Net;
using System.Text;
using System.Web;
using System.Linq;
using System.IO;
using System.Security.Claims;
using ANBR.Security.Common;
using www.Models.Items;

namespace www.Controllers.api
{
    public class TestController : ApiController
    {
        // GET api/object
        [ActionName("DefaultAction")]
        public HttpResponseMessage Get()
        {
            string msg = "empty";
            if (WebSaUtilities.Database != null)
            {
                msg = "ssid=" + HttpContext.Current.Session.SessionID + Environment.NewLine;
                msg += "dbtype=" + WebSaUtilities.Database.DatabaseType + "; name=" + WebSaUtilities.Database.ConnectionInfo.DatabaseName + Environment.NewLine;

                string userid = "unknown";

                ClaimsPrincipal user = ClaimsPrincipal.Current; // (ClaimsPrincipal)System.Threading.Thread.CurrentPrincipal;
                if (user != null)
                    userid = user.Claims.Single(item => item.Type == "http://idsrv.anbr.ru/claims/userkey").Value;

                msg += "userid=" + userid + Environment.NewLine;

                try
                {
                    Thinktecture.IdentityModel45.Authorization.ClaimPermission.CheckAccess(Constants.Operation.InRoles, "SA_DEMO");
                    msg += "111";
                }
                catch (Exception ex)
                {

                    msg += ex.ToString();
                }
            }

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(msg, Encoding.UTF8, "text/plain")
            };
        }

        [HttpGet]
        public IEnumerable<ListElement> LinkedFactsAndObjects(int id)
        {
            return new List<ListElement>();
        }


        [HttpGet]
        public void SendReport(int id)
        {
            var reports = WebSaUtilities.Reporting.GetReports(id);
            var report = reports.First();
            byte[] buffer = WebSaUtilities.Reporting.RenderReportToBytes(report.ReportServer, report.ReportPath, id, ANBR.Reporting.Contracts.ReportFormat.PDF);

            string path = HttpContext.Current.Server.MapPath(Root.GetFolder_Temp() + Path.GetRandomFileName() + ".pdf");
            File.WriteAllBytes(path, buffer);
        }

        [HttpGet]
        public void SendEmail(int id)
        {
            SendMessage msg = new SendMessage()
            {
                Email = "vvolkov@anbr.ru",
                Subject = "TEST"
            };
            msg.Text = File.ReadAllText(@"C:\___55555\test.html");

            Root.SendMail(msg, true);
        }

    }
}
