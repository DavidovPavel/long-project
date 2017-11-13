using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net.Http;
using System.Web.Http;
using System.Web.Mvc;
using www.Models;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Configuration;
using System.Web.Http.Routing;
using System.Web.Routing;
using Anbr.Web.SA.CoreLogic;
using ANBR.SemanticArchive.SDK.GlobalBase;
using Microsoft.Web.Helpers;
using www.Models.Common;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api
{

    public class AuthoriseController : ApiController
    {

#if (RELEASE)
        /// <summary>
        /// Выбор рабочей группы, проекта, базы данных и подключение
        /// </summary>
        [ValidateAntiForgeryToken]
        [System.Web.Http.ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get()
        {
            /*
             * Логика довольно запутанная. Присутствует 2 источника данных "что кому доступно":
             *  источник 1 - это semarch, источник 2 - это паспорт пользователя
             * 
             */

            var q = Request.RequestUri.ParseQueryString();
            int itemid;
            int.TryParse(q["itemid"], out itemid);

            var output = new List<ListElement>();
            switch (q["cmd"])
            {
                //Список рабочих групп
                case "works":
                    {
                        var clinetIds = WebSaUtilities.GetClients();
                        var clients = AdminBridgeObserver.GetClients(clinetIds); //SAdminProxy.GetClients(clinetIds);
                        output.AddRange(clients.Select(item => new ListElement { id = item.ID, title = item.Name }));
                        return output;
                    }
                //Список доступных для подключения проектов
                case "projects":
                    {
                        if (itemid != 0 && WebSaUtilities.HasClient(itemid)) //выбраная рабочая группа
                        {
                            int[] prjArr = WebSaUtilities.GetProjectsByClient(itemid);
                            //var projects = WebUtilities.GetProjects(prjArr); //SAdminProxy
                            var projects = AdminBridgeObserver.GetProjectsByClientID(itemid); //SAdminProxy - здесь проблема в том, что не используется паспорт пользователя

                            //фильтровать нельзя, поскольку шара дается на БД, а не на проект, если отфильтруем
                            //отбросим зашаренный проект
                            projects = projects.Join(prjArr, ok => ok.ID, ik => ik, (o, i) => o).ToArray(); //внутренняя коллекция выступает фильтром

                            output.AddRange(projects.Select(item => new ListElement { id = item.ID, title = item.Name }));
                            return output;
                        }
                        break;
                    }
                //Список доступных для подключения баз данных
                case "datas":
                    {
                        if (itemid != 0 && WebSaUtilities.HasProject(itemid)) // выбранный доступный проект
                        {
                            int[] dbArr = WebSaUtilities.GetDatabasesByProject(itemid); //SAdminProxy
                            //var dbs = WebUtilities.GetDatabases(dbArr);
                            var dbs = AdminBridgeObserver.GetDatabasesByProjectID(itemid); //SAdminProxy - здесь проблема в том, что не используется паспорт пользователя
                            dbs = dbs.Join(dbArr, ok => ok.ID, ik => ik, (o, i) => o).ToArray(); //внутренняя коллекция выступает фильтром

                            output.AddRange(dbs.Select(item => new ListElement { id = item.ID, title = item.Name }));
                            return output;
                        }
                        break;
                    }
                case "connect":
                    {
                        if (itemid != 0 && WebSaUtilities.HasDatabase(itemid)) // выбранная база
                        {
                            var db = AdminBridgeObserver.GetDatabases(new[] { itemid }).FirstOrDefault();
                            if (db != null)
                            {
                                var saDb = WebSaUtilities.ConnectorInstance.GetDataBase(itemid, 0, db.Name);
                                if (saDb == null)
                                    throw new Exception("Не удалось установить соедиенение с БД.");

                                WebSaUtilities.ConnectionDataSet(new ModelConnectionData
                                {
                                    WorkgroupData = new Tuple<int, string>(Convert.ToInt32(q["wgid"]), q["wgtitle"]),
                                    ProjectData = new Tuple<int, string>(Convert.ToInt32(q["prgid"]), q["prgtitle"]),
                                    DatabaseData = new Tuple<int, string>(Convert.ToInt32(q["dbid"]), q["dbtitle"])
                                });


                                string area = "";
                                var uri = new Uri(Scope.GetCurrentUrl());
                                var rawQ = HttpUtility.ParseQueryString(uri.Query);
                                var r = rawQ["returnurl"];
                                if (!String.IsNullOrEmpty(r))
                                {

                                    if (r.ToLower().StartsWith("check") || r.ToLower().StartsWith("wiki") || r.ToLower().StartsWith("inquiry") || r.ToLower().StartsWith("services"))
                                    {
                                        //при подключении с главной страницы https://saweb5staging.anbr.ru/lang-ru-RU/account/loginex?returnUrl=check
                                        var segments = r.Split(new[] { "/" }, StringSplitOptions.RemoveEmptyEntries);
                                        area = segments[0];
                                    }
                                    else
                                    {
                                        //при смене базы получаем https://saweb5staging.anbr.ru/lang-ru-RU/account/loginex?returnUrl=/lang-ru-RU/db6218/check

                                        // смена базы данных  15.02.2016
                                        Regex rgx = new Regex("db\\d+");
                                        if (rgx.IsMatch(r))
                                        {
                                            r = rgx.Replace(r, string.Format("db{0}", itemid));
                                            r = ANBR.Helpful.Misc.Uri.Helper.ExtractPathFromUrl(r);
                                            output.Add(new ListElement { id = itemid, title = r });
                                            return output;
                                        }
                                    }
                                }

                                var url = RouteConfig.MvcUriBuilder.CreateUriFromRouteValues(
                                    new RouteValueDictionary
                                    {
                                        { "dbid", itemid },
                                        { "lang",  Root.GetCurrentLang() },
                                        { "area", area }
                                    }
                                );

                                output.Add(new ListElement { id = itemid, title = url });
                                return output;
                            }
                        }
                        break;
                    }
            }

            return new List<ListElement>();
        }
#endif


#if (RELEASE_IS || DEBUG)
        /// <summary>
        /// Выбор рабочей группы, проекта, базы данных и подключение
        /// </summary>
        [ValidateAntiForgeryToken]
        [System.Web.Http.ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get()
        {
            var q = Request.RequestUri.ParseQueryString();
            var itemid = 0;
            int.TryParse(q["itemid"], out itemid);

            var output = new List<ListElement>();
            switch (q["cmd"])
            {
                //Список рабочих групп
                case "works":
                    {
                        output.Add(new ListElement { id = 1, title = WebConfigurationManager.AppSettings["ServerName"] });
                        return output;
                    }
                //Список доступных для подключения баз данных
                case "datas":
                    {
                        if (itemid != 0) // выбранный доступный проект
                        {
                            string userDescriptor = WebSaUtilities.GetCurrentUserID();
                            IGlobalbase gb = WebSaUtilities.ConnectorInstance.GetGlobalDatabase(userDescriptor);
                            output.AddRange(from IDatabaseInfo item in gb.Databases
                                            select new ListElement { id = item.Id, title = item.Name });

                            return output;
                        }
                        break;
                    }
                case "connect":
                    {
                        if (itemid != 0) // выбранная база
                        {
                            var saDb = WebSaUtilities.ConnectorInstance.GetDataBase(itemid, 0);
                            if (saDb == null)
                                throw new Exception("Не удалось установить соедиенение с БД.");

                            var url = RouteConfig.MvcUriBuilder.CreateUriFromRouteValues(
                                new RouteValueDictionary
                                        {
                                            {
                                                "dbid", itemid
                                            },
                                            {
                                                "lang", Root.GetCurrentLang()
                                            }
                                        });

                            output.Add(new ListElement { id = itemid, title = url });
                            return output;
                        }
                    }
                    break;
            }

            return new List<ListElement>();
        }
#endif
    }
}
