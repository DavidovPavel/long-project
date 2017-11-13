using ANBR.Monitoring.Implementation;
using Microsoft.AspNet.SignalR.Hubs;
using www.Models;
using System;
using System.Threading.Tasks;
using Anbr.Web.SA.CoreLogic;
using Newtonsoft.Json.Linq;
using Microsoft.AspNet.SignalR;
using www.SaGateway;

namespace www.Hub
{
    [HubName("Ticker")]
    public class TickerHub : Microsoft.AspNet.SignalR.Hub
    {
        /// <summary>
        /// Работа с алертами
        /// </summary>
        /// <param name="obj"></param>
        /// <param name="messageID"></param>
        /// <param name="typeID"></param>
        /// <returns></returns>
        public AlertMessage SendMessage(JObject obj, Guid messageID, int typeID)
        {
            if (typeID == 1 || typeID == 2) //1 - уточнение по задаче; 2 - капча
            {
                string responseValue = (string)obj["result"];
                if (!String.IsNullOrWhiteSpace(responseValue))
                    responseValue = responseValue.TrimStart('\'', '\"').TrimEnd('\'', '\"');
                WebSaUtilities.MBF.SaveAlertAnswer(messageID, responseValue);
            }

            Clients.User(Context.User.Identity.Name).hideAlerts(messageID);

            return null;
        }

        public void StopMonitoringTasks(string key, int mainObjectID)
        {
            ContextData context = WebSaUtilities.GetCurrentContextData(key);
            var currentDBID = Scope.GetCurrentDBID(key);

            RobotsInfo.StopMonitoringObject(Context.ConnectionId, context, currentDBID);
        }

        public void ReturnValueSet(string kind, string key, string val)
        {

            if (kind == "alertDelivery")
            {
                //сообщение со стороны клиента о факте присутствия алерта в коллекции
                //данное сообщение отправляется каждый раз при вызове showAlerts(newAlerts) из RobotsInfo.ShowAlerts
                if (val == "1")
                    Scope.TemporaryStorage.Add($"{Context.ConnectionId}:" + key, val, DateTime.Now.AddMinutes(20));
            }
        }

        /// <summary>
        /// Запускае уведомления клиентов о статусе работы запущенных роботов (в процессе, ожидает ответа, с ошибкой и т.п.)
        /// </summary>
        /// <param name="key"></param>
        /// <param name="mainObjectID"></param>
        public void StartMonitoringTasks(string key, int mainObjectID)
        {
            LogBL.Write($"monitoring:{mainObjectID}", Context.ConnectionId, LogBL.KindLog.SignalR);

            ContextData context = WebSaUtilities.GetCurrentContextData(key);
            var currentDBID = Scope.GetCurrentDBID(key);

            RobotsInfo.StartMonitoringObject(Context.ConnectionId, mainObjectID, context, currentDBID);
        }

        public void StartListening(string key)
        {
            ContextData context = WebSaUtilities.GetCurrentContextData(key);

            var currentDBID = Scope.GetCurrentDBID(key);

#warning 2016-06-25 Возможно проблема. Что делаем на страницах, на которых нет DBID?
            if (currentDBID == null)
            {
                LogBL.Write("listening", $"failed:{Context.ConnectionId} (db isn\'t defined)", LogBL.KindLog.SignalR);
                return;
            }

            RobotsInfo.Subscribe(Context.ConnectionId, context, currentDBID);
        }

        public override System.Threading.Tasks.Task OnDisconnected(bool stopCalled)
        {
            RobotsInfo.Unsubscribe(Context.ConnectionId);
            return base.OnDisconnected(stopCalled);
        }

        static void LogServerEvent(string kind, string msg)
        {
            GlobalHost.ConnectionManager.GetHubContext<TickerHub>().Clients.All.Log(kind, msg);
        }

        public override Task OnConnected()
        {
            var t = base.OnConnected();
            return t.ContinueWith(tb =>
           {
               Scope.RegisterSignalRLogFunction(LogServerEvent);
           });
        }

        /// <summary>
        /// Проверка связи
        /// </summary>
        /// <param name="msg"></param>
        public void PingConnect(string msg)
        {
            Clients.Caller.ping("echo: " + msg);
        }
    }
}