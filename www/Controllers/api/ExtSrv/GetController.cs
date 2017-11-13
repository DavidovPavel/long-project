using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.ServiceModel;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Cors;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using ANBR.Common.Filters;
using ANBR.Helpful.Misc.Uniclasses;
using ANBR.SemanticArchive.SDK;
using www.Areas.wall.Models;
using www.Areas.wall.Models.WidgetTypes;
using www.Helpers;
using www.Models.Data.Common;
using www.Models.Data.Out.Cloud;
using www.Models.Data.Out.Graph;
using www.Models.Ex.Feed;
using www.Models.ExtSrv;
using www.SaGateway;
using www.WebExtensions;
using TypeObjectListView = ANBR.Common.Filters.TypeObjectListView;

namespace www.Controllers.api.ExtSrv
{
    /// <inheritdoc />
    /// <summary>
    /// Фасад получения данных для виджетов разного типа
    /// </summary>
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    public class GetApiController : ApiController
    {
        /// <summary>
        /// Получить приращение к данным, для заданного виджета
        /// Вызвается автоматически через заданные интервалы времени (если разрешено)
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException">Invalid input data</exception>
        [EnableCorsCustom]
        [Route("api/extsrv/latestposts")]
        [HttpPost]
        public async Task<DataPackTableUpdate> LatestPosts(DataRequestDescriptor data)
        {
            if (data.id == 0) throw new ArgumentException("Invalid input data");

            DataPackTableUpdate output = null;
            QueryDTO qDto = await WallBL.WidgetQueryDataAsync(data.id);
            IDataBase saDB = WebSaUtilities.ConnectorInstance.GetDataBase(qDto.DatabaseID, 0, qDto.DatabaseName);

            ANBR.Query.Common.QueryInfo qi = saDB.QueryService.QueryGet(qDto.SAQueryID);
            QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);

            TypeObjectListView viewType = qfd.MainQueryInfo.CrossView == TypeObjectListView.CrossTable
                ? qfd.MainQueryInfo.StandardView
                : qfd.MainQueryInfo.CrossView;

            VisualizatonType vType = CalcDataTransformationMode(viewType, data.widget);
            switch (vType)
            {
                case VisualizatonType.WidgetTable:
                    {
                        string ts;
                        bool useDefParams = (data.useDefParams ?? qDto.UseDefParams) ?? true;
                        HelperContent.FillParameters(data, qfd, useDefParams);

                        ContentCollection feed;
                        if (!String.IsNullOrWhiteSpace(data.widget?.Visualization))
                        {
                            using (CallContextScope.Capture("Visualization", data.widget?.Visualization))
                            {
                                feed = HelperContent.PrepareCollectionFeed(saDB, data, qfd, out ts, qDto.DatabaseID);
                                feed.render = viewType.ToString();
                                output = new DataPackTableUpdate { posts = feed.items, ts = ts };
                                break;
                            }
                        }

                        feed = HelperContent.PrepareCollectionFeed(saDB, data, qfd, out ts, qDto.DatabaseID);
                        feed.render = viewType.ToString();
                        output = new DataPackTableUpdate { posts = feed.items, ts = ts };
                        break;

                    }
            }

            return output;
        }


