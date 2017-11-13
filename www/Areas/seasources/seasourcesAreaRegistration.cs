using System.Web.Mvc;

namespace www.Areas.seasources
{
    public class seasourcesAreaRegistration : AreaRegistration 
    {
        public override string AreaName => "seasources";

        public override void RegisterArea(AreaRegistrationContext context)
        {
            context.MapRoute(
                "seasources_default",
                "lang-{lang}/db{dbid}/seasources/{controller}/{action}/{id}",
                new { controller = "SourcesHome", action = "Index", id = UrlParameter.Optional },
                constraints: new { dbid = @"\d+" }
            );

            context.MapRoute(
                null,
                "lang-{lang}/seasources",
                new { controller = "SourcesHome", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}