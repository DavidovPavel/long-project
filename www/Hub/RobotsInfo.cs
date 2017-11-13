using System;
using System.Collections.Generic;
using System.DirectoryServices.AccountManagement;
using System.Globalization;
using System.Security.Principal;
using System.Threading;
using ANBR.Monitoring.Implementation;
using ANBR.ObjectService.OperationContracts;
using Anbr.Web.SA.CoreLogic;
using Microsoft.AspNet.SignalR;
using www.Models;
using System.Linq;
using System.Collections.Concurrent;
using System.Text;
using www.SaGateway;
using System.Text.RegularExpressions;
using ANBR.SemanticArchive.SDK;
using ExCSS;
using HtmlAgilityPack;
using www.Helpers;
using WebGrease.Css.Extensions;
using WebMarkupMin.Core;
using HelperSerializer = ANBR.Helpful.Misc.Serializer.Helper;

namespace www.Hub
{
    public static class RobotsInfo
    {
        private static readonly ConcurrentDictionary<string, Notificator> _listeners = new ConcurrentDictionary<string, Notificator>();
        private static readonly ConcurrentDictionary<string, Dictionary<string, AlertMessage>> _cacheAlerts = new ConcurrentDictionary<string, Dictionary<string, AlertMessage>>();
        private static readonly ConcurrentDictionary<string, HashSet<string>> _db2connection = new ConcurrentDictionary<string, HashSet<string>>();
        private static readonly ConcurrentDictionary<string, string> _connection2db = new ConcurrentDictionary<string, string>();

        static readonly ConcurrentDictionary<string, object> _state = new ConcurrentDictionary<string, object>();
        private static double NOTIFICATOR_INTERVAL_NOTIFICATION_MS = 2000;

        public static void DoTick(Notificator sender)
        {
            ri_Elapsed(sender, null);
        }

