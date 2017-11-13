using System;
using ANBR.Common.Filters;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web.Http;
using www.Helpers;
using www.Models;
using System.Net.Http;
using System.Runtime.Caching;
using System.ServiceModel;
using Anbr.Web.SA.CoreLogic;
using ANBR.Query.Common;
using www.Areas.wall.Models;
using www.Areas.wall.Models.WidgetTypes;
using www.Controllers.api.ExtSrv;
using www.Models.Data.In;
using www.Models.Ex;
using www.Models.Ex.Feed;
using www.Models.ExtSrv;
using www.Models.Items;
using www.SaGateway;
using TypeObjectListView = ANBR.Common.Filters.TypeObjectListView;


namespace www.Controllers.api
{
    public class RequestController : ApiController
    {
        [ActionName("DefaultAction")]
        public List<TreeElement> Get(string widgetType = null)
        {
            var saDB = WebSaUtilities.Database;

            int targetViewIndex = -1;
            if (!String.IsNullOrWhiteSpace(widgetType)) targetViewIndex = (int)Widget.QueryTypeByWidgetType(widgetType);

            List<QueryInfo> queries = saDB.QueryService.QueryList(TypeQuery.Template, ANBR.Query.Common.TypeQueryApplication.Analyst, ANBR.Query.Common.FolderType.CommonFolder);
            List<QueryFolderInfo> folders = saDB.QueryService.QueryFolderList(ANBR.Query.Common.TypeQueryApplication.Analyst, ANBR.Query.Common.FolderType.CommonFolder);

            IEnumerable<TreeElement> query =
                from QueryFolderInfo mType in folders
                where mType != null
                select new TreeElement
                {
                    id = mType.QueryFolder_ID.ToString(),
                    parentid = (mType.ParentFolder_ID == -1 ? 0 : mType.ParentFolder_ID).ToString(),
                    title = mType.Name,
                    iconexist = false
                };

            //запрос может быть составной: "кросс-запрос" и "стандартный"
            //в большинстве случаев присутствует только один "стандартный", который и является точкой входа
            //если же запрос составной, то точкой входа является "кросс-запрос" - бред полный!
            IEnumerable<TreeElement> els = queries.Select(el =>
            {
                //структурами SDK el.AllParameters пользоваться нельзя содержат неполные данныие и ошибки
                //в аналитике работа осуществляется с QueryFileData

                QueryInfo qi = saDB.QueryService.QueryGet(el.Query_ID);

                var node = new TreeElement
                {
                    id = el.Query_ID.ToString(),
                    parentid = el.QueryFolder_ID.ToString(),
                    title = el.Name,
                    iconexist = false,
                    isdoc = true
                };

                try
                {
                    QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);
                    FTDLQuery entryQuery = qfd.MainQueryInfo.UseCross ? qfd.CrossQuery : qfd.StandardQuery;
                    TypeObjectListView viewType = qfd.MainQueryInfo.CrossView == TypeObjectListView.CrossTable ? qfd.MainQueryInfo.StandardView : qfd.MainQueryInfo.CrossView;
                    if (targetViewIndex >= 0 && targetViewIndex != (int)viewType) return null;


                    //содержит параметры "стандартного запроса"
                    node.parameters = entryQuery.Parametrs.Select(q => q.ToLocalType()).ToArray();
                    node.status = 0;
                }
                catch (Exception e)
                {
                    node.status = -1;
                    node.msg = e.Message;
                }

                return node;
            }).Where(item => item != null);

            var folder = query.ToList();
            var queriesOnly = els.ToList();

            List<TreeElement> res = new List<TreeElement>();
            SearchAllFolders(queriesOnly, folder, ref res);
            res.AddRange(queriesOnly);

            return res;
        }

        private void SearchAllFolders(List<TreeElement> children, List<TreeElement> allFolders, ref List<TreeElement> res)
        {
            var l = (from f in allFolders
                    join c in children on f.id equals c.parentid
                    select f).Distinct().ToList();
            if (!l.Any()) return;

            res.AddRange(l);
            SearchAllFolders(l, allFolders, ref res);
        }

        /// <summary>
        /// Позволяет получить результаты сохраненного запроса
        /// </summary>
        /// <param name="id"></param>
        /// <returns>PostsPack, в случае ошибки заполняется поле msg</returns>
        [HttpGet]
        public HttpResponseMessage Execute(int id)
        {
            var q = Request.RequestUri.ParseQueryString();

            int page;
            if (!int.TryParse(q["page"], out page))
                page = 1;

            ANBR.Query.Common.QueryInfo qi = WebSaUtilities.Database.QueryService.QueryGet(id);
            QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);
            FTDLQuery entryQuery = qfd.MainQueryInfo.UseCross ? qfd.CrossQuery : qfd.StandardQuery;

            //param - это перечень параметров запроса
            if (q.Count > 0 && q.GetKey(0) != "param" && q["param"] != "null")
            {
                foreach (string p in q)
                {
                    string paramName = p.StartsWith("#") ? p : $"#{p}#";
                    var par = entryQuery.Parametrs.FirstOrDefault(el => String.Equals(el.Name, paramName, StringComparison.OrdinalIgnoreCase));
                    var v = System.Web.HttpUtility.UrlDecode(q[p]);
                    if (par != null)
                        par.Value = v;
                }
            }

