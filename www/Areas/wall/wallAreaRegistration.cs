using System.Web.Mvc;

namespace www.Areas.wall
{
    public class wallAreaRegistration : AreaRegistration
    {
        public override string AreaName => "wall";

        public override void RegisterArea(AreaRegistrationContext context)
        {
            context.MapRoute(
                null,
                "lang-{lang}/wall",
                new { controller = "Board", action = "Index", id = UrlParameter.Optional }
            );
            context.MapRoute(
                "wall_default",
                "lang-{lang}/db{dbid}/wall/{controller}/{action}/{id}",
                new { controller = "Board", action = "Index", id = UrlParameter.Optional },
                constraints: new { dbid = @"\d+" }
            );
        }
    }
}