        /// <summary>
        /// Позволяет получить набор данных для заданного виджета
        /// Возможен последовательный вызов при прокрутке (изменятеся параметр страницы и количество возвращаемых объектов)
        /// </summary>
        /// <param name="data"></param>
        /// <returns>PostsPack, в случае ошибки заполняется поле msg</returns>
        //[EnableCors(origins: "*", headers: "*", methods: "*")]
        [EnableCorsCustom]
        [Route("api/extsrv/send")]
        [HttpPost]
        public async Task<HttpResponseMessage> Send(DataRequestDescriptor data)
        {
            DataPackBase output = null;
            QueryDTO qDto = await WallBL.WidgetQueryDataAsync(data.id);
            if (qDto == null) return Request.CreateResponse(HttpStatusCode.InternalServerError, new DataPackTable { msg = "Invalid SA Query" });

            if (String.IsNullOrWhiteSpace(data.ruleCode))
                data.ruleCode = qDto.ruleCode;
            if (data.ruleCode == "any") //команда получить все варианты данных
                data.ruleCode = null;

            IDataBase saDB = WebSaUtilities.ConnectorInstance.GetDataBase(qDto.DatabaseID, 0, qDto.DatabaseName);

            ANBR.Query.Common.QueryInfo qi = saDB.QueryService.QueryGet(qDto.SAQueryID);
            if (qi?.Query_ID == default(int)) return Request.CreateResponse(HttpStatusCode.InternalServerError, new DataPackTable { msg = "Invalid SA Query" });

            QueryFileData qfd = QueryFileData.FromXmlContent(qi?.XmlText);

            TypeObjectListView viewType = qfd.MainQueryInfo.CrossView == TypeObjectListView.CrossTable
                ? qfd.MainQueryInfo.StandardView
                : qfd.MainQueryInfo.CrossView;

            string mainObjectID = saDB.GetPrameterValueFromSaQueryByName(qDto.SAQueryID, "MainObjectID");
            if (!(qDto.UseDefParams ?? true))
            {
                var pList = qDto.Params.ToLocalType(saDB, qi);
                var p = pList.FirstOrDefault(item => item.Name == "MainObjectID");
                mainObjectID = p?.ValueCombine();
            }
            int[] mainObjectIDArr = mainObjectID?.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(item => Convert.ToInt32(item)).ToArray();


            HelperCache.MainObjectDataAddToCache(saDB, mainObjectIDArr);
            try
            {
                VisualizatonType vType = CalcDataTransformationMode(viewType, data.widget);
                switch (vType)
                {
                    case VisualizatonType.WidgetTable:
                        {
                            if (!String.IsNullOrWhiteSpace(data.widget?.Visualization))
                            {
                                using (CallContextScope.Capture("Visualization", data.widget?.Visualization))
                                {
                                    output = PrepareData(data, qDto, saDB, qfd, viewType);
                                }
                            }
                            else
                                output = PrepareData(data, qDto, saDB, qfd, viewType);

                            break;
                        }
                    case VisualizatonType.WidgetCloud:
                    case VisualizatonType.WidgetGraph:
                        {
                            bool useDefParams = (data.useDefParams ?? qDto.UseDefParams) ?? true;
                            HelperContent.FillParameters(data, qfd, useDefParams);

                            if (vType == VisualizatonType.WidgetCloud)
                                output = new DataPack<RuleSetTransformationResultCloud>
                                {
                                    data = HelperContent.PrepareCollection<RuleSetTransformationResultCloud>(saDB, data, qfd, vType, out var _, qDto.DatabaseID)
                                };
                            if (vType == VisualizatonType.WidgetGraph)
                                output = new DataPack<RuleSetTransformationResultGraph>
                                {
                                    data = HelperContent.PrepareCollection<RuleSetTransformationResultGraph>(saDB, data, qfd, vType, out var _, qDto.DatabaseID)
                                };

                            break;
                        }
                }


                return Request.CreateResponse(HttpStatusCode.OK, output);
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
        private static DataPackBase PrepareData(DataRequestDescriptor data, QueryDTO qDto, IDataBase saDB, QueryFileData qfd, TypeObjectListView viewType)
        {
            bool useDefParams = (data.useDefParams ?? qDto.UseDefParams) ?? true;
            HelperContent.FillParameters(data, qfd, useDefParams);
            ContentCollection feed = HelperContent.PrepareCollectionFeed(saDB, data, qfd, out var ts, qDto.DatabaseID);
            feed.render = viewType.ToString();

            DataPackBase output = new DataPackTable { feed = feed, ts = ts };
            return output;
        }

        private VisualizatonType CalcDataTransformationMode(TypeObjectListView viewType, WidgetDescriptor dataWidget)
        {
            if (viewType == TypeObjectListView.Table || viewType == TypeObjectListView.Map)
                return VisualizatonType.WidgetTable;

            if (Enum.TryParse(dataWidget.type, true, out WidgetTypes wt))
            {
                if (wt == WidgetTypes.WidgetCloud) return VisualizatonType.WidgetCloud;
                if (wt == WidgetTypes.WidgetGraph) return VisualizatonType.WidgetGraph;
            }

            throw new ArgumentException("Unknown widget type for the query");
        }
    }
}
