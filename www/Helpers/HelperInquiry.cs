using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Xml.Linq;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using ANBR.Common.Filters;
using ANBR.Monitoring;
using ANBR.Monitoring.Implementation;
using ANBR.Query.Common;
using ANBR.SemanticArchive.DataContracts;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.SemanticArchive.SDK.Queries;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using www.Areas.ExpressDossier.Models;
using www.Areas.inquiry.Models;
using www.Hub;
using www.Models;
using www.Models.Items;
using www.SaGateway;

namespace www.Helpers
{
    /// <summary>
    /// Фасад к блоку Заявок
    /// </summary>
    public static class HelperInquiry
    {
        /// <summary>
        /// Получить данные по проекту
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="projectID"></param>
        /// <returns></returns>
        public static ProjectModel ProjectGet(IDataBase saDB, int? projectID)
        {
            if (projectID == null) return null;

            SAProject project = saDB.ObjectService.GetProjectByID(projectID.Value);
            if (project == null) return null;

            return new ProjectModel
            {
                projectId = projectID.Value,
                projectCode = project.ProjectCode,
                projectName = project.ProjectName,
                projectState = project.ProjectState,
                projectStatus = project.ProjectStatus,
                Rubrics = project.Rubrics?.Select(item => new RubricsDescriptionModel { id = item.RubricID, title = item.RubricName }).ToArray() ?? new RubricsDescriptionModel[0]
            };
        }

        /// <summary>
        /// Получение порядокового номера заявки
        /// </summary>
        /// <param name="saDB"></param>
        /// <returns></returns>
        public static int GetSeqNumberForInquiry(IDataBase saDB)
        {
            const string sql = @"usp_GetNewSeqVal 'WebInquiryNumber'";

            DataTable res = saDB.QueryService.ExecuteNativeSQLQueryAsIs(new SQLQuery { Text = sql }).Result.Tables[0];

            return (int)res.Rows[0][0];
        }

        /// <summary>
        /// Получение статистики по заявкам: общее кол-во, количество моих заявок
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static InquiryStatsModel GetStats(IDataBase saDB, int id)
        {
            string userName = WebSaUtilities.GetCurrentUserName();

            string sql = @"
select 
	TotalCount = (select count('x') from [dbo].[Projects] where Deleted = 0),
	MineCount = (select count('x') from [dbo].[Projects] where UserOwner = @UserOwner and Deleted = 0)
";
            sql = "SET ROWCOUNT 0; " + System.Environment.NewLine + sql;
            IQuery qr = saDB.QueriesProvider.CreateQuery();
            qr.Sql = sql;

            qr.Parameters.CreateParam("@UserOwner", QueryParameterType.String).Value = new object[] { userName };
            IQueryResult qres = qr.Execute();

            int totalCount = (int)qres.DataSet.Tables[0].Rows[0][0];
            int mineCount = (int)qres.DataSet.Tables[0].Rows[0][1];

            return new InquiryStatsModel { MineCount = mineCount, TotalCount = totalCount };
        }


        internal static IEnumerable<TaskTypeInfoSimple> Search_GetRobotsByType(IMetaType saType)
        {
            string dicItemCode = "";
            if (saType.SystemName == "Organization") dicItemCode = "COMPANY";
            if (saType.SystemName == "Person") dicItemCode = "PERSON";

            CatalogDicItemData[] dics = WebSaUtilities.MBF.ProductSourcesGetDicItems(null, WebSaUtilities.GetCurrentContextData());
            var dicItem = dics.Single(item => item.DicCode == "BySAType" && item.DicCodeItem == dicItemCode);

            var sscd = new SourcesSearchCriteriasData();
            sscd.DicItems = new List<int>(dicItem.ID);
            Guid[] data = WebSaUtilities.MBF.ProductSourcesGetBy(sscd, WebSaUtilities.GetCurrentContextData()).Where(item => item.Source.HasValue).Select(item => item.Source.Value).ToArray();
            List<TaskType> allTaskTypes = WebSaUtilities.MBF.Types.GetTypes(WebSaUtilities.GetCurrentContextData()).ToList();
            var query = from tt in allTaskTypes
                        join uid in data on tt.UID equals uid
                        select new TaskTypeInfoSimple { id = tt.UID, title = tt.Name };

            return query.ToList();
        }

