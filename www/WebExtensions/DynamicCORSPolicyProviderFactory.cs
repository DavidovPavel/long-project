using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Cors;
using System.Web.Handlers;
using System.Web.Http.Controllers;
using System.Web.Http.Cors;
using Anbr.Web.SA.CoreLogic;
using System.Web.Http.Filters;


namespace www.WebExtensions
{
    /*
     * See: https://msdn.microsoft.com/en-us/magazine/dn532203.aspx
     */

    public class DynamicCORSPolicyProviderFactory
    {
        public ICorsPolicyProvider GetCorsPolicyProvider(HttpRequestMessage request)
        {
            var route = request.GetRouteData();
            var controller = (string)route.Values["controller"];
            var corsRequestContext = request.GetCorsRequestContext();
            var originRequested = corsRequestContext.Origin;
            var policy = GetPolicyForControllerAndOrigin(controller, originRequested);

            return new CustomPolicyProvider(policy);
        }

        private CorsPolicy GetPolicyForControllerAndOrigin(string controller, string originRequested)
        {
            // Do database lookup to determine if the controller is allowed for
            // the origin and create CorsPolicy if it is (otherwise return null)

            var policy = new CorsPolicy();
            policy.Origins.Add(originRequested);
            policy.Methods.Add("GET");

            return policy;
        }
    }

    public class CustomPolicyProvider : ICorsPolicyProvider
    {
        private readonly CorsPolicy _policy;

        public CustomPolicyProvider(CorsPolicy policy)
        {
            _policy = policy;
        }

        public Task<CorsPolicy> GetCorsPolicyAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_policy);
        }
    }

    /*
     * Если потребуется в дальнейшем работа на уровне отдельной политик...
     * 
    public static class WebApiConfig
    {
      public static void Register(HttpConfiguration config)
      {
        // Other configuration omitted
        config.EnableCors();
        config.SetCorsPolicyProviderFactory(new DynamicCORSPolicyProviderFactory());
      }
    }
    */

    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public class EnableCorsCustomAttribute : ActionFilterAttribute, ICorsPolicyProvider
    {
        private const string EXCEPTION_CONTEXT_NULL = "Access Denied: HttpActionContext cannot be null.";
        private const string EXCEPTION_REFERRER_NULL = "Access Denied: Referrer cannot be null.";
        private const string FORMAT_INVALID_REFERRER = "Access Denied: '{0}' is not a valid referrer.";
        private const string FORMAT_REFERRER = "Referrer: '{0}' was processed for this request.";
        private const string FORMAT_REFERRER_FOUND = "Referrer IsFound: {0}.";
        private readonly CorsPolicy _policy;

        public EnableCorsCustomAttribute()
        {
            var list = CommonBL.OriginGetAll();
            _policy = new CorsPolicy
            {
                AllowAnyHeader = true,
                AllowAnyMethod = true,
                SupportsCredentials = true,
                AllowAnyOrigin = false
            };

            foreach (var origin in list)
                _policy.Origins.Add(origin);
        }


        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            if (actionContext == null)
                throw new ArgumentNullException("HttpActionContext");

            if (actionContext.Request.Headers.Referrer == null)
                actionContext.Response = actionContext.Request.CreateErrorResponse(HttpStatusCode.Forbidden, EXCEPTION_REFERRER_NULL);

            var referrer = actionContext.Request.Headers.Referrer.GetLeftPart(UriPartial.Authority).ToLower();

            if (_policy.Origins.Count > 0)
            {
                var isFound = _policy.Origins.Contains(referrer);

                if (!isFound)
                {
                    actionContext.Response = actionContext.Request.CreateErrorResponse(HttpStatusCode.Forbidden, string.Format(FORMAT_INVALID_REFERRER, referrer));
                }
            }

            base.OnActionExecuting(actionContext);
        }

        public Task<CorsPolicy> GetCorsPolicyAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (cancellationToken.CanBeCanceled && cancellationToken.IsCancellationRequested)
                return Task.FromResult<CorsPolicy>(null);

            var corsRequestContext = request.GetCorsRequestContext();
            var originRequested = corsRequestContext.Origin.ToLower();

            if (IsOrigValid(originRequested))
            {
                var policy = new CorsPolicy
                {
                    AllowAnyHeader = true,
                    AllowAnyMethod = true,
                    SupportsCredentials = true,
                    AllowAnyOrigin = false
                };
                policy.Origins.Add(originRequested);

                return Task.FromResult(policy);
            }

            // Reject CORS request
            return null;
        }

        private bool IsOrigValid(string originRequested)
        {
            return CommonBL.OriginIsGranted(originRequested);
        }
    }
}