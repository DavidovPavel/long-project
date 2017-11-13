using System.Web.Mvc;
using www.Controllers;

namespace www.Areas.services.Controllers
{
    public class RequestLibraryController : BaseController
    {
        // GET: services/RequestLibrary
        public ActionResult Index()
        {
            return View();
        }
    }
}