        static void ri_Elapsed(object sender, System.Timers.ElapsedEventArgs e)
        {
            var notificator = (Notificator)sender;
            notificator.Enabled = false;
            string logObjId = notificator.MainObjectID.HasValue ? notificator.MainObjectID.ToString() : "нет";
            CultureInfo ci = new CultureInfo("en-US");
            string ciToken = notificator.Context?.Language;
            if (!String.IsNullOrWhiteSpace(ciToken)) ci = new CultureInfo(ciToken);


            LogBL.Write("notification:tick", $"{notificator.ConnectionID}(db{notificator.DataBase.Id}:obj{logObjId})", LogBL.KindLog.SignalR);

            try
            {
#if (RELEASE_IS || DEBUG)

                WindowsImpersonationContext context = null;
                try
                {
                    // ReSharper disable once PossibleNullReferenceException
                    if (!WindowsIdentity.GetCurrent().IsSystem)
                        context = WindowsIdentity.Impersonate(IntPtr.Zero);
                }
                catch (Exception ex)
                {
                    LogBL.Write("RobotsInfo", ex.ToString());
                }

                try
                {
                    using (
                        var pc = new PrincipalContext(ContextType.Domain,
                            Environment.UserDomainName))
                    using (var p = UserPrincipal.FindByIdentity(pc, notificator.Context.ID))
                    {
                        // ReSharper disable once PossibleNullReferenceException
                        var identity = new WindowsIdentity(p.UserPrincipalName);
                        Thread.CurrentPrincipal = new WindowsPrincipal(identity);
                    }
                }
                catch (PrincipalServerDownException ex)
                {
                    var identity = new GenericIdentity(notificator.Context.ID);
                    var principal = new GenericPrincipal(identity, null);
                    Thread.CurrentPrincipal = principal;
                }
                catch (Exception ex)
                {
                    LogBL.Write("RobotsInfo", ex.ToString());
                }
                finally
                {
                    try
                    {
                        context?.Undo();
                    }
                    catch (Exception ex)
                    {
                        LogBL.Write("RobotsInfo", ex.ToString());
                    }
                }

#endif

                string stateKey = String.Format("{0}§{1}", SaJobType.CheckInterestObject, "all");
                object prevState;
                _state.TryGetValue(stateKey, out prevState);

                //получает список активных проверок идущих в заданной БД
                List<Tuple<Guid, int>> jobsData = HelperInquiry.GetActiveJobs(notificator.DataBase, SaJobType.CheckInterestObject);
                LogBL.Write($"notification:{notificator.ConnectionID};jobsData:db{notificator.DataBase.Id}", HelperSerializer.JsonSerializer(jobsData), LogBL.KindLog.SignalR);

                List<int> objs = jobsData.Select(item => item.Item2).ToList();
                if (jobsData.Count > 0)
                {
                    _state[stateKey] = jobsData.Count;
                    //осуществляет рассылку уведомлений всем пользователям, которые подключены к данной БД
                    NotifyClientsAboutJobs(notificator.ConnectionID, objs);
                }
                else
                {
                    if (prevState != null && (int)prevState > 0)
                    {
                        _state[stateKey] = jobsData.Count;
                        NotifyClientsAboutJobs(notificator.ConnectionID, objs);
                    }
                }


                if (jobsData.Count > 0 && notificator.MainObjectID != null)
                {
                    var rawTaskData = SDKHelper.GetLinkedTasks(notificator.MainObjectID.Value, notificator.Mbf, notificator.DataBase);
                    LogBL.Write($"notification:taskData:obj{logObjId}", $"Tasks Count:{rawTaskData.Count}", LogBL.KindLog.SignalR);



                    var taskStates = rawTaskData
                            .Select(item => item.ToSearchTask(notificator.MainObjectID.Value, ci)).ToList();


                    //var monitoringTasks = rawTaskData.GroupBy(g => g.Item1, item => item.Item2, (key, val) => new
                    //{
                    //    ObjID = key,
                    //    Tasks = new List<ANBR.Monitoring.Task>(val)
                    //});


                    NotifyClients(notificator.ConnectionID, taskStates);
                }

                foreach (var job in jobsData)
                {
                    StateInfo state = notificator.DataBase.ObjectService.CustomTaskGetState(job.Item1, null);
                    if (state?.param1 == null) continue;

                    var tasksData = state.param1.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

                    bool finished = true;
                    foreach (var td in tasksData)
                    {
                        var ti = td.Split(new[] { ':' }, StringSplitOptions.RemoveEmptyEntries);
                        var taskUID = new Guid(ti[1]);

                        var t = notificator.Mbf.Tasks.GetTaskById(taskUID);
                        if (t == null) break;   //не успела создаться 

                        finished = (t.Status == ANBR.Monitoring.TaskStatus.Aborted
                                    || t.Status == ANBR.Monitoring.TaskStatus.Aborting
                                    || t.Status == ANBR.Monitoring.TaskStatus.Completed
                                    || t.Status == ANBR.Monitoring.TaskStatus.Invalid);
                        if (!finished) break;
                    }

                    if (finished)
                    {
                        LogBL.Write("notification:finished", $"{notificator.ConnectionID}(db{notificator.DataBase.Id}:obj{logObjId})", LogBL.KindLog.SignalR);
                        notificator.DataBase.ObjectService.CustomTaskSetStateOnly(job.Item1, null, 1);
                    }
                }

                LogBL.Write("notification:showAlert", $"{notificator.ConnectionID}(db{notificator.DataBase.Id}:obj{logObjId})", LogBL.KindLog.SignalR);
                ShowAlerts(notificator.ConnectionID, notificator);
            }
            catch (Exception ex)
            {
                LogBL.Write("RobotsInfo", ex.ToString());
            }
            finally
            {
                notificator.Enabled = true;
            }
        }

        private static void NotifyClientsAboutJobs(string connectionId, List<int> objectsIds)
        {
            string dbID;
            if (_connection2db.TryGetValue(connectionId, out dbID))
            {
                HashSet<string> bag;
                if (_db2connection.TryGetValue(dbID, out bag))
                {
                    List<string> connections;
                    lock (bag)
                        connections = bag.ToList();

                    var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
                    clients.Clients(connections).infoActiveChecks(objectsIds);
                }
            }
        }