        /// <summary>
        /// Возвращает пары id работы + id объекта
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="jobType"></param>
        /// <param name="userId"></param>
        /// <returns></returns>
        public static List<Tuple<Guid, int>> GetActiveJobs(IDataBase saDB, SaJobType jobType, string userId = null)
        {
            string sql = "SET ROWCOUNT 0; " + System.Environment.NewLine + @"
select [TaskID], [ParamInt1] from [dbo].[ImportExportState] where Type = @JobType and Creator = @Creator and State <> @State and [ParamInt1] is not null
";
            if (userId == null)
            {
                sql = "SET ROWCOUNT 0; " + System.Environment.NewLine + @"
select [TaskID], [ParamInt1] from [dbo].[ImportExportState] where Type = @JobType and State <> @State and [ParamInt1] is not null
";
            }

            IQuery qr = saDB.QueriesProvider.CreateQuery();
            qr.Sql = sql;
            qr.Parameters.CreateParam("@JobType", QueryParameterType.Int).Value = new object[] { (int)jobType };
            qr.Parameters.CreateParam("@State", QueryParameterType.Int).Value = new object[] { 1 };
            if (userId != null)
                qr.Parameters.CreateParam("@Creator", QueryParameterType.String).Value = new object[] { userId };

            IQueryResult qres = qr.Execute();
            DataTable data = qres.DataSet.Tables[0];
            var lst = data.AsEnumerable()
                .Select(item => new Tuple<Guid, int>(
                    item.Field<Guid>("TaskID"),
                    // ReSharper disable once PossibleInvalidOperationException
                    item.Field<int?>("ParamInt1").Value)).ToList();
            return lst;
        }

        public static string GetCheckNameByCheckId(IDataBase saDB, int checkId)
        {
            string sql = "SET ROWCOUNT 0; " + System.Environment.NewLine + @"
select CDate from [dbo].[ImportExportState] where ID = @id
";

            IQuery qr = saDB.QueriesProvider.CreateQuery();
            qr.Sql = sql;
            qr.Parameters.CreateParam("@id", QueryParameterType.Int).Value = new object[] { checkId };

            IQueryResult qres = qr.Execute();
            DataTable data = qres.DataSet.Tables[0];
            return data.Rows.Count == 0 ? null : ((DateTime) data.Rows[0][0]).ToString("o");
        }


        private static int[] GetTasksByCheckUid(IDataBase saDB, Guid checkUid)
        {
            var res = new int[0];

            string sql = "SET ROWCOUNT 0; " + System.Environment.NewLine + @"
select Param1 from [dbo].[ImportExportState] where TaskID = @TaskUid
";

            IQuery qr = saDB.QueriesProvider.CreateQuery();
            qr.Sql = sql;
            qr.Parameters.CreateParam("@TaskUid", QueryParameterType.String).Value = new object[] { checkUid };

            IQueryResult qres = qr.Execute();
            DataTable data = qres.DataSet.Tables[0];
            if (data.Rows.Count == 0) return res;

            string val = data.Rows[0][0].ToString();
            string[] pairs = val.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            res = pairs.Select(item => Convert.ToInt32(item.Substring(0, item.IndexOf(':')))).ToArray();

            return res;
        }

        public static int[] ContextGetSATaskIds(IDataBase saDb)
        {
            string ids = Root.GetDataFromKey(Root.KeyElement.ids);
            string checkUid = Root.GetDataFromKey(Root.KeyElement.checkuid);
            int[] idsArr =
                ids?.Split(new char[','], StringSplitOptions.RemoveEmptyEntries)
                    .Select(item => Convert.ToInt32(item))
                    .ToArray();
            if (!String.IsNullOrWhiteSpace(checkUid) && checkUid != Guid.Empty.ToString())
                idsArr = GetTasksByCheckUid(saDb, new Guid(checkUid));
            return idsArr;
        }

