using System;
using System.Linq;
using System.Web.Mvc;
using System.Data;
using System.Threading.Tasks;
using Anbr.Web.SA.CoreLogic;
using www.Models;
using www.SaGateway;

namespace www.Controllers
{
    [OutputCache(NoStore = true, Duration = 0)]
    public class HomeController : BaseController
    {
       public ActionResult IndexR()
        {
            ViewBag.RealUrl = TempData["ret"];
            return View();
        }

        public ActionResult Index()
        {

#if (RELEASE)
            //ViewData["CurrentPrincipal"] = Thinktecture.IdentityModel.Authorization.ClaimPermission.CheckAccess(Constants.Operation.InRoles, "SA_ADMINISTRATOR") ? "SA_ADMINISTRATOR" : "Guest";

            //if (!Thinktecture.IdentityModel.Authorization.ClaimPermission.CheckAccess(Constants.Operation.InRoles, "SA_ADMINISTRATOR"))
            //{
            //    var fam = FederatedAuthentication.WSFederationAuthenticationModule;
            //    SignInRequestMessage message = new SignInRequestMessage(new Uri(fam.Issuer), fam.Realm);

            //    return new RedirectResult(message.WriteQueryString());
            //}
#endif

            //var table = GetObjectsByType(typeID);
            //корневой тип
            //IMetaType root = WebUtilities.Database.MetaModel.RootType;
            //IMetaTypes metaTypes = WebUtilities.Database.MetaModel.MetaTypes;
            //получение типов 
            //WebUtilities.Database.MetaModel.MetaTypes
            ViewBag.Title = "Analyst";
            return View();

        }

        /// <summary>
        /// Редактор главной страницы с набором граней
        /// </summary>
        /// <returns></returns>
        public async Task<ActionResult> Main()
        {
#warning 
            ((GLOBAL_SAModel)ViewBag.GLOBAL_SA).Points = new[] { "B47DF531-34A5-4E55-B03F-A987B0B97694" };
            ((GLOBAL_SAModel) ViewBag.GLOBAL_SA).Kind = "0";

            var model = (await ContentBL.EdgesGetAllAsync()).ConvertAll(Edge.ToEdge);
            foreach (Edge edge in model)
            {
                if (String.IsNullOrWhiteSpace(edge.Title))
                    edge.Title = Guid.NewGuid().ToString();
            }

            return View(model);
        }


        [NonAction]
        private DataTable GetObjectsByType(int typeID)
        {
            ANBR.SemanticArchive.SDK.Queries.IQueryResult qr = WebSaUtilities.Database.QueriesProvider.ExecuteTypeQuery("", typeID, true);
            return qr.DataSet.Tables[0];
        }
    }
}
