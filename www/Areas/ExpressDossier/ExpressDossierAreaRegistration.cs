using System.Web.Mvc;

namespace www.Areas.ExpressDossier
{
    public class ExpressDossierAreaRegistration : AreaRegistration
    {
        public override string AreaName => "ExpressDossier";

        public override void RegisterArea(AreaRegistrationContext context)
        {
            context.MapRoute(
                "ExpressDossier_default",
                "lang-{lang}/db{dbid}/ExpressDossier/{controller}/{action}/{id}",
                new { controller = "Express", action = "Index", id = UrlParameter.Optional },
                constraints: new { dbid = @"\d+" }
            );

            context.MapRoute(
                null,
                "lang-{lang}/ExpressDossier",
                new { controller = "Express", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}
