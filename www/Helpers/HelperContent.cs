using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Routing;
using Anbr.Web.SA.CoreLogic;
using ANBR.Common.Contarcts;
using ANBR.Common.Filters;
using ANBR.Helpful.Misc.Html;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.SemanticArchive.SDK.ObjectModel;
using ANBR.SemanticArchive.SDK.Queries;
using www.Models;
using www.Models.Data.Common;
using www.Models.Data.In;
using www.Models.Data.Out.Base;
using www.Models.Ex.Feed;
using www.Models.ExtSrv;
using www.SaGateway;
using TypeObjectListView = ANBR.Common.Filters.TypeObjectListView;

namespace www.Helpers
{
    public static class HelperContent
    {
        public enum TextMode
        {
            Short, Whole
        }

        public enum TranslationMode
        {
            Orignal, Translation
        }

        const int _FULLTEXTLENGTH = 5000;

        /// <summary>
        /// Возвращает подготовленный элемент контента по экземпляру типа Источник
        /// </summary>
        /// <param name="saDB">БД СА</param>
        /// <param name="id">Идентификатор источника</param>
        /// <param name="kwArr">Масив ключевых слов, которые требуют подсветки</param>
        /// <param name="highlightPhrase">Фраза, которая требует подсветки</param>
        /// <param name="htmlEncodingNeeded">Необходимо кодировать исходные тексты</param>
        /// <param name="highlightFragments">Фрагменты требующие подсветки</param>
        /// <param name="contentPropName">Системное имя свойства, откуда берем содержимое</param>
        /// <param name="extractOnlyMedia">Признак того, что в содержимом останутся только img, video, iframe(youtube)</param>
        /// <param name="textMode">Режим отображения весь текст/краткий вариант</param>
        /// <param name="translationMode"></param>
        /// <returns>Подготовленный элемент контента по экземпляру типа Источник</returns>
        internal static ContentItem GetContentV2(IDataBase saDB, int id, string[] kwArr, string highlightPhrase, bool htmlEncodingNeeded, Tuple<Guid, string>[] highlightFragments, string contentPropName, bool extractOnlyMedia, TextMode textMode, TranslationMode translationMode)
        {
            var ci = new ContentItem();

            string userDescriptor = WebSaUtilities.GetCurrentUserID();
            string resource = "Rule_TextExtracted";
            string kind = "GET";
            bool hasViolated = StatisticsBL.OperationRulesViolated(userDescriptor, kind, resource);

            if (hasViolated)
            {
                ci.LinkAdd("sys", "Mode", "9");
                return ci;
            }

            string url = Scope.GetCurrentUrl();
            StatisticsBL.OperationTransaction(userDescriptor, kind, resource, url);

            ci = GetSourceSimpleEx(saDB, id, kwArr, highlightPhrase, htmlEncodingNeeded, highlightFragments, contentPropName, extractOnlyMedia, textMode, translationMode, out var textLength, out var hasFile);

            if (textLength > 0)
            {
                string param = "?textMode=" + HttpUtility.UrlEncode(textMode.ToString());
                if (!String.IsNullOrWhiteSpace(highlightPhrase))
                    param = param + "&highlightPhrase=" + HttpUtility.UrlEncode(highlightPhrase);

                LinkExt link;
                if (translationMode == TranslationMode.Orignal)
                    link = new LinkExt()
                    {
                        rel = "tools",
                        id = "translate",
                        href = String.Format("/api/Details/ContentV2ToTranslate/{0}{1}", id, param),
                        verb = "GET",
                        prompt = Root.GetResource("toolsTranslate"),
                        render = "replaceItem"
                    };
                else
                    link = new LinkExt()
                    {
                        rel = "tools",
                        id = "toOriginal",
                        href = String.Format("/api/Details/ContentV2ToOriginal/{0}{1}", id, param),
                        verb = "GET",
                        prompt = Root.GetResource("toolsToOriginalText"),
                        render = "replaceItem"
                    };

                ci.links.Add(link);
            }

            if (hasFile)
            {
                var link = new LinkExt()
                {
                    rel = "tools",
                    id = "showOriginalDoc",
                    href = "",
                    prompt = Root.GetResource("toolsShowOriginalDoc"),
                    render = "showOriginalDoc"
                };
                ci.links.Add(link);
            }

            if (htmlEncodingNeeded)
            {
#warning КраткийВид-ПолныйВид надо понять что с этим делать (он работал при поиске в ГИ)
                /*
                bool isLargeText = textLength > _FULLTEXTLENGTH;
                if (textMode == TextMode.Whole && isLargeText)
                {
                    var link = new LinkExt()
                    {
                        rel = "tools",
                        id = "shortText",
                        href =
                            String.Format("/api/Details/ContentV2/{0}{1}", id,
                            (String.IsNullOrWhiteSpace(highlightPhrase)
                                ? ""
                                : "?highlightPhrase=" + HttpUtility.UrlEncode(highlightPhrase))),
                        verb = "GET",
                        prompt = Root.GetResource("toolsToShortView"),
                        render = "replaceItem"
                    };
                    ci.links.Add(link);
                }
                if (textMode == TextMode.Short && isLargeText)
                {
                    var link = new LinkExt()
                    {
                        rel = "tools",
                        id = "shortText",
                        href =
                            String.Format("/api/Details/ContentV2ToWholeText/{0}{1}", id,
                            (String.IsNullOrWhiteSpace(highlightPhrase)
                                ? ""
                                : "?highlightPhrase=" + HttpUtility.UrlEncode(highlightPhrase))),
                        verb = "GET",
                        prompt = Root.GetResource("toolsToFullView"),
                        render = "replaceItem"
                    };
                    ci.links.Add(link);
                }
                */
            }

            return ci;
        }

