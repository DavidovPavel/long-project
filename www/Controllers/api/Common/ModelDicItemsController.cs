using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using ANBR.SemanticArchive.SDK.Dictionaries;
using ANBR.SemanticArchive.SDK.MetaModel;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api.Common
{
    /// <summary>
    /// Работа со справочниками
    /// </summary>
    public class ModelDicItemsController : ApiController
    {
        /// <summary>
        /// Позволяет получить список элементов заданного справочника
        /// </summary>
        /// <param name="dic"></param>
        /// <returns></returns>
        [HttpGet]
        [ActionName("DefaultAction")]
        public List<ListElement> Get(string dic)
        {
            var saDB = WebSaUtilities.Database;

            IMetaDictionary metaDic;
            if (int.TryParse(dic, out var dicID))
                metaDic = saDB.MetaModel.MetaDictionaries.GetByID(dicID);
            else
                metaDic = saDB.MetaModel.MetaDictionaries.GetByName(dic);

            var dicData = saDB.ObjectModel.GetDictionary(metaDic);
            return (
                from IDictionaryValue dicVal in dicData.Values select new ListElement { id = dicVal.Id, title = dicVal.DisplayName }
                ).ToList();
        }
    }
}
