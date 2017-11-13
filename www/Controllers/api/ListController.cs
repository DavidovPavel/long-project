using ANBR.SemanticArchive.SDK.ObjectModel;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Data;
using System.Net.Http;
using System.Web.Http;
using ANBR.SemanticArchive.ObjectService;
using ANBR.SemanticArchive.SDK.Queries2;
using System.Linq;
using ANBR.SDKHelper;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api
{
    public class ListController : ApiController
    {
        /// <summary>
        /// Получить список объектов с фильтрацией по типу, по наименование и с учетом страницы
        /// </summary>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get()
        {
            var output = new List<ListElement>();
            NameValueCollection qs = Request.RequestUri.ParseQueryString();

            if (qs.Count > 0)
            {
                string key = Root.GetCacheKeyByRequest(Request.RequestUri);
                output = Helpers.HelperCache.CacheGetOrAdd(key, () =>
                {
                    List<ListElement> list = new List<ListElement>(); 
                    var saDB = WebSaUtilities.Database;

                    string txt = qs["text"];
                    if (!Int32.TryParse(qs["typeid"], out var typeid)) typeid = saDB.MetaModel.RootType.ID;
                    if (!int.TryParse(qs["page"], out var page)) page = 1;
                    int totalRowCount = 0;

                    try
                    {

                        DataTable data;
                        int start = Root.CalcRowFrom(page);
                        int[] objIds = new int[0];
                        if (txt?.StartsWith("id:") ?? false)
                        {
                            objIds = txt.Substring(3).Split(new[] {","}, StringSplitOptions.RemoveEmptyEntries)
                                .Select(item =>
                                {
                                    int oid;
                                    Int32.TryParse(item, out oid);

                                    return oid;
                                }).ToArray();
                        }

                        if (objIds.Length != 0)
                        {
                            data = saDB._PropertyFastGetSomeAsTable(objIds,
                                new[] {_SAConst.Object_ID, _SAConst.Наименование, "Type_ID", "CreatedDate"});
                            totalRowCount = data.Rows.Count;
                        }
                        else
                        {
                            IPagedQuery query = saDB.PagedQueryFactory.CreateQueryMetatype(new AbstractObjectQuery
                            {
                                Name = txt,
                                RootTypeId = typeid,
                                UseSynonym = true,
                                FromRow = start,
                                RowCount = Root.PAGE_SIZE
                            });
                            query.Execute();
                            if (query.QueryResult == null) return new List<ListElement>();

                            data = query.QueryResult;
                            totalRowCount = query.TotalRowCount;
                        }

                        int hasObject_ID = data.Columns.IndexOf("Object_ID");
                        int hasDisplay_Name = data.Columns.IndexOf("Display_Name");
                        int hasTypeName = data.Columns.IndexOf("TypeName");
                        int hasType_ID = data.Columns.IndexOf("Type_ID");
                        int hasCreatedDate = data.Columns.IndexOf("CreatedDate");

                        list = data.AsEnumerable().Select((r, i) => new ListElement
                        {
                            id = hasObject_ID != -1 ? r.Field<int>(hasObject_ID) : 0,
                            title = hasDisplay_Name != -1 ? r.Field<string>(hasDisplay_Name) : "",
                            type = hasTypeName != -1 ? r.Field<string>(hasTypeName) : "",
                            typeid = hasType_ID != -1 ? r.Field<int>(hasType_ID) : 0,
                            date = hasCreatedDate != -1 ? r.Field<DateTime>(hasCreatedDate).ToShortDateString() : "",
                            num = start + i + 1
                        }).ToList();

                    }
                    catch
                    {
#warning На текущий момент ошибка если количество букв меньше 3... Данное исключение блокируется

                    }

                    list.Add(new ListElement
                    {
                        id = 0,
                        num = totalRowCount
                    });

                    return list;
                }, DateTime.UtcNow.AddSeconds(10), null);

            }

            return output;
        }

        /// <summary>
        /// Получить элемент списка сформированный на основе списка объектов (по идентификатору объекта)
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get(int id)
        {
            IObjectInfo info = WebSaUtilities.Database.ObjectModel.GetObjectInfo(id);

            return new[]
                       {
                           new ListElement
                               {
                                   id = info.ObjectId,
                                   uid = info.Object.Uid.ToString(),
                                   title = info.DisplayName,
                                   type = info.TypeName,
                                   typeid = info.MetaType.ID,
                                   date = info.Object.CreadetDate.ToString("dd.MM.yyyy"),
                                   num = 1
                               }
                       };
        }
    }
}
