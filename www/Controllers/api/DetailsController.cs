using System;
using System.Collections.Generic;
using System.Data;
using System.Net.Http;
using System.Web.Http;
using ANBR.SemanticArchive.SDK;
using Newtonsoft.Json.Linq;
using www.Models;
using ANBR.SemanticArchive.SDK.ObjectModel;
using Anbr.Web.SA.CoreLogic;
using System.Text.RegularExpressions;
using System.Linq;
using ANBR.SDKHelper;
using www.Helpers;
using www.Models.ExpressDossier;
using www.Models.Items;
using www.SaGateway;
using ABS.Connectivity.Interaction;
using www.Models.Analyst;
using www.Models.Ex.Feed;


namespace www.Controllers.api
{
    public class DetailsController : ApiController
    {
        const int _FULLTEXTLENGTH = 5000;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <param name="modView">Представление 0-краткий вид; 1-полный вид</param>
        /// <returns></returns>
        [HttpGet]
        public Source Content(int id, int? modView = 1)
        {
            string userDescriptor = WebSaUtilities.GetCurrentUserID();
            string resource = "Rule_TextExtracted";
            string kind = "GET";
            bool hasViolated = StatisticsBL.OperationRulesViolated(userDescriptor, kind, resource);

            if (hasViolated)
                return new Source { Text = "", Mode = 9 };

            string url = Scope.GetCurrentUrl();
            StatisticsBL.OperationTransaction(userDescriptor, kind, resource, url);

            var q = Request.RequestUri.ParseQueryString();
            bool? translateTo = null;
            if (q != null)
                translateTo = q["t"] == "1";

            return GetSourceSimple(WebSaUtilities.Database, id, modView, translateTo);
        }

        /// <summary>
        /// Получает сведения по заданному источнику
        /// </summary>
        /// <param name="id">Идентификатор источника</param>
        /// <param name="highlightPhrase">Искомая фраза для подсветки</param>
        /// <returns></returns>
        [HttpGet]
        public ContentCollection ContentV2(int id, string highlightPhrase = null)
        {
            var sourceCollection = new ContentCollection();

            var saDB = WebSaUtilities.Database;
            var saObj = saDB.ObjectModel.GetObject(id);

            var qnv = Request.GetQueryNameValuePairs();
            var qp = qnv.FirstOrDefault(item => item.Key == "originoid");
            int originOID;
            int.TryParse(qp.Value, out originOID);

            string[] kw = null;
            Tuple<Guid, string>[] fragments = null;
            if (String.IsNullOrEmpty(highlightPhrase) && originOID != default(int))
            {
                var data = saDB._PropertyFastGet(originOID, new Tuple<string[], string[]>(
                    new[] { "InterestObjectINPUTDATA", "Display_Name" },
                    new[] { _SAConst.Текст })
                    , _SAConst.Rel_Ассоциативная_связь, _SAConst.Type_AnnotatedNote);

                string valInterestObjectINPUTDATA = data.Field<string>(0);
                string valDisplay_Name = data.Field<string>(1);
                string checkNotes = data.Field<string>(2);

                if (!String.IsNullOrWhiteSpace(valInterestObjectINPUTDATA))
                {
                    JObject jo = JObject.Parse(valInterestObjectINPUTDATA);
                    kw = jo.GetValue("synonyms_INTERN").Select(item => item.Value<string>()).ToArray();
                }

                if (!String.IsNullOrWhiteSpace(checkNotes))
                {
                    var listNotes = JArray.Parse(checkNotes).ToObject<List<ListElement<NoteFragment>>>();
                    var found = new List<NoteFragment>();
                    HelperNote.GetNotesBySourceID(listNotes, id, ref found);
                    // ReSharper disable once PossibleInvalidOperationException
                    fragments = found.Select(item => new Tuple<Guid, string>(item.id.Value, item.PlainTextOrig)).ToArray();
                }

                if (kw == null || kw.Length == 0)
                    kw = new[] { valDisplay_Name };
            }

            if (saObj.MetaType.IsSource)
            {
                var ci = HelperContent.GetContentV2(saDB, id, kw, highlightPhrase, true, fragments, null, false, HelperContent.TextMode.Short, HelperContent.TranslationMode.Orignal);
                sourceCollection.items.Add(ci);

                return sourceCollection.AddContextData(saDB);
            }
            if (saObj.MetaType.IsFact)
                return FactsController.GetSourceForFact(saDB, id, null, null).AddContextData(saDB);

            return sourceCollection.AddContextData(saDB);
        }

