using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.ObjectModel;
using Anbr.Web.SA.CoreLogic;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic.Model;
using www.Areas.wall.Models;
using System.Threading.Tasks;
using Anbr.Web.SA.CoreLogic.Model.Wall;
using ANBR.Common.Filters;
using ANBR.Helpful.Misc.Graphic;
using ANBR.SDKHelper;
using Newtonsoft.Json.Linq;
using Omu.ValueInjecter;
using www.Areas.wall.Models.WidgetTypes;
using www.Helpers;
using www.Models;
using www.Models.Data.Out.Base;
using www.Models.Ex.Feed;
using www.SaGateway;
using www.SaGateway.BL;

namespace www.Controllers.api.wall
{
    public class WidgetController : ApiController
    {
        /// <summary>
        /// Item1 - bgColor, item2 - fontColor
        /// </summary>
        static readonly ConcurrentDictionary<int, Tuple<System.Drawing.Color, System.Drawing.Color>> _mentionObjectColorPairCache = new ConcurrentDictionary<int, Tuple<System.Drawing.Color, System.Drawing.Color>>();

        #region Методы на реакцию событий прослушиваемых виджетов

        /// <summary>
        /// Получения содержимого декоративного виджета
        /// </summary>
        /// <param name="queryid"></param>
        /// <param name="wuid"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        [Route("api/widget/listen/{queryid:int}/uiwidget/{wuid:guid}/{id:int}")]
        [HttpGet]
        public async Task<string> GetUIContent(int queryid, Guid wuid, int id)
        {
            //QueryDTO qDto = WallBL.WidgetQueryData(queryid);
            //IDataBase saDB = WebSaUtilities.ConnectorInstance.GetDataBase(qDto.DatabaseID, 0, qDto.DatabaseName);

            WidgetDTO wDTO = await WallBL.WidgetGet(wuid);

            return wDTO.ContentHtml;
        }

        /// <summary>
        /// Получения содержимого исходного документа для источника
        /// </summary>
        /// <param name="queryid"></param>
        /// <param name="wuid"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        [Route("api/widget/listen/{queryid:int}/source/{wuid:guid}/{id:int}")]
        [HttpGet]
        public async Task<ContentCollection> Get(int queryid, Guid wuid, int id)
        {
            string contentPropName = "TextSource";

            QueryDTO qDto = await WallBL.WidgetQueryDataAsync(queryid);
            IDataBase saDB = WebSaUtilities.ConnectorInstance.GetDataBase(qDto.DatabaseID, 0, qDto.DatabaseName);
            WidgetDTO wDTO = await WallBL.WidgetGet(wuid);
            if (!String.IsNullOrWhiteSpace(wDTO.ContentProp))
                contentPropName = wDTO.ContentProp;

            ANBR.Query.Common.QueryInfo qi = saDB?.QueryService.QueryGet(qDto.SAQueryID);

            var kwArr = new string[0];
            string kw = saDB.GetPrameterValueFromSaQueryByName(qDto.SAQueryID, "HighlightKeywords");
            if (!String.IsNullOrWhiteSpace(kw))
                kwArr = kw.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);

            string highlightMentionObj = saDB.GetPrameterValueFromSaQueryByName(qDto.SAQueryID, "HighlightMentionObj");
            string mainObjectID = saDB.GetPrameterValueFromSaQueryByName(qDto.SAQueryID, "MainObjectID");
            string mainObjectColor = saDB.GetPrameterValueFromSaQueryByName(qDto.SAQueryID, "MainObjectColor");

            if (!(qDto.UseDefParams ?? true))
            {
                List<QueryParameter> pList = qDto.Params.ToLocalType(saDB, qi);
                QueryParameter p = pList.FirstOrDefault(item => item.Name == "HighlightMentionObj");
                highlightMentionObj = p?.Value.Length > 0 ? p[0] : null;

                p = pList.FirstOrDefault(item => item.Name == "MainObjectID");
                mainObjectID = p?.ValueCombine();

                p = pList.FirstOrDefault(item => item.Name == "mainObjectColor");
                mainObjectColor = p?.Value.Length > 0 ? p[0] : null;
            }
            mainObjectColor = String.IsNullOrWhiteSpace(mainObjectColor) ? "#FF0000" : mainObjectColor;

