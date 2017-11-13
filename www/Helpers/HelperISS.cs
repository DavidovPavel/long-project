using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Web.Configuration;
using System.Xml.Linq;
using System.Xml.XPath;
using Anbr.Web.SA.CoreLogic;
using ANBR.Monitoring;
using ANBR.Monitoring.Implementation;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.SemanticArchive.SDK.ObjectModel;
using ANBR.Tasks.RobotContracts.CommonSettings;
using ANBR.Tasks.Saver.AnalystHelper;
using ANBR.Tasks.Saver.Settings;
using www.SaGateway;
using Task = ANBR.Monitoring.Task;

namespace www.Helpers
{
    public static class HelperISS
    {
        /// <summary>
        /// Создает МБФ задачу, возвращает пару id поисковой задачи СА - item1 и Task МБФ-а в item2
        /// </summary>
        /// <param name="tasktypeid"></param>
        /// <param name="id"></param>
        /// <param name="projectId"></param>
        /// <param name="customElement">Позволяет задать дополнительные параметры в секцию Custom</param>
        /// <param name="externalDb"></param>
        /// <param name="externalContext"></param>
        /// <returns></returns>
        public static Tuple<int, Task> CreateNewTask(Guid tasktypeid, int id, int? projectId, XElement customElement, IDataBase externalDb = null, ContextData externalContext = null)
        {
            ContextData context = externalContext ?? WebSaUtilities.GetCurrentContextData();

            externalDb = externalDb ?? WebSaUtilities.Database;
            var taskType = WebSaUtilities.MBF.Types.GetTypes(context).FirstOrDefault(item => item.UID == tasktypeid);

            if (taskType != null)
            {
                // общие настройки всех новых задач (объекты
                var commonSettingsSet = InitialSettingsSet(id, externalDb);
                // пустые настройки задачи, в которую вкинули общие настройки
                var str = MergeSettings(commonSettingsSet, taskType, customElement);

                var mbfTask = MBFHelper.Instance.CreateNewTask(taskType, taskType.Name, str, context);
                if (mbfTask == null) return null;

                int saTask = SDKHelper.CreateSearchTask(id, 0, mbfTask.UID.ToString(), mbfTask.Type.Name, -1, externalDb, projectId);
                return new Tuple<int, Task>(saTask, mbfTask);
            }

            return null;
        }

        /// <summary>
        /// Осуществляет запуск работов, по переданному перчню источников (поисковые задачи создаются НОВЫМИ)
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="mbf"></param>
        /// <param name="userID"></param>
        /// <param name="saType"></param>
        /// <param name="objectID"></param>
        /// <param name="sources">Перечень источников</param>
        /// <param name="context"></param>
        /// <param name="projectID"></param>
        /// <param name="checkId">Идентификатор запущенной проверки</param>
        /// <returns></returns>
        public static Guid[] StartRobots(IDataBase saDB, IGateway mbf, string userID, IMetaType saType, int objectID,
            Guid[] sources, ContextData context, int? projectID, int checkId)
        {
            try
            {
                /*
                string dicItemCode = "";
                if (saType.SystemName == "Organization") dicItemCode = "COMPANY";
                if (saType.SystemName == "Person") dicItemCode = "PERSON";

                CatalogDicItemData[] dics = mbf.ProductSourcesGetDicItems(null, context);
                var dic = dics.Single(item => item.DicCode == "BySAType" && item.DicCodeItem == dicItemCode);
                */

                ISaObject interestObject = saDB.ObjectModel.GetObject(objectID);
                List<Guid> taskTypes = GetRobotsBySources(mbf, context, sources).Select(item => item.Item1).ToList();

                var tasksDataList = new List<Tuple<int, Task>>();
                foreach (Guid taskTypeID in taskTypes)
                {
                    Tuple<int, Task> taskData = CreateNewTask(taskTypeID, interestObject.Id, projectID, null, saDB, context);

                    taskData?.Item2.Start(context);
                    if (taskData != null)
                        tasksDataList.Add(taskData);
                }

                if (tasksDataList.Count == 0)
                {
                    CheckSetErrorState(saDB, checkId, objectID, "Doesn't created any tasks");
                    return new Guid[0];
                }

                string data = tasksDataList.Select(item => $"{item.Item1}:{item.Item2.UID}")
                    .Aggregate((current, next) => current + "," + next);

                saDB.ObjectService.CustomTaskSetState(null, checkId, data, null, objectID, null, null, null, 2);

                return tasksDataList.Select(item => item.Item2.UID).ToArray();
            }
            catch (Exception e)
            {
                LogBL.Write("StartRobots", e.ToString());
            }

            return new Guid[0];
        }

        static void CheckSetErrorState(IDataBase saDb, int checkId, int objectID, string message,
           [CallerMemberName] string memberName = "",
           [CallerFilePath] string sourceFilePath = "",
           [CallerLineNumber] int sourceLineNumber = 0)
        {
            saDb.ObjectService.CustomTaskSetState(null, checkId, null, $@"{message} [{memberName}:{sourceFilePath}:{sourceLineNumber}]", objectID, null, null, null, 500);
        }

