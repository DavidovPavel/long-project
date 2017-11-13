using System.Web.Mvc;
using www.Controllers;

namespace www.Areas.check.Controllers
{
    public class CheckController : BaseController
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}