using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace www.WebExtensions
{
    public interface IUriBuilder
    {
        string CreateUriFromRouteValues(object values);
    }

    public class UriBuilder : IUriBuilder
    {
        private readonly Func<RouteCollection> getRouteCollection;
        private readonly Func<HttpContextBase> getHttpContext;

        public UriBuilder(Func<RouteCollection> getRouteCollection, Func<HttpContextBase> getHttpContext)
        {
            this.getRouteCollection = getRouteCollection;
            this.getHttpContext = getHttpContext;
        }

        public string CreateUriFromRouteValues(object routeValues)
        {
            string area = (string)((RouteValueDictionary)routeValues)["area"];

            var routeData = new RouteData();
            //    routeData.DataTokens.Add("area", area);

            var requestContext = new RequestContext(getHttpContext(), routeData);
            VirtualPathData virtualPathData;
            if (!String.IsNullOrWhiteSpace(area))
                virtualPathData = getRouteCollection().GetVirtualPathForArea(requestContext, (RouteValueDictionary)routeValues);
            else
                virtualPathData = getRouteCollection().GetVirtualPath(requestContext, (RouteValueDictionary)routeValues);

            if (virtualPathData == null)
                throw new ApplicationException("virtualPathData is null");

            return virtualPathData.VirtualPath;
        }
    }

    public class FakeHttpContext : HttpContextBase
    {
        public override HttpRequestBase Request
        {
            get { return new FakeRequest(); }
        }

        public override HttpResponseBase Response
        {
            get { return new FakeResponse(); }
        }
    }

    public class FakeRequest : HttpRequestBase
    {
        public override string ApplicationPath
        {
            get { return "/"; }
        }
    }

    public class FakeResponse : HttpResponseBase
    {
        public override string ApplyAppPathModifier(string virtualPath)
        {
            return virtualPath;
        }
    }
}
