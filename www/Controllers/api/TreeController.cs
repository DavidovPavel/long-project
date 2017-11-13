using System;
using System.Net.Http;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.MetaModel;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using www.Models;
using ANBR.SemanticArchive.SDK.Queries2;
using ANBR.SemanticArchive.ObjectService;
using ANBR.SemanticArchive.SDK.ObjectModel;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api
{
    /// <summary>
    /// - Работа с деревом типов (перечень узлов)
    /// - Получение списка объектов по типу
    /// </summary>
    public class TreeController : ApiController
    {
        [HttpGet]
        [Route("api/Tree")]
        [Route("api/Type")]
        public IEnumerable<TreeElement> Get()
        {
            IDataBase saDB = WebSaUtilities.Database;

            NameValueCollection qs = Request.RequestUri.ParseQueryString();
            var query = new TreeElement[] { };
            if (qs.Count > 0)
            {
                int pid;
                if (int.TryParse(qs["pid"], out pid))
                {
                    query = GetTreeElements(saDB, pid, query);
                }
            }
            else
            {
                var mts = saDB.MetaModel.MetaTypes;
                var q2 =
                    from IMetaType mType in mts
                    select new TreeElement
                    {
                        id = mType.ID.ToString(),
                        parentid = mType.ParentId.ToString(),
                        title = mType.DisplayName,
                        children = mType.Children.Count,
                        iconexist = true,
                        iconurl = String.Format("/lang-ru-RU/db{0}/files/details/{1}", Scope.GetCurrentDBID(), mType.ID)
                    };
                query = q2.ToArray();
            }
            return query;
        }

        [NonAction]
        private static TreeElement[] GetTreeElements(IDataBase saDB, int pid, TreeElement[] query)
        {
            var p = saDB.MetaModel.GetEntityById(pid) as IMetaType;

            if (p != null)
            {
                var q1 =
                    from IMetaType mType in p.Children
                    select new TreeElement
                    {
                        id = mType.ID.ToString(),
                        parentid = mType.ParentId.ToString(),
                        title = mType.DisplayName,
                        children = mType.Children.Count,
                        sysName = mType.SystemName,
                        iconexist = true,
                        iconurl = String.Format("/lang-ru-RU/db{0}/files/details/{1}", Scope.GetCurrentDBID(), mType.ID)
                    };
                var r = q1.ToList();
                r.Add(new TreeElement
                {
                    id = p.ID.ToString(),
                    parentid = 0.ToString(),
                    title = p.DisplayName,
                    children = p.Children.Count,
                    sysName = p.SystemName,
                    iconexist = true,
                    iconurl = String.Format("/lang-ru-RU/db{0}/files/details/{1}", Scope.GetCurrentDBID(), p.ID)
                });
                query = r.ToArray();
            }
            return query;
        }

        /// <summary>
        /// Используется для "стены", позволяет получить элементы дерева типов
        /// </summary>
        /// <param name="queryid">Идентификатор запроса, который является источником коллекции</param>
        /// <param name="pid"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/Tree/ByWidgetQ/{queryid:int}")]
        [Route("api/Type/ByWidgetQ/{queryid:int}")]
        public async Task<TreeElement[]> GetReportsBySATypeID(int queryid)
        {
            QueryDTO qDto = await WallBL.WidgetQueryDataAsync(queryid);
            IDataBase saDB = WebSaUtilities.ConnectorInstance.GetDataBase(qDto.DatabaseID, 0, qDto.DatabaseName);

            var query =
                   from IMetaType mType in saDB.MetaModel.MetaTypes
                   select new TreeElement
                   {
                       id = mType.ID.ToString(),
                       parentid = mType.ParentId.ToString(),
                       title = mType.DisplayName,
                       sysName = mType.SystemName,
                       children = mType.Children.Count,
                       iconexist = true,
                       iconurl = String.Format("/lang-ru-RU/db{0}/files/details/{1}", qDto.DatabaseID, mType.ID)
                   };

            return query.ToArray();
        }

        [HttpGet]
        [Route("api/Tree/{id:int}")]
        [Route("api/Type/{id:int}")]
        public IEnumerable<ListElement> Get(int id)
        {
            var output = new List<ListElement>();

            int page;
            var qs = Request.RequestUri.ParseQueryString();
            if (!int.TryParse(qs["page"], out page))
                page = 1;

            IPagedQuery pq = WebSaUtilities.Database.PagedQueryFactory.CreateQueryMetatype(
                new AbstractObjectQuery
                {
                    FromRow = (page - 1) * Root.PAGE_SIZE,
                    RowCount = Root.PAGE_SIZE,
                    RootTypeId = id
                });

            output = Root.GetList(pq, page);

            return output;
        }

    }
}
