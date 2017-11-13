using System.Collections.Generic;
using System.Web.Http;
using ANBR.SemanticArchive.SDK;
using Newtonsoft.Json.Linq;
using www.SaGateway;
using ABS.Connectivity.Interaction;

namespace www.Controllers.api.inquiry
{
    public class InquiryObjectsController : ApiController
    {
        [HttpGet]
        public void SetRole(int id, int oid)
        {
            IDataBase saDB = WebSaUtilities.Database;

            string propVal = saDB._PropertyFastGet(oid, "InterestObjectINPUTDATA");
            var jData = JObject.Parse(propVal);
            jData["ProjectRole_ID"] = id;
            saDB._FieldFastSet(oid,
                new Dictionary<string, object>
                {
                    { "InterestObjectINPUTDATA", jData.ToString() },
                    { "ProjectRole_ID", id }
                });
        }
    }
}