        public static string ContextGetCurrentCheckId()
        {
            return Root.GetDataFromKey(Root.KeyElement.id);
        }

        public static SearchTask ToSearchTask(this Tuple<int, Task> stData, int mainObjectID, CultureInfo ci = null)
        {
            if (stData.Item2 == null) return null;

            string message = stData.Item2.StatusInfo;
            string details = stData.Item2.ErrorInfo;
            int severity = 0;
            string status = "unknown";

            switch (stData.Item2.Status)
            {
                case TaskStatus.Stopped:
                case TaskStatus.WaitingAnswer:
                    status = "stopped";
                    message = Root.GetResource("MBFResult_Stopped", ci);
                    break;
                case TaskStatus.Completed:
                    status = "complited";
                    message = Root.GetResource("MBFResult_Completed", ci);
                    break;
                case TaskStatus.Unknown:
                case TaskStatus.Added:
                    status = "created";
                    message = Root.GetResource("MBFResult_Created", ci);
                    break;
                case TaskStatus.Starting:
                case TaskStatus.Started:
                    status = "processing";
                    message = Root.GetResource("MBFResult_InProgress", ci);
                    break;
                case TaskStatus.Aborted:
                case TaskStatus.Aborting:
                case TaskStatus.Invalid:
                    status = "invalid";
                    message = Root.GetResource("MBFResult_Invalid", ci);
                    break;
            }

            switch (stData.Item2.Reason)
            {
                case "ErrorGeneral":
                    message = Root.GetResource("MBFResult_GeneralError", ci);
                    severity = 500;
                    break;
                case "Found":
                    message = Root.GetResource("MBFResult_Found", ci);
                    severity = 200;
                    break;
                case "NotFound":
                    message = Root.GetResource("MBFResult_NotFound_v01", ci);
                    severity = 404;
                    break;
                case "ErrorNet":
                    message = Root.GetResource("MBFResult_ErrorNet", ci);
                    severity = 500;
                    break;
                case "ErrorSource":
                    message = Root.GetResource("MBFResult_ErrorResource", ci);
                    severity = 500;
                    break;
                case "ErrorParsing":
                    message = Root.GetResource("MBFResult_ErrorProcessing", ci);
                    severity = 500;
                    break;
                case "ErrorSave":
                    message = Root.GetResource("MBFResult_ErrorSaveResult", ci);
                    severity = 500;
                    break;
                case "NoUserAnswer":
                    message = Root.GetResource("MBFResult_UserIgnoreAlert", ci);
                    severity = 501;
                    break;
                case "NoEnoughInput":
                    message = Root.GetResource("MBFResult_NotenoughInputData", ci); 
                    severity = 502;
                    break;
            }

            var task = new SearchTask
            {
                objID = mainObjectID,
                searchSATaskID = stData.Item1,
                title = stData.Item2.DisplayName,
                id = stData.Item2.TypeUID,
                state = message,
                severity = severity,
                status = status,
                details = details
            };

            return task;
        }


