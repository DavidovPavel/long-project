using ANBR.SemanticArchive.SDK.GlobalBase;
using System;
using System.IdentityModel.Services;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Configuration;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Security;
using Anbr.Web.SA.CoreLogic;
using www.Models;
using www.SaGateway;

namespace www.Controllers
{
    public class AccountController : BaseController
    {

#if (RELEASE) 
        [AllowAnonymous]
        public ActionResult Login(string returnUrl)
        {
            var fam = FederatedAuthentication.WSFederationAuthenticationModule;
            SignInRequestMessage message;

            if (String.IsNullOrEmpty(returnUrl))
                message = new SignInRequestMessage(new Uri(fam.Issuer), fam.Realm);
            else
                message = new SignInRequestMessage(new Uri(fam.Issuer), fam.Realm, returnUrl);

            return new RedirectResult(message.WriteQueryString());
        }

        [HttpPost]
        [AllowAnonymous]
        public ActionResult LogOff()
        {
            var fam = FederatedAuthentication.WSFederationAuthenticationModule;

            fam.SignOut(false);
            SignOutRequestMessage signOutRequest = new SignOutRequestMessage(new Uri(fam.Issuer), fam.Realm);

            return new RedirectResult(signOutRequest.WriteQueryString());
        }
#endif

        public ActionResult LoginEx(string returnUrl)
        {
            if (returnUrl != null && (returnUrl.ToLower().StartsWith("wiki") ||
                                      returnUrl.ToLower().StartsWith("check") || 
                                      returnUrl.ToLower().StartsWith("inquiry") ||
                                      returnUrl.ToLower().StartsWith("services") ||
                                      returnUrl.ToLower().StartsWith("reqlibrary") ||
                                      returnUrl.ToLower().StartsWith("seasources")

                                      ))
            {
                string dbid = (string)RouteData.Values["dbid"];
                if (!String.IsNullOrEmpty(dbid) && dbid != "0")
                    return Redirect(String.Format("/lang-{0}/db{1}/{2}", Root.GetCurrentLang(), dbid, returnUrl));
            }

            ViewBag.ReturnUrl = returnUrl;
            return View("LoginEx");
        }

#if (DEBUG)
/*
        [AllowAnonymous]
        public ActionResult Login(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;
            return View("Login");
        }

        //
        // POST: /Account/Login
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult Login(LoginModel model, string returnUrl)
        {
            if (ModelState.IsValid)
            {
                if (!ValidateLogOn(model.UserName, model.Password, model.DatabaseID.Value))
                    return View("Login");

                FormsAuthentication.SetAuthCookie(model.UserName, model.RememberMe);

                if (!string.IsNullOrEmpty(returnUrl))
                    return Redirect(returnUrl);

                var url = RouteConfig.MvcUriBuilder.CreateUriFromRouteValues(
                    new RouteValueDictionary
                    {
                        { "dbid", model.DatabaseID},
                        { "lang", Root.GetCurrentLang()}
                    });
                return Redirect(url);
            }

            // If we got this far, something failed, redisplay form
            ModelState.AddModelError("", "The user name or password provided is incorrect.");
            return View("Login", model);
        }

        [NonAction]
        private bool ValidateLogOn(string userName, string password, int databaseID)
        {
            if (string.IsNullOrEmpty(userName))
                ModelState.AddModelError("username", "User name required");

            if (string.IsNullOrEmpty(password))
                ModelState.AddModelError("password", "Password required");

            if (ModelState.IsValid && !Membership.ValidateUser(userName, password))
                ModelState.AddModelError("_FORM", "Wrong user name or password");

            return ModelState.IsValid;
        }

        //
        // POST: /Account/LogOff
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult LogOff()
        {
            FormsAuthentication.SignOut();

            return RedirectToAction("Login", "Account");
        }
*/
#endif

#if (RELEASE_IS || DEBUG)
        [AllowAnonymous]
        public ActionResult Login(string returnUrl)
        {
            string userDescriptor = WebSaUtilities.GetCurrentUserID();
            IGlobalbase gb = WebSaUtilities.ConnectorInstance.GetGlobalDatabase(userDescriptor);

            ViewBag.ReturnUrl = returnUrl;

            System.Collections.Generic.List<SelectListItem> dbList = new System.Collections.Generic.List<SelectListItem>();
            foreach (IDatabaseInfo item in gb.Databases)
                dbList.Add(new SelectListItem() { Value = item.Id.ToString(), Text = item.Name });

            LoginModel model = new LoginModel();
            model.Databases = dbList;
            model.UserName = "dummy";
            model.Password = "dummy";

            HttpCookie cookie = this.ControllerContext.HttpContext.Request.Cookies["common"];
            if (cookie != null)
            {
                string uid = WebSaUtilities.GetCurrentUserID();
                string strDbID = cookie[String.Format("{0}.dbid", uid)];
                int dbID;
                if (!String.IsNullOrWhiteSpace(strDbID) && Int32.TryParse(strDbID, out dbID))
                {
                    IDatabaseInfo db = gb.Databases.ById(dbID);
                    if (db != null) model.DatabaseID = dbID;
                }
            }

            model.Servers = new System.Collections.Generic.List<SelectListItem>() { new SelectListItem() { Value = "0", Text = WebConfigurationManager.AppSettings["ServerName"] } };
            return View("LoginW", model);
        }

