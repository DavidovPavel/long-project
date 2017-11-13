using System.Collections.Generic;
using System.Net.Http;
using System.Web.Http;
using www.Models;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api
{
    public class FindController : ApiController
    {
        // GET api/find
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get()
        {
            var output = new List<ListElement>();
            var qs = Request.RequestUri.ParseQueryString();
            if (qs.Count > 0)
            {
                var txt = qs["text"];
                int typeid;
                int.TryParse(qs["typeid"], out typeid);

                //var pf = new PersonFilter();
                //var of = new OrganizationFilter();

                int page;
                if (!int.TryParse(qs["page"], out page))
                    page = 1;

                var qr = WebSaUtilities.Database.QueriesProvider.ExecuteTypeQuery(txt, typeid==0?10001:typeid, true);
                var td = qr.DataSet.Tables[0];
                output = Root.GetList(td, page);
            }
            return output;
        }
    }
}
