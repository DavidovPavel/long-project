using System;
using System.Linq;
using System.Web.Http;
using ANBR.SemanticArchive.SDK;
using Newtonsoft.Json.Linq;
using www.Areas.ExpressDossier.Models;
using www.SaGateway;

namespace www.Controllers.api.Common
{
    public class ObjectRubricsController : ApiController
    {
        [HttpGet]
        public void Remove(int id, int oid)
        {
            IDataBase saDB = WebSaUtilities.Database;
            saDB.ObjectService.RemoveRubricFromObject(oid, id);
        }

        [HttpGet]
        public void Set(int id, int oid, string title)
        {
            IDataBase saDB = WebSaUtilities.Database;
            saDB.ObjectService.AddRubricToObject(oid, id);
        }
    }
}
