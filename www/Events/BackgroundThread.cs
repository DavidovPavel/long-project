using System;
using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Collections.Generic;
using System.Data;
using System.Web.Hosting;
using System.Xml;
using System.Xml.Linq;
using ABS.ExcelImport;
using ANBR.Monitoring;
using ANBR.SDKHelper;
using ANBR.Tasks.RobotContracts.CommonSettings;
using ANBR.Tasks.Saver;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using ANBR.SemanticArchive.SDK;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using VkSoft.Common.Data;
using VkSoft.Common.Objects;
using VkSoft.Richelieu.ServiceContract.Filters;
using www.Controllers.api;
using www.SaGateway;
using ANBR.Reporting.Contracts;
using Microsoft.AspNet.SignalR;
using www.Hub;
using www.Models;
using System.IO.Compression;
using Anbr.Web.SA.CoreLogic.Model.check;
using EntityFinder;
using www.Events;
using www.Helpers;
using www.Utilities;
using DataSaverSA4 = ANBR.SDKHelper.DataSaverSA4;
using Environment = System.Environment;

namespace www
{
    /// <summary>
    /// Фоновый поток
    /// </summary>
    public class BackgroundThread
    {
        #region Constants

        /// <summary>
        /// Интервал между итерациями проверки списка задач
        /// </summary>
        public static int SEND_DISPATCH_INTERVAL_SEC = 4;

        #endregion

        #region Fields

        /// <summary>
        /// Событие завершения
        /// </summary>
        private static readonly ManualResetEvent _destroyEvent = new ManualResetEvent(false);
        /// <summary>
        /// Проверка на актуальность
        /// </summary>
        private static readonly AutoResetEvent _event = new AutoResetEvent(false);
        /// <summary>
        /// Поток
        /// </summary>
        private static Thread _thread;

        #endregion

        #region Methods

        /// <summary>
        /// Начинает поток
        /// </summary>
        public static void Start()
        {
            _destroyEvent.Reset();
            _thread = new Thread(new ThreadStart(RunAsync));
            _thread.IsBackground = true;
            _thread.Start();
        }

        /// <summary>
        /// Завершает поток
        /// </summary>
        public static void Stop()
        {
            if (sendDispatchTimer != null)
            {
                sendDispatchTimer.Change(Timeout.Infinite, Timeout.Infinite);
                sendDispatchTimer.Dispose();
                sendDispatchTimer = null;
            }

            _destroyEvent.Set();
            if (_thread != null) _thread.Join();
        }

        /// <summary>
        /// Асинхронная входная функция
        /// </summary>
        private static void RunAsync()
        {
            try
            {
                StartLoopProcessing();
                InternalRunAsync();
            }
            catch (Exception)
            {
            }
        }

        static void ApplicationErrorInternal(Exception ex, string addInfo = null)
        {
            if (ex.InnerException != null)
            {
                ex = ex.InnerException;
            }

            if (ex != null)
            {
                //ex.Data["GeneralDescription"] = "Ошибка возникла в процессе выполнения фонового потока";
                //bool rethrow = ExceptionPolicy.HandleException(ex, "Default");
            }

            string msgType = "BackgroundThread Error";
            if (addInfo != null)
                msgType += ":" + addInfo;

            LogBL.Write(msgType, ex.ToString());

        }

        static Queue<NotificationEventArg> tasksQueue = new Queue<NotificationEventArg>();

        static Timer sendDispatchTimer;

        static void StartLoopProcessing()
        {
            sendDispatchTimer = new Timer(SendDispatch, null, TimeSpan.Zero, TimeSpan.FromSeconds(SEND_DISPATCH_INTERVAL_SEC));
        }


        public static void StateChanged(object sender, NotificationEventArg e)
        {
            tasksQueue.Enqueue(e);
            lock (tasksQueue)
            {
                if (sendDispatchTimer == null)
                    sendDispatchTimer = new Timer(SendDispatch, null, Timeout.Infinite, Timeout.Infinite);
            }

            sendDispatchTimer.Change(0, SEND_DISPATCH_INTERVAL_SEC);
        }

        /// <summary>
        /// Асинхонная входная функция
        /// </summary>
        private static void InternalRunAsync()
        {
            int result;

            do
            {
                result = WaitHandle.WaitAny(new WaitHandle[] { _destroyEvent, _event });

                try
                {
                    switch (result)
                    {
                        case 1: //_event
                            {
                                break;
                            }

                    }
                }
                catch (Exception ex)
                {
                    ApplicationErrorInternal(ex);
                }

            } while (result != 0);
        }

        /// <summary>
        /// Сгенерировать настройки задачи поиска Vkontakte (Checkmail)
        /// </summary>
        /// <param name="taskType"></param>
        /// <param name="saDB"></param>
        /// <param name="mainObjectId"></param>
        /// <param name="mainObjectName"></param>
        /// <param name="urlProfile"></param>
        /// <returns></returns>
        static string GetSettings(TaskType taskType, IDataBase saDB, int mainObjectId, string mainObjectName, string urlProfile)
        {
            var str = HelperISS.MergeSettings(new SettingsSet
            {
                saveType = SaveType.SA4,
                saveString = saDB.ConnectionInfo.ServerName + "#" + saDB.ConnectionInfo.DatabaseName,
                MonitoringObjectID = mainObjectId,
                target = new List<CommonSearchObject>
                    {
                        new CommonSearchObject
                        {
                            ID = mainObjectId,
                            DisplayName = mainObjectName,
                            IsPerson = true,
                            URL = urlProfile
                        }
                    },
            }, taskType, null);

            return str;
        }

        /// <summary>
        /// Сгенерировать настройки задачи поиска Facebook (Checkmail)
        /// </summary>
        /// <param name="taskType"></param>
        /// <param name="saDB"></param>
        /// <param name="mainObjectId"></param>
        /// <param name="mainObjectName"></param>
        /// <param name="urlProfile"></param>
        /// <returns></returns>
        static string GetSettingsFacebook(TaskType taskType, IDataBase saDB, int mainObjectId, string mainObjectName, string urlProfile)
        {
            var saveString = saDB.ConnectionInfo.ServerName + "#" + saDB.ConnectionInfo.DatabaseName;

            var settingsTemplate = @"<?xml version=""1.0"" encoding=""utf-16""?>
<Settings>
  <timeDelay>1000</timeDelay>
  <saveType>SA4</saveType>
  <saveString>{0}</saveString>
  <useProxy>false</useProxy>
  <proxyServer />
  <proxyPort>3128</proxyPort>
  <proxyUser />
  <proxyPass />
  <disabledSaveTypes>
    <SaveType>SQL</SaveType>
    <SaveType>AlfaBase</SaveType>
    <SaveType>TXT</SaveType>
  </disabledSaveTypes>
  <categoryName>05. Социальные сети, блоги и форумы</categoryName>
  <monitoringTypes>
    <string>Person</string>
  </monitoringTypes>
  <maxMsgAge>0</maxMsgAge>
  <startDate>0001-01-01 00:00:00Z</startDate>
  <endDate>0001-01-01 00:00:00Z</endDate>
  <maxMsgCount>0</maxMsgCount>
  <MonitoringObjectID>{1}</MonitoringObjectID>
  <TaskCultureInfo>ru-RU</TaskCultureInfo>
  <target />
  <CmntySettings>
    <Enabled>false</Enabled>
    <GetBoardMsgs>false</GetBoardMsgs>
    <GetMembers>false</GetMembers>
    <MaxDownloadAge>0</MaxDownloadAge>
    <StartDownloadDate>0001-01-01T00:00:00</StartDownloadDate>
    <OwnSettings>false</OwnSettings>
  </CmntySettings>
  <UserSettings>
    <Enabled>true</Enabled>
    <UserTargets>
      <CommonSearchObject>
        <ID>{1}</ID>
        <IsPerson>false</IsPerson>
        <IsOrganization>false</IsOrganization>
        <IsObject>false</IsObject>
        <DisplayName>{2}</DisplayName>
        <INNS />
        <OGRNS />
        <address />
        <URL>{3}</URL>
        <SearchNameList />
        <DateBirth>0001-01-01 00:00:00Z</DateBirth>
      </CommonSearchObject>
    </UserTargets>
    <GetFeed>false</GetFeed>
    <GetFriends>true</GetFriends>
    <GetPhoto>true</GetPhoto>
    <MaxDownloadAge>0</MaxDownloadAge>
    <StartDownloadDate>0001-01-01T00:00:00</StartDownloadDate>
    <OwnSettings>true</OwnSettings>
    <CreatePerson>true</CreatePerson>
  </UserSettings>
  <AuthorizationUseGlobal>true</AuthorizationUseGlobal>
  <AuthUser />
  <AuthPass />
</Settings>
";

            return String.Format(settingsTemplate, saveString, mainObjectId, "", urlProfile);
        }


        static string AddHtmlToTopMessage(string bodyHtml, string addData)
        {
            string newBodyHtml;
            if (bodyHtml.IndexOf("<body", StringComparison.OrdinalIgnoreCase) != -1)
                newBodyHtml = Regex.Replace(bodyHtml, "<body.*?>", "$0" + addData + "<hr>", RegexOptions.IgnoreCase);
            else
                newBodyHtml = addData + "<hr>" + bodyHtml;

            return newBodyHtml;
        }

        static TaskGroup GetTempGroup(IGateway mbf)
        {
            var groups = mbf.Groups.GetGroups();
            
            // группа мониторинг
            return groups.FirstOrDefault(g => g.Parent == null && g.Name == "TEMP") ?? ANBR.Monitoring.Environment.Instance.Gateway.Groups.CreateGroup("TEMP", null);
        }

