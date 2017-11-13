using System.Web;
using System.Web.Http.WebHost;
using System.Web.Routing;
using System.Web.SessionState;

namespace www.WebExtensions
{
    public class SessionHttpControllerHandler : HttpControllerHandler, IRequiresSessionState
    {
        public SessionHttpControllerHandler(RouteData routeData)
            : base(routeData)
        {
        }
    }

    public class SessionHttpControllerRouteHandler : HttpControllerRouteHandler
    {
        public SessionHttpControllerRouteHandler()
        {

        }

        protected override IHttpHandler GetHttpHandler(RequestContext requestContext)
        {
            return new SessionHttpControllerHandler(requestContext.RouteData);
        }
    }

}