        private static void ShowAlerts(string connectionID, Notificator owner)
        {
            var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;

            Guid[] activeAlerts;
            Dictionary<string, AlertMessage> cache;
            var newAlerts = GetAlerts(connectionID, owner, out activeAlerts, out cache);
            clients.Client(connectionID).showAlerts(newAlerts);

            foreach (var item in newAlerts)
            {
                if (Scope.TemporaryStorage.Contains($"{connectionID}:" + item.eqID))
                    cache.Add(item.eqID, item);
            }

            clients.Client(connectionID).acitiveAlerts(activeAlerts);
        }

        /// <summary>
        /// Возвращает список новых элертов
        /// </summary>
        /// <param name="connectionID"></param>
        /// <param name="owner"></param>
        /// <param name="activeAlerts">возвращает массив активных элертов</param>
        /// <param name="cache">Справочник кэшированных алертов</param>
        /// <returns></returns>
        static AlertMessage[] GetAlerts(string connectionID, Notificator owner, out Guid[] activeAlerts, out Dictionary<string, AlertMessage> cache)
        {
            // ReSharper disable once InconsistentlySynchronizedField
            if (!_cacheAlerts.TryGetValue(connectionID, out cache))
                lock (_cacheAlerts)
                    if (!_cacheAlerts.TryGetValue(connectionID, out cache))
                    {
                        cache = new Dictionary<string, AlertMessage>();
                        _cacheAlerts[connectionID] = cache;
                    }

            var allAlerts = owner.Mbf.GetAlerts(owner.Context);

            activeAlerts = allAlerts.Select(item => item.AlertID).ToArray();
            var alerts =
                allAlerts.Where(item => item.AlertType != 3) //3 - особый тип уведомлнений для передачи сведений (к пр. egrul и т.д) 
                .Select(item => new AlertMessage { eqID = item.AlertID.ToString() + "|" + item.Date.Ticks.ToString(CultureInfo.InvariantCulture), id = item.AlertID, typeid = item.AlertType, title = item.Title, kind = AlertKind.message, cdate = item.Date.Ticks.ToString(CultureInfo.InvariantCulture), html = item.AlertData, taskUID = item.TaskUID })
                .ToList();

            if (cache.Count > 0)
            {
                var deletedAlerts = cache.Values.ToList().Except(alerts, new AlertMessageComparerByUID()).ToArray();
                foreach (var item in deletedAlerts)
                    cache.Remove(item.eqID);
            }

            var newAlerts = alerts.Except(cache.Values.ToList(), new AlertMessageComparer()).ToArray();
            newAlerts.ForEach(item => item.html = ExtractValidHtml(item.html));

            return newAlerts;
        }

