using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using ANBR.Monitoring;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model.check;
using www.Areas.ExpressDossier.Models;
using www.SaGateway;
using Task = System.Threading.Tasks.Task;

namespace www.Controllers.api.ExpressDossier
{
    public class SourcesController : ApiController
    {
        #region Получение данных по источникам и справочникам
        /// <summary>
        /// Получить данные заданного источника
        /// </summary>
        /// <param name="sid"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/sources/{sid}")]
        public SourceModel Get(Guid sid)
        {
            var filter = new SourcesSearchCriteriasData { FilterByID = sid };
            GoodsLabelData[] data = WebSaUtilities.MBF.ProductSourcesGetBy(filter, WebSaUtilities.GetCurrentContextData());

            return data.ToLocalType().FirstOrDefault();
        }

        /// <summary>
        /// Получить данные по всем источникам
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/sources")]
        public SourceModel[] Get()
        {
            GoodsLabelData[] data = WebSaUtilities.MBF.ProductSourcesGetBy(null, WebSaUtilities.GetCurrentContextData());
            return data.ToLocalType();
        }

        /// <summary>
        /// Получить список источников, удовлетворяющих условию фильтра
        /// </summary>
        /// <param name="sf"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/sources/filterby")]
        public SourceModel[] GetByFilter(FilterSourcesModel sf)
        {
            var filter = new SourcesSearchCriteriasData { DicItems = sf.DicItems, SearchText = sf.SearchText };
            GoodsLabelData[] data = WebSaUtilities.MBF.ProductSourcesGetBy(filter, WebSaUtilities.GetCurrentContextData());

            return data.ToLocalType();
        }

        /// <summary>
        /// Возвращает все справочники и их значения
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/sources/types")]
        public DicModel[] GetDicTypes()
        {
            CatalogDicItemData[] dicItems = WebSaUtilities.MBF.ProductSourcesGetDicItems(null, WebSaUtilities.GetCurrentContextData());
            CatalogDicData[] dics = WebSaUtilities.MBF.ProductSourcesGetDictionaries(WebSaUtilities.GetCurrentContextData());

            return dics.ToLocalType(dicItems);
        }

        /// <summary>
        /// Возвращает справочные значения заданного справочника
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/sources/types/{dicid}")]
        public DicItemModel[] GetDicItems(int dicid)
        {
            CatalogDicItemData[] dicItems = WebSaUtilities.MBF.ProductSourcesGetDicItems(dicid, WebSaUtilities.GetCurrentContextData());

            return dicItems.ToLocalType();
        }
        #endregion

        #region Манипуляция с выбранными источниками
        /// <summary>
        /// Сохраняет выбранные пользователем источники
        /// </summary>
        /// <param name="sources"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/sources/persisted")]
        public async Task<Guid> PersistSelectedSources(SelectedSourcesByUserModel sources)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            return await SearchBL.SelectedSourcesPersist(userID, sources.Sources, sources.BySATypeSelectedValue, sources.SearchPackUID, sources.SearchPackName);
        }

        /// <summary>
        /// Удаляет заданные источники из списка выбранных
        /// </summary>
        /// <param name="sources"></param>
        /// <returns></returns>
        [HttpDelete]
        [Route("api/sources/persisted")]
        public async Task RemoveSelectedSources(SelectedSourcesByUserModel sources)
        {
            if (sources.SearchPackUID == null)
                throw new ArgumentException("SearchPackUID should be defined");

            string userID = WebSaUtilities.GetCurrentUserID();
            await SearchBL.RemoveSelectedSources(userID, sources.Sources, sources.BySATypeSelectedValue, sources.SearchPackUID.Value);
        }

        /// <summary>
        /// Получает список выбранных источников (если параметр saType - не задаан, то все выбранные источники)
        /// </summary>
        /// <param name="saType">Справочное значение справочника BySAType т.е. персона, организация и т.п.</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/sources/persisted/{saType:int}")]
        public async Task<SourceModel[]> GetPersistedSources(int saType)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            var sources = await SearchBL.SelectedSourcesGetAsync(userID, saType);