        static bool dispatchProcessing;
        static object syncdispatchProcessing = new object();
        private static void SendDispatch(object state)
        {
            lock (syncdispatchProcessing)
            {
                if (dispatchProcessing)
                    return;

                dispatchProcessing = true;
            }

            NotificationEventArg notificationInfo;
            try
            {
                try
                {
                    do
                    {
                        notificationInfo = null;
                        lock (tasksQueue)
                        {
                            if (tasksQueue.Count > 0)
                                notificationInfo = tasksQueue.Dequeue();
                        }

                        DataTable info = null;
                        if (notificationInfo == null)  //получение данных в общем режиме, когда сработал таймер
                            info = NotificationBL.GetNotificationList(null, null, null);

                        foreach (DataRow item in info.Rows)
                        {
                            int notificationID = Convert.ToInt32(item["ID"]);
                            try
                            {
                                CultureInfo ci = new CultureInfo("en-US");
                                string ciToken = item["ci"] != DBNull.Value ? item["ci"].ToString() : "en-US";
                                if (!String.IsNullOrWhiteSpace(ciToken)) ci = new CultureInfo(ciToken);
                                Thread.CurrentThread.CurrentUICulture = ci;
                                Thread.CurrentThread.CurrentCulture = ci;

                                bool hasBeenProccessed = false;
                                bool isComplete = false;

                                Guid notificationUID = (Guid)item["UID"];
                                int status = Convert.ToInt32(item["Status"]);
                                int? pid = item["PID"] != DBNull.Value ? (int?)item["PID"] : null;
                                int? projectID = item["Project_ID"] != DBNull.Value ? (int?)item["Project_ID"] : null;

#warning 2017-07-28 Надо разобраться, заметил закоментарено использование userID, почему?
                                string userID = item["UserID"].ToString();
#if (RELEASE_IS || DEBUG)
                                //var identity = new WindowsIdentity(userID);
                                //Thread.CurrentPrincipal = new WindowsPrincipal(identity);
#endif

                                string[] key = item["DatabaseKey"].ToString().Split(new[] { "|$|" }, StringSplitOptions.None);
                                DateTime cdate = item.Field<DateTime>("CDate");
                                int dbID = Convert.ToInt32(key[0]);
#if (RELEASE_IS || DEBUG)
                                if (dbID == 2094) dbID = 156;
                                string dbName = null;
#endif
#if (RELEASE)
                                string dbName = key[1];
#endif


                                IReportingService SAReporting;
                                IDataBase SADB = WebSaUtilities.ConnectorInstance.GetDataBase(dbID, projectID ?? 0, dbName);

                                if (SADB == null)
                                {
                                    NotificationBL.NotificationAffirm(notificationID, false);
                                    continue;
                                }

                                SAReporting = WebSaUtilities.ConnectorInstance.GetRepoting(dbID, dbName);

                                #region Запуск автоматического извлечения фактов после запуска роботов
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r0_AutoFactExtractionAfterMBF)
                                {
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<Int32>("ID");
                                        int mainobjectID = param.Field<Int32>("ParamINT1");
                                        string tasks = param.Field<String>("ParamSTR1");
                                        Guid? factAutoExtractionJobUID = param.Field<Guid?>("ParamUID1");
                                        var guidsTasks = tasks.Split(',').Select(task => new Guid(task)).ToArray();

                                        if (status == 0)
                                        {
                                            bool isCompleated = WebSaUtilities.MBF.Tasks.TasksHaveBeenCompleted(guidsTasks);
                                            if (!isCompleated) break;

                                            var so = SADB.ObjectModel.GetObjectInfo(mainobjectID);
                                            if (so == null)
                                            {
                                                NotificationBL.NotificationChangeStatus(notificationID, 7);
                                                status = 7;
                                            }
                                            else
                                            {
                                                var alert = new AlertMessage
                                                {
                                                    eqID = notificationID.ToString() + "_" + status.GetHashCode().ToString(),
                                                    id = Guid.NewGuid(),
                                                    typeid = -1,
                                                    title = String.Format("{0} ({1})", Root.GetResource("BackgroundThread_RobotsFinished", ci), so.DisplayName),
                                                    kind = AlertKind.message,
                                                    cdate = cdate.ToString(),
                                                    html = "",
                                                    state = StateAlert.hot.ToString(),
                                                    mainObjectID = mainobjectID.ToString()
                                                };

                                                var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                                                clients.User(userID).showAlerts(new[] { alert });

                                                NotificationBL.NotificationChangeStatus(notificationID, 2);
                                                status = 2;
                                            }
                                        }

                                        if (status == 2)
                                        {
                                            bool isSplited = HasBeenSplittingCompleted(mainobjectID, SADB);
                                            if (!isSplited) break;
                                            NotificationBL.NotificationChangeStatus(notificationID, 3);
                                            status = 3;
                                        }

#if (RELEASE_IS || DEBUG)
                                        if (status == 3)
                                        {
                                            var result = SADB.QueriesProvider.ExecuteQuery("SELECT FULLTEXTCATALOGPROPERTY('SentecnceCatalog','PopulateStatus')");
                                            var value = result.DataSet.Tables[0].Rows[0][0];
                                            int indexState = 0;
                                            if (value != DBNull.Value)
                                                indexState = Convert.ToInt32(result.DataSet.Tables[0].Rows[0][0]);
                                            bool isIndexed = indexState == 0;

                                            if (!isIndexed) break;
                                            NotificationBL.NotificationChangeStatus(notificationID, 4);
                                            status = 4;
                                        }
#endif

#if (RELEASE)
                                        if (status == 3)
                                        {
                                            bool isIndexed = HasBeenIndexingCompleted(mainobjectID, SADB);
                                            if (!isIndexed) break;
                                            NotificationBL.NotificationChangeStatus(notificationID, 4);
                                            status = 4;
                                        }
#endif

                                        if (status == 4 && !factAutoExtractionJobUID.HasValue)
                                        {
                                            List<int> listSources = GetSources(mainobjectID, SADB);


                                            factAutoExtractionJobUID = SADB.SourceService.AutoExtractFactsEntitiesComplexByDocsByJob(userID, "", listSources, true, EntityTypeSa.Object | EntityTypeSa.Organization | EntityTypeSa.Person, true, true);

                                            var so = SADB.ObjectModel.GetObjectInfo(mainobjectID);
                                            string message = String.Format(Root.GetResource("Docs_AutoExtractJobNameTemplate", ci), so.DisplayName);
                                            NotificationBL.NotificationAdditinalChangeStatus(notificationParamID, new Dictionary<string, string> { { "ParamUID1", factAutoExtractionJobUID.Value.ToString() } });
                                            NotificationBL.NotificationChangeStatus(notificationID, 5);
                                            NotificationBL.RegisterAutoFactExtraction(userID, dbID.ToString() + "|$|" + dbName, mainobjectID, factAutoExtractionJobUID.Value, message, ci);
                                            status = 5;
                                        }

                                        if (status == 5)
                                        {
                                            ANBR.SourceService.Contracts.DocJob dj = SADB.SourceService.AutoExtract_GetDocJob(factAutoExtractionJobUID.Value);
                                            if (dj.Status != ANBR.SourceService.Contracts.DocJobProcessStatus.Finished) break;
                                            NotificationBL.NotificationChangeStatus(notificationID, 6);
                                            status = 6;
                                        }
                                    }

                                    if (status < 6) continue;

                                    isComplete = true;
                                    hasBeenProccessed = true;
                                }
                                #endregion

                                #region Запуск задач, внешних систем (запросы через почту и т.п.)
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r1_AutoExecutingSomeTask)
                                {
#if (DEBUG)
                                    //return;
#endif
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);


                                    //значения параметров также доступны через справочник
                                    var taskParams = new Dictionary<string, string>();
                                    #region Параметры внешних задач
                                    string ogrn = "";

                                    int profileID = 0;
                                    string emailAddress = null;
                                    string errorCode = null;
                                    string orgOPF = null, orgClearName = null;
                                    string persLastName = null, persFirstName = null, persMiddleName = null, persCity = null, persProfileSelected = null;
                                    int persAgeFrom = 0, persAgeTo = 0;
                                    string bodyHtml = null;
                                    string orgOGRNSelected = null;
                                    string workPlaceName = null, dataPath = null;
                                    string displayName = null;
                                    string inn = null;
                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int? code = param.Field<int?>("CODE");
                                        if (code.HasValue && code == 1)
                                        {
                                            emailAddress = param.Field<string>("ParamSTR1");
                                            continue;
                                        }

                                        string propName = param.Field<string>("ParamSTR1");
                                        string propValue = param.Field<string>("ParamSTR2");
                                        taskParams[propName] = propValue;

                                        if (propName == "profileID")
                                        {
                                            profileID = Convert.ToInt32(propValue);
                                            continue;
                                        }

                                        if (propName == "BodyHtml")
                                        {
                                            bodyHtml = propValue;
                                            continue;
                                        }

                                        if (propName == "persMiddleName")
                                        {
                                            persMiddleName = propValue;
                                            continue;
                                        }

                                        if (propName == "PersFirstName")
                                        {
                                            persFirstName = propValue;
                                            continue;
                                        }

                                        if (propName == "PersLastName")
                                        {
                                            persLastName = propValue;
                                            continue;
                                        }

                                        if (propName == "persCity")
                                        {
                                            persCity = propValue;
                                            continue;
                                        }

                                        if (propName == "persAgeFrom")
                                        {
                                            persAgeFrom = Convert.ToInt32(propValue);
                                            continue;
                                        }

                                        if (propName == "persAgeTo")
                                        {
                                            persAgeTo = Convert.ToInt32(propValue);
                                            continue;
                                        }


                                        if (propName == "OrgClearName")
                                        {
                                            orgClearName = propValue;
                                            continue;
                                        }

                                        if (propName == "OrgOPF")
                                        {
                                            orgOPF = propValue;
                                            continue;
                                        }

                                        if (propName == "OrgOGRNSelected")
                                        {
                                            orgOGRNSelected = propValue;
                                            continue;
                                        }

                                        if (propName == "persProfileSelected")
                                        {
                                            persProfileSelected = propValue;
                                            continue;
                                        }

                                        if (propName == "OGRN")
                                        {
                                            ogrn = propValue;
                                            continue;
                                        }

                                        if (propName == "INN")
                                        {
                                            inn = propValue;
                                            continue;
                                        }

                                        if (propName == "DisplayName")
                                        {
                                            displayName = propValue;
                                            continue;
                                        }

                                        if (propName == "DataPath")
                                        {
                                            dataPath = propValue;
                                            continue;
                                        }

                                        if (propName == "WorkPlaceName")
                                        {
                                            workPlaceName = propValue;
                                            continue;
                                        }

                                        if (propName == "Error") //Ошибка: проверьте правильность заполнения шаблона
                                        {
                                            errorCode = propValue;
                                            continue;
                                        }
                                    }
                                    #endregion


                                    if (emailAddress != null)
                                    {
                                        if (!String.IsNullOrWhiteSpace(errorCode))
                                        {
                                            switch (errorCode)
                                            {
                                                case "CODE_600_001":
                                                    {
                                                        var msg = new SendMessage
                                                        {
                                                            Email = emailAddress,
                                                            Subject = "Ошибка при выполнении запроса",
                                                            Text = AddHtmlToTopMessage(bodyHtml, "<p>Ошибка. Проверьте, пожалуйста, правильность заполнения значения в поле возраст</p>")
                                                        };

                                                        Root.SendMail(msg, true);

                                                        break;
                                                    }
                                                case "CODE_600_002":
                                                    {
                                                        var msg = new SendMessage
                                                        {
                                                            Email = emailAddress,
                                                            Subject = "Ошибка при выполнении запроса",
                                                            Text = AddHtmlToTopMessage(bodyHtml, "<p>Ошибка. Ссылка на профиль пользователя пустая</p>")
                                                        };

                                                        Root.SendMail(msg, true);

                                                        break;
                                                    }
                                                case "CODE_501":
                                                    {
                                                        var msg = new SendMessage
                                                        {
                                                            Email = emailAddress,
                                                            Subject = "Ошибка при выполнении запроса",
                                                            Text = AddHtmlToTopMessage(bodyHtml, "<p>Ошибка. Проверьте, пожалуйста, корректность заполнения шаблона письма</p>")
                                                        };

                                                        Root.SendMail(msg, true);

                                                        break;
                                                    }
                                                case "CODE_502":
                                                    {
                                                        string subj = "";
                                                        string text = "";

                                                        if (profileID == 200) //Проверка компании по кэшу объектов
                                                        {
                                                            subj = "Не сделан выбор компании";
                                                            text = AddHtmlToTopMessage(bodyHtml, "<p>Не сделан выбор компании. При ответе на письмо поставьте крест в ячейке \"Ваш выбор\"</p>");
                                                        }
                                                        if (profileID == 900) //импорт данных
                                                        {
                                                            subj = "Неполные данные";
                                                            text = AddHtmlToTopMessage(bodyHtml, "<p>Проблема с БД. Код БД отсутствует или задан не корректно</p>");
                                                        }

                                                        var msg = new SendMessage
                                                        {
                                                            Email = emailAddress,
                                                            Subject = subj,
                                                            Text = text
                                                        };

                                                        Root.SendMail(msg, true);

                                                        break;
                                                    }
                                                case "CODE_503":
                                                    {
                                                        string subj = "";
                                                        string text = "";

                                                        if (profileID == 900) //импорт данных
                                                        {
                                                            subj = "Наименование рабочей области не задано";
                                                            text = AddHtmlToTopMessage(bodyHtml, "<p>Наименование рабочей области не задано</p>");
                                                        }

                                                        var msg = new SendMessage
                                                        {
                                                            Email = emailAddress,
                                                            Subject = subj,
                                                            Text = text
                                                        };

                                                        Root.SendMail(msg, true);

                                                        break;
                                                    }
                                                case "CODE_504":
                                                    {
                                                        string subj = "";
                                                        string text = "";

                                                        if (profileID == 900) //импорт данных
                                                        {
                                                            subj = "Отсуствуют данные для импорта";
                                                            text = AddHtmlToTopMessage(bodyHtml, "<p>Отсуствуют данные для импорта. Проверьте, пожалуйста, наличие файлов во вложении</p>");
                                                        }

                                                        var msg = new SendMessage
                                                        {
                                                            Email = emailAddress,
                                                            Subject = subj,
                                                            Text = text
                                                        };

                                                        Root.SendMail(msg, true);

                                                        break;
                                                    }
                                            }

                                            isComplete = true;
                                            hasBeenProccessed = true;
                                        }

                                        if (!isComplete)
                                        {
                                            #region Profile = 100

                                            if (profileID == 100)
                                            {
                                                if (ogrn != "")
                                                {
                                                    var saver = new DataSaverSA4(SADB);
                                                    var so = new SavedObject(_SAConst.Type_Organization);
                                                    so.property[_SAConst.Наименование] = String.IsNullOrEmpty(displayName) ? ogrn : displayName;
                                                    so.property[_SAConst.OGRN] = ogrn;
                                                    so.property[_SAConst.INN_Org] = inn;
                                                    int objectID = saver.CreateObject(so, 0, false);


                                                    var taskTypeIDs = new List<Guid>
                                                    {
                                                        new Guid("DBB78700-BAB8-4236-8D2E-4E747620F246"),
                                                        new Guid("1E1FD488-60E7-4274-A6D7-EA59EEAF03A9")
                                                    };
                                                    foreach (Guid taskTypeID in taskTypeIDs)
                                                    {
                                                        var context = new ANBR.Monitoring.Implementation.ContextData
                                                        {
                                                            ID = userID,
                                                            Language = ciToken
                                                        };

                                                        var taskData = HelperISS.CreateNewTask(taskTypeID,
                                                            objectID, projectID, null, SADB, context);
                                                        context.ID = userID;
                                                        if (taskData != null) taskData.Item2.Start(context);
                                                    }

                                                    var arr = taskTypeIDs.Select(t => t.ToString()).ToArray();
                                                    string tasks = String.Join(",", arr);
                                                    var jObj = new JObject();
                                                    jObj["emailBody"] = bodyHtml;
                                                    jObj["tasks"] = tasks;

                                                    NotificationBL.RegisterUniformSingleEvent(userID,
                                                        item["DatabaseKey"].ToString(), emailAddress, jObj.ToString(),
                                                        objectID, profileID, null, null,
                                                        NotificationReasonEnum.r3_CheckRobotsAndGenerateMail, ci);

                                                    isComplete = true;
                                                    hasBeenProccessed = true;
                                                }
                                            }

                                            #endregion

                                            #region Profile = 600 (ВКонтакте)

                                            if (profileID == 600 && !String.IsNullOrWhiteSpace(persProfileSelected))
                                            {
                                                var context = new ANBR.Monitoring.Implementation.ContextData
                                                {
                                                    ID = userID,
                                                    Language = ciToken
                                                };
                                                var taskType = WebSaUtilities.MBF.Types.GetTypes(context)
                                                        .FirstOrDefault(t => t.UID == new Guid("A9FF9FF5-DB21-4118-AC38-43F3421061C5"));

                                                var saver = new DataSaverSA4(SADB);
                                                var so = new SavedObject(_SAConst.Type_Person);
                                                so.property[_SAConst.Наименование] = displayName;
                                                int objectID = saver.CreateObject(so, 0, false);
                                                var s = GetSettings(taskType, SADB, objectID, displayName, persProfileSelected);

                                                var tempGroup = GetTempGroup(WebSaUtilities.MBF);
                                                var task = WebSaUtilities.MBF.Tasks.CreateTask(
                                                        new Guid("A9FF9FF5-DB21-4118-AC38-43F3421061C5"), tempGroup.GroupId,
                                                        "Test vk2", null, s, context);

                                                // это создаётся поисковая задача в базе СА (сущность, к которой будут привязаны результаты и сам объект проверки)
                                                var saO = SADB.ObjectModel.CreateObject(SADB.MetaModel.MetaTypes.GetByName(_SAConst.Type_WebTask));
                                                saO.DisplayName = "Search task " + taskType.Name;
                                                saO.Properties[_SAConst.Assembly_Name].Value = task.UID;
                                                saO.Save();
                                                if (objectID > 0)
                                                {
                                                    var r = SADB.MetaModel.MetaRoles.TryGetByName(_SAConst.Role_Содержит_проверяемые_объекты);
                                                    if (r == null)
                                                        throw new TaskException("Metarole error " + _SAConst.Role_Содержит_проверяемые_объекты, ResultCode.ErrorSave);
                                                    saO.CreateRelation(r, objectID);
                                                }
                                                saO.Save();

                                                task.Start(context);

                                                var jObj = new JObject();
                                                jObj["emailBody"] = bodyHtml;
                                                jObj["tasks"] = task.UID;

                                                NotificationBL.RegisterUniformSingleEvent(userID,
                                                    item["DatabaseKey"].ToString(), emailAddress, jObj.ToString(),
                                                    objectID, profileID, null, null,
                                                    NotificationReasonEnum.r3_CheckRobotsAndGenerateMail, ci);

                                                isComplete = true;
                                                hasBeenProccessed = true;
                                            }

                                            if (profileID == 600 && String.IsNullOrWhiteSpace(persProfileSelected))
                                            {
                                                var context = new ANBR.Monitoring.Implementation.ContextData
                                                {
                                                    ID = userID,
                                                    Language = ciToken
                                                };

                                                var tempGroup = GetTempGroup(WebSaUtilities.MBF);
                                                var request = new XElement("Options");
                                                var custom = new XElement("Custom");
                                                request.Add(custom);
                                                custom.Add(new XElement("DisplayName", String.Format("{0} {1}", persFirstName, persLastName)));
                                                if (!String.IsNullOrWhiteSpace(persCity))
                                                    custom.Add(new XElement("address", new XElement("string", persCity)));
                                                if (persAgeFrom > 0 && persAgeTo > 0)
                                                {
                                                    custom.Add(new XElement("_ageFrom", persAgeFrom));
                                                    custom.Add(new XElement("_ageTo", persAgeTo));
                                                }

                                                var t = WebSaUtilities.MBF.Tasks.CreateTask(new Guid("CF0560D6-993C-48BC-9343-4309B88A777F"), tempGroup.GroupId,
                                                        "Test vk1", null, request.ToString(), context);
                                                t.Start(context);

                                                var jObj = new JObject();
                                                jObj["emailBody"] = bodyHtml;

                                                NotificationBL.RegisterUniformSingleEvent(userID,
                                                    item["DatabaseKey"].ToString(), emailAddress, jObj.ToString(),
                                                    3, profileID, t.UID, null,
                                                    NotificationReasonEnum.r12_VKontakteData, ci);

                                                isComplete = true;
                                                hasBeenProccessed = true;
                                            }
                                            #endregion

                                            #region Profile = 601 (Facebook)

                                            if (profileID == 601 && !String.IsNullOrWhiteSpace(persProfileSelected))
                                            {
                                                var context = new ANBR.Monitoring.Implementation.ContextData
                                                {
                                                    ID = userID,
                                                    Language = ciToken
                                                };
                                                var taskType = WebSaUtilities.MBF.Types.GetTypes(context)
                                                        .FirstOrDefault(t => t.UID == new Guid("61978149-04F3-448B-816D-76DE7D69B82E"));

                                                var saver = new DataSaverSA4(SADB);
                                                var so = new SavedObject(_SAConst.Type_Person);
                                                so.property[_SAConst.Наименование] = displayName;
                                                int objectID = saver.CreateObject(so, 0, false);
                                                var s = GetSettingsFacebook(taskType, SADB, objectID, displayName, persProfileSelected);

                                                var tempGroup = GetTempGroup(WebSaUtilities.MBF);
                                                var task = WebSaUtilities.MBF.Tasks.CreateTask(
                                                        new Guid("61978149-04F3-448B-816D-76DE7D69B82E"), tempGroup.GroupId,
                                                        "Test facebook2", null, s, context);

                                                // это создаётся поисковая задача в базе СА (сущность, к которой будут привязаны результаты и сам объект проверки)
                                                var saO = SADB.ObjectModel.CreateObject(SADB.MetaModel.MetaTypes.GetByName(_SAConst.Type_WebTask));
                                                saO.DisplayName = "Search task " + taskType.Name;
                                                saO.Properties[_SAConst.Assembly_Name].Value = task.UID;
                                                saO.Save();
                                                if (objectID > 0)
                                                {
                                                    var r = SADB.MetaModel.MetaRoles.TryGetByName(_SAConst.Role_Содержит_проверяемые_объекты);
                                                    if (r == null)
                                                        throw new TaskException("Metarole error " + _SAConst.Role_Содержит_проверяемые_объекты, ResultCode.ErrorSave);
                                                    saO.CreateRelation(r, objectID);
                                                }
                                                saO.Save();

                                                task.Start(context);

                                                var jObj = new JObject();
                                                jObj["emailBody"] = bodyHtml;
                                                jObj["tasks"] = task.UID;

                                                NotificationBL.RegisterUniformSingleEvent(userID,
                                                    item["DatabaseKey"].ToString(), emailAddress, jObj.ToString(),
                                                    objectID, profileID, null, null,
                                                    NotificationReasonEnum.r3_CheckRobotsAndGenerateMail, ci);

                                                isComplete = true;
                                                hasBeenProccessed = true;
                                            }

                                            if (profileID == 601 && String.IsNullOrWhiteSpace(persProfileSelected))
                                            {
                                                var context = new ANBR.Monitoring.Implementation.ContextData
                                                {
                                                    ID = userID,
                                                    Language = ciToken
                                                };

                                                var tempGroup = GetTempGroup(WebSaUtilities.MBF);
                                                var request = new XElement("Options");
                                                var custom = new XElement("Custom");
                                                request.Add(custom);
                                                custom.Add(new XElement("DisplayName", String.Format("{0} {1}", persFirstName, persLastName)));

                                                var t = WebSaUtilities.MBF.Tasks.CreateTask(new Guid("94D7FCBC-C2E7-4EA3-A589-4ABFC8315C2E"), tempGroup.GroupId,
                                                        "Test facebook1", null, request.ToString(), context);
                                                t.Start(context);

                                                var jObj = new JObject();
                                                jObj["emailBody"] = bodyHtml;

                                                NotificationBL.RegisterUniformSingleEvent(userID,
                                                    item["DatabaseKey"].ToString(), emailAddress, jObj.ToString(),
                                                    3, profileID, t.UID, null,
                                                    NotificationReasonEnum.r15_FacebookData, ci);

                                                isComplete = true;
                                                hasBeenProccessed = true;
                                            }
                                            #endregion

                                            #region Profile = 200

                                            if (profileID == 200 && !String.IsNullOrWhiteSpace(orgOGRNSelected))
                                            {
                                                var saver = new DataSaverSA4(SADB);
                                                var so = new SavedObject(_SAConst.Type_Organization);
                                                so.property[_SAConst.Наименование] = displayName;
                                                so.property[_SAConst.OGRN] = orgOGRNSelected;
                                                so.property[_SAConst.INN_Org] = inn;
                                                int objectID = saver.CreateObject(so, 0, false);

                                                var taskTypeIDs = new List<Guid>
                                                {
                                                        new Guid("DBB78700-BAB8-4236-8D2E-4E747620F246"),
                                                        new Guid("1E1FD488-60E7-4274-A6D7-EA59EEAF03A9")
                                                    };
                                                foreach (Guid taskTypeID in taskTypeIDs)
                                                {
                                                    var context = new ANBR.Monitoring.Implementation.ContextData
                                                    {
                                                        ID = userID,
                                                        Language = ciToken
                                                    };

                                                    var taskData = HelperISS.CreateNewTask(taskTypeID,
                                                        objectID, projectID, null, SADB, context);
                                                    context.ID = userID;
                                                    if (taskData != null) taskData.Item2.Start(context);
                                                }

                                                var arr = taskTypeIDs.Select(t => t.ToString()).ToArray();
                                                string tasks = String.Join(",", arr);
                                                var jObj = new JObject();
                                                jObj["emailBody"] = bodyHtml;
                                                jObj["tasks"] = tasks;

                                                NotificationBL.RegisterUniformSingleEvent(userID,
                                                    item["DatabaseKey"].ToString(), emailAddress, jObj.ToString(),
                                                    objectID, profileID, null, null,
                                                    NotificationReasonEnum.r3_CheckRobotsAndGenerateMail, ci);

                                                isComplete = true;
                                                hasBeenProccessed = true;
                                            }

                                            if (profileID == 200 && String.IsNullOrWhiteSpace(orgOGRNSelected))
                                            {
                                                var cor = new CashObjectRepository();
                                                var of = new DOrganizationFilter();
                                                of.Name = new OrgName { ClearName = orgClearName };
                                                //if (!String.IsNullOrWhiteSpace(orgOPF))
                                                //    of.Name.FormOfIncorporations = new GFormOfIncorporation() { ShortName = orgOPF };
                                                var t = cor.SearchOrganizations(of);
                                                if (!t.Wait(10000))
                                                    throw new TimeoutException("DOrganizationFilter timeout");
                                                IPagedDataSource pds = t.Result;

                                                if (pds.RowCount == 0)
                                                {
                                                    var msg = new SendMessage
                                                    {
                                                        Email = emailAddress,
                                                        Subject = "Нет сведений",
                                                        Text = AddHtmlToTopMessage(bodyHtml, "<p>По введенному объекту данные отсутствуют</p>")
                                                    };

                                                    Root.SendMail(msg, true);
                                                    isComplete = true;
                                                    hasBeenProccessed = true;
                                                }
                                                else
                                                {
                                                    string templateOrgItem = Scope.MsgCashObjectOrgResultItemBody;
                                                    string orgItems = "";
                                                    for (int rowid = 0;
                                                        rowid < pds.Dataset.Tables[0].Rows.Count;
                                                        rowid++)
                                                    {
                                                        DataRow orgRow = pds.Dataset.Tables[0].Rows[rowid];
                                                        int entityId = orgRow.Field<int>("EntityId");
                                                        string eDisplayName = orgRow.Field<string>("DisplayName");
                                                        string eINN = orgRow.Field<string>("Inn");
                                                        string eOGRN = orgRow.Field<string>("OGRN"); //БИН (для Казахстана)
                                                        string eOPf = orgRow.Field<string>("OPFName");
                                                        int? eRegionId = orgRow.Field<int?>("RegionId");
                                                        string eRegionName = "";
                                                        if (eRegionId.HasValue)
                                                            eRegionName = cor.GetRegionNameByID(eRegionId.Value);
                                                        string orgItem = Share.TemplateSubsitutionProcessing(
                                                            new
                                                            {
                                                                ENTITYID = entityId,
                                                                DisplayName = eDisplayName ?? "",
                                                                Inn = eINN ?? "",
                                                                OGRN = eOGRN ?? "",
                                                                OPF = eOPf ?? "",
                                                                Region = eRegionName ?? ""
                                                            }, templateOrgItem);
                                                        orgItems += orgItem + Environment.NewLine;
                                                    }
                                                    string templateOrg = Scope.MsgCashObjectOrgResultBody;
                                                    string orgBody = Share.TemplateSubsitutionProcessing(new
                                                    {
                                                        CompanyList = orgItems
                                                    }, templateOrg);

                                                    string newBodyHtml = AddHtmlToTopMessage(bodyHtml, orgBody);
                                                    var msg = new SendMessage
                                                    {
                                                        Email = emailAddress,
                                                        Subject = "Выберете компанию",
                                                        Text = newBodyHtml
                                                    };

                                                    Root.SendMail(msg, true);
                                                    isComplete = true;
                                                    hasBeenProccessed = true;
                                                }
                                            }

                                            #endregion

                                            #region Profile = 900

                                            if (profileID == 900 && !String.IsNullOrWhiteSpace(workPlaceName) && !String.IsNullOrWhiteSpace(dataPath))
                                            {
                                                if (Directory.Exists(dataPath))
                                                {
                                                    var saver = new DataSaverSA4(SADB);
                                                    var so = new SavedObject(_SAConst.Type_Workspace);
                                                    so.property[_SAConst.Наименование] = workPlaceName;
                                                    int workspaceID = saver.CreateObject(so, 0, false);

                                                    FileInfo[] fileList = new DirectoryInfo(dataPath).GetFiles("*.xls*", SearchOption.AllDirectories);
                                                    foreach (FileInfo fi in fileList)
                                                    {
                                                        var excelImporter = new ExcelImporterCore(fi.FullName,
                                                            SADB.MetaModel,
                                                            SADB.ObjectService,
                                                            SADB.DictionaryService,
                                                            SADB.SourceService);

                                                        excelImporter.Prepare();
                                                        excelImporter.Execute();

                                                        foreach (int oid in excelImporter.GetCreatedObjects())
                                                            saver.SetRelation(workspaceID, oid, _SAConst.Role_Рабочая_область_содержит_Элемент);
                                                    }

                                                    NotificationBL.RegisterUniformSingleEvent(userID,
                                                        item["DatabaseKey"].ToString(), emailAddress, bodyHtml,
                                                        workspaceID, profileID, null, null,
                                                        NotificationReasonEnum.r11_GenerateSNAndSendReply, ci);


                                                }
                                                isComplete = true;
                                                hasBeenProccessed = true;
                                            }
                                            #endregion

                                            #region Profile = 110 (Минюст Казахстана 1_150, 1_154) 

                                            if (profileID == 110)
                                            {
                                                if (ogrn != "")
                                                {
                                                    var saver = new DataSaverSA4(SADB);
                                                    var so = new SavedObject(_SAConst.Type_Organization);
                                                    so.property[_SAConst.Наименование] = String.IsNullOrEmpty(displayName) ? ogrn : displayName;
                                                    so.property[_SAConst.OGRN] = ogrn;
                                                    so.property[_SAConst.INN_Org] = inn;
                                                    int objectID = saver.CreateObject(so, 0, false);

                                                    var startedTasks = new List<Guid>();
                                                    var taskTypeIDs = new List<Guid>
                                                    {
                                                        new Guid("CC406AFE-8209-43A9-AB2D-7558A70D641A"),
                                                        new Guid("AC696F3A-A1B9-4F39-A8BD-FC8A94DAF03B")
                                                    };

                                                    XElement elCustomOptions = new XElement("AutoCache", 1);
                                                    foreach (Guid taskTypeID in taskTypeIDs)
                                                    {
                                                        var context = new ANBR.Monitoring.Implementation.ContextData
                                                        {
                                                            ID = userID,
                                                            Language = ciToken
                                                        };

                                                        var taskData = HelperISS.CreateNewTask(taskTypeID,
                                                            objectID, projectID, elCustomOptions, SADB, context);
                                                        context.ID = userID;
                                                        if (taskData != null)
                                                        {
                                                            taskData.Item2.Start(context);
                                                            startedTasks.Add(taskData.Item2.UID);
                                                        }
                                                    }

                                                    var arr = startedTasks.Select(t => t.ToString()).ToArray();
                                                    string tasks = String.Join(",", arr);
                                                    var jObj = new JObject();
                                                    jObj["emailBody"] = bodyHtml;
                                                    jObj["tasks"] = tasks;

                                                    NotificationBL.RegisterUniformSingleEvent(userID,
                                                        item["DatabaseKey"].ToString(), emailAddress, jObj.ToString(),
                                                        objectID, profileID, null, null,
                                                        NotificationReasonEnum.r3_CheckRobotsAndGenerateMail, ci);

                                                    isComplete = true;
                                                    hasBeenProccessed = true;
                                                }
                                            }

                                            #endregion
                                        }

                                    }
                                }
                                #endregion

                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r11_GenerateSNAndSendReply)
                                {
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);
                                    foreach (DataRow param in additionalIfo.Rows)
                                    {

                                        string emailAddress = param.Field<String>("ParamSTR1");
                                        string bodyHtml = param.Field<String>("ParamSTR2");
                                        int workspaceID = param.Field<Int32>("ParamINT1");
                                        int profileID = param.Field<Int32>("ParamINT2");

                                        string semnetPath = HelperSemNet.GetImageSemNet(workspaceID, null, dbID.ToString(), SADB);

                                        var msg = new SendMessage
                                        {
                                            Email = emailAddress,
                                            Subject = "Запрос выполнен",
                                            Text =
                                                Regex.Replace(bodyHtml, "<body.*?>",
                                                    "$0<p>Запрос выполнен. Результат во вложении</p><hr>",
                                                    RegexOptions.IgnoreCase)
                                        };
                                        msg.Attachments = new[] { semnetPath };

                                        Root.SendMail(msg, true);
                                    }