        /// <summary>
        /// Возвращает подготовленный элемент контента по экземпляру типа Источник
        /// </summary>
        /// <param name="saDB">БД СА</param>
        /// <param name="id">Идентификатор источника</param>
        /// <param name="kwArr">Масив ключевых слов, которые требуют подсветки</param>
        /// <param name="highlightPhrase">Фраза, которая требует подсветки</param>
        /// <param name="htmlEncodingNeeded">Необходимо кодировать исходные тексты</param>
        /// <param name="highlightFragments">Фрагменты требующие подсветки</param>
        /// <param name="contentPropName">Системное имя свойства, откуда берем содержимое</param>
        /// <param name="extractOnlyMedia"></param>
        /// <param name="textMode">Режим отображения весь текст/краткий вариант</param>
        /// <param name="transMode"></param>
        /// <param name="textLength">Возвращает размер оригинального текста</param>
        /// <param name="hasFile">Признак наличия файла оригинала</param>
        /// <returns>Подготовленный элемент контента по экземпляру типа Источник</returns>
        internal static ContentItem GetSourceSimpleEx(IDataBase saDB, int id, string[] kwArr, string highlightPhrase, bool htmlEncodingNeeded, Tuple<Guid, string>[] highlightFragments, string contentPropName, bool extractOnlyMedia, TextMode textMode, TranslationMode transMode, out int textLength, out bool hasFile)
        {
            if (String.IsNullOrWhiteSpace(contentPropName)) contentPropName = "TextSource";
            if (!htmlEncodingNeeded)
                textMode = TextMode.Whole;

            textLength = 0;
            ISaObject obj = saDB.ObjectModel.GetObject(id);
            var meta = saDB.MetaModel.MetaProperties;
            if (obj == null) throw new InvalidOperationException("Object is not found");
            if (!obj.MetaType.IsSource) throw new ArgumentException("Object is not Source type");

            var uid = obj.Uid.ToString();
            string sourceText = "";
            var mTextSource = meta.GetByName(contentPropName);
            if (obj.MetaType.IsSource && contentPropName == "TextSource")
            {
                var source = (ISource)obj;
                sourceText = source.Text;
                RawTextPrepare(htmlEncodingNeeded, out textLength, ref sourceText);
            }
            else
            {
                if (mTextSource.PropType == PropertyType.String || mTextSource.PropType == PropertyType.Text)
                {
                    sourceText = saDB._PropertyFastGet<string>(id, contentPropName);
                    RawTextPrepare(htmlEncodingNeeded, out textLength, ref sourceText);
                }

                if (mTextSource.PropType == PropertyType.HTML)
                {
                    sourceText = saDB._PropertyFastGet<string>(id, contentPropName);
                    sourceText = Helper.MhtToHtml(sourceText);
                    textMode = TextMode.Whole;

                    sourceText = HelperOther.ScriptsTrim(sourceText, extractOnlyMedia);
                }
            }

            var mObject_ID = meta.GetByName("Object_ID");
            var mDisplay_Name = meta.GetByName("Display_Name");
            var mAuthor = meta.GetByName("Author");
            var mUrl = meta.GetByName("URL_источника");
            var mMassMedia = meta.GetByName("MassMedia");
            var mOrigFileName = meta.GetByName("Файл_оригинала");
            var mType = obj.MetaType.SystemName;

            var prop = obj.Properties["Файл_оригинала"];
            string fileName = "";
            if (prop != null && prop.Value != null && prop.Value != DBNull.Value && !String.IsNullOrWhiteSpace(((IFilePropertyValue)prop.Value).FileName))
            {
                var v = (IFilePropertyValue)prop.Value;
                fileName = v.FileName;
            }
            hasFile = !String.IsNullOrWhiteSpace(fileName);

            if (!String.IsNullOrWhiteSpace(sourceText))
            {
                sourceText = saDB.DoHighlight(highlightPhrase, sourceText, 0);

                bool isLargeText = sourceText.Length > _FULLTEXTLENGTH;
                if (textMode == TextMode.Short && isLargeText)
                {
                    var regex = new Regex(@"(<span.*?</span>)", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    MatchCollection mcollection = regex.Matches(sourceText);

                    int textLen = sourceText.Length;
                    var vectors = new List<System.Windows.Vector>();
                    for (int i = 0; i < mcollection.Count; i++)
                    {
                        int startIndex = mcollection[i].Index - 200;
                        if (startIndex < 0) startIndex = 0;
                        int endIndex = mcollection[i].Index + mcollection[i].Length + 200;
                        if (endIndex > textLen) endIndex = textLen;

                        if (vectors.Count > 0)
                        {
                            System.Windows.Vector v = vectors[vectors.Count - 1];

                            if (startIndex >= v.X && v.Y >= startIndex)
                            {
                                v.Y = endIndex;
                                vectors[vectors.Count - 1] = v;

                                continue;
                            }
                        }

                        vectors.Add(new System.Windows.Vector { X = startIndex, Y = endIndex });
                    }

                    string mitem = "";
                    foreach (System.Windows.Vector v in vectors)
                        mitem += sourceText.Substring((int)v.X, (int)(v.Y - v.X)) + Environment.NewLine + Environment.NewLine +
                                 new String('*', 50) + Environment.NewLine;


                    if (mcollection.Count > 0)
                        sourceText = mitem;
                }
            }

            string mediaUrl = "";
            if (mType.ToLower() != "videosource" && mType.ToLower() != "audiosource")
            {
                string txt = SDKHelper.HighligtKeywords(saDB, highlightFragments, sourceText);
                txt = SDKHelper.HighligtKeywords(saDB, kwArr, txt);
                sourceText = txt;
            }
            else
                if (mType.ToLower() == "audiosource")
                mediaUrl = Root.GetVideoHost() + "/audio/" + uid + ".mp3";
            else
                mediaUrl = Root.GetVideoHost() + "/video/" + uid + ".mp4";


            if (transMode == TranslationMode.Translation)
                sourceText = saDB.ObjectService.TranslateText(sourceText, String.Empty);

            var href = $"/Object/{id}";
            var ci = new ContentItem { href = href }
            .AddProperty(mObject_ID, id)
            .AddProperty(mDisplay_Name, obj.DisplayName)
            .AddProperty(mTextSource, sourceText, false)
            .AddProperty(mAuthor, saDB._PropValue(obj.Properties[mAuthor.SystemName]))
            .AddProperty(mUrl, saDB._PropValue(obj.Properties[mUrl.SystemName]))
            .AddProperty(mMassMedia, saDB._PropValue(obj.Properties[mMassMedia.SystemName]))
            .AddProperty(mOrigFileName, fileName)
            .AddProperty("SystemTypeName", "", mType, PropertyType.String, false, true)
            .AddProperty("uid", "", uid, PropertyType.String, false, true)
            .AddProperty("ContentCollection_Rubrics", Root.GetResource("ContentCollection_Rubrics"), obj._Rubrics(), PropertyType.String, true, true)
            .AddProperty("MediaUrl", "", mediaUrl, PropertyType.Integer, false, true);

            var propDN = ci.GetPropertyBySystemName(mDisplay_Name.SystemName);
            propDN.href = href;

            return ci;
        }

        public static void RawTextPrepare(bool htmlEncodingNeeded, out int textLength, ref string sourceText)
        {
            sourceText = htmlEncodingNeeded ? WebUtility.HtmlEncode(sourceText) : HelperOther.ScriptsTrim(sourceText, false);
            if (htmlEncodingNeeded)
            {
                sourceText = sourceText.EncodedReplace("[\n\r]+", "<br />");
                sourceText = sourceText.EncodedReplace(@"\s+", " ");
            }
            textLength = sourceText.Length;
        }

        internal static ContentCollection AddContextData(this ContentCollection content, IDataBase saDB)
        {
            string checkId = Root.GetDataFromKey(Root.KeyElement.id);
            string prjid = Root.GetDataFromKey(Root.KeyElement.prjid);

            if (!String.IsNullOrWhiteSpace(checkId))
            {
                var checkSaObjectName = saDB._PropertyFastGet<string>(Convert.ToInt32(checkId), _SAConst.Наименование);
                if (!String.IsNullOrWhiteSpace(checkSaObjectName))
                    content.links.Add(new LinkExt { id = Root.KeyElement.id.ToString(), value = checkSaObjectName });
            }

            if (!String.IsNullOrWhiteSpace(prjid))
            {
                var prjName = saDB.ObjectService.GetProjectByID(Convert.ToInt32(prjid))?.ProjectName;
                if (!String.IsNullOrWhiteSpace(prjName))
                    content.links.Add(new LinkExt { id = Root.KeyElement.prjid.ToString(), value = prjName });
            }

            return content;
        }

        /// <summary>
        /// Заполняет коллекцию контента. Иммеет зависимость от FillParameters - используется для корректной инициализации параметрами qfd
        /// (требует рефакторинга)
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="data"></param>
        /// <param name="qfd"></param>
        /// <param name="ts"></param>
        /// <param name="dbId"></param>
        /// <returns></returns>
        internal static ContentCollection PrepareCollectionFeed(IDataBase saDB, DataRequestDescriptor data, QueryFileData qfd, out string ts, int dbId)
        {
            ContentCollection feed = PrepareCollectionSimple(saDB, qfd, data.page, data.pagesize, out _, dbId);
            ContentItem firstItem = feed.items.FirstOrDefault();

            if (firstItem != null)
            {
                var createdDateObject = firstItem.GetValueBySystemName("CreatedDate");
                if (createdDateObject != null)
                {
                    var dt = DateTime.Parse(createdDateObject.ToString());
                    ts = GetTimestamp2(dt);
                }
                else
                    ts = data.ts;
            }
            else
                ts = data.ts;

            return feed;
        }

        /// <summary>
        /// Заполняет коллекцию контента. Иммеет зависимость от FillParameters - используется для корректной инициализации параметрами qfd
        /// (требует рефакторинга)
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="data"></param>
        /// <param name="qfd"></param>
        /// <param name="vType"></param>
        /// <param name="ts"></param>
        /// <param name="dbId"></param>
        /// <returns></returns>
        internal static T PrepareCollection<T>(IDataBase saDB, DataRequestDescriptor data, QueryFileData qfd, VisualizatonType vType, out string ts, int dbId) where T : RuleSetTransformationResultBase
        {
            DataRaw dRaw = Root.GetDataRaw(saDB, qfd);
            ts = GetTimestamp2(DateTime.Now);

            return (T)RuleSetTransformationResultBase.Create(dRaw, vType, data.ruleCode);
        }


        public static void FillParameters(DataRequestDescriptor data, QueryFileData qfd, bool useDefParams)
        {
            var q = data.pars;
            if (!useDefParams && q != null)
            {
                FTDLQuery entryQuery = qfd.MainQueryInfo.UseCross ? qfd.CrossQuery : qfd.StandardQuery;
                foreach (QueryParameter item in data.pars)
                {
                    string paramName = item.Name.StartsWith("#") ? item.Name : $"#{item.Name}#";
                    var saParam = entryQuery.Parametrs.FirstOrDefault(el => String.Equals(el.Name, paramName, StringComparison.OrdinalIgnoreCase));
                    if (saParam == null) continue;

                    string val = null;
                    if (item.Value.Length > 0)
                        val = item.ValueCombine();

                    if (!String.IsNullOrWhiteSpace(val))
                        saParam.Value = HttpUtility.HtmlDecode(val);

                    if (saParam.Name.ToLower() == "#ischeckdate#") //запрос не расчитан на обновление
                        saParam.Value = "0";

                    if (saParam.Name.ToLower() == "#ischeckdate#" && !String.IsNullOrWhiteSpace(data.ts))
                        saParam.Value = "1";

                    if (saParam.Name.ToLower() == "#createddate#" && !String.IsNullOrWhiteSpace(data.ts))
                        saParam.Value = data.ts;
                }
            }
        }

        internal static ContentCollection PrepareCollectionSimpleV2(IDataBase saDB, QueryFileData qfd, int? page, int? pageSize, out TypeObjectListView viewType, int did)
        {
            viewType = qfd.MainQueryInfo.CrossView == TypeObjectListView.CrossTable ? qfd.MainQueryInfo.StandardView : qfd.MainQueryInfo.CrossView;

            var feed = new ContentCollection();

            switch (viewType)
            {
                case TypeObjectListView.Table:
                    {
                        DataRaw dRaw = Root.GetDataRawPaged(saDB, qfd, page, pageSize);
                        feed = WrapDataTableV2(saDB, dRaw, did);
                        break;
                    }
                case TypeObjectListView.CrossTable:
                    break;
                case TypeObjectListView.Map:
                    {
                        DataRaw dRaw = Root.GetDataRaw(saDB, qfd);
                        feed = WrapDataMap(saDB, dRaw.data);
                        break;
                    }
                case TypeObjectListView.Graph:
                    {
                        DataRaw dRaw = Root.GetDataRaw(saDB, qfd);
                        feed = WrapDataGraph(dRaw.data);
                        break;
                    }
                case TypeObjectListView.Tree:
                    break;
                case TypeObjectListView.Gauge:
                    break;
            }

            return feed;
        }

        internal static ContentCollection PrepareCollectionSimple(IDataBase saDB, QueryFileData qfd, int page, int pageSize, out TypeObjectListView viewType, int dbId)
        {
            viewType = qfd.MainQueryInfo.CrossView == TypeObjectListView.CrossTable ? qfd.MainQueryInfo.StandardView : qfd.MainQueryInfo.CrossView;

            var feed = new ContentCollection();

            switch (viewType)
            {
                case TypeObjectListView.Table:
                    {
                        DataRaw dRaw = Root.GetDataRawPaged(saDB, qfd, page, pageSize);
                        feed = WrapDataTable(saDB, dRaw, dbId);
                        break;
                    }
                case TypeObjectListView.CrossTable:
                    break;
                case TypeObjectListView.Map:
                    {
                        DataRaw dRaw = Root.GetDataRaw(saDB, qfd);
                        feed = WrapDataMap(saDB, dRaw.data);
                        break;
                    }
                case TypeObjectListView.Graph:
                    {
                        DataRaw dRaw = Root.GetDataRaw(saDB, qfd);
                        feed = WrapDataGraph(dRaw.data);
                        break;
                    }
                case TypeObjectListView.Tree:
                    break;
                case TypeObjectListView.Gauge:
                    break;
            }

            return feed;
        }

        internal static ContentCollection WrapDataTableV2(IDataBase saDB, DataRaw dataRaw, int dbID, Dictionary<string, string> mapMeta = null)
        {
            var data = dataRaw.data;
            var hsFields = new Dictionary<string, int>(StringComparer.InvariantCultureIgnoreCase);
            for (int i = 0; i < data.Columns.Count; i++)
                hsFields[data.Columns[i].ColumnName] = i;

            int realDbID = WebSaUtilities.GetDbBase(dbID);
            if (realDbID == 0) realDbID = dbID;

            var dic = new Dictionary<string, IMetaProperty>(StringComparer.InvariantCultureIgnoreCase);
            var collection = new ContentCollection();
            var pagination = new Pagination { totalItems = dataRaw.TotalRecordCount, pageSize = dataRaw.PageSize, currentPage = dataRaw.Page };
            collection.AddPageInfo(pagination);

            string cartAddress = GetCartAddress(realDbID);

            var hasObject_IDcol = false;
            for (var i = 0; i < data.Columns.Count; i++)
            {
                DataColumn col = data.Columns[i];
                if (col.ColumnName.ToLower().StartsWith("link0000")) continue;
                hasObject_IDcol = hasObject_IDcol || (col.ColumnName.ToLower() == "object_id");

                IMetaProperty mCol = null;
                try
                {
                    if (!dic.TryGetValue(col.ColumnName, out mCol))
                    {
                        //если элемента с данным именем нет то null
                        mCol = saDB.MetaModel.MetaProperties.TryGetByName(col.ColumnName);
                        dic[col.ColumnName] = mCol;
                    }
                }
                catch
                {
                    dic[col.ColumnName] = null;
                }

                if (mCol != null)
                {
                    if (mCol.IsVisible)
                        collection.AddHead(col.ColumnName, mCol.DisplayName,
                            mCol.IsVisible && mCol.Importance != PropertyImportance.Additional);
                }
                else
                {
                    string dn;
                    string cn = (String.IsNullOrWhiteSpace(col.ColumnName) ? $"col#{col.Ordinal}" : col.ColumnName);
                    collection.AddHead(cn,
                        (mapMeta != null && mapMeta.TryGetValue(col.ColumnName, out dn))
                            ? dn : cn, true);
                }
            }

            var hs = new HashSet<string>();
            foreach (DataRow row in data.Rows)
            {
                var item = new ContentItem();
                collection.items.Add(item);

                for (var i = 0; i < data.Columns.Count; i++)
                {
                    DataColumn col = data.Columns[i];

                    #region Обработка полей вида link0000*

                    if (col.ColumnName.ToLower().StartsWith("link0000"))
                    {
                        var relType = col.ColumnName.Substring(9).ToLower();
                        string relTypeAlias = null;
                        string[] relTypeInfo = relType.Split(new[] { "$" }, StringSplitOptions.RemoveEmptyEntries);
                        if (relTypeInfo.Length > 1)
                        {
                            relType = relTypeInfo[0];
                            relTypeAlias = relTypeInfo[1];
                        }

                        string linkInfo = row[col.ColumnName] != DBNull.Value ? row[col.ColumnName].ToString() : null;
                        if (linkInfo != null)
                        {
                            string[] links = linkInfo.Split(new[] { "§§" }, StringSplitOptions.RemoveEmptyEntries);
                            foreach (var link in links)
                            {
                                switch (relType)
                                {
                                    case "rubric_id":
                                        {
                                            string[] vals = link.Split(new[] { '§' }, StringSplitOptions.RemoveEmptyEntries);
                                            item.LinkAdd(relType, vals[0], vals[1]);

                                            if (!hs.Contains(relType + vals[0]))
                                            {
                                                hs.Add(relType + vals[0]);
                                                collection.LinkAdd(relType, vals[0], vals[1]);
                                            }

                                            break;
                                        }
                                    case "url_источника":
                                        {
                                            IMetaProperty mp = null;
                                            try
                                            {
                                                if (!dic.TryGetValue(relType, out mp))
                                                {
                                                    mp = saDB.MetaModel.MetaProperties.TryGetByName(relType);
                                                    dic[col.ColumnName] = mp;
                                                }
                                            }
                                            catch
                                            {
                                                dic[col.ColumnName] = null;
                                            }

                                            var ciLink = new LinkExt { rel = relType, href = link };
                                            if (!String.IsNullOrWhiteSpace(relTypeAlias)) ciLink.prompt = relTypeAlias;
                                            else
                                                ciLink.prompt = mp != null ? mp.DisplayName : "URL";

                                            item.LinkAdd(ciLink);

                                            break;
                                        }
                                }
                            }
                        }

                        continue;
                    }

                    #endregion

                    IMetaProperty mCol = dic[col.ColumnName];
                    if (mCol != null)
                    {
                        //if (mCol.IsVisible && (!mCol.IsSystem || mCol.IsRelevance))
                        item.AddProperty(mCol, row[col.ColumnName]);
                        if (row[col.ColumnName] != DBNull.Value && hasObject_IDcol && mCol.SystemName == _SAConst.Фото)
                        {
                            string imageLink = "Object_ID";
                            int imageLinkIDX;
                            if (hsFields.TryGetValue("link0000_" + mCol.SystemName, out imageLinkIDX))
                                imageLink = row.Table.Columns[imageLinkIDX].ColumnName;

                            var propImage = item.GetLastAddedProperty;
                            var template = $"/lang-{Root.GetCurrentLang()}/db{dbID}/files/ObjImage/[{imageLink}]";
                            propImage.href = HelperContentCollection.RenderTemplate(row, template);
                        }
                    }
                    else
                    {
                        string cn = (String.IsNullOrWhiteSpace(col.ColumnName) ? $"col#{col.Ordinal}" : col.ColumnName);
                        item.AddProperty(cn, cn, row[col.Ordinal],
                            SDKHelper.SAPropTypeByDataType(col.DataType), true, true);
                    }
                }

                if (hasObject_IDcol)
                {
                    var oID = Convert.ToInt32(row["Object_ID"]);
                    var cmd = new LinkExt
                    {
                        rel = "tools",
                        id = "addToCart",
                        href = String.Format("/api/Cart/AddEx/{0}?did={1}", oID, realDbID),
                        verb = "GET",
                        prompt = Root.GetResource("toolsAddToCart"),
                        render = "action"
                    };
                    item.links.Add(cmd);
                    cmd = new LinkExt
                    {
                        rel = "tools",
                        id = "goToCart",
                        href = cartAddress,
                        verb = "GET",
                        prompt = Root.GetResource("toolsGoToCart"),
                        render = "open"
                    };
                    item.links.Add(cmd);
                }
            }

            return collection;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="data">Набор результирующих данных</param>
        /// <param name="dbID"></param>
        /// <returns></returns>
        static ContentCollection WrapDataTable(IDataBase saDB, DataRaw data, int dbID)
        {
            return WrapDataTableV2(saDB, data, dbID);
        }

        static ContentCollection WrapDataGraph(DataTable data)
        {
            var collection = new ContentCollection();
            collection
                .AddPageInfo(1, data.Rows.Count, data.Rows.Count);

            int seriaNameColumnIndex = -1;

            for (int i = 0; i < data.Columns.Count; i++)
            {
                string colName = data.Columns[i].ColumnName.ToLower();

                //Идетнификатор объекта (ось X)
                if (i == 0)
                    collection.AddHead("Object_ID", "", false);
                //Наименование объекта (ось X)
                if (i == 1)
                    collection.AddHead("Display_Name", "", true);
                //Значение по оси Y
                if (i == 2)
                    collection.AddHead("YVal", data.Columns[i].ColumnName, true);
                //Идентификатор группы
                if (i == 3)
                    collection.AddHead("GroupID", data.Columns[i].ColumnName, false);

                //Наименование группы
                if (i == 4)
                    collection.AddHead("GroupName", data.Columns[i].ColumnName, true);

                if (colName == "seriesname" || colName == "serianame")
                {
                    collection.AddHead("SeriesName", data.Columns[i].ColumnName, false);
                    seriaNameColumnIndex = i;
                }
            }

            foreach (DataRow row in data.Rows)
            {
                var item = new ContentItem();
                collection.items.Add(item);

                for (int i = 0; i < data.Columns.Count; i++)
                {
                    PropertyType pt = SDKExt.PropTypeCalculation(row[i].GetType());

                    //Идетнификатор объекта (ось X)
                    if (i == 0)
                        item.AddProperty("Object_ID", "", row[i], pt, false, true);

                    //Наименование объекта (ось X)
                    if (i == 1)
                        item.AddProperty("Display_Name", "", row[i], pt, true, true);

                    //Значение по оси Y
                    if (i == 2)
                        item.AddProperty("YVal", data.Columns[i].ColumnName, row[i], pt, true, true);

                    //Идентификатор группы
                    if (i == 3)
                        item.AddProperty("GroupID", "", row[i], pt, false, true);

                    //Наименование группы
                    if (i == 4)
                        item.AddProperty("GroupName", "", row[i], pt, true, true);

                    //Наименование серии
                    if (i == seriaNameColumnIndex)
                        item.AddProperty("SeriesName", "", row[i], pt, false, true);
                }
            }

            return collection;
        }

        static ContentCollection WrapDataMap(IDataBase saDB, DataTable data)
        {
            var dic = new Dictionary<string, IMetaProperty>(StringComparer.InvariantCultureIgnoreCase);
            var collection = new ContentCollection();
            collection
                .AddPageInfo(1, data.Rows.Count, data.Rows.Count);

            foreach (DataColumn col in data.Columns)
            {
                if (col.ColumnName.ToLower().StartsWith("link0000")) continue;

                IMetaProperty mCol = null;
                try
                {
                    if (!dic.TryGetValue(col.ColumnName, out mCol))
                    {
                        mCol = saDB.MetaModel.MetaProperties.TryGetByName(col.ColumnName);
                        dic[col.ColumnName] = mCol;
                    }
                }
                catch
                {
                    dic[col.ColumnName] = null;
                }

                if (mCol != null)
                {
                    if (mCol.IsVisible && (!mCol.IsSystem || mCol.IsRelevance))
                        collection.AddHead(col.ColumnName, mCol.DisplayName, mCol.IsVisible);
                }
                else
                    collection.AddHead(col.ColumnName, col.ColumnName, true);
            }

            var hs = new HashSet<string>();
            var objIds = new Dictionary<int, ContentItem>();
            foreach (DataRow row in data.Rows)
            {
                var item = new ContentItem();
                collection.items.Add(item);

                foreach (DataColumn col in data.Columns)
                {
                    #region Блок формирования ссылок для ContentItem
                    if (col.ColumnName.ToLower().StartsWith("link0000"))
                    {
                        var relType = col.ColumnName.Substring(9).ToLower();
                        string relTypeAlias = null;
                        string[] relTypeInfo = relType.Split(new[] { "$" }, StringSplitOptions.RemoveEmptyEntries);
                        if (relTypeInfo.Length > 1)
                        {
                            relType = relTypeInfo[0];
                            relTypeAlias = relTypeInfo[1];
                        }

                        string linkInfo = row[col.ColumnName] != DBNull.Value ? row[col.ColumnName].ToString() : null;
                        if (linkInfo != null)
                        {
                            string[] links = linkInfo.Split(new[] { "§§" }, StringSplitOptions.RemoveEmptyEntries);
                            foreach (var link in links)
                            {
                                switch (relType)
                                {
                                    case "rubric_id":
                                        {
                                            string[] vals = link.Split(new[] { '§' }, StringSplitOptions.RemoveEmptyEntries);
                                            item.LinkAdd(relType, vals[0], vals[1]);

                                            if (!hs.Contains(relType + vals[0]))
                                            {
                                                hs.Add(relType + vals[0]);
                                                collection.LinkAdd(relType, vals[0], vals[1]);
                                            }

                                            break;
                                        }
                                    case "url_источника":
                                        {
                                            IMetaProperty mp = null;
                                            try
                                            {
                                                if (!dic.TryGetValue(relType, out mp))
                                                {
                                                    mp = saDB.MetaModel.MetaProperties.TryGetByName(relType);
                                                    dic[col.ColumnName] = mp;
                                                }
                                            }
                                            catch
                                            {
                                                dic[col.ColumnName] = null;
                                            }

                                            var ciLink = new LinkExt { rel = relType, href = link };
                                            if (!String.IsNullOrWhiteSpace(relTypeAlias)) ciLink.prompt = relTypeAlias;
                                            else
                                                ciLink.prompt = mp != null ? mp.DisplayName : "URL";

                                            item.LinkAdd(ciLink);

                                            break;
                                        }
                                }
                            }
                        }

                        continue;
                    }

                    #endregion

                    IMetaProperty mCol = dic[col.ColumnName];
                    if (mCol != null)
                        item.AddProperty(mCol, row[col.ColumnName]);
                    else
                        item.AddProperty(col.ColumnName, col.ColumnName, row[col.ColumnName], SDKHelper.SAPropTypeByDataType(col.DataType), true, true);
                }

                IMetaProperty mObject_ID = dic["Object_ID"];
                if (mObject_ID != null)
                    objIds[Convert.ToInt32(row["Object_ID"])] = item;
            }

            if (objIds.Count > 0)
            {
#warning 2015-01-28 Волков Проблема на стороне SA Server - требует решения
                /*
                IGeographicDataList geoList = saDB.QueriesProvider.GetGeoDataForObjects(objIds.Keys.ToArray());
                if (geoList != null)
                    foreach (var g in geoList)
                    {
                        if (g.Coordinate != null)
                        {
                            double lat = g.Coordinate.Latitude;
                            double lng = g.Coordinate.Longitude;
                            objIds[g.DataId].AddProperty("Latitude", "Latitude", lat, PropertyType.Float, false, true);
                            objIds[g.DataId].AddProperty("Longitude", "Longitude", lng, PropertyType.Float, false, true);
                        }
                    }
                 */

                var markerNav = new RedrawImage("marker.png");
                foreach (var item in objIds)
                {
                    IGeographicDataList geoList = saDB.QueriesProvider.GetGeoDataForObjects(new[] { item.Key });
                    if (geoList != null)
                        foreach (var g in geoList)
                        {
                            if (g.Coordinate != null && (int)g.Coordinate.Latitude != 0 && (int)g.Coordinate.Longitude != 0)
                            {
                                string colorHtml = ColorTranslator.ToHtml(g.MarkColor);

                                double lat = g.Coordinate.Latitude;
                                double lng = g.Coordinate.Longitude;
                                objIds[item.Key].AddProperty("Latitude", "Latitude", lat, PropertyType.Float, false, true);
                                objIds[item.Key].AddProperty("Longitude", "Longitude", lng, PropertyType.Float, false, true);
                                objIds[item.Key].AddProperty("Color", "Color", colorHtml, PropertyType.String, false, true);
                                objIds[item.Key].AddProperty("MarkerText", "MarkerText", g.MarkerText, PropertyType.String, false, true);

                                string url = markerNav.Redraw(g.MarkColor);
                                objIds[item.Key].AddProperty("MarkerUrl", "MarkerUrl", url, PropertyType.String, false, true);

                                if (!String.IsNullOrWhiteSpace(g.ImageUrl))
                                {
                                    objIds[item.Key].AddProperty("MarkerType", "MarkerType",
                                        MapMarkTypes.Image.ToString(), PropertyType.String, false, true);
                                    objIds[item.Key].AddProperty("ImageUrl", "ImageUrl", g.ImageUrl, PropertyType.String,
                                        false, true);
                                }
                                else
                                {
                                    var marker = MapMarkTypes.Bubble;
                                    if (g.MarkType != MapMarkTypes.Image) marker = g.MarkType;

                                    objIds[item.Key].AddProperty("MarkerType", "MarkerType", marker.ToString(), PropertyType.String, false, true);
                                }
                            }
                        }
                }

            }
            return collection;
        }

        static string GetCartAddress(int dbID)
        {
            var url = RouteConfig.MvcUriBuilder.CreateUriFromRouteValues(
                new RouteValueDictionary
                {
                    { "dbid", dbID},
                    { "lang",  Root.GetCurrentLang()}
                });

            var baseUri = new Uri(HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority));
            return new Uri(baseUri, url + "#Cart").ToString();
        }

        static string GetTimestamp(DateTime dt)
        {
            return dt.ToString("yyyyMMddHHmmssffff");
        }

        static string GetTimestamp2(DateTime dt)
        {
            return dt.ToString("o", CultureInfo.InvariantCulture).Substring(0, 23);
        }

    }
}