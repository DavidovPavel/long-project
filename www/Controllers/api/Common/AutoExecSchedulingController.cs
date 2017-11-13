using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using Newtonsoft.Json.Linq;
using www.Models;
using www.Models.Common;
using www.SaGateway;

namespace www.Controllers.api.Common
{
    public class AutoExecSchedulingController : ApiController
    {
        /// <summary>
        /// Получить список задач с расписанием
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/autoexecscheduling/items")]
        public AutoExecSchedulingTask[] GetSchedulingTasks()
        {
            int dbID = Scope.GetCurrentDBIDi();
            return CommonBL.SchedulingTaskItems(dbID).ToLocalType();
        }

        /// <summary>
        /// Получить заданную задачу
        /// </summary>
        /// <param name="liuid">UID задачи</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/autoexecscheduling/item/{liuid:guid}")]
        public AutoExecSchedulingTask GetSchedulingTask(Guid liuid)
        {
            return CommonBL.SchedulingTaskByUID(liuid).ToLocalType();
        }

        /// <summary>
        /// Создать данные по задаче
        /// </summary>
        /// <param name="schedulingTakItem"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/autoexecscheduling/item")]
        public AutoExecSchedulingTask SetSchedulingTasksItem(AutoExecSchedulingTask schedulingTakItem)
        {
            if (schedulingTakItem.SchedulingTaskType == AutoExecSchedulingTask.TaskKind.Unknown) throw new ArgumentException("Invalid input data");
            if (schedulingTakItem.Periodicity == AutoExecSchedulingTask.PeriodicityKind.Unknown) throw new ArgumentException("Invalid input data");
            if (schedulingTakItem.UID == null) throw new ArgumentException("Invalid input data");
            if ((DateTimeOffset.UtcNow - schedulingTakItem.TimeStartExecution).Duration().Days > 2) throw new ArgumentException("Invalid input data");

            schedulingTakItem.UID = (schedulingTakItem.UID ?? Guid.NewGuid());
            string userName = WebSaUtilities.GetCurrentUserName();
            string userID = WebSaUtilities.GetCurrentUserID();
            int dbID = Scope.GetCurrentDBIDi();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
            string dbKey = dbID + "|$|" + dbName;

            JObject data = JObject.Parse(schedulingTakItem.Data);
            CommonBL.SchedulingTaskSetItem(schedulingTakItem.ToDTOType(), data, dbKey, dbID, userName, userID, System.Threading.Thread.CurrentThread.CurrentUICulture);

            return schedulingTakItem;
        }

        /// <summary>
        /// Изменить данные по задаче
        /// </summary>
        /// <param name="schedulingTakItem"></param>
        /// <param name="liuid"></param>
        /// <returns></returns>
        [HttpPut]
        [Route("api/autoexecscheduling/items/{liuid:guid}")]
        public AutoExecSchedulingTask SetSchedulingTasksItem(AutoExecSchedulingTask schedulingTakItem, Guid liuid)
        {
            if (schedulingTakItem.SchedulingTaskType == AutoExecSchedulingTask.TaskKind.Unknown) throw new ArgumentException("Invalid input data");
            if (schedulingTakItem.Periodicity == AutoExecSchedulingTask.PeriodicityKind.Unknown) throw new ArgumentException("Invalid input data");
            if (schedulingTakItem.UID == null) throw new ArgumentException("Invalid input data");
            if ((DateTimeOffset.UtcNow - schedulingTakItem.TimeStartExecution).Duration().Days > 2) throw new ArgumentException("Invalid input data");

            schedulingTakItem.UID = (schedulingTakItem.UID ?? Guid.NewGuid());

            string userName = WebSaUtilities.GetCurrentUserName();
            int dbID = Scope.GetCurrentDBIDi();
            string userID = WebSaUtilities.GetCurrentUserID();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
            string dbKey = dbID + "|$|" + dbName;

            JObject schedulingData = JObject.FromObject(schedulingTakItem);

            JObject data = null;
            if (!String.IsNullOrWhiteSpace(schedulingTakItem.Data) && schedulingTakItem.Data != "{}")
                data = JObject.Parse(schedulingTakItem.Data);
            CommonBL.SchedulingTaskSetItem(schedulingTakItem.ToDTOType(), data, dbKey, dbID, userName, userID, System.Threading.Thread.CurrentThread.CurrentUICulture);

            return schedulingTakItem;
        }

        /// <summary>
        /// Удалить заданную задачу
        /// </summary>
        /// <param name="uid"></param>
        [HttpDelete]
        [Route("api/autoexecscheduling/items/{uid:guid}")]
        public void DeleteSchedulingTasksItem(Guid uid)
        {
            CommonBL.SchedulingTaskDelete(uid);
        }

        /// <summary>
        /// Деактивировать(выключить) заданную задачу
        /// </summary>
        /// <param name="uid"></param>
        [HttpPut]
        [Route("api/autoexecscheduling/items/{uid:guid}/deactivate")]
        public void SchedulingTasksDeactivate(Guid uid)
        {
            CommonBL.SchedulingTaskDeactivate(uid);
        }

        /// <summary>
        /// Включить заданную задачу
        /// </summary>
        /// <param name="uid"></param>
        [HttpPut]
        [Route("api/autoexecscheduling/items/{uid:guid}/activate")]
        public void SchedulingTasksAactivate(Guid uid)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            int dbID = Scope.GetCurrentDBIDi();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
            string dbKey = dbID + "|$|" + dbName;
            CommonBL.SchedulingTaskActivate(uid, dbKey, dbID, userID, System.Threading.Thread.CurrentThread.CurrentUICulture);
        }

        /// <summary>
        /// Выполнить заданную задачу
        /// </summary>
        /// <param name="uid"></param>
        [HttpGet]
        [Route("api/autoexecscheduling/items/{uid:guid}/execute")]
        public void SchedulingTasksExecute(Guid uid)
        {
            AutoExecSchedulingTask task = GetSchedulingTask(uid);

            string userID = WebSaUtilities.GetCurrentUserID();
            int dbID = Scope.GetCurrentDBIDi();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
            string dbKey = dbID + "|$|" + dbName;
            CommonBL.SchedulingTaskForceExecute(uid, dbKey, dbID, userID, System.Threading.Thread.CurrentThread.CurrentUICulture);
        }
    }
}