        /// <summary>
        /// Возвращает пары id работы + id объекта
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="mbf"></param>
        /// <param name="jobType"></param>
        /// <param name="mainObjectId"></param>
        /// <param name="userId"></param>
        /// <returns></returns>
        public static List<ListElement> GetAllJobs(IDataBase saDB, IGateway mbf, SaJobType jobType, int mainObjectId, string userId = null)
        {
            string sql = "SET ROWCOUNT 0; " + System.Environment.NewLine + @"
select [ID], [TaskID], [ParamInt1], [Param1], [CDate] from [dbo].[ImportExportState] where Type = @JobType and Creator = @Creator and [ParamInt1] = @ParamInt1
order by CDate desc
";
            if (userId == null)
            {
                sql = "SET ROWCOUNT 0; " + System.Environment.NewLine + @"
select [ID], [TaskID], [ParamInt1], [Param1], [CDate] from [dbo].[ImportExportState] where Type = @JobType and [ParamInt1] = @ParamInt1
order by CDate desc
";
            }

            IQuery qr = saDB.QueriesProvider.CreateQuery();
            qr.Sql = sql;
            qr.Parameters.CreateParam("@JobType", QueryParameterType.Int).Value = new object[] { (int)jobType };
            qr.Parameters.CreateParam("@ParamInt1", QueryParameterType.Int).Value = new object[] { mainObjectId };
            if (userId != null)
                qr.Parameters.CreateParam("@Creator", QueryParameterType.String).Value = new object[] { userId };

            IQueryResult qres = qr.Execute();
            DataTable data = qres.DataSet.Tables[0];
            var lst = data.AsEnumerable()
                .Select(item =>
                {
                    var sourcesData = item.Field<String>("Param1");
                    if (sourcesData == null) return null;

                    var tasksData = sourcesData.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                    var sources = tasksData.Select(el =>
                    {
                        int div = el.IndexOf(':');
                        int saTaskID = Int32.Parse(el.Substring(0, div));
                        var mbfTaskID = new Guid(el.Substring(div + 1, el.Length - div - 1));
                        Task t = mbf.Tasks.GetTaskById(mbfTaskID);
                        return new Tuple<int, Task>(saTaskID, t).ToSearchTask(mainObjectId);
                    }).ToList().Where(el => el != null).ToList();

                    var cdate = item.Field<DateTime>("CDate");
                    cdate = DateTime.SpecifyKind(cdate, DateTimeKind.Local);

                    var d = new ListElement
                    {
                        id = item.Field<int>("ID"),
                        date = cdate.ToString("o"),
                        uid = item.Field<Guid>("TaskID").ToString(),
                        data = JsonConvert.SerializeObject(sources)
                    };
                    return d;
                }).Where(item => item != null).ToList();
            return lst;
        }

        public static JObject GetRealDataBy(OrganizationSearchTaskModel organization, int kind, string wnd)
        {
            var currentCountry = HelperOther.ExtractCountryNameFromCulture(organization.selectedCountries.FirstOrDefault());

            if (kind == 0) //как элемент возможного расширения 
            {
                var addInfo = new JObject
                {
                    ["typeSystemName"] = organization.typeSystemName,
                    ["typeid"] = organization.typeid,
                };

                // список всех групп
                var groups = WebSaUtilities.MBF.Groups.GetGroups();
                // группа мониторинг
                var tempGroup = groups.First(g => g.Parent == null && g.Name == "TEMP");

                Guid taskTypeUID;
                XElement request;
                switch (currentCountry)
                {
                    case "RU":
                        {
                            taskTypeUID = new Guid("9DC23A37-A10C-4961-BD2C-E5FB91D79980");

                            var xmllist = new List<XElement>();
                            var slist = new List<string> { organization.title_INTERN };
                            foreach (var s in slist)
                                xmllist.Add(new XElement("string", s));

                            request = new XElement("Options",
                               new XElement("Custom",
                                   new XElement("DisplayName", organization.title_INTERN),
                                   new XElement("Inn", organization.inn__ru_RU ?? ""),
                                   new XElement("Ogrn", organization.ogrn__ru_RU ?? ""),
                                   new XElement("SearchNameList", xmllist)
                           ));

                            break;
                        }
                    case "KZ":
                        {
                            taskTypeUID = new Guid("3C700C54-A4F4-4504-8D7A-42F0424C25E2");

                            var xmllist = new List<XElement>();
                            var slist = new List<string> { organization.title_INTERN };
                            foreach (var s in slist)
                                xmllist.Add(new XElement("string", s));

                            request = new XElement("Options",
                               new XElement("Custom",
                                   new XElement("IsOrganization", Boolean.TrueString),
                                   new XElement("DisplayName", organization.title_INTERN),
                                   new XElement("Inn", organization.inn__ru_RU ?? ""),
                                   new XElement("Ogrn", organization.ogrn__ru_RU ?? ""),
                                   new XElement("SearchNameList", xmllist)
                           ));

                            break;
                        }

                    default:
                    {
                        return null;
                    }
                }

                ContextData context = WebSaUtilities.GetCurrentContextData();
                var x =
                    ANBR.Monitoring.Environment.Instance.Gateway.Tasks.CreateTask(
                        taskTypeUID, tempGroup.GroupId,
                        organization.title_INTERN, null, request.ToString(), context);
                x.Start(context);

                string userID = WebSaUtilities.GetCurrentUserID();
                string dbID = Scope.GetCurrentDBID();
                string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;

                // 3 - это особый тип МБФ алерта
                NotificationBL.RegisterUniformSingleEvent(userID, dbID + "|$|" + dbName, wnd, addInfo.ToString(), 3 /*это тип МБФ Алерта*/,
                    null, x.UID,
                    taskTypeUID, NotificationReasonEnum.r10_EgrulCompanyData,
                    System.Threading.Thread.CurrentThread.CurrentUICulture);

                var jobj = new JObject
                {
                    ["taskUID"] = x.UID
                };

                return jobj;
            }

            return null;
        }

