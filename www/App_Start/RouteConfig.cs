using System.Web.Http;
using System.Web.Mvc;
using System.Web.Routing;
using www.SaGateway;
using www.WebExtensions;

namespace www
{
    public class RouteConfig
    {
        public static UriBuilder MvcUriBuilder { get; set; }

        public static void RegisterRoutes(RouteCollection routes)
        {
            //routes.Clear();

            string snPath = Root.GetFolder_SemanticNet().TrimStart('/') + "{*relpath}";
            string tempStorage = Root.GetFolder_Temp().TrimStart('/') + "{*relpath}";
            string mapMarkersPath = Root.GetFolder_MapMarkers().TrimStart('/') + "{*relpath}";
            string exportPath = Root.GetFolder_Export().TrimStart('/') + "{*relpath}";
            string odPath = Root.GetFolder_OriginalSource().TrimStart('/');
            const string storagePath = "Storage/" + "{*relpath}";

            routes.IgnoreRoute("Combine");
            routes.IgnoreRoute("app/{*relpath}");

            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
            routes.IgnoreRoute("Dummy/{*relpath}");
            routes.IgnoreRoute("Content/{*relpath}");
            routes.IgnoreRoute("Images/{*relpath}");
            routes.IgnoreRoute("js/{*relpath}");            
            routes.IgnoreRoute("Scripts/{*relpath}");
            //routes.IgnoreRoute("templates/{*relpath}");
            //routes.IgnoreRoute("tinymce/{*relpath}");
            //routes.IgnoreRoute("themes/{*relpath}");
            routes.IgnoreRoute("favicon.ico");
            routes.IgnoreRoute("proxy.html");
            routes.IgnoreRoute("SqlReporting.aspx");
            routes.IgnoreRoute("SqlRepPage.aspx");
            routes.IgnoreRoute(tempStorage);
            routes.IgnoreRoute(snPath);
            routes.IgnoreRoute(mapMarkersPath);
            routes.IgnoreRoute(exportPath);
            routes.IgnoreRoute(odPath + "{*relpath}"/*, new { relpath = new NotHtmlConstraint() }*/);
            routes.IgnoreRoute(storagePath, new { relpath = new NotHtmlConstraint() });
            
            routes.RouteExistingFiles = true;

            routes.MapRoute(
                "originalDocs",
                odPath + "{source_uid}/{source_fn}.html",
                new { controller = "Original", action = "Index" }
            );

            routes.MapPageRoute("",
                "lang-{lang}/db{dbid}/{page}.aspx",
                "~/sqlreporting.aspx", true,
                new RouteValueDictionary(),
                new RouteValueDictionary { { "page", "sqlreporting" } });

            routes.MapPageRoute("",
                "lang-{lang}/db{dbid}/{page}.aspx",
                "~/sqlreppage.aspx", true,
                new RouteValueDictionary(),
                new RouteValueDictionary { { "page", "sqlreppage" } });

            routes.MapRoute(
                name: "",
                url: "lang-{lang}/db{dbid}/{area}/Files/{action}/{id}",
                defaults: new { id = RouteParameter.Optional, controller = "Files" },
                constraints: new { dbid = @"\d+", area = @"(expressdossier|inquiry|check|wall|services|extSrv|wiki)" }
            );


            routes.MapRoute(
                name: "",
                url: "lang-{lang}/db{dbid}/{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Index", id = RouteParameter.Optional },
                constraints: new { dbid = @"\d+", controller = @"^((?!((reqlibrary)|(seasources)|(ExpressDossier)|(inquiry)|(check)|(Wall)|(Services)|(ExtSrv)|(wiki))).)*" }
            );

            AreaRegistration.RegisterAllAreas();

            routes.MapRoute(
                name: "",
                url: "lang-{lang}/{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Main", id = RouteParameter.Optional }
            );

            routes.MapRoute(
                name: "",
                url: "db{dbid}/{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Main", id = RouteParameter.Optional },
                constraints: new { dbid = @"\d+" }
            );

            routes.MapRoute(
                name: "Default",
                url: "{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Main", id = RouteParameter.Optional }
            );

            MvcUriBuilder = new UriBuilder(() => routes, () => new FakeHttpContext());
        }
    }
}