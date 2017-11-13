using System;
using System.Net.Http;
using ANBR.SemanticArchive.SDK.Dictionaries;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using www.Models;
using ANBR.Tasks.Saver.AnalystHelper.Mon;
using www.SaGateway;
using System.Data;
using ANBR.Monitoring.Implementation;
using www.Models.Items;

namespace www.Controllers.api
{
    /// <summary>
    /// Работа с деревом рубрик панели мониторинга
    /// </summary>
    public class MRubricsController : ApiController
    {
        [ActionName("DefaultAction")]
        public IEnumerable<TreeElement> Get()
        {
            ContextData context = WebSaUtilities.GetCurrentContextData();
            IssMonLoader monLoader = new IssMonLoader(WebSaUtilities.GetCurrentUserID(), context);
            monLoader.Database = WebSaUtilities.Database;
            List<IssMonElement> list = monLoader.LoadDataSync();

            List<TreeElement> treeList = null;
            PreparePlainList(list, ref treeList, 0);

            return treeList;
        }

        [NonAction]
        private void PreparePlainList(List<IssMonElement> list, ref List<TreeElement> treeList, int pid)
        {
            if (treeList == null) treeList = new List<TreeElement>();
            foreach (var item in list)
            {
                if (item is IssMonGroup)
                {
                    var group = (IssMonGroup)item;
                    treeList.Add(new TreeElement
                    {
                        title = group.Name,
                        id = group.Group.GroupId.ToString(),
                        parentid = pid.ToString(),
                        children = group.ChildList.Count,
                        iconexist = false
                    });

                    if (item.ChildList.Count > 0)
                        PreparePlainList(group.ChildList, ref treeList, group.Group.GroupId);

                }
                if (item is IssMonTask)
                {
                    var task = (IssMonTask)item;
                    treeList.Add(new TreeElement()
                    {
                        title = task.Name,
                        id = task.Task.UID.ToString(),
                        parentid = pid.ToString(),
                        children = 0,
                        isdoc = true,
                        iconexist = false
                    });
                }
            }
        }


        [HttpPost]
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Query(MonitoringQuery model)
        {
            string webTaskIds = "";
            DateTime? fromDate = null;
            DateTime? toDate = null;
            string strToFind = null;

            foreach (string uidStr in model.TaskIds)
            {
                Guid uid;
                if (Guid.TryParse(uidStr, out uid))
                {
                    ContextData context = WebSaUtilities.GetCurrentContextData();
                    IssMonLoader monLoader = new IssMonLoader(WebSaUtilities.GetCurrentUserID(), context);
                    monLoader.Database = WebSaUtilities.Database;
                    int webTaskId = monLoader.GetWebTaskByUid(uid);
                    webTaskIds += "," + webTaskId;
                }
            }
            
            if (model.TaskIds.Length > 0)
                webTaskIds = webTaskIds.Substring(1);
            else
                webTaskIds += "-1";
            webTaskIds = "(" + webTaskIds + ")";

            string from = fromDate.HasValue ? fromDate.Value.ToString("YYYY-MM-DD") : "NO";
            string to = toDate.HasValue ? toDate.Value.ToString("YYYY-MM-DD") : "NO";
            string stringToFind = strToFind ?? "";
            DataTable td = SDKHelper.ExecuteMonitoringQuery(webTaskIds, from, to, stringToFind);

            return Root.GetList(td, model.PageNum);

        }
    }
}
