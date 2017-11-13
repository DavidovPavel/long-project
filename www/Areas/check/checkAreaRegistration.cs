using System.Web.Mvc;

namespace www.Areas.check
{
    public class checkAreaRegistration : AreaRegistration 
    {
        public override string AreaName => "check";

        public override void RegisterArea(AreaRegistrationContext context) 
        {
            context.MapRoute(
                "check_default",
                "lang-{lang}/db{dbid}/check/{controller}/{action}/{id}",
                new { controller = "Check", action = "Index", id = UrlParameter.Optional },
                constraints: new { dbid = @"\d+" }
            );

            context.MapRoute(
                null,
                "lang-{lang}/check",
                new { controller = "Check", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}