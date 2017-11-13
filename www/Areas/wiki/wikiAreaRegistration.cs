using System.Web.Mvc;

namespace www.Areas.wiki
{
    public class wikiAreaRegistration : AreaRegistration 
    {
        public override string AreaName 
        {
            get 
            {
                return "wiki";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context) 
        {
            context.MapRoute(
                null,
                "lang-{lang}/wiki",
                new { controller = "Wiki", action = "Index", id = UrlParameter.Optional }
            );

            context.MapRoute(
                null,
                "lang-{lang}/db{dbid}/wiki/{controller}/{action}/{id}",
                new { controller = "Wiki", action = "Index", id = UrlParameter.Optional },
                constraints: new { dbid = @"\d+" }
            );
        }
    }
}