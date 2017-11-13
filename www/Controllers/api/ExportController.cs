using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Hosting;
using System.Web.Http;
using ANBR.Common.Filters;
using ANBR.Morphology;
using ANBR.Reporting.Contracts;
using ANBR.SemanticArchive.SDK;
using ANBR.Utility;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using ANBR.Helpful.Misc;
using ANBR.Helpful.Misc.Graphic;
using ANBR.SDF;
using DocXLibrary;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json.Linq;
using Omu.ValueInjecter;
using ReportXLibrary;
using www.Hub;
using www.Models;
using www.Models.Common;
using www.Models.Data.In;
using www.SaGateway;

namespace www.Controllers.api
{
    public class ExportController : ApiController
    {
        /// <summary>
        /// Экспорт данных
        /// </summary>
        /// <param name="options"></param>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        public string Post(ModelOptionsForExportData options)
        {
            var exportOptions = (ExportDataToSDF.Options)new ExportDataToSDF.Options().InjectFrom(options);
            var export = new ExportDataToSDF(WebSaUtilities.Database, options.list, exportOptions);

            Guid jobUid = export.StartExport();

            string userID = WebSaUtilities.GetCurrentUserID();
            string dbID = Scope.GetCurrentDBID();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
            string dbKey = dbID + "|$|" + dbName;

            NotificationBL.RegisterExportDataToSDFEvent(userID, dbKey, jobUid, System.Threading.Thread.CurrentThread.CurrentUICulture);

            return "Task has been created for processing. When the task is finished, you’ll get a notification";
        }

        /// <summary>
        /// Получить сведения о ранее выполненных экспортрах
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [ActionName("DefaultAction")]
        public ModelExportedData[] Get()
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            if (String.IsNullOrWhiteSpace(userID)) throw new ArgumentException("Invalid User Info");

            var ds = NotificationBL.GetNotificationList(null, (int)NotificationReasonEnum.r4_ExportDataToSDF, userID, 1);

            var res = ds.AsEnumerable().Where(r => r.Field<int>("Status") == 1).Select(r =>
                new ModelExportedData() { ID = r.Field<int>("ID"), CDate = r.Field<DateTime>("CDate") })
                .OrderByDescending(item => item.CDate)
                .ToArray();

            return res;
        }

        /// <summary>
        /// Генерирует дайджест фактов
        /// </summary>
        /// <param name="model"></param>
        /// <param name="oid">Идентификатор центрального объекта</param>
        [HttpPost]
        [Route("api/export/genfactdigest/{oid:int}")]
        public string GenerateFactDigest(ModelFactDigest model, int oid)
        {
            if (oid == default(int))
                throw new ArgumentException("To report generation should be selected at least one object");
            if (model == null)
                throw new ArgumentException("Input data is absent");

            model.MainObject = oid; //идентификатор центрального объекта

            if (model.SchedulingTaskData != null)
            {
                var schedulingTakItem = model.SchedulingTaskData;

                if (schedulingTakItem.SchedulingTaskType == AutoExecSchedulingTask.TaskKind.Unknown)
                    throw new ArgumentException("Invalid input data");
                if (schedulingTakItem.Periodicity == AutoExecSchedulingTask.PeriodicityKind.Unknown)
                    throw new ArgumentException("Invalid input data");

                schedulingTakItem.UID = (schedulingTakItem.UID ?? Guid.NewGuid());

                string userName = WebSaUtilities.GetCurrentUserName();
                int dbID = Scope.GetCurrentDBIDi();
                string userID = WebSaUtilities.GetCurrentUserID();
                string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
                string dbKey = dbID + "|$|" + dbName;

                model.SchedulingTaskData = null; //уменьшаем избытьчность хранения
                CommonBL.SchedulingTaskSetItem(schedulingTakItem.ToDTOType(), JObject.FromObject(model), dbKey, dbID, userName, userID, Thread.CurrentThread.CurrentUICulture);
            }

            string pathDigest = GenerateFactDigest(WebSaUtilities.Database, model, false, Thread.CurrentThread.CurrentUICulture);
            return Root.GetResource(!String.IsNullOrWhiteSpace(pathDigest) ? "Export_GenerateFactDigest" : "Export_GenerateFactDigest_NoFacts");
        }

