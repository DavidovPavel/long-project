using ANBR.SemanticArchive.SDK.ObjectModel;
using System.Collections.Generic;
using System.Web.Http;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api
{
    public class LinksController : ApiController
    {
        [HttpGet]
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> ForType(int typeid, int objid)
        {
           ISaObject leftObject =  WebSaUtilities.Database.ObjectModel.GetObject(objid);
           return SDKHelper.GetRolesForLink(leftObject.MetaType.ID, typeid);
        }
    }
}