        /// <summary>
        /// Получает полное представление источника
        /// </summary>
        /// <param name="id">Идентификатор источника</param>
        /// <param name="highlightPhrase">Искомая фраза для подсветки</param>
        /// <returns></returns>
        [HttpGet]
        public ContentItem ContentV2ToWholeText(int id, string highlightPhrase = null)
        {
            var saDB = WebSaUtilities.Database;
            return HelperContent.GetContentV2(saDB, id, null, highlightPhrase, true, null, null, false, HelperContent.TextMode.Whole, HelperContent.TranslationMode.Orignal);
        }

        /// <summary>
        /// Позволяет получить перевод источника
        /// </summary>
        /// <param name="id"></param>
        /// <param name="textMode"></param>
        /// <param name="highlightPhrase"></param>
        /// <returns></returns>
        [HttpGet]
        public ContentItem ContentV2ToTranslate(int id, string textMode, string highlightPhrase = null)
        {
            HelperContent.TextMode tMode;
            if (!Enum.TryParse(textMode, true, out tMode)) tMode = HelperContent.TextMode.Short;

            var saDB = WebSaUtilities.Database;
            return HelperContent.GetContentV2(saDB, id, null, highlightPhrase, true, null, null, false, tMode, HelperContent.TranslationMode.Translation);
        }

        /// <summary>
        /// Позволяет вернуться к оригиналу
        /// </summary>
        /// <param name="id"></param>
        /// <param name="textMode"></param>
        /// <param name="highlightPhrase"></param>
        /// <returns></returns>
        [HttpGet]
        public ContentItem ContentV2ToOriginal(int id, string textMode, string highlightPhrase = null)
        {
            HelperContent.TextMode tMode;
            if (!Enum.TryParse(textMode, true, out tMode)) tMode = HelperContent.TextMode.Short;

            var saDB = WebSaUtilities.Database;
            return HelperContent.GetContentV2(saDB, id, null, highlightPhrase, true, null, null, false, tMode, HelperContent.TranslationMode.Orignal);
        }




        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <param name="highlightPhrase"></param>
        /// <param name="modView">Представление 0-краткий вид; 1-полный вид</param>
        /// <returns></returns>
        [HttpGet]
        public Source Content(int id, string highlightPhrase, int? modView = 1)
        {
            var q = Request.RequestUri.ParseQueryString();
            bool translateTo = q["t"] == "1";

            return GetSource(WebSaUtilities.Database, id, highlightPhrase, modView, translateTo);
        }

        [NonAction]
        internal static Source GetSourceSimple(IDataBase saDB, int id, int? modView, bool? translateTo)
        {
            string output = "";
            ISaObject obj = saDB.ObjectModel.GetObject(id);
            if (obj.MetaType.IsSource)
            {
                var source = (ISource)obj;
                if (translateTo.HasValue)
                {
                    if (translateTo.Value)
                    {
                        source.TranslateText();
                        output = source.Text;
                    }
                    else
                        output = source.HasTextOriginal ? source.TextOriginal : source.Text;
                }
                else
                    output = source.Text;
            }

            output = output ?? "";

            ISaObject info = saDB.ObjectModel.GetObject(id);
            var uid = info.Uid.ToString();
            bool isLargeText = output.Length > _FULLTEXTLENGTH;
            if (modView == 0 && isLargeText)
            {
                output = output.Substring(0, _FULLTEXTLENGTH);
            }

            return new Source { Text = output, id = id, uid = uid, IsLargeText = isLargeText };
        }


