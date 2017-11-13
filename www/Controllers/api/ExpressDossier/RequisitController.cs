using System.Collections.Generic;
using System.Web.Http;
using www.Helpers;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api.ExpressDossier
{
    public class RequisitController : ApiController
    {
        /// <summary>
        /// Получает список признаков для заданного объекта
        /// </summary>
        /// <param name="id">ID объекта</param>
        /// <param name="page"></param>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get(int id, int page = 1)
        {
            var saDb = WebSaUtilities.Database;

            int[] idsArr = HelperInquiry.ContextGetSATaskIds(saDb);
            var result = HelperRequisits.GetRequisites(saDb, id, idsArr, page);

            result.ForEach(item => item.originoid = id);

            return result;
        }
    }
}