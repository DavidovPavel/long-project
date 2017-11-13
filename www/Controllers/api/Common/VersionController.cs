using System.Reflection;
using System.Web.Http;
using ANBR.Helpful.Misc.Environment;

namespace www.Controllers.api.Common
{
    public class VersionController : ApiController
    {
        [HttpGet]
        [Route("api/version/product")]
        public string GetProductVersion()
        {
            return Helper.VersionProduct(Assembly.GetExecutingAssembly().Location);
        }
    }
}