        [NonAction]
        internal static Source GetSource(IDataBase saDB, int id, string highlightPhrase, int? modView, bool traslateTo)
        {
            var source = GetSourceSimple(saDB, id, 1, traslateTo); //1 поскольку нам нужно еще обрабатывать текст

            if (String.IsNullOrWhiteSpace(highlightPhrase))
            {
                source.IsLargeText = source.Text.Length > _FULLTEXTLENGTH;
                if (modView == 0 && source.IsLargeText)
                    source.Text = source.Text.Substring(0, source.IsLargeText ? _FULLTEXTLENGTH : source.Text.Length);

                return source;
            }

            if (source.Mode == 0 && !String.IsNullOrWhiteSpace(source.Text))
            {
                source.Text = saDB.DoHighlight(highlightPhrase, source.Text, 0);

                source.IsLargeText = source.Text.Length > _FULLTEXTLENGTH;
                if (modView == 0 && source.IsLargeText)
                {
                    var regex = new Regex(@"(<span.*?</span>)", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    MatchCollection mcollection = regex.Matches(source.Text);

                    int textLen = source.Text.Length;
                    var vectors = new List<System.Windows.Vector>();
                    for (int i = 0; i < mcollection.Count; i++)
                    {
                        int startIndex = mcollection[i].Index - 200;
                        if (startIndex < 0) startIndex = 0;
                        int endIndex = mcollection[i].Index + mcollection[i].Length + 200;
                        if (endIndex > textLen) endIndex = textLen;

                        if (vectors.Count > 0)
                        {
                            System.Windows.Vector v = vectors.Last();

                            if (startIndex > v.X && v.Y > startIndex)
                            {
                                v.Y = endIndex;
                                continue;
                            }
                        }

                        vectors.Add(new System.Windows.Vector() { X = startIndex, Y = endIndex });
                    }

                    string mitem = "";
                    foreach (System.Windows.Vector v in vectors)
                        mitem += source.Text.Substring((int)v.X, (int)(v.Y - v.X)) + Environment.NewLine + Environment.NewLine +
                                 new String('*', 50) + Environment.NewLine;


                    if (mcollection.Count > 0)
                        source.Text = mitem;
                }
            }

            return source;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <param name="mode">1 - если не требуется формировать Html-отчет</param>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        public JObject Get(int id, int mode = 0)
        {
            return GetHtmlRepresentation(WebSaUtilities.Database, id, mode);
        }

        [NonAction]
        internal static JObject GetHtmlRepresentation(IDataBase saDb, int id, int mode = 0)
        {
            JObject res;
            var info = saDb.ObjectModel.GetObjectInfo(id);
            if (info == null) return null;


            string htmlReport = "";
            if (mode == 0)
            {
                htmlReport = saDb.QueriesProvider.GenerateDefaultComplexReport(id);
                var html = htmlReport.Replace("\r\n", string.Empty);
                var start = html.IndexOf("<body>", StringComparison.Ordinal) + 6;
                var len = html.IndexOf("</body>", StringComparison.Ordinal) - start;
                var output = html.Length > start && html.Length > start + len ? html.Substring(start, len) : "";
                htmlReport = output.Replace("http://s3.afisha.net/dsn/collapse.gif", "/images/collapse.gif");
            }

            var o = new PropertiesObject
            {
                id = id,
                html = htmlReport
            };

            string projectRole_IDVal = null;
            if (Scope.GetCurrentArea() == "inquiry")
                projectRole_IDVal = saDb._PropertyFastGet(id, "ProjectRole_ID");

            o.uid = info.Object.Uid.ToString();
            o.date = info.Object.CreadetDate;
            o.type = info.TypeName;
            o.title = info.DisplayName;
            o.typeid = info.MetaType.ID;
            o.issource = info.MetaType.IsSource || info.MetaType.IsFact;

            if (!String.IsNullOrWhiteSpace(projectRole_IDVal))
                o.projectRoleId = Convert.ToInt32(projectRole_IDVal);

            res = JObject.FromObject(o);
            res["hasFragments"] = new JArray();

            if (Scope.GetCurrentArea() == "inquiry")
            {
                var data = SDKHelper.GetObjectsLinkedTo(saDb, new[] { "Object_ID", _SAConst.Текст }, id, _SAConst.Type_AnnotatedNote);
                if (data != null && data.Rows.Count > 0)
                {
                    var json = data.Rows[0][1] == DBNull.Value ? null : (string)data.Rows[0][1];
                    if (!String.IsNullOrWhiteSpace(json))
                    {
                        var list = JArray.Parse(json).ToObject<List<ListElement<NoteFragment>>>();
                        var hs = new HashSet<int>();
                        HelperNote.AggregateAllSourceIDInNote(list, ref hs);
                        res["hasFragments"] = JArray.FromObject(hs.ToArray());
                    }
                }
                
                string state = null;
                int? projectID = Scope.GetInternalPrjIDi();
                if (!projectID.HasValue) throw new InvalidOperationException("Project Id not found");
                int? projectRoleID = SDKHelper.InquiryRoleSystemGet(saDb, InquirySysRoles.state);

                DataTable dt = SDKHelper.InquiryGetObjectsMarkedByRoles(saDb, projectID.Value, projectRoleID.Value, id);
                if (dt != null && dt.Rows.Count != 0)
                {
                    var objID = (int)dt.Rows[0][0];
                    state = saDb._PropertyFastGet(objID, _SAConst.Целочисленный_показатель);
                }

                var prj = HelperInquiry.ProjectGet(saDb, projectID);
                prj.state = state;

                res.Merge(JObject.FromObject(prj));
            }

            return res;
        }

        public static string GetHtml(IDataBase saDB, int id)
        {
            var info = saDB.ObjectModel.GetObjectInfo(id);
            if (info == null) return null;

            string htmlReport = "";
            var html = htmlReport.Replace("\r\n", string.Empty);
            var start = html.IndexOf("<body>", StringComparison.Ordinal) + 6;
            var len = html.IndexOf("</body>", StringComparison.Ordinal) - start;
            var output = html.Length > start && html.Length > start + len ? html.Substring(start, len) : "";
            htmlReport = output.Replace("http://s3.afisha.net/dsn/collapse.gif", "/images/collapse.gif");

            return htmlReport;
        }
    }
}

