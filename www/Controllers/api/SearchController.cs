using System.Collections.Generic;
using System.Web.Http;
using www.Models;
using System.Linq;
using System;
using ANBR.Monitoring;
using System.Web;
using System.Net.Http;
using System.Net;
using www.SaGateway;
using Anbr.Web.SA.CoreLogic;
using ANBR.Monitoring.Implementation;
using www.Helpers;

namespace www.Controllers.api
{
    /// <summary>
    /// получение, конфигурирование, запуск поисковых задач
    /// </summary>
    public class SearchController : ApiController
    {
        [NonAction]
        string GetTaskOptions2(Guid typeID)
        {
            return WebSaUtilities.MBF.Types.GetHtmlSettings(typeID);
        }

        [HttpGet]
        [Route("api/search/balance")]
        public decimal GetBalance()
        {
            return WebSaUtilities.MBF.GetTotalAssets(WebSaUtilities.GetCurrentContextData()).Amount;
        }


        [HttpGet]
        [ActionName("DefaultAction")]
        public void ConfigureTask(int mainObjectID, Guid id, Guid typeID)
        {
            AddSearchTaskToCart(mainObjectID, typeID, id);
        }

        [HttpPost]
        [ActionName("DefaultAction")]
        public HttpResponseMessage StartTaskPack(TasksForExecuting model)
        {
            if (model.MainObject == default(int) || model.TaskTypeIDs.Length == 0) return Request.CreateResponse(HttpStatusCode.InternalServerError, "Model state is invalid");
            var taskList = SDKHelper.GetLinkedTasks(model.MainObject);

            string key = String.Format("ExternalSearchSources${0}", model.MainObject);
            var cart = new Dictionary<Guid, Guid>();
            if (HttpContext.Current.Session[key] != null)
                cart = (Dictionary<Guid, Guid>)HttpContext.Current.Session[key];

            var tasks = new List<Guid>();
            foreach (Guid taskTypeID in model.TaskTypeIDs)
            {
                Tuple<int, Task> task;
                Guid taskID;
                if (cart.TryGetValue(taskTypeID, out taskID))
                {
                    var t = WebSaUtilities.MBF.Tasks.GetTaskById(taskID);
                    task = taskList.FirstOrDefault(item => item.Item2.TypeUID == t.TypeUID);
                }
                else
                {
                    task = taskList.FirstOrDefault(item => item.Item2.TypeUID == taskTypeID);
                    if (task == null)
                        task = HelperISS.CreateNewTask(taskTypeID, model.MainObject, null, null);
                }

                ContextData context = WebSaUtilities.GetCurrentContextData();
                if (task != null) task.Item2.Start(context);
                tasks.Add(task.Item2.UID);
            }

            if (model.TaskTypeIDs.Length > 0 && model.AutoSelect)
            {
                string userID = WebSaUtilities.GetCurrentUserID();
                string dbID = Scope.GetCurrentDBID();
                string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;

                NotificationBL.RegisterAutoFactExtractionAfterMBFEvent(userID, dbID + "|$|" + dbName, model.MainObject, tasks.ToArray(), System.Threading.Thread.CurrentThread.CurrentUICulture);
            }

            return Request.CreateResponse(HttpStatusCode.Created);
        }


        [ActionName("DefaultAction")]
        [Route("api/search/SimpleProfiles")]
        public IEnumerable<SearchProfile> GetSimpleProfiles()
        {
            var profiles = WebSaUtilities.MBF.GetProfiles();

            return profiles
                .OrderBy(item => item.ProfileName)
                .Select(item =>
                            new SearchProfile
                            {
                                ProfileID = item.ProfileId,
                                IsDefault = item.IsDefault,
                                title = item.ProfileName,
                                MBFTaskTypes = item.Types.ToList()
                            });
        }

