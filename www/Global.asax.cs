using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.IdentityModel.Services;
using System.Net;
using System.Security;
using System.Web;
using System.Web.Helpers;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using SaAdminBridgeContract;
using www.Controllers;
using www.SaGateway;
using System.Net.Http;
using System.Web.SessionState;
using ANBR.Security.Common;
using System.IdentityModel.Claims;
using System.Linq;
using System.Reflection;
using Anbr.Web.SA.CoreLogic;
using LicenseHelper;
using www.Events;
using www.WebExtensions;

namespace www
{
    public class MvcApplication : HttpApplication
    {
#if (RELEASE)
        static string _idsrvEndpoint = "https://idsrv.anbr.ru/issue/wstrust/mixed/username";
        static string _realm = "https://sadminbridge.anbr.ru/";
        static string _service = "https://sadminbridge45.anbr.ru/service.svc";
#endif

        protected void Application_PostAuthorizeRequest()
        {
            if (IsWebApiRequest())
            {
                HttpContext.Current.SetSessionStateBehavior(SessionStateBehavior.Required);
            }
        }

        private static bool IsWebApiRequest()
        {
            return HttpContext.Current.Request.AppRelativeCurrentExecutionFilePath.StartsWith(WebApiConfig.UrlPrefixRelative);
        }

        void WSFederationAuthenticationModule_AuthorizationFailed(object sender, AuthorizationFailedEventArgs e)
        {
            e.RedirectToIdentityProvider = false;
        }

        object GetSensibleByKey(string key)
        {
            return Scope.GetCurrentDBID();
        }

        void Application_End(object sender, EventArgs e)
        {
            Cron.Instance.Stop();
            BackgroundThread.Stop();
        }

        protected void Application_Start()
        {
#if (DEBUG)
            BundleTable.EnableOptimizations = false;
#else
            BundleTable.EnableOptimizations = true;
#endif

#if (RELEASE)
            Guid ssid = SDKHelper.SAAdminBridgeKey;

            SecurityEnvironment.RegisterSessionSensibleData(GetSensibleByKey);
            Tuple<Type, string> kvp = new Tuple<Type, string>(typeof(ISAAdminBridge), _service);
            SecurityEnvironment.Startup(ssid, _idsrvEndpoint, _realm, new[] { kvp });
            SecurityEnvironment.LogIn(ssid, ConfigurationManager.AppSettings["AdmLogin"], ConfigurationManager.AppSettings["AdmPwd"]);

            System.IdentityModel.Services.FederatedAuthentication.FederationConfiguration.IdentityConfiguration.ClaimsAuthorizationManager = new AuthorizationManager45();
            AntiForgeryConfig.UniqueClaimTypeIdentifier = ClaimTypes.Name;
#endif

            Anbr.Web.SA.CoreLogic.Scope.RegisterContextInfoReturFunction(ReturnUsingContext);
            Anbr.Web.SA.CoreLogic.Scope.PhysicalRoot = HostingEnvironment.ApplicationPhysicalPath;


            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            GlobalConfiguration.Configure(WebApiConfig.Register);
            RouteConfig.RegisterRoutes(RouteTable.Routes);

            //AreaRegistration.RegisterAllAreas();

            BundleConfig.RegisterBundles(BundleTable.Bundles);

            GlobalConfiguration.Configuration.MessageHandlers.Insert(0, new CustomAuthorizationApiHandler());
            GlobalConfiguration.Configuration.MessageHandlers.Insert(0, new WebApiExceptionHandler());
            GlobalConfiguration.Configuration.Filters.Add(new UnhandledExceptionFilterAttribute()
                    .Register<KeyNotFoundException>(HttpStatusCode.NotFound)
                    .Register<SecurityException>(HttpStatusCode.Forbidden)
                    .Register<SqlException>(
                            (exception, request) =>
                            {
                                var sqlException = exception as SqlException;

                                if (sqlException != null && sqlException.Number > 50000)
                                {
                                    var response = request.CreateResponse(HttpStatusCode.BadRequest);
                                    response.ReasonPhrase = sqlException.Message.Replace(Environment.NewLine, String.Empty);

                                    return response;
                                }
                                return request.CreateResponse(HttpStatusCode.InternalServerError);
                            }
                        )
            );


            Microsoft.AspNet.SignalR.GlobalHost.HubPipeline.AddModule
                    (new ExceptionPipelineModule());

            BackgroundThread.Start();
            Cron.Instance.Start();
        }