        /// <summary>
        /// Генерирует дайджест фактов
        /// </summary>
        /// <param name="saDB">БД</param>
        /// <param name="model">Исходные данные</param>
        /// <param name="isAuto">Признак автоматического запуска</param>
        /// <param name="jobUID">Идентификатор задачи (при автоматическом запуске)</param>
        /// <param name="dateFrom">Позволяет ограничить выбор фактов по правилу "начиая от"</param>
        /// <returns></returns>
        [NonAction]
        internal static string GenerateFactDigest(IDataBase saDB, ModelFactDigest model, bool isAuto, CultureInfo ci, Guid? jobUID = null, DateTime? dateFrom = null)
        {
            DateTime cdate = DateTime.Now;
            jobUID = jobUID ?? Guid.NewGuid();

            string dateFolder = cdate.ToString("yyyy-MM-dd");
            var pathToSave =
                // ReSharper disable once AssignNullToNotNullAttribute
                Path.Combine(HostingEnvironment.MapPath(Root.GetFolder_Export()), dateFolder);

            Directory.CreateDirectory(pathToSave);

            var path = Path.Combine(pathToSave, jobUID + ".docx");
            if (File.Exists(path)) return path;

            var objTypes = new List<int>()
            {
                saDB.MetaModel.MetaTypes.GetByName("Person").ID,
                saDB.MetaModel.MetaTypes.GetByName("Organization").ID,
                saDB.MetaModel.MetaTypes.GetByName("Region").ID
            };

            var format = new FactDigestFormat();

            format.TitleTop = String.IsNullOrEmpty(model.TitleTop) ? format.TitleTop : model.TitleTop;
            format.TitleMiddle = String.IsNullOrEmpty(model.TitleMiddle) ? format.TitleMiddle : model.TitleMiddle;
            format.TitleBottom = String.IsNullOrEmpty(model.TitleBottom) ? format.TitleBottom : model.TitleBottom;

            DateTime? collectFrom = dateFrom;
            if (!collectFrom.HasValue && model.PointDateForSelection.HasValue)
                collectFrom = model.PointDateForSelection;

            DigestFolder folder = collectFrom.HasValue ? saDB.ReportingService.GetDigestFactInfoByObjectFromDate(model.MainObject, DigestGroupKind.ByObject, objTypes, null, collectFrom.Value)
                : saDB.ReportingService.GetDigestFactInfoByObject(model.MainObject, DigestGroupKind.ByObject, objTypes, null);

            if (folder == null) return null; //в том случае если нет фактов для дайджеста

            FactDigest.Make(path, format, DigestGroupKind.ByObject, folder);

            var relPath = Root.GetFolder_Export() + dateFolder + "/" + jobUID + ".docx";


            if (!isAuto)
            {
                string userID = WebSaUtilities.GetCurrentUserID();
                Task.Run(() =>
                {
                    var alert = new AlertMessage()
                    {
                        eqID = jobUID.Value + "_" + path.GetHashCode().ToString(CultureInfo.InvariantCulture),
                        id = jobUID.Value,
                        typeid = -1,
                        title = Root.GetResource("Export_GenerateFactDigest_AlertMsg", ci),
                        kind = AlertKind.message,
                        cdate = cdate.ToString(CultureInfo.InvariantCulture),
                        html =
                            String.Format(
                                Root.GetResource("Export_GenerateFactDigest_AlertBody", ci),
                                relPath),
                        state = StateAlert.hot.ToString()
                    };

                    var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                    clients.User(userID).showAlerts(new AlertMessage[] { alert });
                });
            }

            return path;
        }

