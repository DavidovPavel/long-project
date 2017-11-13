using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using ANBR.Common.Filters;
using ANBR.Query.Common;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using www.Areas.wall.Models;
using System.Threading.Tasks;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.ObjectModel;
using www.Areas.wall.Models.WidgetTypes;
using www.Models;
using www.SaGateway;
using Auth = Thinktecture.IdentityModel45.Authorization;

namespace www.Controllers.api.interactive
{
    public class InteractiveController : ApiController
    {
        #region "Грани"

        /// <summary>
        /// Метод для получения списка всех граней (подсистем) системы
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/edge/all")]
        public async Task<List<Edge>> EdgesGetAll()
        {
            return (await ContentBL.EdgesGetAllAsync()).ConvertAll(Edge.ToEdge);
        }

        /// <summary>
        /// Метод для добавления грани системы
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        [Route("api/edge")]
        public async Task EdgesAdd(IEnumerable<Edge> edges)
        {
            if (!Scope.IsSupervizer()) return;

            await ContentBL.EdgesDeleteAll();
            foreach (var edgeDTO in edges.Select(Edge.ToEdgeDTO))
                await ContentBL.EdgesSave(edgeDTO);
        }

        /// <summary>
        /// Метод для изменении информации по грани системы
        /// </summary>
        /// <returns></returns>
        [HttpPut]
        [Route("api/edge")]
        public async Task<Edge> EdgesModify(Edge edge)
        {
            var edgeDTO = Edge.ToEdgeDTO(edge);
            await ContentBL.EdgesSave(edgeDTO);

            return edge;
        }

        #endregion

        #region "Стена"

        /// <summary>
        /// Метод удаления шаблона запроса
        /// </summary>
        /// <param name="widgetType"></param>
        /// <param name="id"></param>
        [HttpDelete]
        [Route("api/interactive/getparamsforwall/{widgetType}/{id:int}")]
        public async Task DeletTemplate(string widgetType, int id)
        {
            await WallBL.DeleteQueryTemplate(id);
        }

        /// <summary>
        /// Метод для передачи параметров запроса на витрину
        /// </summary>
        /// <param name="pars"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/interactive/paramsforwall")]
        public async Task<RequestParameters> ParamsForWall(RequestParameters pars)
        {
            var virtualDbId = Scope.GetCurrentDBIDi();
            if (virtualDbId == default) throw new ApplicationException("Current database isn't defined.");

            QueryInfo qry = WebSaUtilities.Database.QueryService.QueryGet(pars.requestid);

            ANBR.Query.Common.QueryInfo qi = WebSaUtilities.Database.QueryService.QueryGet(qry.Query_ID);
            QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);
            FTDLQuery entryQuery = qfd.MainQueryInfo.UseCross ? qfd.CrossQuery : qfd.StandardQuery;

            TypeObjectListView viewType = qfd.MainQueryInfo.CrossView == TypeObjectListView.CrossTable
                ? qfd.MainQueryInfo.StandardView
                : qfd.MainQueryInfo.CrossView;


            string title = DateTime.Now.ToString("yyyyMMdd") + "_" + qry.Name;
            string userID = WebSaUtilities.GetCurrentUserID();

            var query = new QueryDTO
            {
                DatabaseID = virtualDbId,
                DatabaseName = WebSaUtilities.Database.ConnectionInfo.DatabaseName,
                Host = pars.domain,
                PageSize = pars.pagesize,
                SAQueryID = pars.requestid,
                ViewType = viewType.ToString(),
                UseDefParams = pars.useDefParams
            };
            if (pars.parameters != null)
            {
                foreach (var p in pars.parameters)
                {
                    query.AddParameter(new QueryParamDTO
                    {
                        QueryParamName = p.Name,
                        QueryParamValues = TransformationHelper.ParamToString(p),
                        QueryParamTitle = p.Caption
                    });
                }
            }

            var qid = await WallBL.QueryAddForWidgetData(title, userID, query);

            return (await WallBL.QueryCandidateGetByID(qid))
                .ToLocalType(entryQuery);
        }

