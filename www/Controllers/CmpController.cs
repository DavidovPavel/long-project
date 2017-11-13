using System.Web.Mvc;

namespace www.Controllers
{
    public class CmpController : BaseController
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Editor()
        {
            return View("editor");
        }
        public ActionResult Mnxm()
        {
            return View("mnxm");
        }

        // сем. сеть
        public ActionResult Snet(int? id)
        {
            ViewBag.ObjectID = id;
            return View();
        }

        // результат запроса
        public ActionResult Result(int id)
        {
            ViewBag.ObjectID = id;
            return View();
        }
    }
}