            int[] mainObjectIDArr = mainObjectID?.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(item => Convert.ToInt32(item)).ToArray();

            var coll = new ContentCollection();
            if (saDB._ObjectTypeOf(id, _SAConst.Type_Fact))
                coll = FactsController.GetSourceForFact(saDB, id, kwArr, contentPropName);
            if (saDB._ObjectTypeOf(id, _SAConst.Type_Source))
            {
                bool htmlEncodingNeeded = !(wDTO.IsHtmlContent ?? false);
                bool extractOnlyMedia = wDTO.ExtractOnlyMedia ?? false;
                ContentItem ci = HelperContent.GetContentV2(saDB, id, kwArr, null, htmlEncodingNeeded, null, contentPropName, extractOnlyMedia, HelperContent.TextMode.Short, HelperContent.TranslationMode.Orignal);
                coll.items.Add(ci);
            }

            if (coll.items.Count > 0)
            {
                int sourceID = Convert.ToInt32(coll.items[0].GetPropertyBySystemName("Object_ID").value);
                var textEl = coll.items[0].GetPropertyBySystemName(contentPropName);
                string text = textEl.value;


                Regex reIsRightToLeft = new Regex(@"\p{IsArabic}|\p{IsHebrew}");
                RegexOptions options = RegexOptions.IgnoreCase | RegexOptions.Singleline;
                if (reIsRightToLeft.IsMatch(text)) options = options | RegexOptions.RightToLeft;

                if (mainObjectIDArr != null)
                {
                    Tuple<List<string>, List<string>> synListPureWithMorph = HelperCache.MainObjectDataGetFromCache(saDB, mainObjectIDArr);
                    if (synListPureWithMorph != null)
                    {
                        var synListPureWithMorphReadyForSearch = synListPureWithMorph.Item1;
#warning 2016-09-09 Отсутствует подсветка морфологии фраз
                        //TODO: 2016-09-09 Отсутствует подсветка морфологии фраз
                        var synListPureWithMorphPhrases = synListPureWithMorph.Item2;

                        var refMorph = new List<string>();
                        foreach (var sm in synListPureWithMorphReadyForSearch)
                        {
                            var re = new Regex(Regex.Escape(sm), options);

                            if (re.IsMatch(text))
                                refMorph.Add(sm);
                        }
                        foreach (var sm in synListPureWithMorphPhrases)
                        {
                            var re = new Regex(Regex.Escape(sm), options);
                            if (re.IsMatch(text))
                                refMorph.Add(sm);
                        }

                        text = DocumentHighlighting.GetFormattedText(refMorph.ToArray(), text, "0",
                            DocumentHighlighting.FormattinKind.Keywords, DocumentHighlighting.Mode.WholeWord,
                            $"color:{mainObjectColor};font-weight: 600;", "*");
                    }
                }


                if (!String.IsNullOrWhiteSpace(highlightMentionObj) || (wDTO.HighlightMentionObj ?? false))
                {
                    var objectList = saDB.SourceService.GetMentionObject(sourceID);
                    for (int i = 0; i < objectList.Count; i++)
                    {
                        var mo = objectList[i];
                        if (!mo.IsMonitoring) continue;
                        if (mainObjectIDArr?.Any(item => item == mo.DataObjectInfo.Object_ID) ?? false) continue;

                        var highlightingElements = new List<string>(mo.Synonyms);
                        highlightingElements.Add(mo.DataObjectInfo.DisplayName);

                        var pair = _mentionObjectColorPairCache.GetOrAdd(mo.DataObjectInfo.Object_ID, ColorGenerator.GetNext());

                        string color = pair.Item1.ToHtmlVersion();
                        string bgcolor = pair.Item2.ToHtmlVersion();

                        var minLen = highlightingElements.Min(item => item.Length);

                        var highlightingElementstWithMorph = saDB.ServiceTools.GetPhraseFormsSimple(highlightingElements.ToArray(), text);
                        if (minLen != 1) minLen = 2;

                        highlightingElementstWithMorph = highlightingElementstWithMorph.Where(item => item.Length >= minLen).ToArray();

                        text = DocumentHighlighting.GetFormattedText(
                            highlightingElementstWithMorph,
                            text,
                            sourceID.ToString(),
                            DocumentHighlighting.FormattinKind.EntitiesInText, DocumentHighlighting.Mode.WholeWord,
                            $"color:{color};font-weight: 600;background-color:{bgcolor}", "*");
                    }

                    textEl.value = text;
                }
            }

