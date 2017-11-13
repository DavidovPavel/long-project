using System.IO;
using System.Web;
using System.Web.Mvc;
using ANBR.SDKHelper;

namespace www.Common
{
    public static class HelperHtml
    {
        public static HtmlString InlineImage(this HtmlHelper html, string path, object attributes = null)
        {
            var array = File.ReadAllBytes(HttpContext.Current.Server.MapPath(path));
            var htmlImg = HelperImage.GetImageSource(array);
            return new HtmlString(htmlImg);
        }

        public static string RenderRazorViewToString(this Controller controller, string viewName, object model)
        {
            controller.ViewData.Model = model;
            using (var sw = new StringWriter())
            {
                var viewResult = ViewEngines.Engines.FindPartialView(controller.ControllerContext, viewName);
                var viewContext = new ViewContext(controller.ControllerContext, viewResult.View, controller.ViewData, controller.TempData, sw);
                viewResult.View.Render(viewContext, sw);
                viewResult.ViewEngine.ReleaseView(controller.ControllerContext, viewResult.View);
                return sw.GetStringBuilder().ToString();
            }
        }
    }
}