            return SourcesByIds(sources);
        }

        /// <summary>
        /// Получает список источников, принадлежащих коллекции
        /// </summary>
        /// <param name="searchPackUID"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/sources/persisted/{searchPackUID:guid}")]
        public async Task<SourceModel[]> GetPersistedSourcesBySearchPack(Guid searchPackUID)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            var sources = await SearchBL.SelectedSourcesGetAsync(userID, searchPackUID);

            return SourcesByIds(sources);
        }


        [HttpGet]
        [Route("api/sources/persisted")]
        public async Task<SourceModel[]> GetPersistedSourcesAll()
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            var sources = await SearchBL.SelectedSourcesGetAsync(userID);

            return SourcesByIds(sources);
        }

        /// <summary>
        /// Получает список коллекций для заданного типа проверки
        /// </summary>
        /// <param name="saType">Идентификатор поискового тип (справочное значение)</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/sources/searchpacks/{saType}")]
        public async Task<SearchPackModel[]> SearchPacksGet(int saType)
        {
            string userID = WebSaUtilities.GetCurrentUserID();

            var data = new GoodsLabelData[0];
            var context = WebSaUtilities.GetCurrentContextData();
            var sourcesDataTask = Task.Run(() =>
            {
                data = WebSaUtilities.MBF.ProductSourcesGetBy(null, context);
            });

            SearchPackDTO[] searchPacks = await SearchBL.SearchPacksGet(userID, saType);
            var res = new SearchPackModel[searchPacks.Length];

            var sourcesForPacksTasks = new Task<Guid[]>[searchPacks.Length];
            for (int i = 0; i < searchPacks.Length; i++)
            {
                var sp = searchPacks[i];
                sourcesForPacksTasks[i] = SearchBL.SelectedSourcesGetAsync(userID, sp.SearchPackUID);
            }

            var allTasks = new List<Task>();
            allTasks.Add(sourcesDataTask);
            allTasks.AddRange(sourcesForPacksTasks);
            await Task.WhenAll(allTasks);

            for (int i = 0; i < searchPacks.Length; i++)
            {
                var sp = searchPacks[i];
                var ids = sourcesForPacksTasks[i].Result;
                var sum = (
                    from s in ids
                    join gl in data on s equals gl.ProductUID
                    select gl
                ).Sum(item => (item.DerivativePrice ?? item.BasePrice) ?? 0M);

                res[i] = sp.ToLocalType();
                res[i].Sum = sum;
                res[i].SourcesCount = ids.Length;
            }

            return res;
        }

        /// <summary>
        /// Изменение заданной коллекции
        /// </summary>
        /// <param name="saType">Идентификатор поискового тип (справочное значение)</param>
        /// <returns></returns>
        [HttpPut]
        [Route("api/sources/searchpacks/{saType}")]
        public async Task SearchPacksChangeName(SearchPackModel model)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            await SearchBL.SearchPacksChangeName(model.SearchPackUID, model.SearchPackName, userID);
        }


        /// <summary>
        /// Удаление заданной коллекции
        /// </summary>
        /// <param name="searchPackUID"></param>
        /// <returns></returns>
        [HttpDelete]
        [Route("api/sources/searchpacks/{saType}/{searchPackUID}")]
        public async Task SearchPackRemove(Guid searchPackUID)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            await SearchBL.SearchPacksDelete(userID, searchPackUID);
        }

        /// <summary>
        /// Изменение заданной коллекции
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPut]
        [Route("api/sources/searchpacks/{saType}/{searchPackUID:Guid}")]
        public async Task SearchPackRename(SearchPackModel model)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            await SearchBL.SearchPacksChangeName(model.SearchPackUID, model.SearchPackName, userID);
        }

        [NonAction]
        SourceModel[] SourcesByIds(IEnumerable<Guid> ids)
        {
            GoodsLabelData[] data = WebSaUtilities.MBF.ProductSourcesGetBy(null, WebSaUtilities.GetCurrentContextData());

            var res = (
                from s in ids
                join gl in data on s equals gl.ProductUID
                select gl
            ).ToArray();

            return res.ToLocalType();
        }
        #endregion
    }
}