        internal static JObject GetRealDataBy(PersonSearchTaskModel person, int kind, string wnd)
        {
            var currentCountry = HelperOther.ExtractCountryNameFromCulture(person.selectedCountries.FirstOrDefault());

            if (kind == 0) //как элемент возможного расширения 
            {
                var addInfo = new JObject
                {
                    ["typeSystemName"] = person.typeSystemName,
                    ["typeid"] = person.typeid,
                };

                string dn = (person.lname_INTERN ?? "") + " " + (person.fname_INTERN ?? "") + " " +
                            (person.mname_INTERN ?? "");

                // список всех групп
                var groups = WebSaUtilities.MBF.Groups.GetGroups();
                // группа мониторинг
                var tempGroup = groups.First(g => g.Parent == null && g.Name == "TEMP");

                Guid taskTypeUID;
                XElement request;
                switch (currentCountry)
                {
                    case "KZ":
                    {
                        taskTypeUID = new Guid("3C700C54-A4F4-4504-8D7A-42F0424C25E2");

                        var xmllist = new List<XElement>();
                        var slist = new List<string> {dn};
                        foreach (var s in slist)
                            xmllist.Add(new XElement("string", s));

                        request = new XElement("Options",
                            new XElement("Custom",
                                new XElement("IsOrganization", Boolean.FalseString),
                                new XElement("DisplayName", dn),
                                new XElement("LName", person.lname_INTERN),
                                new XElement("FName", person.fname_INTERN),
                                new XElement("MName", person.mname_INTERN),
                                new XElement("Inn", person.inn__ru_RU ?? ""),
                                new XElement("SearchNameList", xmllist)
                            ));

                        break;
                    }

                    default:
                    {
                        return null;
                    }
                }

                ContextData context = WebSaUtilities.GetCurrentContextData();
                var x =
                    ANBR.Monitoring.Environment.Instance.Gateway.Tasks.CreateTask(
                        taskTypeUID, tempGroup.GroupId,
                        dn, null, request.ToString(), context);
                x.Start(context);

                string userID = WebSaUtilities.GetCurrentUserID();
                string dbID = Scope.GetCurrentDBID();
                string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;


                // 3 - это особый тип МБФ алерта
                NotificationBL.RegisterUniformSingleEvent(userID, dbID + "|$|" + dbName, wnd, addInfo.ToString(), 3 /*это тип МБФ Алерта*/,
                    null, x.UID,
                    taskTypeUID, NotificationReasonEnum.r10_EgrulCompanyData,
                    System.Threading.Thread.CurrentThread.CurrentUICulture);

                var jobj = new JObject
                {
                    ["taskUID"] = x.UID
                };

                return jobj;
            }

            return null;
        }
    }
}
