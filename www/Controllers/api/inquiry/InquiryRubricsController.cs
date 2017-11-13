using System;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using ANBR.SemanticArchive.SDK;
using www.SaGateway;

namespace www.Controllers.api.inquiry
{
    public class InquiryRubricsController : ApiController
    {
        [HttpGet]
        public void Remove(int id, int? oid = null)
        {

            IDataBase saDB = WebSaUtilities.Database;
            int? projectID = Scope.GetInternalPrjIDi();
            if (!projectID.HasValue) throw new InvalidOperationException("Project Id not found");

            if (!oid.HasValue || oid == 0)
                oid = projectID.Value;

            saDB.ObjectService.ProjectRubricsObjectRemoveFor(oid.Value, id);
        }

        [HttpGet]
        public void Set(int id, int? oldid = null, int? oid = null, string title = null)
        {
            IDataBase saDB = WebSaUtilities.Database;
            int? projectID = Scope.GetInternalPrjIDi();
            if (!projectID.HasValue) throw new InvalidOperationException("Project Id not found");

            if (!oid.HasValue || oid == 0)
                oid = projectID.Value;

            if (oldid.HasValue)
                saDB.ObjectService.ProjectRubricsObjectRemoveFor(oid.Value, oldid.Value);

            saDB.ObjectService.ProjectRubricsObjectAddFor(oid.Value, id);
        }
    }
}
