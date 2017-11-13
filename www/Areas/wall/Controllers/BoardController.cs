using System.Web.Mvc;
using www.Controllers;

namespace www.Areas.wall.Controllers
{
    public class BoardController:BaseController
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}