                                    isComplete = true;
                                    hasBeenProccessed = true;
                                }


                                #region Создание отчета и картинки семсети и отправка письма
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r3_CheckRobotsAndGenerateMail)
                                {
#if (DEBUG)
                                    //return;
#endif
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        string reportPath = "";
                                        string semnetPath = "";
                                        var profileID = param.Field<Int32>("ParamINT2");
                                        var emailAddress = param.Field<String>("ParamSTR1");
                                        var jObj = JObject.Parse(param.Field<String>("ParamSTR2"));
                                        var tasks = (string)jObj["tasks"];
                                        var guidsTasks = tasks.Split(',').Select(task => new Guid(task)).ToArray();
                                        string bodyHtml = (string)jObj["emailBody"];

                                        if (status == 0)
                                        {
                                            bool isCompleated = true;
                                            foreach (Guid gt in guidsTasks)
                                            {
                                                isCompleated = isCompleated && WebSaUtilities.MBF.Tasks.TasksHaveBeenCompleted(new[] { gt });
                                                if (!isCompleated) break;
                                            }

                                            if (!isCompleated) break;
                                        }

                                        if (profileID == 100 || profileID == 200)
                                        {
                                            int mainObjectID = param.Field<Int32>("ParamINT1");
                                            reportPath = SDKHelper.GenerateReport(SAReporting, mainObjectID, "OrganizationFactsByChapter");
                                            semnetPath = HelperSemNet.GetImageSemNet(mainObjectID, null, dbID.ToString(CultureInfo.InvariantCulture), SADB);
                                        }
                                        if (profileID == 110)
                                        {
                                            int mainObjectID = param.Field<Int32>("ParamINT1");

                                            reportPath = SDKHelper.GenerateReport(SAReporting, mainObjectID, "OrganizationOnlineDataByChapter");
                                            semnetPath = HelperSemNet.GetImageSemNet(mainObjectID, null, dbID.ToString(CultureInfo.InvariantCulture), SADB);
                                        }
                                        if (profileID == 600 || profileID == 601)
                                        {
                                            int mainObjectID = param.Field<Int32>("ParamINT1");

                                            reportPath = SDKHelper.GenerateReport(SAReporting, mainObjectID, "PersonFactsByChapter");
                                            semnetPath = HelperSemNet.GetImageSemNet(mainObjectID, null, dbID.ToString(CultureInfo.InvariantCulture), SADB);
                                        }

                                        var msg = new SendMessage
                                        {
                                            Email = emailAddress,
                                            Subject = "Запрос выполнен",
                                            Text = AddHtmlToTopMessage(bodyHtml, "<p>Запрос выполнен. Результат во вложении</p>")
                                        };
                                        msg.Attachments = new[] { reportPath, semnetPath };

                                        Root.SendMail(msg, true);
                                        isComplete = true;
                                        hasBeenProccessed = true;
                                    }
                                }
                                #endregion

                                #region Автовыделение фактов
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r2_AutoFactExtractionFactsStart)
                                {
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<Int32>("ID");
                                        int mainobjectID = param.Field<Int32>("ParamINT1");
                                        string message = param.Field<String>("ParamSTR1");
                                        Guid jobUID = param.Field<Guid>("ParamUID1");

                                        ANBR.SourceService.Contracts.DocJob job;
                                        job = SADB.SourceService.AutoExtract_GetDocJob(jobUID);

                                        string text = message;
                                        switch (job.Status)
                                        {
                                            case ANBR.SourceService.Contracts.DocJobProcessStatus.DocSplittedToSentences:
                                                text += " - " + Root.GetResource("Docs_AutoExtractJobNameTempl_Splitted", ci);
                                                break;
                                            case ANBR.SourceService.Contracts.DocJobProcessStatus.Finished:
                                                text += " - " + Root.GetResource("Docs_AutoExtractJobNameTempl_Finished", ci);
                                                break;
                                            case ANBR.SourceService.Contracts.DocJobProcessStatus.Processing:
                                                text += " - " + Root.GetResource("Docs_AutoExtractJobNameTempl_Processing", ci);
                                                break;
                                            case ANBR.SourceService.Contracts.DocJobProcessStatus.SentencesIndexed:
                                                text += " - " + Root.GetResource("Docs_AutoExtractJobNameTempl_Indexed", ci);
                                                break;
                                            case ANBR.SourceService.Contracts.DocJobProcessStatus.Started:
                                                text += " - " + Root.GetResource("Docs_AutoExtractJobNameTempl_Started", ci);
                                                break;
                                            default:
                                                text += " - " + Root.GetResource("Docs_AutoExtractJobNameTempl_Processing", ci);
                                                break;
                                        }

                                        var alert = new AlertMessage
                                        {
                                            eqID = notificationID.ToString(CultureInfo.InvariantCulture) + "_" + text.GetHashCode().ToString(CultureInfo.InvariantCulture),
                                            id = jobUID,
                                            typeid = -1,
                                            title = text,
                                            kind = AlertKind.message,
                                            cdate = cdate.ToString(CultureInfo.InvariantCulture),
                                            html = "",
                                            state = StateAlert.hot.ToString()
                                        };
                                        if (job.Status == ANBR.SourceService.Contracts.DocJobProcessStatus.Finished)
                                            alert.mainObjectID = mainobjectID.ToString();

                                        var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                                        clients.User(userID).showAlerts(new[] { alert });

                                        if (job.Status != ANBR.SourceService.Contracts.DocJobProcessStatus.Finished)
                                            continue;

                                        isComplete = true;
                                        hasBeenProccessed = true;
                                    }
                                }
                                #endregion


