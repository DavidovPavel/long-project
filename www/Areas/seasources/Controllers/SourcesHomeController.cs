using System.Web.Mvc;
using www.Controllers;

namespace www.Areas.seasources.Controllers
{
    public class SourcesHomeController : BaseController
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}