        /// <summary>
        /// Генерирует дайджест документов
        /// </summary>
        [HttpPost]
        [ActionName("DefaultAction")]
        [Route("api/export/gendocsdigest")]
        public string GenerateDocsDigest(ModelDocsDigest model)
        {
            if (model == null)
                throw new ArgumentException("Input data is absent");
            if (model.Sources == null || model.Sources.Count == 0)
                throw new ArgumentException("To report generation should be selected at least one document or query id");

            if (model.SelectedObjectsForKeyPhrases == null)
                model.SelectedObjectsForKeyPhrases = new List<int>();

            if (model.SchedulingTaskData != null)
            {
                var schedulingTakItem = model.SchedulingTaskData;

                if (schedulingTakItem.SchedulingTaskType == AutoExecSchedulingTask.TaskKind.Unknown)
                    throw new ArgumentException("Invalid input data");
                if (schedulingTakItem.Periodicity == AutoExecSchedulingTask.PeriodicityKind.Unknown)
                    throw new ArgumentException("Invalid input data");

                schedulingTakItem.UID = schedulingTakItem.UID ?? Guid.NewGuid();

                string userName = WebSaUtilities.GetCurrentUserName();
                int dbID = Scope.GetCurrentDBIDi();
                string userID = WebSaUtilities.GetCurrentUserID();
                string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
                string dbKey = dbID + "|$|" + dbName;

                model.SchedulingTaskData = null; //уменьшаем избытьчность хранения
                CommonBL.SchedulingTaskSetItem(schedulingTakItem.ToDTOType(), JObject.FromObject(model), dbKey, dbID, userName, userID, Thread.CurrentThread.CurrentUICulture);
            }

            GenerateDocsDigest(WebSaUtilities.Database, model, false, Thread.CurrentThread.CurrentUICulture);

            return Root.GetResource("Export_GenerateDocsDigest");
        }

        /// <summary>
        /// Генерирует дайджест документов
        /// </summary>
        /// <param name="saDB">БД</param>
        /// <param name="model">Исходные данные</param>
        /// <param name="isAuto">Признак автоматического запуска</param>
        /// <param name="ci">Языковая культура</param>
        /// <param name="jobUID">Идентификатор задачи (при автоматическом запуске)</param>
        /// <param name="dateFrom">Позволяет ограничить выбор фактов по правилу "начиая от"</param>
        /// <returns></returns>
        [NonAction]
        internal static string GenerateDocsDigest(IDataBase saDB, ModelDocsDigest model, bool isAuto, CultureInfo ci, Guid? jobUID = null, DateTime? dateFrom = null)
        {
            DateTime cdate = DateTime.Now;
            jobUID = jobUID ?? Guid.NewGuid();

            string dateFolder = cdate.ToString("yyyy-MM-dd");
            // ReSharper disable once AssignNullToNotNullAttribute
            var pathToSave = Path.Combine(HostingEnvironment.MapPath(Root.GetFolder_Export()), dateFolder);

            Directory.CreateDirectory(pathToSave);

            var path = Path.Combine(pathToSave, jobUID + ".docx");
            if (File.Exists(path)) return path;

            var objTypes = new List<int>()
            {
                saDB.MetaModel.MetaTypes.GetByName("Person").ID,
                saDB.MetaModel.MetaTypes.GetByName("Organization").ID,
                saDB.MetaModel.MetaTypes.GetByName("Region").ID
            };

            var format = new ArticleStandardDigestFormat
            {
                CountKeyWords = false,
                HighlightKeyWords = true,
                UseAnnotations = false,
                UseHyperRefTitle = false,
                HyperRefTitle = ""
            };

            format.TitleTop = String.IsNullOrEmpty(model.TitleTop) ? format.TitleTop : model.TitleTop;
            format.TitleMiddle = String.IsNullOrEmpty(model.TitleMiddle) ? format.TitleMiddle : model.TitleMiddle;
            format.TitleBottom = String.IsNullOrEmpty(model.TitleBottom) ? format.TitleBottom : model.TitleBottom;

            List<K_KeyPhrase> _keyPhrases = model
                .SelectedObjectsForKeyPhrases
                .Select(objectId => 
                    saDB.ObjectModel.GetObject(objectId)).Select(objInfo => objInfo != null ? GetKeyPhrase(saDB, objInfo.Uid) : null).ToList();
            _keyPhrases = _keyPhrases.Where(item => item != null).ToList();

            List<int> sources = model.Sources.ToList();
            if (model.ObjectByRequest == "b")
            {
                int saQueryID = model.Sources.First();
                ANBR.Query.Common.QueryInfo qi = saDB.QueryService.QueryGet(saQueryID);
                QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);
                DataRaw dr = Root.GetDataRaw(saDB, qfd);
                int idxObject_ID = dr.data.Columns.IndexOf("Object_ID");
                if (idxObject_ID == -1) idxObject_ID = dr.data.Columns.IndexOf("ObjectID");
                if (idxObject_ID == -1) throw new ArgumentException("Query must contain Object_ID field");

                int idxCreatedDate = dr.data.Columns.IndexOf("CreatedDate");

                if (dateFrom.HasValue && idxCreatedDate != -1)
                {
                    sources = (from t in dr.data.AsEnumerable()
                               where t.Field<DateTime>(idxCreatedDate) > dateFrom.Value
                               select t.Field<int>(idxObject_ID)
                        ).ToList();
                }
                else
                {
                    sources = (from t in dr.data.AsEnumerable()
                               select t.Field<int>(idxObject_ID)
                        ).ToList();
                }
            }

