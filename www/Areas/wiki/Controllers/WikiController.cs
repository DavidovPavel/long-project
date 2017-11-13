using System.Web.Mvc;
using www.Controllers;

namespace www.Areas.wiki.Controllers
{
    public class WikiController:BaseController
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}