            try
            {
                TypeObjectListView viewType;
                var feed = HelperContent.PrepareCollectionSimple(WebSaUtilities.Database, qfd, page, Root.PAGE_SIZE, out viewType, Scope.GetCurrentDBIDi());

                var data = RecieveData(feed, viewType);

                return Request.CreateResponse(HttpStatusCode.OK, data);
            }
            catch (FaultException e)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, new DataPackTable
                {
                    msg = e.Message
                });
            }
        }

        [NonAction]
        private DataPackTable RecieveData(ContentCollection feed, TypeObjectListView viewType)
        {
            DataPackTable output = null;

            switch (viewType)
            {
                case TypeObjectListView.CrossTable:
                    break;

                case TypeObjectListView.Table:
                case TypeObjectListView.Map:
                case TypeObjectListView.Graph:
                    {
                        feed.render = viewType.ToString();
                        output = new DataPackTable { feed = feed };
                        break;
                    }
                case TypeObjectListView.Tree:
                    break;
                case TypeObjectListView.Gauge:
                    break;
            }

            return output;
        }

//TODO: 2017-08-29 Необходимо рассмотреть возможность использования логики GetController

        [HttpPost]
        [ActionName("DefaultAction")]
        public HttpResponseMessage ExecuteV2(DataRequestDescriptor dm)
        {
            ANBR.Query.Common.QueryInfo qi = WebSaUtilities.Database.QueryService.QueryGet(dm.id);
            QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);
            FTDLQuery entryQuery = qfd.MainQueryInfo.UseCross ? qfd.CrossQuery : qfd.StandardQuery;
            if (dm.pars != null)
                foreach (QueryParameter item in dm.pars)
                {
                    string paramName = item.Name.StartsWith("#") ? item.Name : $"#{item.Name}#";
                    var saParam = entryQuery.Parametrs.FirstOrDefault(el => String.Equals(el.Name, paramName, StringComparison.OrdinalIgnoreCase));
                    if (saParam == null) continue;

                    string val = item.ValueCombine();
                    if (val != null)
                        saParam.Value = val;
                }

            string cacheKey = $"{Scope.GetCurrentDBIDi()}_{dm.id}_{qfd.ToString().GetHashCode()}_{dm.page}_{dm.pagesize}";
            try
            {
                var data = HelperCache.CacheGetOrAdd<DataPackTable>(cacheKey, () =>
                {
                    TypeObjectListView viewType;
                    var feed = HelperContent.PrepareCollectionSimpleV2(WebSaUtilities.Database, qfd, dm.page, dm.pagesize, out viewType, Scope.GetCurrentDBIDi());

                    return RecieveData(feed, viewType);
                }, DateTime.UtcNow.AddSeconds(20), null);


                return Request.CreateResponse(HttpStatusCode.OK, data);
            }
            catch (FaultException e)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, new DataPackTable
                {
                    msg = e.Message
                });
            }
        }

        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get(int id)
        {
            var output = new List<ListElement>();
            var q = Request.RequestUri.ParseQueryString();

            int page;
            if (!int.TryParse(q["page"], out page))
                page = 1;

            ANBR.Query.Common.QueryInfo qi = WebSaUtilities.Database.QueryService.QueryGet(id);
            QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);

            FTDLQuery entryQuery = qfd.MainQueryInfo.UseCross ? qfd.CrossQuery : qfd.StandardQuery;

            //param - это перечень параметров запроса
            if (q.Count > 0 && q.GetKey(0) != "param" && q["param"] != "null")
            {
                foreach (string p in q)
                {
                    string paramName = p.StartsWith("#") ? p : $"#{p}#";
                    var par = entryQuery.Parametrs.FirstOrDefault(el => String.Equals(el.Name, paramName, StringComparison.OrdinalIgnoreCase));
                    var v = System.Web.HttpUtility.UrlDecode(q[p]);
                    if (par != null)
                    {
                        par.Value = v;
                        //var result = ConvertTo(v, par.Type);
                        //if (result.Length == 1) par.Value = ConvertTo(v, par.Type)[0].ToString();
                        //if (result.Length > 1) par.Value = String.Join(",", ConvertTo(v, par.Type));
                    }
                }

                var viewType = qfd.MainQueryInfo.CrossView == TypeObjectListView.CrossTable ? qfd.MainQueryInfo.StandardView : qfd.MainQueryInfo.CrossView;

                if (viewType == TypeObjectListView.Table)
                {
                    DataRaw dRaw = Root.GetDataRawPaged(WebSaUtilities.Database, qfd, page);
                    output = Root.GetList(dRaw.data);
                }
                else
                {
                    DataRaw dRaw = Root.GetDataRaw(WebSaUtilities.Database, qfd);
                    output = Root.GetList(dRaw.data, page);
                }
            }
            return output;
        }

        /*
            С параметрами можно работать через QueryFileData...

                [NonAction]
                private object[] ConvertTo(string v, ANBR.Common.Filters.QueryParameterType type)
                {
                    var output = new List<object>();

                    switch (type.ToString())
                    {
                        case "DateTime":
                            DateTime _out;
                            if (DateTime.TryParse(v, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out _out))
                                output.Add(_out);
                            else output.Add(v);
                            break;
                        case "Text":
                            //v = "\"" + v + "\"";
                            output.Add(v);
                            break;
                        case "String":
                        case "Object":
                            output.Add(v);
                            break;
                        default:
                            string[] vv = v.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                            output.AddRange(vv.Select(s => Convert.ToInt32(s)).Cast<object>());
                            break;
                    }

                    return output.ToArray();
                }
        */
    }
}