        private static string ExtractValidHtml(string html)
        {
            html = html.Replace(".external", "");

            HtmlDocument doc = new HtmlDocument();
            doc.LoadHtml(html);
            HtmlNodeCollection nc = doc.DocumentNode.SelectNodes("//style");

            StringBuilder sb = null;
            if (nc != null)
            {
                sb = new StringBuilder();
                sb.AppendLine(@"<style type=""text/css"">");

                for (int mStyleIndex = 0; mStyleIndex < nc.Count(); mStyleIndex++)
                {
                    HtmlNode node = nc[mStyleIndex];
                    var parser = new Parser();
                    var stylesheet = parser.Parse(node.InnerText);
                    foreach (var rule in stylesheet.StyleRules)
                    {
                        rule.Selector = new SimpleSelector("#feedback-alerts-panel " + rule.Selector);
                        sb.AppendLine(rule.ToString());
                    }

                    node.Remove();
                }

                sb.AppendLine("</style>");
            }
            var body = doc.DocumentNode.SelectSingleNode("//body");
            html = (sb?.ToString() ?? "") + (body != null ? body.InnerHtml : doc.DocumentNode.InnerHtml);

            var htmlMinifier = new HtmlMinifier();
            MarkupMinificationResult result = htmlMinifier.Minify(html);
            string htmlPure = result.MinifiedContent;

            if (result.Errors.Count > 0)
                LogBL.Write("alert:error", html, LogBL.KindLog.Db);

            html = htmlPure;

            var re = new Regex(@"<base64Binary>(.*)</base64Binary>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            var match = re.Match(html);
            if (match.Success)
                return PrepareCaptchaHtml(match.Groups[1].Value);

            return html;
        }

        static string PrepareCaptchaHtml(string byte64string)
        {
            const string htmlTemplate = @"<div><img width=""300"" src=""data:image/png;base64,{0}"" /><br/><input type=""text"" />&nbsp;<button onclick=""captcha()"">Ok</span></div>";

            return String.Format(htmlTemplate, byte64string);
        }

        static void NotifyClients(string connectionID, IEnumerable<SearchTask> robots)
        {
            var clients = GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients;
            foreach (var taskInfo in robots)
            {
                clients.Client(connectionID).updateRobot(taskInfo);
            }
        }

        public static void Unsubscribe(string connectionID)
        {
            string dbid;
            if (_connection2db.TryRemove(connectionID, out dbid))
            {
                HashSet<string> bag = GetConnectionsBagByDBID(dbid);
                lock (bag)
                {
                    bag.Remove(connectionID);
                }
            }

            Notificator ri;
            if (_listeners.TryRemove(connectionID, out ri))
                ri.Stop();

            Dictionary<string, AlertMessage> alerts;
            _cacheAlerts.TryRemove(connectionID, out alerts);
        }

        private static HashSet<string> GetConnectionsBagByDBID(string dbID)
        {
            if (String.IsNullOrWhiteSpace(dbID))
                return null;

            HashSet<string> bag;
            if (!_db2connection.TryGetValue(dbID, out bag))
                lock (_listeners)
                    if (!_db2connection.TryGetValue(dbID, out bag))
                    {
                        bag = new HashSet<string>();
                        _db2connection[dbID] = bag;
                    }

            return bag;
        }

        internal static Notificator Subscribe(string connectionID, ContextData context, string currentDBID)
        {
            int dbid = Convert.ToInt32(currentDBID);
            IDataBase saDb = WebSaUtilities.ConnectorInstance.GetDataBase(dbid, 0);
            if (saDb == null)
            {
                LogBL.Write("listening", "failed:" + connectionID + " (db isn't defined)", LogBL.KindLog.SignalR);
                return null;
            }

            _connection2db.TryAdd(connectionID, currentDBID);
            HashSet<string> bag = GetConnectionsBagByDBID(currentDBID);
            lock (bag)
            {
                bag.Add(connectionID);
            }

#warning нужно что-то придумать с удалением таймеров по таймауту!

            Notificator ri;
            if (!_listeners.TryGetValue(connectionID, out ri))
            {
                lock (_listeners)
                {
                    if (!_listeners.TryGetValue(connectionID, out ri))
                    {
                        LogBL.Write("listening", "success:" + connectionID + "(notification agent has been created)", LogBL.KindLog.SignalR);

                        ri = new Notificator(saDb, WebSaUtilities.MBF, connectionID, context);
                        ri.Elapsed += ri_Elapsed;
                        ri.Interval = NOTIFICATOR_INTERVAL_NOTIFICATION_MS;
                        _listeners[connectionID] = ri;
                        ri.Start();
                    }
                    else
                        LogBL.Write("listening", "success:" + connectionID + "(notification agent already exists)", LogBL.KindLog.SignalR);
                }
            }
            else
                LogBL.Write("listening", "success:" + connectionID + "(notification agent already exists)", LogBL.KindLog.SignalR);

            return ri;
        }

        internal static void StopMonitoringObject(string connectionID, ContextData context, string currentDBID)
        {
            Notificator ri = Subscribe(connectionID, context, currentDBID);
            if (ri == null) return;

            ri.Stop();
            ri.SetMainObject(null);
            ri.Start();
        }

        internal static void StartMonitoringObject(string connectionID, int mainObjectID, ContextData context, string currentDBID)
        {
            if (mainObjectID == default(Int32)) return;

            Notificator ri = Subscribe(connectionID, context, currentDBID);
            if (ri == null)
            {
                LogBL.Write($"monitoring:{mainObjectID}", $"{connectionID}:notification agent not found", LogBL.KindLog.SignalR);
                return;
            }

            LogBL.Write($"monitoring:{mainObjectID}", $"{connectionID}:started", LogBL.KindLog.SignalR);

            ri.Stop();
            ri.SetMainObject(mainObjectID);
            ri.Start();
            DoTick(ri);
        }

    }

    public enum SaJobType
    {
        ExportSDF = 0,
        ImportSDF = 1,
        CheckInterestObject = 100
    }
}