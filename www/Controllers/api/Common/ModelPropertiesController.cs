using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using www.SaGateway;
using ABS.Connectivity.Interaction;

namespace www.Controllers.api.Common
{
    public class ModelPropertiesController : ApiController
    {
        [HttpGet]
        public string GetDisplayName(int id)
        {
            IDataBase saDB = WebSaUtilities.Database;
            return saDB._PropertyFastGet(id, _SAConst.Наименование);
        }
    }
}