            DigestFolder folder = saDB.ReportingService.GetArticles(sources, ArticleDigestGroupKind.Standard);
            var keyPhrases = GetKeyPhrases(saDB.ReportingService, format, _keyPhrases);
            ArticleDigest.Make2(path, folder, format, keyPhrases, ArticleDigestGroupKind.Standard);


            if (!isAuto)
            {
                var relPath = Root.GetFolder_Export() + dateFolder + "/" + jobUID + ".docx";
                string userID = WebSaUtilities.GetCurrentUserID();

                Task.Run(() =>
                {
                    var alert = new AlertMessage()
                    {
                        eqID = jobUID.Value + "_" + path.GetHashCode().ToString(CultureInfo.InvariantCulture),
                        id = jobUID.Value,
                        typeid = -1,
                        title = Root.GetResource("Export_GenerateDocsDigest_AlertMsg", ci),
                        kind = AlertKind.message,
                        cdate = cdate.ToString(CultureInfo.InvariantCulture),
                        html =
                            String.Format(
                                Root.GetResource("Export_GenerateDocsDigest_AlertBody", ci),
                                relPath),
                        state = StateAlert.hot.ToString()
                    };

                    var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                    clients.User(userID).showAlerts(new AlertMessage[] { alert });
                });
            }

            return path;
        }

        [NonAction]
        static K_KeyPhrase GetKeyPhrase(IDataBase saDB, Guid objectGuid)
        {
            int objectId = saDB.ObjectService.ObjectIdByGuid(objectGuid);

            string keySentence = saDB.ObjectService.GetAbstractObject(objectId).Display_Name;
            List<Synonym> syns = saDB.ReportingService.GetEntitySynsByObjectId(objectId);

            var synonyms = new List<string>();
            syns.ForEach(s =>
            {
                if (!s.IsFTSearch)
                    synonyms.Add(s.SynonymName);
            });

            CultureInfo ci = Thread.CurrentThread.CurrentUICulture;
            string name = Root.GetResource("ABS_ArtKeyPhrases", ci);
            var articleKeyPhrasesStyle =
                    new DocXStyle()
                    {
                        Id = "ABS_ArtKeyPhrases",
                        Name = name, //"Стиль ключевых фраз по умолчанию",
                        Alignment = DocXAlignment.Left,
                        FontX = new DocXFont("Times New Roman", Color.Green, Color.Yellow, 12, DocXFontStyle.Bold),
                        Kind = DocXStyleKind.PieceOfText
                    };

            var style = new DocXStyle(articleKeyPhrasesStyle);
            style.FontX.Color = ColorGenerator.GenerateRandomColor();
            return new K_KeyPhrase(keySentence, synonyms, style);
        }

        [NonAction]
        static K_KeyPhrases GetKeyPhrases(IReportingService reportingService, ArticleStandardDigestFormat Format, List<K_KeyPhrase> keyPhrases)
        {
            var result = new K_KeyPhrases();
            int styleCounter = 1;
            Format.KeyPhrasesHighlightStyles.Clear();
            for (int i = 0; i < keyPhrases.Count; ++i)
            {
                K_KeyPhrase phrase = keyPhrases[i];
                if (phrase.Style != Format.ArticleKeyPhrasesStyle)
                {
                    phrase.Style.Id = Guid.NewGuid().ToString();
                    phrase.Style.Name = "KeySentenceUserStyle" + styleCounter++;
                    Format.KeyPhrasesHighlightStyles.Add(phrase.Style);
                }

                var syns = phrase.GetSynonyms();
                if (!syns.IsCollectionEmpty())
                    foreach (var syn in syns)
                    {
                        try
                        {
                            // var synForms = reportingService.GetPhraseForms(syn);
                            var synForms = MorphologyGenerator.GeneratePhraseForms(syn);
                            if (!synForms.IsCollectionEmpty()) phrase.AddPhraseForms(synForms);
                        }
                        catch (Exception) { phrase.AddPhraseForms(new List<string>() { syn }); }
                    }

                try
                {
                    // List<string> mainForms = reportingService.GetPhraseForms(phrase.KeyPhrase); old version KSK 
                    var mainForms = MorphologyGenerator.GeneratePhraseForms(phrase.KeyPhrase);
                    if (!mainForms.IsCollectionEmpty()) phrase.AddPhraseForms(mainForms);
                }
                catch (Exception) { phrase.AddPhraseForms(new List<string>() { phrase.KeyPhrase }); }

                result.AddPhrase(phrase);
            }
            return result;
        }

        /// <summary>
        /// Импорт данных
        /// </summary>
        /// <param name="info"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/export/transferdata")]
        public string TransferData(ModelExportedData info)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            var ds = NotificationBL.GetNotificationList(info.ID, (int)NotificationReasonEnum.r4_ExportDataToSDF, userID, 1);
            if (ds.Rows.Count == 0) throw new ArgumentException("Invalid data");

            var dsDetail = NotificationBL.GetNotificationDetails(info.ID);
            if (dsDetail.Rows.Count == 0) throw new ArgumentException("Invalid detail data");

            var row = dsDetail.AsEnumerable().First();
            var filePathRelative = row.Field<string>("ParamSTR1");
            if (String.IsNullOrWhiteSpace(filePathRelative)) throw new ArgumentException("Invalid expoted file");

            string filePathAbsZip = HostingEnvironment.MapPath(filePathRelative);
            // ReSharper disable once PossibleNullReferenceException
            string fn = filePathAbsZip.Replace(".zip", ".sdf");

            var saDB = WebSaUtilities.Database;
            string dbID = Scope.GetCurrentDBID();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
            string dbKey = dbID + "|$|" + dbName;

            var jobUid = Guid.NewGuid();
            var import = new ImportDataFromSDF(saDB, fn, jobUid);
            NotificationBL.RegisterImportDataToSDFEvent(userID, dbKey, jobUid, System.Threading.Thread.CurrentThread.CurrentUICulture);

            HostingEnvironment.QueueBackgroundWorkItem(ct =>
            {
                Stopwatch sw = Stopwatch.StartNew();
                try
                {
                    ImportDataFromSDF.ImportResult res = import.ClientProccessing();
                }
                catch (TaskCanceledException)
                {
                    Trace.WriteLine("TaskCanceledException timer finished:" + sw.Elapsed.TotalSeconds);
                }
                catch (Exception ex)
                {
                    Trace.TraceError(ex.ToString());
                }
            });

            return "Task has been created for processing. When the task is finished, you’ll get a notification";
        }
    }
}