        //
        // POST: /Account/Login
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult Login(LoginModel model, string returnUrl)
        {
            if (ModelState.IsValid)
            {
                if (!model.DatabaseID.HasValue)
                {
                    ModelState.AddModelError("База данных", "База данных должна быть выбрана");
                    return View("LoginW", model);
                }

#warning дебильненько но работать пока будет
                if (returnUrl != null && (returnUrl.ToLower().StartsWith("wiki") ||
                                          returnUrl.ToLower().StartsWith("check") ||
                                          returnUrl.ToLower().StartsWith("inquiry") ||
                                          returnUrl.ToLower().StartsWith("services") ||
                                          returnUrl.ToLower().StartsWith("reqlibrary") ||
                                          returnUrl.ToLower().StartsWith("seasources")

                                          ))
                {
                    return Redirect(String.Format("/lang-{0}/db{1}/{2}", Root.GetCurrentLang(), model.DatabaseID, returnUrl));
                }

                if (!string.IsNullOrEmpty(returnUrl)) {
                    // смена базы данных  15.02.2016
                    Regex rgx = new Regex("db\\d+");
                    returnUrl = rgx.Replace(returnUrl, string.Format("db{0}", model.DatabaseID));
                    returnUrl = ANBR.Helpful.Misc.Uri.Helper.ExtractPathFromUrl(returnUrl);
                    return Redirect(returnUrl);
                }
                else
                {
                    var cookie = new HttpCookie("common");
                    string uid = WebSaUtilities.GetCurrentUserID();
                    cookie[String.Format("{0}.dbid", uid)] = model.DatabaseID.Value.ToString();
                    cookie.Expires = DateTime.Now.AddDays(30);
                    HttpContext.Response.Cookies.Add(cookie);

                    return Redirect(String.Format("/lang-{0}/db{1}", Root.GetCurrentLang(), model.DatabaseID));
                    /*
                                        var url = RouteConfig.MvcUriBuilder.CreateUriFromRouteValues(
                                            new
                                            {
                                                dbid = model.DatabaseID,
                                                lang = Root.GetCurrentLang()
                                            }
                                        );
                     */
                }
            }
            return View("LoginW", model);
        }

        //
        // POST: /Account/LogOff
        [HttpPost]
        public ActionResult LogOff()
        {
            //The code is based on decompiling the Microsoft.TeamFoundation.WebAccess which has the "Sign in as a different User" function.

            HttpCookie cookie = Request.Cookies["TSWA-Last-User"];

            if (User.Identity.IsAuthenticated == false || cookie == null ||
                StringComparer.OrdinalIgnoreCase.Equals(User.Identity.Name, cookie.Value))
            {
                string name = string.Empty;

                if (Request.IsAuthenticated)
                {
                    name = User.Identity.Name;
                }

                cookie = new HttpCookie("TSWA-Last-User", name);
                Response.Cookies.Set(cookie);

                Response.AppendHeader("Connection", "close");
                Response.StatusCode = 0x191;
                Response.Clear();
                //should probably do a redirect here to the unauthorized/failed login page
                //if you know how to do this, please tap it on the comments below
                Response.Write("Unauthorized. Reload the page to try again...");
                Response.End();

                return Redirect("/");
            }

            cookie = new HttpCookie("TSWA-Last-User", string.Empty)
            {
                Expires = DateTime.Now.AddYears(-5)
            };

            Response.Cookies.Set(cookie);

            return Redirect("/");
        }
#endif

        public enum ManageMessageId
        {
            ChangePasswordSuccess,
            SetPasswordSuccess,
            RemoveLoginSuccess,
        }
    }
}