            coll.href = $"/api/widget/listen/{queryid}/source/{id}";

            return coll;
        }

        /// <summary>
        /// Получение ссылки на сгенерированный pdf-документ
        /// </summary>
        /// <param name="queryid"></param>
        /// <param name="wuid"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        [Route("api/widget/listen/{queryid:int}/reporting/{wuid:guid}/{id:int}")]
        [HttpGet]
        public async Task<string> GetReport(int queryid, Guid wuid, int id)
        {
            QueryDTO qDto = await WallBL.WidgetQueryDataAsync(queryid);
            IDataBase saDB = WebSaUtilities.ConnectorInstance.GetDataBase(qDto.DatabaseID, 0, qDto.DatabaseName);

            ISaObject saObj = saDB.ObjectModel.GetObject(id);
            if (saObj == null) throw new ArgumentException("Entity doesn't exist (" + id + ")");

            var repData = await WallBL.WidgetGetReportingItems(wuid);
            foreach (var ri in repData)
            {
                var mt = saDB.MetaModel.MetaTypes.GetByName(ri.TypeSysName);
                if (mt != null)
                {
                    if (mt.IsType(saObj.MetaType.ID))
                        return ReportingBL.GeneratePDFByReportName(saDB, ri.ReportSysName, id);
                }
            }

            return null;
        }

        #endregion

        #region Subscribers and Listeners

        /// <summary>
        /// Получить список виджетов на события которых подписан виджет(слушатель)
        /// Виджет содержит только uid и Title
        /// </summary>
        /// <param name="id">виджет слушатель</param>
        /// <returns></returns>
        [Route("api/widget/{id}/subscribed")]
        [HttpGet]
        public async Task<IEnumerable<Widget>> GetSubscribed(Guid id)
        {
            var widgetsTask = WallBL.WidgetsGetPublishers(id);
            var subscribersDataTask = WallBL.WidgetAllSubscribers(id);

            await Task.WhenAll(widgetsTask, subscribersDataTask);

            List<WidgetDTO> widgets = widgetsTask.Result;
            Dictionary<Guid, List<Tuple<Guid, IEnumerable<QueryParamMapDTO>>>> subscribersData = subscribersDataTask.Result;

            var wList = HelperDashboard.WidgetDtoToModelWithMix(widgets, subscribersData);

            foreach (var w in wList)
            {
                if (w is WidgetQuery) continue;

                var q = WallBL.WidgetsGetPublishersWithQuery(id, w.id);
                if (w is IMarkByRequest reqBearer)
                {
                    IDataBase saDB = WebSaUtilities.ConnectorInstance.GetDataBase(q.DatabaseID, 0, q.DatabaseName);
                    ANBR.Query.Common.QueryInfo qi = saDB.QueryService.QueryGet(q.SAQueryID);
                    QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);
                    FTDLQuery entryQuery = qfd.MainQueryInfo.UseCross ? qfd.CrossQuery : qfd.StandardQuery;

                    reqBearer.requestParameters = q.ToLocalType(entryQuery);
                }
            }