        //Метод для получения простого списка типов задач
        [ActionName("DefaultAction")]
        [Route("api/search/TasksByProfileSimple")]
        public IEnumerable<TaskTypeInfo> GetTasksByProfileSimple(int mainObjectID, int? profileID)
        {
            var mainObject = SDKHelper.GetSAObject(mainObjectID);
            var metaType = WebSaUtilities.Database.MetaModel.MetaTypes.GetByID(mainObject.MetaType.ID);
            return SDKHelper.Search_GetRobotsByTypeSimple(metaType, profileID);
        }

        // получение данных по поисковым задачам для дерева
        [ActionName("DefaultAction")]
        [Route("api/search/TacksByProfile")]
        public IEnumerable<TaskTypeByCategoriesInfo> GetTasksByProfile(int mainObjectID, int? profileID)
        {
            var mainObject = SDKHelper.GetSAObject(mainObjectID);
            var metaType = WebSaUtilities.Database.MetaModel.MetaTypes.GetByID(mainObject.MetaType.ID);
            return SDKHelper.Search_GetRobotsByType(metaType, profileID);
        }


        [HttpGet]
        [ActionName("DefaultAction")]
        public IEnumerable<TaskTypeByCategoriesInfo> Get(int mainObjectID)
        {
            /*
            var mainObject = SDKHelper.GetSAObject(mainObjectID);
            var metaType = WebUtilities.Database.MetaModel.GetEntityById(mainObject.MetaType.ID);

            var allRobots = SDKHelper.Search_GetRobotsByType(metaType);

            var taskList = SDKHelper.GetLinkedTasks(mainObjectID);

            var result = (from treeItem in allRobots
                          join task in taskList on treeItem.id equals task.Type.UID into tmpTasks
                          from tmpTask in tmpTasks.DefaultIfEmpty()
                          orderby treeItem.title
                          select new TreeElementExternalSearch
                                     {
                              id = treeItem.id,
                              isdoc = treeItem.isdoc,
                              parentid = treeItem.parentid,
                              title = treeItem.title,
                              status = (tmpTask != null ? tmpTask.StatusInfo : "")
                          }).ToList();


            return result;
             */
            return null;
        }

        [HttpGet]
        public IEnumerable<TaskTypeInfoSimple> GetTasks(int id)
        {
            var mainObject = SDKHelper.GetSAObject(id);
            var metaType = WebSaUtilities.Database.MetaModel.MetaTypes.GetByID(mainObject.MetaType.ID);
            return HelperInquiry.Search_GetRobotsByType(metaType);
        }


        // GET api/search/TaskOptions
        [ActionName("DefaultAction")]
        public string GetTaskOptions(Guid tasktypeid, int id)
        {
            var taskData = SDKHelper.GetLinkedTasks(id).FirstOrDefault(item => item.Item2.TypeUID == tasktypeid);
            if (taskData == null)
                taskData = HelperISS.CreateNewTask(tasktypeid, id, null, null);

#if (RELEASE_IS || DEBUG)
            if (taskData != null)
                return string.Format("http://localhost:61011/tt-{0}/{1}", taskData.Item2.TypeUID.ToString(), taskData.Item2.UID.ToString());
            return "http://localhost:61011/Unknown";
#endif
#if (RELEASE)
            if (taskData != null)
                return string.Format("https://isscfg.anbr.ru/tt-{0}/{1}", taskData.Item2.TypeUID.ToString(), taskData.Item2.UID.ToString());
            return "https://isscfg.anbr.ru/Unknown";
#endif

        }


        #region NonAction

        [NonAction]
        void AddSearchTaskToCart(int mainObjectID, Guid taskTypeUID, Guid taskUID)
        {
            Dictionary<Guid, Guid> cart;

            string key = String.Format("ExternalSearchSources${0}", mainObjectID);
            if (HttpContext.Current.Session[key] == null)
            {
                cart = new Dictionary<Guid, Guid>();
                HttpContext.Current.Session[key] = cart;
            }
            else
                cart = (Dictionary<Guid, Guid>)HttpContext.Current.Session[key];

            cart[taskTypeUID] = taskUID;
        }

        #endregion

    }
}
