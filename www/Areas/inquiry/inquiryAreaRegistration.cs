using System.Web.Mvc;

namespace www.Areas.inquiry
{
    public class inquiryAreaRegistration : AreaRegistration 
    {
        public override string AreaName => "inquiry";

        public override void RegisterArea(AreaRegistrationContext context) 
        {
            context.MapRoute(
                "inquiry_default",
                "lang-{lang}/db{dbid}/inquiry/{controller}/{action}/{id}",
                new { controller = "Inquiry", action = "Index", id = UrlParameter.Optional },
                constraints: new { dbid = @"\d+" }
            );

            context.MapRoute(
                null,
                "lang-{lang}/inquiry",
                new { controller = "Inquiry", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}