using Anbr.Web.SA.CoreLogic;
using ANBR.Reporting.Contracts;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Xml.Linq;
using www.Models.ExpressDossier;
using www.SaGateway;
using Omu.ValueInjecter;
using Anbr.Web.SA.CoreLogic.Model.check;
using www.Models.Items;

namespace www.Controllers.api.ExpressDossier
{
    public class ReportController : ApiController
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [ActionName("DefaultAction")]
        public HttpResponseMessage UploadReportsArchived(ModelReportsSelected model)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            string dbID = Scope.GetCurrentDBID();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
            string dbKey = dbID + "|$|" + dbName;
            int? projectId = Scope.GetInternalPrjIDi();

            var dto = (ReportsSelectedDTO)new ReportsSelectedDTO().InjectFrom(model);

            NotificationBL.RegisterUploadSelectedReportsForUser(userID, dbKey, dto,
                System.Threading.Thread.CurrentThread.CurrentUICulture, projectId);

            if (model.Action == 0)
                return Request.CreateResponse(HttpStatusCode.Created, Root.GetResource("Report_UploadReportsArchived"));
            return Request.CreateResponse(HttpStatusCode.Created, Root.GetResource("Report_UploadReportsArchived_0"));
        }


        /// <summary>
        /// Получает список SqlReporting отчетов, зареганых в CheckReportingConfiguration.xml 
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get(int id)
        {
            var saObj = WebSaUtilities.Database.ObjectModel.GetObject(id);

            if (saObj == null) return new List<ListElement>();

            string baseType = null;
            if (saObj.MetaType.IsPerson) baseType = "person";
            if (baseType == null && saObj.MetaType.IsOrganization) baseType = "organization";

            string path = HttpContext.Current.Server.MapPath("~/App_Data/CheckReportingConfiguration.xml");
            var doc = XDocument.Load(path);

            IReportingService r = WebSaUtilities.Reporting;
            var allReports = r.GetReports(0);

            var q = (
                from ReportOnObject rs in allReports
                join rd in
                    doc.Descendants("rep").Where(item => item.Attribute("type")?.Value == baseType)
                    on rs.ReportPath equals rd.Attribute("path")?.Value
                select new { rs.ReportId, title = rd.Attribute("title")?.Value }
                ).ToList();

            return q.Select(item => new ListElement
            {
                id = item.ReportId,
                title = Root.GetResource(item.title)
            });
        }
    }
}