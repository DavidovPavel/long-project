using System.Collections.Generic;
using System.Web.Http;
using www.Models;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api
{
    public class FindFullTextController : ApiController
    {
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get(string title, string phrase, int page, int rubricid, int? typeid = null)
        {
#warning 2014-07-2 Слава нужно добавить в параметры запроса typeid
            var qr = SDKHelper.FullTextSearchQuery(title, phrase, page, rubricid /*, typeid*/);
            if (qr != null)
            {
                var td = qr.DataSet.Tables[1];
                return Root.GetList(td, page, (int) qr.DataSet.Tables[0].Rows[0]["TotalRowsNumber"]);
            }
            return new List<ListElement> {new ListElement {id = 0, num = 0}};
        }
    }
}
