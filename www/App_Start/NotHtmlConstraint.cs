using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Routing;

namespace www
{
    public class NotHtmlConstraint : IRouteConstraint
    {
        public bool Match(HttpContextBase httpContext, Route route, string parameterName, RouteValueDictionary values, RouteDirection routeDirection)
        {
            string ext = Path.GetExtension(httpContext.Request.RawUrl).ToLower();

            return (ext != ".html");
        }
    }
}