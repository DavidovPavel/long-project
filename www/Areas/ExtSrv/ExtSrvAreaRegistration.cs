using System.Web.Mvc;

namespace www.Areas.ExtSrv
{
    public class ExtSrvAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "ExtSrv";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {

            context.MapRoute(
                name: "ExtSrv_default",
                url: "lang-{lang}/db{dbid}/ExtSrv/{controller}/{action}/{id}",
                defaults: new {action = "Index", id = UrlParameter.Optional}
                );
        }
    }
}
