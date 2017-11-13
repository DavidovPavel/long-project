using System.Web;
using System.Web.Mvc;

namespace www.WebExtensions
{
    public class AllowCrossSiteJsonAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            HttpContext.Current.Response.Cache.SetCacheability(HttpCacheability.NoCache);
            HttpContext.Current.Response.Cache.SetNoStore();

            filterContext.RequestContext.HttpContext.Response.AppendHeader("Access-Control-Allow-Origin", "*");

            string rqstMethod = HttpContext.Current.Request.Headers["Access-Control-Request-Method"];
            if (rqstMethod == "OPTIONS" || rqstMethod == "POST")
            {
                filterContext.RequestContext.HttpContext.Response.AppendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                filterContext.RequestContext.HttpContext.Response.AppendHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, key");

            }
            base.OnActionExecuting(filterContext);
        }
    }
}