using System.Web.Mvc;
using Anbr.Web.SA.CoreLogic;
using System.IO;
using www.SaGateway;
using www.WebExtensions;

namespace www.Controllers
{
    public class OriginalController : BaseController
    {
        [Compress]
        public ActionResult Index()
        {
            string userDescriptor = WebSaUtilities.GetCurrentUserID();
            string resource = "Rule_OriginalDoc";
            string kind = "GET";
            string uri = Request.RawUrl;

            bool hasViolated = StatisticsBL.OperationRulesViolated(userDescriptor, kind, resource);
            if (!hasViolated)
            {
                StatisticsBL.OperationTransaction(userDescriptor, kind, resource, uri);
                string path = Server.MapPath(Request.RawUrl);
                string fn = Path.GetFileName(path);

                Response.AddHeader("Content-Disposition", new System.Net.Mime.ContentDisposition { Inline = true, FileName = fn }.ToString());
                return File(path, "text/html");
            }

            TempData["MsgHeader"] = "Ограничение DEMO-режима";
            TempData["MsgContent"] = "Был достигнут лимит просмотров оригинала источника.";

            return RedirectToAction("Index", "Alert");
        }
    }
}