            return wList;
        }

        /// <summary>
        /// Подписать виджет на прослушивание
        /// </summary>
        /// <param name="id">подписчик</param>
        /// <param name="wid">издатель</param>
        /// <returns></returns>
        [Route("api/widget/{id}/subscribed/{wid}")]
        [HttpPut]
        public async Task SaveSubscribed(Guid id, Guid wid)
        {
            if (id == wid)
                throw new ArgumentException("The publisher and the subscriber must be different");

            await WallBL.WidgetSubscribe(id, wid);
        }

        /// <summary>
        /// Отписать виджет от прослушивания
        /// </summary>
        /// <param name="id">подписчик</param>
        /// <param name="wid">издатель</param>
        /// <returns></returns>
        [Route("api/widget/{id}/subscribed/{wid}")]
        [HttpDelete]
        public async Task ClearSubscribed(Guid id, Guid wid)
        {
            await WallBL.WidgetUnsubscribe(id, wid);
        }
        #endregion

        /// <summary>
        /// Получить данные по заданному виджету
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [Route("api/widget/{id}")]
        [HttpGet]
        public async Task<Widget> Get(Guid id)
        {
            WidgetDTO wDTO = await WallBL.WidgetGet(id);

            return wDTO.ToLocalType();
        }

        /// <summary>
        /// Создать новый виджет
        /// </summary>
        /// <param name="wallid"></param>
        /// <param name="wb"></param>
        /// <returns></returns>
        [Route("api/wall/{wallid}/widget")]
        [HttpPost]
        public async Task<Widget> Post(Guid wallid, Widget wb)
        {
            QueryDTO templateQuery = null;

            if (wb is WidgetQuery)
            {
                templateQuery = await WallBL.WidgetQueryDataAsync(((WidgetQuery)wb).requestParameters.rid);
                if (wb is WidgetCloud)
                {
                    var visType = wb.VisualizatonTypeByWidget();
                    templateQuery.ruleCode = RuleSetTransformationResultBase.GetDefaultRuleCodeByVisualization(visType);
                }
            }

            WidgetDTO wDto = wb.ToDTOType(templateQuery);
            wDto = await WallBL.WidgetNew(wallid, wDto);

            var tasks = new Task[wb.publishers.Count()];
            for (int i = 0; i < wb.publishers.Length; i++)
            {
                var publisher = wb.publishers[i];
                tasks[i] = WallBL.WidgetSubscribe(wDto.WidgetUID, publisher);
            }
            await Task.WhenAll(tasks);

            return wDto.ToLocalType();
        }

        /// <summary>
        /// Изменить заданный виджет
        /// </summary>
        /// <param name="wallid"></param>
        /// <param name="widgetid"></param>
        /// <param name="wb"></param>
        /// <returns></returns>
        [Route("api/wall/{wallid}/widget/{widgetid}")]
        [HttpPut]
        public async Task<Widget> Put(Guid wallid, Guid widgetid, Widget wb)
        {
            QueryDTO templateQuery = null;
            int saQueryId = 0;

            if (wb is WidgetQuery wQuery)
                saQueryId = wQuery.requestParameters?.rid ?? 0;

            if (wb is WidgetHtml wHtml)
                saQueryId = HelperOther.ExtractDataOIDFromText<int>(wHtml.contentHtml, "4").FirstOrDefault();

            if (saQueryId != default)
                templateQuery = await WallBL.WidgetQueryDataAsync(saQueryId);


            WidgetDTO wDto = wb.ToDTOType(templateQuery);
            var wDtoRefreshed = await WallBL.WidgetUpdate(wDto);

            return wDtoRefreshed.ToLocalType();
        }

        /// <summary>
        /// Удалить заданный виджет
        /// </summary>
        /// <param name="wallid"></param>
        /// <param name="widgetid"></param>
        [Route("api/wall/{wallid}/widget/{widgetid}")]
        [HttpDelete]
        public async Task Delete(Guid wallid, Guid widgetid)
        {
            await WallBL.WidgetDelete(widgetid);
        }


        #region Произвольные параметры у виджетов
        /// <summary>
        /// Добавление/изменение коллекции параметров виджета
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        [HttpPut]
        [Route("api/widget/{widgetid}/params")]
        public async Task<WidgetsParam[]> WidgetParamsAdd(Guid widgetid, WidgetsParam[] widgetParams)
        {
            var widgetsParams = widgetParams;
            foreach (var p in widgetsParams) p.WidgetParamUID = (p.WidgetParamUID ?? Guid.NewGuid());

            var widgetParamsDTO = widgetsParams.ToDTOType();

            await WallBL.WidgetParamsProcess(widgetParamsDTO, widgetid);

            return widgetsParams;
        }

        /// <summary>
        /// Получить список параметров виджета
        /// </summary>
        /// <param name="widgetid"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/widget/{widgetid}/params")]
        public async Task<WidgetsParam[]> WidgetParamsGet(Guid widgetid)
        {
            WidgetsParamDTO[] wParamsDto = await WallBL.WidgetParamsGet(widgetid);
            return wParamsDto.ToLocalType();
        }

        /// <summary>
        /// Получить значение параметра виджета по имени
        /// </summary>
        /// <param name="widgetid">идентификатор виджета</param>
        /// <param name="pname">наименование параметра</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/widget/{widgetid}/param/{pname}")]
        public async Task<WidgetsParam> WidgetParamGetByName(Guid widgetid, string pname)
        {
            WidgetsParamDTO wParamsDto = await WallBL.WidgetParamGet(widgetid, pname);
            return wParamsDto.ToLocalType();
        }

        /// <summary>
        /// Получить значение параметра виджета по UID параметра
        /// </summary>
        /// <param name="wpid">UID параметра</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/widget/param/{wpid}")]
        public async Task<WidgetsParam> WidgetParamGetByUID(Guid wpid)
        {
            WidgetsParamDTO wParamsDto = await WallBL.WidgetParamGet(wpid);
            return wParamsDto.ToLocalType();
        }


        /// <summary>
        /// Добавить/измененть значение параметра у заданного виджета
        /// </summary>
        /// <param name="widgetid">UID виджета</param>
        /// <param name="widgetParam">Данные</param>
        /// <returns></returns>
        [HttpPost]
        [HttpPut]
        [Route("api/widget/{widgetid}/param")]
        public async Task<WidgetsParam> WidgetParamAdd(Guid widgetid, WidgetsParam widgetParam)
        {
            widgetParam.WidgetParamUID = widgetParam.WidgetParamUID ?? Guid.NewGuid();
            await WallBL.WidgetParamsProcess(widgetParam.ToDTOType(), widgetid);

            return widgetParam;
        }
        #endregion

        #region Позиционирование виджетов
        /// <summary>
        /// Позволяет задать размещение виджета
        /// </summary>
        /// <param name="widgetid"></param>
        /// <param name="pi"></param>
        /// <returns></returns>
        [HttpPut]
        [Route("api/widget/{widgetid}/position")]
        public async Task WidgetSetPosition(Guid widgetid, PositionInfo pi)
        {
            await WallBL.WidgetSetPosition(widgetid, pi.PlacementTop, pi.PlacementLeft, pi.PlacementWidth, pi.PlacementHeight,
               pi.ZIndex);
        }

        #endregion

        #region Состояние виджета (к примеру для карты это масштаб, широта и долгота)
        [HttpPost]
        [Route("api/widget/{widgetid}/setstate")]
        public async Task SetMapState(Guid widgetid, JObject state)
        {
            var wType = WidgetTypes.WidgetMap;
            if (state["widget"] != null)
            {
                string wTypeStr = state["widget"].Value<string>("type");
                if (!String.IsNullOrWhiteSpace(wTypeStr))
                    Enum.TryParse(wTypeStr, true, out wType);
            }

            if (wType == WidgetTypes.WidgetMap)
            {
                var st = state.ToObject<WidgetStateMap>();
                await WallBL.WidgetSetStateMap(widgetid, st.Zoom, st.CenterLong, st.CenterLat);
            }
        }
        #endregion

        #region Map параметров и значений

        /// <summary>
        /// Добавить map между парметром и значением
        /// </summary>
        /// <param name="wid">uid виджета подписчика</param>
        /// <param name="wpublisherid">uid виджета издателя</param>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/widget/{wid:guid}/qparammaps/{wpublisherid:guid}")]
        public async Task<QueryParamMap> QueryParamMapAdd(Guid wid, Guid wpublisherid, QueryParamMap model)
        {
            var qpmap = await WallBL.QueryParamMapAdd(wid, wpublisherid, model.ToDTOType());
            model.QueryParamsMapID = qpmap.QueryParamsMapID;

            return model;
        }

        /// <summary>
        /// Удалить map между параметром и значением
        /// </summary>
        /// <param name="wid">uid виджета подписчика</param>
        /// <param name="wpublisherid">uid виджета издателя</param>
        /// <param name="pmid">Идентификатор цепочки</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("api/widget/{wid:guid}/qparammaps/{wpublisherid:guid}/{pmid:int}")]
        public async Task QueryParamMapDelete(Guid wid, Guid wpublisherid, int pmid)
        {
            await WallBL.QueryParamMapDelete(pmid);
        }

        /// <summary>
        /// Получить коллекцию map между параметром и значеним
        /// </summary>
        /// <param name="wid">uid виджета подписчика</param>
        /// <param name="wpublisherid">uid виджета издателя</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/widget/{wid:guid}/qparammaps/{wpublisherid:guid}")]
        public async Task<IEnumerable<QueryParamMap>> QueryParamMapGetAll(Guid wid, Guid wpublisherid)
        {
            var qpmaps = await WallBL.QueryParamMapGetAll(wid, wpublisherid);
            return qpmaps.Select(item => (QueryParamMap)new QueryParamMap().InjectFrom(item));
        }
        #endregion

        #region Работа с легендой
        [HttpPost]
        [HttpPut]
        [Route("api/widget/{widgetid}/legend")]
        public async Task<LegendInfo> SetLegend(Guid widgetid, LegendInfo legend)
        {
            await WallBL.WidgetSetLegend(widgetid, legend.ToDTOType());

            return legend;
        }

        [HttpPost]
        [HttpPut]
        [Route("api/widget/{widgetid}/legenditems")]
        public async Task<LegendItemInfo[]> SetLegendItems(Guid widgetid, LegendItemInfo[] legenditems)
        {
            foreach (var p in legenditems) p.LegendItemUID = (p.LegendItemUID ?? Guid.NewGuid());

            await WallBL.WidgetSetLegendItems(widgetid, legenditems.ToDTOType());

            return legenditems;
        }

        [HttpPost]
        [HttpPut]
        [Route("api/widget/{widgetid}/legenditem")]
        public async Task<LegendItemInfo> SetLegendItem(Guid widgetid, LegendItemInfo legenditem)
        {
            legenditem.LegendItemUID = (legenditem.LegendItemUID ?? Guid.NewGuid());

            await WallBL.WidgetSetLegendItem(widgetid, legenditem.ToDTOType());

            return legenditem;
        }

        [HttpPost]
        [HttpPut]
        [Route("api/widget/{widgetid}/legenditem/{liuid}")]
        public async Task<LegendItemInfo> SetLegendItem(Guid widgetid, LegendItemInfo legenditem, Guid liuid)
        {
            legenditem.LegendItemUID = (legenditem.LegendItemUID ?? Guid.NewGuid());

            await WallBL.WidgetSetLegendItem(widgetid, legenditem.ToDTOType());

            return legenditem;
        }

        [HttpDelete]
        [Route("api/widget/{widgetid}/legend")]
        public async Task DeleteLegend(Guid widgetid)
        {
            await WallBL.WidgetLegendDelete(widgetid);
        }

        [HttpDelete]
        [Route("api/widget/{widgetid}/legenditem/{uid}")]
        public async Task DeleteLegendItem(Guid widgetid, Guid uid)
        {
            await WallBL.WidgetLegendItemDelete(uid);
        }
        #endregion

        #region Настройка отчетов для виджета WidgetReporting

        [HttpGet]
        [Route("api/widget/{widgetid:guid}/reportitems")]
        public async Task<ReportItemInfo[]> GetReportItems(Guid widgetid)
        {
            return (await WallBL.WidgetGetReportingItems(widgetid)).ToLocalType();
        }

        [HttpPost]
        [Route("api/widget/{widgetid:guid}/reportitems")]
        public async Task<ReportItemInfo> SetReportItems(Guid widgetid, ReportItemInfo reportItem)
        {
            reportItem.UID = (reportItem.UID ?? Guid.NewGuid());

            await WallBL.WidgetSetReportItem(widgetid, reportItem.ToDTOType());

            return reportItem;
        }


        [HttpPut]
        [Route("api/widget/{widgetid:guid}/reportitems/{liuid:guid}")]
        public async Task<ReportItemInfo> SetReportItem(Guid widgetid, ReportItemInfo reportItem, Guid liuid)
        {
            reportItem.UID = (reportItem.UID ?? Guid.NewGuid());

            await WallBL.WidgetSetReportItem(widgetid, reportItem.ToDTOType());

            return reportItem;
        }


        [HttpDelete]
        [Route("api/widget/{widgetid:guid}/reportitems/{uid:guid}")]
        public async Task DeleteReportItem(Guid widgetid, Guid uid)
        {
            await WallBL.WidgetReportItemDelete(uid);
        }
        #endregion
    }
}