        /// <summary>
        /// метод для заполнения селекта сохраненных запросов запросов
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/interactive/getparamsforwall/{widgetType?}")]
        public async Task<List<RequestParameters>> GetParams(string widgetType = null)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            List<QueriesCandidateDTO> qc = await WallBL.QueryCandidateGetAll(userID);
            if (!String.IsNullOrWhiteSpace(widgetType))
            {
                int vt = Widget.QueryTypeByWidgetType(widgetType);
                qc = qc.Where(item => vt == -1 || item.Query.ViewType == ((TypeObjectListView)vt).ToString()).OrderByDescending(item => item.QueryID).ToList();
            }
            return qc.ConvertAll(item =>
            {
                IDataBase sadb = WebSaUtilities.ConnectorInstance.GetDataBase(item.Query.DatabaseID, 0, item.Query.DatabaseName);
                if (sadb != null)
                {
                    ANBR.Query.Common.QueryInfo qi = sadb.QueryService.QueryGet(item.QueryID);
                    QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);
                    FTDLQuery entryQuery = qfd.MainQueryInfo.UseCross ? qfd.CrossQuery : qfd.StandardQuery;

                    return item.ToLocalType(entryQuery);
                }

                return null;
            }).Where(item => item != null).ToList();
        }

        #endregion

        /// <summary>
        /// Возврат параметров объекта и его размещения (сервер, база) для задач импорта данных в СА
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public string GetCodeForExternalSASys(int id)
        {
            string res = "";

            IDataBase saDB = WebSaUtilities.Database;
            IObjectInfo obj = saDB.ObjectModel.GetObject(id);
            if (obj.MetaType.IsOrganization)
            {
                var org = (IOrganization)obj;

                res = string.Format("\"-SO:{0}|{6}|{7}\" \"-SA4:{1}:{2}:{3}:{4}:{8}:{9}\" {5}",
                    /*0*/obj.DisplayName.Replace('"', ' '),
                    /*1*/System.Configuration.ConfigurationManager.AppSettings["ServerName"],
                    /*2*/System.Configuration.ConfigurationManager.AppSettings["Port"],
                    /*3*/saDB.ConnectionInfo.DatabaseName,
                    /*4*/id,
                    /*5*/"", //requestIdArg
                             /*6*/string.IsNullOrEmpty(org.INN) ? "" : org.INN.Trim(),
                    /*7*/string.IsNullOrEmpty(org.OGRN) ? "" : org.OGRN.Trim(),
                    /*8*/Scope.GetCurrentDBID(),
                    /*9*/Scope.GetInternalPrjID());
            }
            if (obj.MetaType.IsPerson)
            {
                var pers = (IPerson)obj;

                res = string.Format("\"-SP:{0}|{6}|{7}|{8}\" \"-SA4:{1}:{2}:{3}:{4}:{9}:{10}\" {5}",
                    /*0*/obj.DisplayName.Replace('"', ' '),
                    /*1*/System.Configuration.ConfigurationManager.AppSettings["ServerName"],
                    /*2*/System.Configuration.ConfigurationManager.AppSettings["Port"],
                    /*3*/saDB.ConnectionInfo.DatabaseName,
                    /*4*/id,
                    /*5*/"", //requestIdArg
                             /*6*/pers.BirhtDate > DateTime.MinValue
                         ? pers.BirhtDate.ToString("d.M.yyyy")
                         : "",
                    /*7*/string.IsNullOrEmpty(pers.INN) ? "" : pers.INN.Trim(),
                    /*8*/string.IsNullOrEmpty(pers.OGRNIP) ? "" : pers.OGRNIP.Trim(),
                    /*9*/Scope.GetCurrentDBID(),
                    /*10*/Scope.GetInternalPrjID());
            }

            return res;
        }

        /// <summary>
        /// Тестовый метод
        /// </summary>
        /// <returns></returns>
        [Route("api/interactive/EGRUL")]
        public async Task<string> GetEGRUL()
        {
            string page = "http://egrul.nalog.ru/";

            using (var client = new HttpClient())
            using (HttpResponseMessage response = await client.GetAsync(page))
            using (HttpContent content = response.Content)
            {
                string html = await content.ReadAsStringAsync();
                //var re = new Regex("(<body.*?>.*</body>)", RegexOptions.Singleline | RegexOptions.IgnoreCase);
                //Match match = re.Match(html);
                //if (match.Success)
                //    return match.Groups[1].Value;

                return html;
            }
        }
    }
}