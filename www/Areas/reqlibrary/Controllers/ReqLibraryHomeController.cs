using System.Web.Mvc;
using www.Controllers;

namespace www.Areas.reqlibrary.Controllers
{
    public class ReqLibraryHomeController : BaseController
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}
