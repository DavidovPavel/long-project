using System.Web.Mvc;
using www.Controllers;

namespace www.Areas.inquiry.Controllers
{
    public class InquiryController : BaseController
    {
        public ActionResult Index(int? prjid)
        {
            return View();
        }
    }
}