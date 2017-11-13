using System.Globalization;
using System.Web.Http;
using Newtonsoft.Json.Converters;
using www.WebExtensions;

namespace www
{
    public static class WebApiConfig
    {
        public static string UrlPrefix => "api";
        public static string UrlPrefixRelative => "~/api";

        public static void Register(HttpConfiguration config)
        {
            GlobalConfiguration.Configuration.Formatters.JsonFormatter.SerializerSettings.DateTimeZoneHandling = Newtonsoft.Json.DateTimeZoneHandling.Utc;
            GlobalConfiguration.Configuration.Formatters.JsonFormatter.SerializerSettings.Converters.Add(new IsoDateTimeConverter() { DateTimeStyles = DateTimeStyles.AdjustToUniversal });

            //config.Formatters.RemoveAt(0);
            //config.Formatters.Insert(0, new JilFormatter());

            //var serializerSettings = new JsonSerializerSettings();
            //serializerSettings.Converters.Add(new IsoDateTimeConverter());
            //GlobalConfiguration.Configuration.Formatters[0] = new JsonNetFormatter(serializerSettings);

            config.EnableCors();

            GlobalConfiguration.Configuration.MapHttpAttributeRoutes(); //Configure(x => x.MapHttpAttributeRoutes());

            config.Routes.MapHttpRoute(
                name: "WithActionApi",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: null
                //constraints: new { id = @"\d+" }
            );

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { action = "DefaultAction", id = RouteParameter.Optional }
            );


#if (DEBUG)
            config.EnableSystemDiagnosticsTracing();
#endif

            GlobalConfiguration.Configuration.EnsureInitialized(); 
        }
    }
}
