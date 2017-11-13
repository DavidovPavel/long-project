using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Web.Http.Routing;

namespace www.WebExtensions
{
    public class CustomAuthorizationApiHandler : DelegatingHandler
    {
        protected override async System.Threading.Tasks.Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, System.Threading.CancellationToken cancellationToken)
        {
            if (!HasPermission(request.GetRouteData()))
                return request.CreateResponse(System.Net.HttpStatusCode.Unauthorized);

            SetLocale(request);

            var response = await base.SendAsync(request, cancellationToken);
            return response;
        }

        private void SetLocale(HttpRequestMessage request)
        {
            IEnumerable<string> keyValues;
            if (request.Headers.TryGetValues("Key", out keyValues))
            {
                string url = keyValues.FirstOrDefault();
                string cultureDescriptor = Root.GetCurrentLangFromKey(url);

                Thread.CurrentThread.CurrentUICulture = new CultureInfo(cultureDescriptor);
                Thread.CurrentThread.CurrentCulture = CultureInfo.CreateSpecificCulture(cultureDescriptor);
#if (RELEASE_IS || DEBUG)
                //System.Threading.Thread.CurrentPrincipal =
                //    new GenericPrincipal(new GenericIdentity(HttpContext.Current.User.Identity.Name), new string[] { });
#endif
            }
        }

        private bool HasPermission(IHttpRouteData routeData)
        {
#warning Слава!!! Attribute Routing Sec
            //нюанс получения информации в зависимости от разновидностей рутинга

            //if (routeData.Route is System.Web.Http.Routing)
            //{
            //    controller = ((System.Web.Http.Routing.HttpDirectRoute)routeData.Route).Actions[0].ControllerDescriptor.ControllerName;
            //    action = ((System.Web.Http.Routing.HttpDirectRoute)routeData.Route).Actions[0].ActionName;
            //}
            //else
            //{
            //    controller = routeData.Values["Controller"].ToString();
            //    action = routeData.Values["Action"].ToString();
            //}


            return true;
        }
    }
}