#warning Необходимо добавить параллелизм при экспорте несколькими пользователями
                                #region Экспорт данных SDF
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r4_ExportDataToSDF)
                                {
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<Int32>("ID");

                                        var jobUID = param.Field<Guid>("ParamUID1");
                                        var si = SADB.ObjectService.ExportDataState(jobUID);
                                        if (si.state == 0) continue;


                                        var serverFile = SADB.ObjectService.ExportDataDownload(jobUID);
                                        string dateFolder = cdate.ToString("yyyy-MM-dd");
                                        var pathToSave =
                                            Path.Combine(HostingEnvironment.MapPath(Root.GetFolder_Export()), dateFolder);
                                        if (!Directory.Exists(pathToSave))
                                        {
                                            try
                                            {
                                                Directory.CreateDirectory(pathToSave);
                                            }
                                            catch
                                            {
                                            }
                                        }

                                        var path = Path.Combine(pathToSave, jobUID + ".sdf");
                                        var pathZip = Path.Combine(pathToSave, jobUID + ".zip");

                                        if (!File.Exists(pathZip))
                                        {
                                            using (FileStream fs = File.Create(path))
                                            {
                                                SDKHelper.CopyStream(serverFile, fs);
                                            }
                                            using (var fs = new FileStream(pathZip, FileMode.Create))
                                            using (var arch = new ZipArchive(fs, ZipArchiveMode.Create))
                                                arch.CreateEntryFromFile(path, jobUID + ".sdf");
                                        }

                                        var relPath = Root.GetFolder_Export() + dateFolder + "/" + jobUID + ".zip";
                                        NotificationBL.NotificationAdditinalChangeStatus(notificationParamID, new Dictionary<string, string> { { "ParamSTR1", relPath } });
                                        var alert = new AlertMessage
                                        {
                                            eqID = notificationID.ToString(CultureInfo.InvariantCulture) + "_" + path.GetHashCode().ToString(CultureInfo.InvariantCulture),
                                            id = jobUID,
                                            typeid = -1,
                                            title = "Data export has been finished.",
                                            kind = AlertKind.message,
                                            cdate = cdate.ToString(CultureInfo.InvariantCulture),
                                            html = String.Format("<p>Data export has been finished. <br>You can get exproted data by <a href='{0}'>this link</a></p>", relPath),
                                            state = StateAlert.hot.ToString()
                                        };

                                        var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                                        clients.User(userID).showAlerts(new[] { alert });

                                        isComplete = true;
                                        hasBeenProccessed = true;
                                    }
                                }
                                #endregion

                                #region Импорт данных из SDF
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r5_ImportDataFromSDF)
                                {
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<Int32>("ID");

                                        var jobUID = param.Field<Guid>("ParamUID1");
                                        var si = SADB.ObjectService.ExportDataState(jobUID);
                                        if (si.state == 0) continue;

                                        var alert = new AlertMessage
                                        {
                                            eqID = notificationID.ToString(CultureInfo.InvariantCulture) + "_" + jobUID,
                                            id = jobUID,
                                            typeid = -1,
                                            title = "Data import has been finished.",
                                            kind = AlertKind.message,
                                            cdate = cdate.ToString(CultureInfo.InvariantCulture),
                                            html = "<p>No additional information</p>",
                                            state = StateAlert.hot.ToString()
                                        };

                                        var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                                        clients.User(userID).showAlerts(new[] { alert });

                                        isComplete = true;
                                        hasBeenProccessed = true;
                                    }
                                }
                                #endregion

                                #region Экспорт дайджеста документов
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r7_ExportDigestDocsScheduling)
                                {
                                    var notificationTo = (DateTimeOffset)item["NotificationTo"];
                                    if (notificationTo >= DateTimeOffset.UtcNow) continue;

                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    bool allFailure = true;
                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<Int32>("ID");
                                        var schedulingTaskUID = param.Field<Guid>("ParamUID1");
                                        string data = param.Field<String>("ParamSTR1");
                                        var task = JObject.Parse(data).ToObject<AutoExecSchedulingTaskDTO>();
                                        var dataObj = JObject.Parse(task.Data).ToObject<ModelDocsDigest>();

                                        DateTime? dateFrom = null;
                                        if (pid.HasValue) dateFrom = cdate;
                                        string path = ExportController.GenerateDocsDigest(SADB, dataObj, true, ci, notificationUID, dateFrom);

                                        string pathDir = Path.GetDirectoryName(path);
                                        string pathFNWithoutExt = Path.GetFileNameWithoutExtension(path);
                                        string pathExt = Path.GetExtension(path);
                                        string pathZip = Path.Combine(pathDir, pathFNWithoutExt + ".zip");

                                        if (!File.Exists(pathZip))
                                        {
                                            using (var fs = new FileStream(pathZip, FileMode.Create))
                                            using (var arch = new ZipArchive(fs, ZipArchiveMode.Create))
                                                arch.CreateEntryFromFile(path, pathFNWithoutExt + pathExt);
                                        }

                                        var subscribersArr = task.Subscribers.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);

                                        foreach (var email in subscribersArr)
                                        {
                                            var msg = new SendMessage
                                            {
                                                Email = email,
                                                Subject = task.EmailTopic,
                                                Text = task.EmailBody
                                            };
                                            msg.Attachments = new[] { pathZip + ";report_" + notificationTo.ToString("yyyy-MM-dd") + ".zip" };

                                            try
                                            {
                                                Root.SendMail(msg, true);
                                                allFailure = false;
                                            }
                                            catch (Exception ex)
                                            {
                                                LogBL.Write("r7_ExportDigestDocsScheduling", ex.ToString(), LogBL.KindLog.Db);
                                            }
                                        }

                                        if (status == 0)
                                        {
                                            var flag = param.Field<Int32?>("ParamINT1"); //проставляется 1 - если разовый форсированный запуск
                                            if (!flag.HasValue)
                                                NotificationBL.PrepareNextNotificationBy(task, notificationTo, userID, item["DatabaseKey"].ToString(), ci, notificationID);
                                        }

                                        break; //выход из additionalIfo.Rows
                                    }

                                    if (!allFailure)
                                    {
                                        isComplete = true;
                                        hasBeenProccessed = true;
                                    }
                                    else
                                        NotificationBL.NotificationChangeStatus(notificationID, 2);
                                }
                                #endregion

                                #region Экспорт дайджеста фактов
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r9_ExportDigestFactsScheduling)
                                {
                                    var notificationTo = (DateTimeOffset)item["NotificationTo"];
                                    if (notificationTo >= DateTimeOffset.UtcNow) continue;

                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    bool allFailure = true;
                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<Int32>("ID");
                                        var schedulingTaskUID = param.Field<Guid>("ParamUID1");
                                        string data = param.Field<String>("ParamSTR1");
                                        var task = JObject.Parse(data).ToObject<AutoExecSchedulingTaskDTO>();
                                        var dataObj = JObject.Parse(task.Data).ToObject<ModelFactDigest>();

                                        DateTime? dateFrom = null;
                                        if (pid.HasValue) dateFrom = cdate;
                                        if (!dateFrom.HasValue) dateFrom = dataObj.PointDateForSelection;

                                        string path = ExportController.GenerateFactDigest(SADB, dataObj, true, ci, notificationUID, dateFrom);

                                        if (!String.IsNullOrWhiteSpace(path))
                                        {
                                            string pathDir = Path.GetDirectoryName(path);
                                            string pathFNWithoutExt = Path.GetFileNameWithoutExtension(path);
                                            string pathExt = Path.GetExtension(path);
                                            string pathZip = Path.Combine(pathDir, pathFNWithoutExt + ".zip");

                                            if (!File.Exists(pathZip))
                                            {
                                                using (var fs = new FileStream(pathZip, FileMode.Create))
                                                using (var arch = new ZipArchive(fs, ZipArchiveMode.Create))
                                                    arch.CreateEntryFromFile(path, pathFNWithoutExt + pathExt);
                                            }

                                            var subscribersArr = task.Subscribers.Split(new[] { ',', ';' },
                                                StringSplitOptions.RemoveEmptyEntries);

                                            foreach (var email in subscribersArr)
                                            {
                                                var msg = new SendMessage
                                                {
                                                    Email = email,
                                                    Subject = task.EmailTopic,
                                                    Text = task.EmailBody
                                                };

                                                msg.Attachments = new[]
                                                {pathZip + ";report_" + notificationTo.ToString("yyyy-MM-dd") + ".zip"};

                                                try
                                                {
                                                    Root.SendMail(msg, true);
                                                    allFailure = false;
                                                }
                                                catch (Exception ex)
                                                {
                                                    LogBL.Write("r9_ExportDigestFactsScheduling", ex.ToString(), LogBL.KindLog.Db);
                                                }
                                            }
                                        }
                                        if (status == 0)
                                        {
                                            var flag = param.Field<Int32?>("ParamINT1"); //проставляется 1 - если разовый форсированный запуск
                                            if (!flag.HasValue)
                                                NotificationBL.PrepareNextNotificationBy(task, notificationTo, userID,
                                                    item["DatabaseKey"].ToString(), ci, notificationID);
                                        }

                                        break; //выход из additionalIfo.Rows
                                    }

                                    if (!allFailure)
                                    {
                                        isComplete = true;
                                        hasBeenProccessed = true;
                                    }
                                    else
                                        NotificationBL.NotificationChangeStatus(notificationID, 2);
                                }
                                #endregion

                                #region Взаимодействие с egrul
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r10_EgrulCompanyData)
                                {
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    foreach (DataRow param in additionalIfo.Rows)
                                    {

                                        JObject jAddInfo = null;
                                        if (!String.IsNullOrWhiteSpace(param.Field<string>("ParamSTR2")))
                                            jAddInfo = JObject.Parse(param.Field<string>("ParamSTR2"));

                                        int notificationParamID = param.Field<Int32>("ID");
                                        int alertType = param.Field<Int32>("ParamINT1");
                                        Guid taskUID = param.Field<Guid>("ParamUID1");
                                        string taskType = param.Field<Guid>("ParamUID2").ToString().ToUpper();
                                        string wnd = param.Field<String>("ParamSTR1");

                                        var ctx = new ANBR.Monitoring.Implementation.ContextData
                                        {
                                            ID = userID,
                                            Language = ciToken
                                        };

                                        var alert = ANBR.Monitoring.Environment.Instance.Gateway.GetAlerts(ctx).FirstOrDefault(a => a.TaskUID == taskUID && a.AlertType == alertType);
                                        if (alert != null)
                                        {
                                            #region Получаем данные вида
                                            /*
                                            9DC23A37-A10C-4961-BD2C-E5FB91D79980 - egrul (Russia)
                                            <Egrul>
                                              <item>
                                                <Name>Общество с ограниченной ответственностью "Альфа-Транс"</Name>
                                                <Ogrn>1077760973388</Ogrn>
                                                <Inn>7722625290</Inn>
                                                <Address>111250, ГОРОД МОСКВА, УЛИЦА ЛЕФОРТОВСКИЙ ВАЛ, 24А</Address>
                                                <Kpp>772201001</Kpp>
                                                <DateReg>05.10.2007</DateReg>
                                                <DateLikv>14.10.2010</DateLikv>
                                              </item>
                                            </Egrul>

                                            9DC23A37-A10C-4961-BD2C-E5FB91D79980 - kgd.gov.kz
                                            <Egrul>
                                              <item>
                                                <Name>ИП КСЕЛА</Name>
                                                <Kind>ИП</Kind>
                                                <RNN>032620056712</RNN>
                                                <IINBIN>570614450107</IINBIN>
                                                <RegistrationDate>20.02.2007</RegistrationDate>
                                                <RemovalDate></RemovalDate>
                                                <RemovalCause></RemovalCause>
                                                <ActivityPausePeriods></ActivityPausePeriods>
                                              </item>
                                            </Egrul>
                                             */
                                            #endregion
                                            string data = alert.AlertData;
                                            int retType = -1; // исход -1 - все плохо; 1 - результат есть
                                            string retData = data;


                                            if (!String.IsNullOrWhiteSpace(data))
                                            {
                                                switch (taskType)
                                                {
                                                    case "9DC23A37-A10C-4961-BD2C-E5FB91D79980":
                                                        {
                                                            JObject map = new JObject
                                                            {
                                                                ["Name"] = "title_INTERN",
                                                                ["Ogrn"] = "ogrn__ru_RU",
                                                                ["Inn"] = "inn__ru_RU",
                                                                ["Address"] = "address_INTERN"
                                                            };

                                                            JObject aliases = new JObject
                                                            {
                                                                ["Name"] = "Наименование",
                                                                ["Ogrn"] = "ОГРН",
                                                                ["Inn"] = "ИНН",
                                                                ["Address"] = "Адрес"
                                                            };

                                                            var doc = new XmlDocument();
                                                            doc.LoadXml(data);
                                                            var node = doc.SelectSingleNode("Egrul/item");
                                                            if (node != null)
                                                            {
                                                                var jNode = JsonConvert.SerializeXmlNode(node);
                                                                JObject obj = JObject.Parse(jNode);
                                                                obj["taskUID"] = taskUID;
                                                                obj["map"] = map;
                                                                obj["aliases"] = aliases;

                                                                retData = obj.ToString();
                                                                retType = 1;
                                                            }
                                                            node = doc.SelectSingleNode("Egrul/error");
                                                            if (node != null) retData = node.InnerText;
                                                            break;
                                                        }
                                                    case "3C700C54-A4F4-4504-8D7A-42F0424C25E2":
                                                        {
                                                            string typeSystemName = null;
                                                            if (jAddInfo != null)
                                                                typeSystemName = jAddInfo.Property("typeSystemName")?.Value.ToObject<string>();
                                                            if (!String.IsNullOrWhiteSpace(typeSystemName))
                                                                typeSystemName = typeSystemName.ToLower();

                                                            var doc = new XmlDocument();
                                                            doc.LoadXml(data);
                                                            var node = doc.SelectSingleNode("Egrul/item");
                                                            if (node != null)
                                                            {
                                                                JObject map = null;
                                                                JObject aliases = null;
                                                                switch (typeSystemName)
                                                                {
                                                                    case "person":
                                                                        {
                                                                            map = new JObject
                                                                            {
                                                                                ["IINBIN"] = "inn__kk_KZ",
                                                                                ["lname_INTERN"] = "lname_INTERN",
                                                                                ["fname_INTERN"] = "fname_INTERN",
                                                                                ["mname_INTERN"] = "mname_INTERN",
                                                                            };
                                                                            aliases = new JObject
                                                                            {
                                                                                ["IINBIN"] = "ИИН",
                                                                                ["lname_INTERN"] = "Фамилия",
                                                                                ["fname_INTERN"] = "Имя",
                                                                                ["mname_INTERN"] = "Отчество"
                                                                            };
                                                                            break;
                                                                        }
                                                                    case "organization":
                                                                        {
                                                                            map = new JObject
                                                                            {
                                                                                ["Name"] = "title_INTERN",
                                                                                ["IINBIN"] = "bin__kk_KZ",
                                                                                ["RNN"] = "rnn__kk_KZ",
                                                                                ["Address"] = "address_INTERN"
                                                                            };
                                                                            aliases = new JObject
                                                                            {
                                                                                ["Name"] = "Наименование",
                                                                                ["IINBIN"] = "БИН",
                                                                                ["RNN"] = "РНН",
                                                                                ["Address"] = "Адрес"
                                                                            };

                                                                            break;
                                                                        }
                                                                }

                                                                var jNode = JsonConvert.SerializeXmlNode(node);
                                                                JObject obj = JObject.Parse(jNode);
                                                                obj["taskUID"] = taskUID;
                                                                obj["map"] = map;
                                                                obj["aliases"] = aliases;

                                                                if (typeSystemName == "person")
                                                                {
                                                                    var personName = obj.Property("Name").Value?.ToObject<string>();
                                                                    if (!String.IsNullOrWhiteSpace(personName))
                                                                    {
                                                                        var personNameParts = personName.Split(' ');
                                                                        for (int z = 0; z < personNameParts.Length; z++)
                                                                        {
                                                                            if (z == 0) obj["lname_INTERN"] = personNameParts[0];
                                                                            if (z == 1) obj["fname_INTERN"] = personNameParts[1];
                                                                            if (z == 2) obj["mname_INTERN"] = personNameParts[2];
                                                                        }
                                                                    }
                                                                }

                                                                retData = obj.ToString();
                                                                retType = 1;
                                                            }
                                                            node = doc.SelectSingleNode("Egrul/error");
                                                            if (node != null) retData = node.InnerText;

                                                            break;
                                                        }
                                                }
                                            }

                                            var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                                            clients.User(userID).transferData(retData, retType, wnd);

                                            isComplete = true;
                                            hasBeenProccessed = true;
                                        }
                                        else
                                        {
                                            if ((DateTime.Now - cdate).TotalMinutes > 60)
                                                NotificationBL.NotificationAffirm(notificationID, true, -1);
                                        }
                                    }
                                }
                                #endregion

                                #region Взаимодействие с VKontakte
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r12_VKontakteData)
                                {
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<Int32>("ID");
                                        int alertType = param.Field<Int32>("ParamINT1");
                                        int profileID = param.Field<int>("ParamINT2");
                                        Guid taskUID = param.Field<Guid>("ParamUID1");
                                        string emailAddress = param.Field<string>("ParamSTR1");
                                        JObject jData = JObject.Parse(param.Field<string>("ParamSTR2"));
                                        string bodyHtml = (string)jData["emailBody"];

                                        var ctx = new ANBR.Monitoring.Implementation.ContextData
                                        {
                                            ID = userID,
                                            Language = ciToken
                                        };

                                        var alert = ANBR.Monitoring.Environment.Instance.Gateway.GetAlerts(ctx).FirstOrDefault(a => a.TaskUID == taskUID && a.AlertType == alertType);
                                        if (alert != null)
                                        {
                                            #region Получаем данные вида
                                            /*
    {
    "id": "1cd6b6b8-eb06-4022-acea-4dcf8c22abf9",
    "accounts": [
    {
      "url": "https://vk.com/id55832478",
      "pseudo": "id55832478",
      "logo_url": "https://pp.vk.me/c623316/v623316478/47d68/hRa-0RvFcpc.jpg",
      "DateProfileUpdate": "0001-01-01T00:00:00",
      "HtmlInfo": "34 года",
      "id": 55832478,
      "name": "Денис Иванов"
    },
    {
      "url": "https://vk.com/id144915847",
      "pseudo": "id144915847",
      "logo_url": "https://pp.vk.me/c323231/v323231847/8199/DudMCMYv23U.jpg",
      "DateProfileUpdate": "0001-01-01T00:00:00",
      "HtmlInfo": "",
      "id": 144915847,
      "name": "Денис Иванов"
    }, 
                                             */

                                            #endregion
                                            string data = alert.AlertData;
                                            if (!String.IsNullOrWhiteSpace(data))
                                            {
                                                JObject jObj = JObject.Parse(data);
                                                var jArr = (JArray)jObj["accounts"];

                                                if (!jArr.Any())
                                                {
                                                    var msg = new SendMessage
                                                    {
                                                        Email = emailAddress,
                                                        Subject = "Нет сведений",
                                                        Text =
                                                            AddHtmlToTopMessage(bodyHtml,
                                                                "<p>По искомому объекту данные отсутствуют</p>")
                                                    };

                                                    Root.SendMail(msg, true);
                                                }
                                                else
                                                {
                                                    string templatePersItem = Scope.MsgVKontaktePersDataResultItemBody;
                                                    string persItems = "";
                                                    foreach (var jEl in jArr)
                                                    {
                                                        string persInfo = (string)jEl["name"];
                                                        if (!String.IsNullOrWhiteSpace((string)jEl["HtmlInfo"]))
                                                            persInfo = persInfo + " (" + (string)jEl["HtmlInfo"] + ")";

                                                        string persItem = Share.TemplateSubsitutionProcessing(
                                                            new
                                                            {
                                                                Photo = (string)jEl["logo_url"] ?? "",
                                                                Info = persInfo,
                                                                Url = (string)jEl["url"]
                                                            }, templatePersItem);
                                                        persItems += persItem + Environment.NewLine;
                                                    }

                                                    string templatePers = Scope.MsgVKontaktePersDataResultBody;
                                                    string orgBody = Share.TemplateSubsitutionProcessing(new
                                                    {
                                                        PersonsList = persItems
                                                    }, templatePers);

                                                    string newBodyHtml = AddHtmlToTopMessage(bodyHtml, orgBody);
                                                    var msg = new SendMessage
                                                    {
                                                        Email = emailAddress,
                                                        Subject = "Выберете персону",
                                                        Text = newBodyHtml
                                                    };

                                                    Root.SendMail(msg, true);
                                                }
                                            }

                                            isComplete = true;
                                            hasBeenProccessed = true;
                                        }
                                        else
                                        {
                                            if ((DateTime.Now - cdate).TotalMinutes > 60)
                                                NotificationBL.NotificationAffirm(notificationID, true, -1);
                                        }
                                    }
                                }
                                #endregion

                                #region Взаимодействие с Facebook (идентично с VKantakte, пока нет расхождений)
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r15_FacebookData)
                                {
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<int>("ID");
                                        int alertType = param.Field<int>("ParamINT1");
                                        int profileID = param.Field<int>("ParamINT2");
                                        Guid taskUID = param.Field<Guid>("ParamUID1");
                                        string emailAddress = param.Field<string>("ParamSTR1");
                                        JObject jData = JObject.Parse(param.Field<string>("ParamSTR2"));
                                        string bodyHtml = (string)jData["emailBody"];

                                        var ctx = new ANBR.Monitoring.Implementation.ContextData
                                        {
                                            ID = userID,
                                            Language = ciToken
                                        };

                                        var alert = ANBR.Monitoring.Environment.Instance.Gateway.GetAlerts(ctx).FirstOrDefault(a => a.TaskUID == taskUID && a.AlertType == alertType);
                                        if (alert != null)
                                        {
                                            #region Получаем данные вида
                                            /*
    {
    "id": "1cd6b6b8-eb06-4022-acea-4dcf8c22abf9",
    "accounts": [
    {
      "url": "https://www.facebook.com/profile.php?id=1639147111",
      "logo_url": "https://scontent-waw1-1.xx.fbcdn.net/v/t1.0-1/c232.39.495.495/s100x100/321681_2346715320853_683477432_n.jpg?oh=f5dd80dbd9f80422128deead7919b0e7&oe=581A4FB9",
      "HtmlInfo": "Живет в Москва\nГенеральный директор и владелец в Аналитические бизнес решения\n\n\n",
      "id": 1639147111,
      "name": "Денис Шатров"
    },
    {
    ...
    }, 
                                             */

                                            #endregion
                                            string data = alert.AlertData;
                                            if (!String.IsNullOrWhiteSpace(data))
                                            {
                                                JObject jObj = JObject.Parse(data);
                                                var jArr = (JArray)jObj["accounts"];

                                                if (!jArr.Any())
                                                {
                                                    var msg = new SendMessage
                                                    {
                                                        Email = emailAddress,
                                                        Subject = "Нет сведений",
                                                        Text =
                                                            AddHtmlToTopMessage(bodyHtml,
                                                                "<p>По искомому объекту данные отсутствуют</p>")
                                                    };

                                                    Root.SendMail(msg, true);
                                                }
                                                else
                                                {
                                                    string templatePersItem = Scope.MsgFacebookPersDataResultItemBody;
                                                    string persItems = "";
                                                    foreach (var jEl in jArr)
                                                    {
                                                        string persInfo = (string)jEl["name"];
                                                        if (!String.IsNullOrWhiteSpace((string)jEl["HtmlInfo"]))
                                                            persInfo = persInfo + " (" + (string)jEl["HtmlInfo"] + ")";

                                                        string persItem = Share.TemplateSubsitutionProcessing(
                                                            new
                                                            {
                                                                Photo = (string)jEl["logo_url"] ?? "",
                                                                Info = persInfo,
                                                                Url = (string)jEl["url"]
                                                            }, templatePersItem);
                                                        persItems += persItem + Environment.NewLine;
                                                    }

                                                    string templatePers = Scope.MsgFacebookPersDataResultBody;
                                                    string orgBody = Share.TemplateSubsitutionProcessing(new
                                                    {
                                                        PersonsList = persItems
                                                    }, templatePers);

                                                    string newBodyHtml = AddHtmlToTopMessage(bodyHtml, orgBody);
                                                    var msg = new SendMessage
                                                    {
                                                        Email = emailAddress,
                                                        Subject = "Выберете персону",
                                                        Text = newBodyHtml
                                                    };

                                                    Root.SendMail(msg, true);
                                                }
                                            }

                                            isComplete = true;
                                            hasBeenProccessed = true;
                                        }
                                        else
                                        {
                                            if ((DateTime.Now - cdate).TotalMinutes > 60)
                                                NotificationBL.NotificationAffirm(notificationID, true, -1);
                                        }
                                    }
                                }
                                #endregion

                                #region Экспорт отчетов из (Check)
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r13_UploadSelectedReportsForUser)
                                {
                                    var context = new ANBR.Web.ExternalCore.Common.ContextData
                                    {
                                        ID = userID,
                                        Language = ciToken,
                                        DBID = dbID.ToString()
                                    };

                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    bool allFailure = true;
                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<Int32>("ID");
                                        string data = param.Field<String>("ParamSTR1");
                                        var dataObj = JObject.Parse(data).ToObject<ReportsSelectedDTO>();

                                        string pathWithFiles = SDKHelper.CheckModule_ReportsExport(SADB, SAReporting, dataObj, notificationUID, context, ci);

                                        string dateFolderPart = DateTime.Now.ToString("yyyy-MM-dd");
                                        var baseZipPath = HostingEnvironment.MapPath(Root.GetFolder_Export() + @"\" + dateFolderPart);
                                        Directory.CreateDirectory(Path.Combine(baseZipPath));
                                        var saInfo = SADB.ObjectService.GetObjectInfo(dataObj.ObjID);
                                        string zipFileNameOnly = SDKHelper.NormalizeFileName(saInfo.DisplayName + "_" + DateTime.Now.ToString("yyyy-MM-dd_ss")) + ".zip";
                                        zipFileNameOnly = SDKHelper.PurifyFileName(baseZipPath, zipFileNameOnly);
                                        string zipFileName = Path.Combine(baseZipPath, zipFileNameOnly);
                                        ZipFile.CreateFromDirectory(pathWithFiles, zipFileName, CompressionLevel.Optimal, false);

                                        string msgTitle = Root.GetResource("BackgroundThread_r13_MsgTitle", ci);
                                        string msgBody = Root.GetResource(dataObj.Action == 0 ? "BackgroundThread_r13_MsgBody" : "BackgroundThread_r13_MsgBodyEmail", ci);

                                        var relPath = Root.GetFolder_Export() + dateFolderPart + "/" + zipFileNameOnly;
                                        NotificationBL.NotificationAdditinalChangeStatus(notificationParamID, new Dictionary<string, string> { { "ParamSTR2", relPath } });
                                        var alert = new AlertMessage
                                        {
                                            eqID = notificationID.ToString(CultureInfo.InvariantCulture) + "_" + zipFileNameOnly.GetHashCode().ToString(CultureInfo.InvariantCulture),
                                            id = notificationUID,
                                            typeid = -1,
                                            title = String.Format(msgTitle, saInfo.DisplayName),
                                            kind = AlertKind.message,
                                            cdate = cdate.ToString(CultureInfo.InvariantCulture),
                                            html = String.Format(msgBody, relPath, saInfo.DisplayName),
                                            state = StateAlert.hot.ToString()
                                        };

                                        if (dataObj.Action == 1 && !String.IsNullOrWhiteSpace(dataObj.Email))
                                        {
                                            string emailTitle = Root.GetResource("BackgroundThread_r13_EmailTitle", ci);
                                            string emailBody = Root.GetResource("BackgroundThread_r13_EmailBody", ci);

                                            var msg = new SendMessage
                                            {
                                                Email = dataObj.Email,
                                                Subject = String.Format(emailTitle, saInfo.DisplayName, cdate.ToString(ci)),
                                                Text = String.Format(emailBody, saInfo.DisplayName, cdate.ToString(ci)),
                                            };
                                            msg.Attachments = new[] { zipFileName };

                                            Root.SendMail(msg, true);
                                        }

                                        var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                                        clients.User(userID).showAlerts(new[] { alert });

                                        isComplete = true;
                                        hasBeenProccessed = true;

                                    }

                                    if (!allFailure)
                                    {
                                        isComplete = true;
                                        hasBeenProccessed = true;
                                    }
                                    else
                                        NotificationBL.NotificationChangeStatus(notificationID, 2);
                                }
                                #endregion

                                #region Экспорт данных в другой проект
                                if (Convert.ToInt32(item["Reason"]) == (int)NotificationReasonEnum.r16_ExportToProject)
                                {
                                    DataTable additionalIfo = NotificationBL.GetNotificationDetails(notificationID);

                                    foreach (DataRow param in additionalIfo.Rows)
                                    {
                                        int notificationParamID = param.Field<Int32>("ID");
                                        string displayNameImportedObject = param.Field<string>("ParamSTR1");

                                        var jobUID = param.Field<Guid>("ParamUID1");
                                        var si = SADB.ObjectService.ExportDataState(jobUID);
                                        if (si.state == 0) continue;

                                        string url = $@"/lang-{ciToken}/db{dbID}/inquiry?prjid={projectID}";

                                        var alert = new AlertMessage
                                        {
                                            eqID = notificationID.ToString(CultureInfo.InvariantCulture),
                                            id = jobUID,
                                            typeid = -1,
                                            title = $"Import for \"{displayNameImportedObject}\" has been completed.",
                                            kind = AlertKind.message,
                                            cdate = cdate.ToString(CultureInfo.InvariantCulture),
                                            html = $"<p>Import for \"{displayNameImportedObject}\" has been completed. <br>Open <a href='{url}'>link</a></p>",
                                            state = StateAlert.hot.ToString()
                                        };

                                        var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                                        clients.User(userID).showAlerts(new[] { alert });

                                        isComplete = true;
                                        hasBeenProccessed = true;
                                    }
                                }
                                #endregion


                                if (isComplete)
                                    NotificationBL.NotificationAffirm(notificationID, hasBeenProccessed);
                            }
                            catch (Exception ex)
                            {
                                NotificationBL.NotificationAffirm(notificationID, false);
                                ApplicationErrorInternal(ex, notificationID.ToString());
                            }
                        }
                    }
                    while (notificationInfo != null);

                }
                catch (Exception ex)
                {
                    ApplicationErrorInternal(ex);
                }
            }
            finally
            {
                lock (syncdispatchProcessing)
                {
                    dispatchProcessing = false;
                }
            }
        }
        #endregion

        private static List<int> GetSources(int mainobjectID, IDataBase database)
        {
            string sqlTemplate = @"
	select sv.Object_ID/*, sv.Display_Name, sv.[TypeName]*/ from dbo.source_view sv 
	where sv.[Object_ID] in (
		select sr.[RightObject_ID] from [dbo].[Relations] sr inner join
		 (	
			select /*linked.[Display_Name], */linked.[Object_ID]
			from 
				 [dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
			where 
				linked.Deleted = 0 and
				r.[LeftObject_ID] = {0} and 
				linked.[Type_ID] = (select Meta_Type_ID from V_Meta_Types where SystemName = 'WebTask')
				--and  r.[RightObject_ID] = 916195 --for test only
		) T on (sr.[LeftObject_ID] = T.[Object_ID]) 
		where sr.[RightRole_ID] = (select [RightRole_ID] from [dbo].[V_Meta_Relations] where SystemName = 'Rel_Found_object')) 
	and sv.Deleted = 0
";

            string sql = String.Format(sqlTemplate, mainobjectID);

            var qr = database.QueriesProvider.ExecuteQuery(sql);
            var td = qr.DataSet.Tables[0].AsEnumerable();

            return td.Select(row => row.Field<int>(0)).ToList();
        }


        private static bool HasBeenSplittingCompleted(int mainobjectID, IDataBase database)
        {
            string sqlTemplate = @"
if (exists(
	select sv.Object_ID, sv.Display_Name, sv.[TypeName] from dbo.source_view sv 
	where sv.[Object_ID] in (
		select sr.[RightObject_ID] from [dbo].[Relations] sr inner join
		 (	
			select /*linked.[Display_Name], */linked.[Object_ID]
			from 
				 [dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
			where 
				linked.Deleted = 0 and
				r.[LeftObject_ID] = {0} and 
				linked.[Type_ID] = (select Meta_Type_ID from V_Meta_Types where SystemName = 'WebTask')
				--and  r.[RightObject_ID] = 916195 --for test only
		) T on (sr.[LeftObject_ID] = T.[Object_ID]) 
		where sr.[RightRole_ID] = (select [RightRole_ID] from [dbo].[V_Meta_Relations] where SystemName = 'Rel_Found_object')) 
	and sv.Deleted = 0
	and exists(select 'x' from [dbo].[DocIsSplitted] dis where dis.[iddoc] = sv.[Object_ID] and dis.[split] = 0)
)) select 0 
else select 1
";

            string sql = String.Format(sqlTemplate, mainobjectID);

            var qr = database.QueriesProvider.ExecuteQuery(sql);
            DataTable td = qr.DataSet.Tables[0];
            int result = Convert.ToInt32(td.Rows[0][0]);
            return result != 0;
        }

        private static bool HasBeenIndexingCompleted(int mainobjectID, IDataBase database)
        {
            string sqlTemplate = @"exec Util_FullTextIndexingCompleted {0}";
            string sql = String.Format(sqlTemplate, mainobjectID);

            var qr = database.QueriesProvider.ExecuteQuery(sql, true);
            DataTable td = qr.DataSet.Tables[0];
            int result = Convert.ToInt32(td.Rows[0][0]);

            return result != 0;
        }
    }
}