        public static Anbr.Web.SA.CoreLogic.Scope.Context ReturnUsingContext()
        {
            if (HttpContext.Current == null)
            {
                return new Anbr.Web.SA.CoreLogic.Scope.Context
                {
                    LanguageCode = Anbr.Web.SA.CoreLogic.Scope.GetDefaultLanguage()
                };
            }

            string languageCode = Root.GetCurrentLang(); //HttpContext.Current.Request.Unvalidated("Lang");
            if (String.IsNullOrWhiteSpace(languageCode))
                languageCode = Anbr.Web.SA.CoreLogic.Scope.GetDefaultLanguage();

            if (HttpContext.Current.Request.IsAuthenticated)
            {
            }

            return new Anbr.Web.SA.CoreLogic.Scope.Context
            {
                LanguageCode = languageCode
            };
        }

        /// <summary>
        /// Make sure all application requests are running over SSL
        /// </summary>
        protected void Application_BeginRequest()
        {
            if (HttpContext.Current.Request.HttpMethod == "OPTIONS")
            {
                string reqHost = HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority).ToLower();
                string refHost = HttpContext.Current.Request.UrlReferrer?.GetLeftPart(UriPartial.Authority).ToLower();

                var list = CommonBL.OriginGetAll();
                if (list.Contains(reqHost) && list.Contains(refHost))
                {
                    HttpContext.Current.Response.AddHeader("Access-Control-Allow-Origin", refHost);
                    HttpContext.Current.Response.AddHeader("Access-Control-Allow-Credentials", "true");
                    HttpContext.Current.Response.AddHeader("Access-Control-Allow-Methods", "POST, PUT, DELETE");
                    HttpContext.Current.Response.AddHeader("Access-Control-Allow-Headers", "content-type, Accept, key");
                    HttpContext.Current.Response.AddHeader("Access-Control-Max-Age", "1728000");
                    HttpContext.Current.Response.End();
                }
            }

            /*
                        if (IsSignalRRequest(Context))
                        {
                            // Turn readonly sessions on for SignalR
                            Context.SetSessionStateBehavior(SessionStateBehavior.ReadOnly);
                        }
            */

#if (RELEASE)
            if (!Context.Request.IsSecureConnection)
            {
                Response.Redirect(Context.Request.Url.ToString().Replace("http:", "https:"));
            }
#endif
        }

        public void Session_OnStart()
        {
        }

        protected void Application_Error(object sender, EventArgs e)
        {
            var ex = Server.GetLastError();
            Server.ClearError();


            var httpContext = ((MvcApplication)sender).Context;
            var currentController = " ";
            var currentAction = " ";
            var currentRouteData = RouteTable.Routes.GetRouteData(new HttpContextWrapper(httpContext));

            if (currentRouteData != null)
            {
                if (currentRouteData.Values["controller"] != null && !String.IsNullOrEmpty(currentRouteData.Values["controller"].ToString()))
                {
                    currentController = currentRouteData.Values["controller"].ToString();
                }

                if (currentRouteData.Values["action"] != null && !String.IsNullOrEmpty(currentRouteData.Values["action"].ToString()))
                {
                    currentAction = currentRouteData.Values["action"].ToString();
                }
            }

            var controller = new ErrorController();
            var routeData = new RouteData();
            var action = "Index";

            if (ex is HttpException)
            {
                var httpEx = ex as HttpException;

                switch (httpEx.GetHttpCode())
                {
                    case 401:
                        action = "Unauthorized";
                        if (currentRouteData.Values["lang"] != null && currentRouteData.Values["dbid"] != null)
                            routeData.Values["returnUrl"] = Request.Url.ToString();
                        break;
                    case 403:
                        action = "http403";
                        break;
                    case 404:
                        action = "NotFound";
                        break;
                    case 500:
                        action = "http500";
                        break;
                }
            }

            if (ex is SecurityException)
            {
                action = "Unauthorized";
            }

            httpContext.ClearError();
            httpContext.Response.Clear();
            //httpContext.Response.StatusCode = ex is HttpException ? ((HttpException)ex).GetHttpCode() : 500;
            httpContext.Response.TrySkipIisCustomErrors = true;

            routeData.Values["controller"] = "Error";
            routeData.Values["action"] = action;

            controller.ViewData.Model = new HandleErrorInfo(ex, currentController, currentAction);
            ((IController)controller).Execute(new RequestContext(new HttpContextWrapper(httpContext), routeData));
        }
    }
}