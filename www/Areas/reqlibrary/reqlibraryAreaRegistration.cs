using System.Web.Mvc;

namespace www.Areas.reqlibrary
{
    public class reqlibraryAreaRegistration : AreaRegistration 
    {
        public override string AreaName => "reqlibrary";

        public override void RegisterArea(AreaRegistrationContext context)
        {
            context.MapRoute(
                "reqlibrary_default",
                "lang-{lang}/db{dbid}/reqlibrary/{controller}/{action}/{id}",
                new { controller = "ReqLibraryHome", action = "Index", id = UrlParameter.Optional },
                constraints: new { dbid = @"\d+" }
            );

            context.MapRoute(
                null,
                "lang-{lang}/reqlibrary",
                new { controller = "ReqLibraryHome", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}