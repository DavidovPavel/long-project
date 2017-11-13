using System.Web.Mvc;
using www.Controllers;

namespace www.Areas.services.Controllers
{
    public class SourcesController : BaseController
    {
        // GET: services/Sources
        public ActionResult Index()
        {
            return View();
        }
    }
}