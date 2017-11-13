using System;
using System.Collections.Generic;
using System.IdentityModel.Services;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using www.SaGateway;

namespace www.Controllers
{
    public class ErrorController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Unauthorized(string returnUrl = null)
        {
            if (!Request.IsAuthenticated)
            {
#if (RELEASE)
                var fam = FederatedAuthentication.WSFederationAuthenticationModule;
                SignInRequestMessage message;
                if (String.IsNullOrEmpty(returnUrl))
                    message = new SignInRequestMessage(new Uri(fam.Issuer), fam.Realm);
                else
                    message = new SignInRequestMessage(new Uri(fam.Issuer), fam.Realm, returnUrl);

                return new RedirectResult(message.WriteQueryString());
#endif
#if (RELEASE_IS || DEBUG)
                return RedirectToAction("Login", "Account", new { returnUrl = returnUrl });
#endif
            }
            else
                return View();
        }

        public ActionResult NotFound()
        {
            //Response.StatusCode = 404;
            return View();
        }

        public ActionResult http403()
        {
            //Response.StatusCode = 403;
            return View();
        }

        public ActionResult http500()
        {
            //Response.StatusCode = 500;
            return View();
        }

        public ActionResult Test()
        {
            SDKHelper.GetDictionaryItems("Author");

            /*
            string dataUrl = "net.tcp://SRV-DEMO:1011/DataService";
            string dispUrl = "net.tcp://SRV-DEMO:1011/DispatcherService";

            ANBR.Monitoring.Gateway gateway = ANBR.Monitoring.Gateway.CreateGateway(dataUrl, dispUrl, false);

            var typelist = gateway.Types.GetTypes();

            foreach (var item in gateway.Types.GetTypes())
            {
                var categoryName = ANBR.Tasks.Saver.AnalystHelper.MBFHelper.Instance.GetCategoryName(item, new List<string>() { "Person" }, false);
            }

             * 
             */

            var list = SDKHelper.Search_GetAllRobots();

            return View();
        }
    }
}
