using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using ANBR.SemanticArchive.DataContracts;
using ANBR.SemanticArchive.SDK;
using Newtonsoft.Json.Linq;
using www.Areas.ExpressDossier.Models;
using www.Models;
using www.SaGateway;

namespace www.Controllers.api.ExpressDossier
{
    public class CheckObjectRubricsController : ApiController
    {
        [HttpGet]
        public void Remove(int id, int oid)
        {
            /*
            IDataBase saDB = WebUtilities.Database;
            saDB.ObjectService.ProjectRubricsObjectRemoveFor(oid, id);

            var propVal = saDB._PropertyFastGet(oid, "InterestObjectINPUTDATA");
            var jData = JObject.Parse(propVal);
            JToken jRubrics;
            if (jData.TryGetValue("Rubrics", StringComparison.Ordinal, out jRubrics))
            {
                var rubrics = jRubrics.ToObject<RubricsDescription[]>();
                rubrics = rubrics.Where(item => item.id != id).ToArray();

                jData["Rubrics"] = JArray.FromObject(rubrics);

                saDB._PropertyFastSet(oid, "InterestObjectINPUTDATA", jData.ToString());
            }
            */
        }

        [HttpGet]
        public void Set(int id, int oldid, int oid, string title)
        {
            /*
            IDataBase saDB = WebUtilities.Database;
            saDB.ObjectService.ProjectRubricsObjectRemoveFor(oid, oldid);
            saDB.ObjectService.ProjectRubricsObjectAddFor(oid, id);

            var propVal = saDB._PropertyFastGet(oid, "InterestObjectINPUTDATA");
            var jData = JObject.Parse(propVal);
            JToken jRubrics;
            if (jData.TryGetValue("Rubrics", StringComparison.Ordinal, out jRubrics))
            {
                var rubrics = new[] { new RubricsDescription { id = id, title = title } };
                jData["Rubrics"] = JArray.FromObject(rubrics);

                saDB._PropertyFastSet(oid, "InterestObjectINPUTDATA", jData.ToString());
            }
            */
        }
    }
}
