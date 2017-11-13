using System;
using System.Web.Mvc;
using System.Text;
using www.Helpers;
using www.Models;

namespace www.Controllers
{
    public class ReportsController : BaseController
    {
        [HttpGet]
        public ViewResult Index(int id)
        {
            return View();
        }

        [HttpGet]
        public ActionResult DataAsFile(int id)
        {
            var model = HelperReports.WReportModelGet(id, null);
            string xml = ANBR.Helpful.Misc.Serializer.Helper.XmlSerializer(model);

            Response.AddHeader("Content-Disposition", new System.Net.Mime.ContentDisposition { Inline = false, FileName = $"entity_{id}.xml" }.ToString());
            return Content(xml, System.Net.Mime.MediaTypeNames.Text.Xml, Encoding.UTF8);
        }

    }
}