        /// <summary>
        /// Повторный запуск заданного множества поисковых задач
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="mbf"></param>
        /// <param name="userID"></param>
        /// <param name="saType"></param>
        /// <param name="objectID"></param>
        /// <param name="tasksUIDs"></param>
        /// <param name="context"></param>
        /// <param name="projectID"></param>
        /// <param name="checkId"></param>
        /// <param name="createNewSearchTask"></param>
        /// <returns></returns>
        public static void StartRobotsExists(IDataBase saDB, IGateway mbf, string userID, IMetaType saType, int objectID,
            Guid[] tasksUIDs, ContextData context, int? projectID, int checkId, bool createNewSearchTask)
        {
            try
            {
                List<Task> tasks = new List<Task>();
                Parallel.ForEach(tasksUIDs, item =>
                {
                    var t = mbf.Tasks.GetTaskById(item);
                    t?.Start(context);
                });

                saDB.ObjectService.CustomTaskSetStateOnly(null, checkId, 2);
            }
            catch (Exception e)
            {
                LogBL.Write("StartRobots", e.ToString());
            }
        }



        /// <summary>
        /// Взять "пустые" настройки задачи указанного типа, в них закинуть настройки SettingsSet
        /// </summary>
        /// <param name="settingsSet"></param>
        /// <param name="taskType"></param>
        /// <param name="customElement"></param>
        /// <returns></returns>
        public static string MergeSettings(SettingsSet settingsSet, TaskType taskType, XElement customElement)
        {
            if (settingsSet == null) return string.Empty;
            try
            {
                ISettingsCommon settings = null;
                if (!string.IsNullOrEmpty(taskType.StartupClassName))
                    settings = GetSettings(taskType);

                string res;
                if (settings != null)
                {
                    settings.SetSettingsCommon(settingsSet);
                    res = XmlHelper.Serialize(settings);
                }
                else
                    res = MergeXmlOptions("", settingsSet);

                if (customElement != null)
                {
                    var options = XElement.Parse(res);
                    var optCustom = options.XPathSelectElement("Custom") ?? new XElement("Custom");
                    optCustom.Add(customElement);

                    options.Add(optCustom);

                    res = options.ToString();
                }

                return res;
            }
            // ReSharper disable once EmptyGeneralCatchClause
            catch { }

            return string.Empty;
        }

        private static string MergeXmlOptions(string xmlData, SettingsSet settingsSet)
        {
            XElement options = null;
            try
            {
                if (!String.IsNullOrWhiteSpace(xmlData))
                    options = XElement.Parse(xmlData);
            }
            // ReSharper disable once EmptyGeneralCatchClause
            catch { }
            if (options == null || options.Name.LocalName != "Options")
                options = new XElement("Options");
            var optCommon = options.XPathSelectElement("Common");
            if (optCommon != null)
            {
                optCommon.RemoveAll();
                optCommon.Add(XElement.Parse(XmlHelper.Serialize(settingsSet)).Elements());
            }
            else
            {
                optCommon = XElement.Parse(XmlHelper.Serialize(settingsSet));
                optCommon.Name = "Common";
                options.Add(optCommon);
            }
            return options.ToString();
        }

        /// <summary>
        /// Возвращает "пустые" настройки для задач указанного типа.
        /// Если настроек нет, возвращает null
        /// </summary>
        /// <param name="taskType"></param>
        /// <returns></returns>
        public static ISettingsCommon GetSettings(TaskType taskType)
        {
            return ANBR.Tasks.RobotSettings.Robots.RobotSettings.EmptySettings(taskType.UID);
        }

        public static SettingsSet InitialSettingsSet(int objectID, IDataBase externalDB = null)
        {
            SAHelper helper = new SAHelper(externalDB ?? WebSaUtilities.Database);

            string dbName = (externalDB ?? WebSaUtilities.Database).ConnectionInfo.DatabaseName;
            string dbInfo = WebConfigurationManager.AppSettings["ServerName"] + "#" + dbName;

            var sset = new SettingsSet()
            {
                // отключенные варианты сохранения в модулях
                disabledSaveTypes =
                    new List<SaveType> { SaveType.SQL, SaveType.TXT, SaveType.AlfaBase },
                // список объектов мониторинга
                target = new List<CommonSearchObject>()
                           {
                               helper.GetObjectToSearch(objectID)
                           },
                // режим работы модуля, если тот поддерживает несколько
                saveString = dbInfo,
                saveType = SaveType.SA4,
                timeDelay = 500
            };
            var def = UserDefaultTaskSettings.Instance.DefSettingsSet;
            sset.MonitoringObjectID = objectID;
            sset.endDate = def.endDate;
            sset.maxMsgAge = def.maxMsgAge;
            sset.maxMsgCount = def.maxMsgCount;
            sset.startDate = def.startDate;
            sset.proxyPass = def.proxyPass;
            sset.proxyPort = def.proxyPort;
            sset.proxyServer = def.proxyServer;
            sset.proxyUser = def.proxyUser;
            if (def.timeDelay.HasValue)
                sset.timeDelay = def.timeDelay;
            sset.useProxy = def.useProxy;
            return sset;
        }

        /// <summary>
        /// Возваращает по роботам по списку идентификатоов источников
        /// </summary>
        /// <param name="mbf"></param>
        /// <param name="context"></param>
        /// <param name="sourcesGuids"></param>
        /// <returns>список UID типа робота, его наименование</returns>
        public static List<Tuple<Guid, string>> GetRobotsBySources(IGateway mbf, ContextData context, Guid[] sourcesGuids)
        {
            GoodsLabelData[] data = mbf.ProductSourcesGetBy(null, context);

            var query = from robot in data
                        join s1 in sourcesGuids on robot.ProductUID equals s1
                        where robot.Source.HasValue
                        select new Tuple<Guid, string>(robot.Source.Value, robot.Title);

            return query.ToList();
        }
    }
}