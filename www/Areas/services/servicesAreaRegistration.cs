using System.Web.Mvc;

namespace www.Areas.services
{
    public class servicesAreaRegistration : AreaRegistration 
    {
        public override string AreaName => "services";

        public override void RegisterArea(AreaRegistrationContext context) 
        {
            context.MapRoute(
                null,
                "lang-{lang}/db{dbid}/services/{controller}/{action}/{id}",
                 new { controller = "Services", action = "Index", id = UrlParameter.Optional },
                constraints: new { dbid = @"\d+" }
            );

            context.MapRoute(
                null,
                "lang-{lang}/services",
                new { controller = "Services", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}