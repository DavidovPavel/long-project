using System;
using System.Collections.Concurrent;
using System.Configuration;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.Claims;
using System.Security.Principal;
using System.ServiceModel;
using System.ServiceModel.Channels;
using System.ServiceModel.Description;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Configuration;
using System.Web.Mvc;
using System.Web.Routing;
using System.Xml;
using System.Xml.Linq;
using System.Xml.XPath;
using ABS.Connectivity;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using ANBR.CartService.Contracts;
using ANBR.DRGenericServiceContract;
using ANBR.Monitoring.Implementation;
using ANBR.Reporting.Common;
using ANBR.Reporting.Contracts;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.GlobalBase;
using SaAdminBridgeContract;
using SaAdminBridgeContract.DTO;
using www.Common;
using www.Models.Common;
using EndPointProtocolType = ANBR.SemanticArchive.SDK.GlobalBase.EndPointProtocolType;
using SecCommon = ANBR.Security.Common;

namespace www.SaGateway
{
    public static class WebSaUtilities
    {
        private static readonly SaConnectorWeb _connector;

        static WebSaUtilities()
        {
            _connector = new SaConnectorWeb();
        }

        // ReSharper disable once ConvertToAutoProperty
        public static SaConnectorWeb ConnectorInstance => _connector;

        private const string descriptorClaimName = "http://idsrv.anbr.ru/claims/descriptor";

        /// <summary>
        /// Важный момент, который касается инорпритации контекста при взамодействии с внешними сервисами, если он не был установлен.
        /// В этом случае явно переданный контекст не позволит использовать учетку службы и не позволит корректно идентифицировать клиента.
        /// </summary>
        /// <returns></returns>
        public static ContextData GetCurrentContextData(string key = null)
        {
#if (RELEASE_IS || DEBUG)

            return new ContextData()
            {
                ID = GetCurrentUserID(),
                Language = Root.GetCurrentLang(key)
                //DBID = GetCurrentDBID(key) /*БД нельзя указывать в Intranet решении!!!! поскольку включается ветвь в PaymentsBL.IdentifyClient, которая проверяет корректность данных
            };
#endif

#if RELEASE
            return new ContextData()
            {
                ID = GetCurrentUserID(),
                DBID = Scope.GetCurrentDBID(key),
                Language = Root.GetCurrentLang(key),
                Param3 = "7e28bde0-1d9a-4291-a07a-a381dd3b81d1" //это постоянная величина которая позволяет на уровне MMCS использовать данные контекста
            };
#endif
        }

        /// <summary>
        /// Получение имени пользователя - для домена это доменное имя DOMAIN\UserName
        /// Для STS - это email адрес
        /// </summary>
        /// <returns></returns>
        public static string GetCurrentUserName()
        {
#warning Требует проверки. Из фонового потока HttpContext.Current == null

#if (RELEASE_IS || DEBUG)
            if (HttpContext.Current == null)
                return Thread.CurrentPrincipal.Identity.Name;

            var identity = HttpContext.Current.User.Identity;
            return identity.Name;
#endif

#if DEBUG
/*
            //var identity = HttpContext.Current.User.Identity;
            var identity = WindowsIdentity.GetCurrent();
            return identity.Name;
*/
#endif

#if RELEASE
            string userid = null;
            var user = (ClaimsPrincipal)System.Threading.Thread.CurrentPrincipal;
            if (user != null)
            {
                //важный момент user.Claims.Single не работает и приводить к 
                //странному исключению System.Data.SqlClient.SqlException (через большой таймаут)!!!
                var claimUser = user.FindFirst("http://idsrv.anbr.ru/claims/userkey");
                if (claimUser != null)
                {
                    userid = user.Identity.Name;
                }
            }
            return userid;
#endif
        }

        /// <summary>
        /// Получение идентификатора - для домена это доменное имя DOMAIN\UserName
        /// Для STS - GUID
        /// </summary>
        /// <returns></returns>
        public static string GetCurrentUserID()
        {

#warning Требует проверки. Из фонового потока HttpContext.Current == null

#if (RELEASE_IS || DEBUG)
            if (HttpContext.Current == null) return null;
            var identity = HttpContext.Current.User.Identity;
            return identity.Name;
#endif

#if DEBUG
/*
            if (HttpContext.Current == null) return null;

            //var identity = HttpContext.Current.User.Identity;
            var identity = WindowsIdentity.GetCurrent();
            return identity.Name;
*/
#endif

#if RELEASE
            string userid = null;
            var user = (ClaimsPrincipal)System.Threading.Thread.CurrentPrincipal;
            if (user != null)
            {
                //важный момент user.Claims.Single не работает и приводить к 
                //странному исключению System.Data.SqlClient.SqlException (через большой таймаут)!!!
                var claimUser = user.FindFirst("http://idsrv.anbr.ru/claims/userkey");
                if (claimUser != null)
                {
                    userid = claimUser.Value;
                }
            }
            return userid;
#endif
        }

        public static XDocument DescriptorForCurrentUser()
        {
            XDocument doc = new XDocument();
            ClaimsPrincipal user = (ClaimsPrincipal)System.Threading.Thread.CurrentPrincipal;
            if (user != null)
            {
                Claim claim = user.FindFirst(item => item.Type == descriptorClaimName);
                if (claim != null)
                {
                    string descriptor = AuthorizationManager45.DecodeFrom64(claim.Value);
                    if (!String.IsNullOrWhiteSpace(descriptor)) //дескриптор может быть пустым в случае, если пользователя завели, но прав еще не раздали
                        doc = XDocument.Parse(descriptor);
                }
            }

#if (DEBUG)
/*
            doc = XDocument.Parse(@"<descriptor><client id=""1035""><project id=""3229""><db id=""3094""><role name=""SA_GUEST""/></db><db id=""3095""><role name=""SA_GUEST""/></db><db id=""5"" shared=""true""/><db id=""999"" shared=""true""/></project></client><client id=""1039""><project id=""232""><db id=""90""><role name=""SA_GUEST""/></db><db id=""5"" shared=""true""/><db id=""999"" shared=""true""/></project></client></descriptor>");
*/
#endif

            return doc;
        }

        public static int[] GetClients()
        {
            XDocument doc = DescriptorForCurrentUser();
            return (from element in doc.Root.Elements("client")
                    let xAttribute = element.Attribute("id")
                    where xAttribute != null
                    select Convert.ToInt32(xAttribute.Value))
                          .ToArray();
        }

        public static bool HasClient(int id)
        {
            XDocument doc = DescriptorForCurrentUser();
            return doc.Root.Descendants("client").Any(item => item.Attribute("id").Value == id.ToString());
        }

        public static int[] GetProjectsByClient(int id)
        {
            XDocument doc = DescriptorForCurrentUser();
            return (from element in doc.XPathSelectElements(String.Format("/descriptor/client[@id={0}]/project", id))
                    select Convert.ToInt32(element.Attribute("id").Value)
                  ).ToArray();
        }

        public static bool HasProject(int id)
        {
            XDocument doc = DescriptorForCurrentUser();
            return doc.Root != null && doc.Root.Descendants("project").Any(item =>
                                                                               {
                                                                                   var xAttribute = item.Attribute("id");
                                                                                   return xAttribute != null && xAttribute.Value == id.ToString(CultureInfo.InvariantCulture);
                                                                               });
        }

        public static bool HasDatabase(int id)
        {
            XDocument doc = DescriptorForCurrentUser();
            return doc.Root != null && doc.Root.Descendants("db").Any(item =>
                                                                          {
                                                                              var xAttribute = item.Attribute("id");
                                                                              return xAttribute != null && xAttribute.Value == id.ToString(CultureInfo.InvariantCulture);
                                                                          });
        }

        public static bool IsDbShared(int id)
        {
            XDocument doc = DescriptorForCurrentUser();
            return doc.Root != null && doc.Root.Descendants("db").Any(item =>
                                                                          {
                                                                              var xAttributeId = item.Attribute("id");
                                                                              var xAttributeShare = item.Attribute("shared");
                                                                              bool isID = xAttributeId != null && xAttributeId.Value == id.ToString(CultureInfo.InvariantCulture);

                                                                              return isID && xAttributeShare != null && xAttributeShare.Value == "true";
                                                                          });
        }

        public static int GetDbBase(int id)
        {
#if (RELEASE_IS || DEBUG)
            return 0;
#endif
#if (RELEASE)
            int dbID = 0;
            try
            {
                XDocument doc = DescriptorForCurrentUser();
                if (doc.Root != null)
                    dbID = doc.Root.Descendants("db").Where(item =>
                    {
                        var xAttributeBaseId = item.Attribute("baseid");
                        return (xAttributeBaseId != null && xAttributeBaseId.Value == id.ToString(CultureInfo.InvariantCulture));
                    }).Select(item => Int32.Parse(item.Attribute("id").Value)).FirstOrDefault();
            }
            catch
            {
            }

            return dbID;
#endif
        }

        public static int GetClientByDBID(int id)
        {
            int clientID = 0;
            try
            {
                XDocument doc = DescriptorForCurrentUser();
                clientID = doc.Root.Descendants("db").Where(item =>
                {
                    var xAttribute = item.Attribute("id");
                    return (xAttribute != null && xAttribute.Value == id.ToString(CultureInfo.InvariantCulture));
                }).Select(item => Int32.Parse(item.Parent.Parent.Attribute("id").Value)).FirstOrDefault();

            }
            catch
            {

            }

            return clientID;
        }


        public static int[] GetDatabasesByProject(int id)
        {
            XDocument doc = DescriptorForCurrentUser();
            return (from element in doc.XPathSelectElements(String.Format("//project[@id={0}]/db", id))
                    select Convert.ToInt32(element.Attribute("id").Value)
                  ).ToArray();
        }

        public static ModelConnectionData ConnectionDataGetEx(int dbid, int clientid)
        {
            if (dbid == default(int) || clientid == default(int)) return null;

            XDocument doc = DescriptorForCurrentUser();
            int projectID = (from element in doc.XPathSelectElements(String.Format("//project/db[@id={0}][(role)]/..", dbid))
                             select Convert.ToInt32(element.Attribute("id").Value)
                    ).FirstOrDefault();

            ClientDTO[] clientData = AdminBridgeObserver.GetClients(new[] { clientid });
            if (clientData.Length == 0) return null;
            string clientName = clientData.FirstOrDefault(item => item.ID == clientid)?.Name;

            ProjectDTO[] projectsData = AdminBridgeObserver.GetProjectsByClientID(clientid);
            if (projectsData.Length == 0) return null;
            string projectName = projectsData.FirstOrDefault(item => item.ID == projectID)?.Name;

            DatabaseDTO[] dbData = AdminBridgeObserver.GetDatabasesByProjectID(projectID);
            if (dbData.Length == 0) return null;
            string dbName = dbData.FirstOrDefault(item => item.ID == dbid)?.Name;

            var connectionData = new ModelConnectionData
            {
                WorkgroupData = new Tuple<int, string>(clientid, clientName),
                ProjectData = new Tuple<int, string>(projectID, projectName),
                DatabaseData = new Tuple<int, string>(dbid, dbName)
            };
            WebSaUtilities.ConnectionDataSet(connectionData);

            return connectionData;
        }


        #region SessionProperties


        public static bool IsDemoUser()
        {
#if (RELEASE)
            return Thinktecture.IdentityModel45.Authorization.ClaimPermission.CheckAccess(SecCommon.Constants.Operation.InRoles, "SA_DEMO");
#endif

#if (RELEASE_IS || DEBUG)
            return true;
#endif
        }


        public static ANBR.Monitoring.IGateway MBF
        {
            get
            {
                ANBR.Monitoring.Environment.SkipModulesSyncOnConnect = true;
                return ANBR.Monitoring.Environment.Instance.Gateway;
            }
        }

        /// <summary>
        /// Текущая база данных
        /// </summary>
        public static IDataBase Database
        {
            get
            {
                IDataBase saDB = _connector.Database;
                var rid = Root.GetDataFromKey(Root.KeyElement.rid);
                if (!String.IsNullOrWhiteSpace(rid))
                {
                    QueryDTO qDto = WallBL.WidgetQueryData(Convert.ToInt32(rid));
                    saDB = WebSaUtilities.ConnectorInstance.GetDataBase(qDto.DatabaseID, 0, qDto.DatabaseName);
                }

                return saDB;
            }
        }

        /// <summary>
        /// Текущее подключение к службе SQL Repoting
        /// </summary>
        public static IReportingService Reporting => _connector.Reporting;

        public static string BuildBaseUrl()
        {
            var url = RouteConfig.MvcUriBuilder.CreateUriFromRouteValues(
            new RouteValueDictionary
            {
                { "dbid", Scope.GetCurrentDBID()},
                { "lang",  Root.GetCurrentLang()}
            });

            return url;

        }


        #endregion

        internal static string IsGlobalShared(int dbid)
        {
#if (RELEASE)
            var channel = WCFHelper.ServiceRef<IDRGuest>("http://drgeneric.anbr.ru/service.svc");
            using (var proxy = new SecCommon.ServiceWrapper<IDRGuest>(channel))
                return proxy.Channel.IsShare(dbid);
#endif
#if (DEBUG)
/*
            return "DB";
            //return (dbid == 138) ? "DB" : null;
*/
#endif
#if (RELEASE_IS || DEBUG)
            return GetSharedDatabases().IndexOf("," + dbid + ",", System.StringComparison.Ordinal) > 0 ? "DB" : null;
#endif
        }

        private static string _databasesShared;

        public static string GetSharedDatabases()
        {
            if (_databasesShared == null)
                _databasesShared = ConfigurationManager.AppSettings["SharedDatabases"] ?? "";

            return _databasesShared;

        }

        public static void ConnectionDataSet(ModelConnectionData data)
        {
            string connectionKey = WebSaUtilities.GetCurrentUserID() + "#" + data.DatabaseData.Item1;
            Helpers.HelperCache.CacheAdd(connectionKey, () => data, null, TimeSpan.FromHours(1));
        }

        public static ModelConnectionData ConnectionDataGet(int dbID, Func<ModelConnectionData> getData)
        {
            string connectionKey = WebSaUtilities.GetCurrentUserID() + "#" + dbID;
            return Helpers.HelperCache.CacheGetOrAdd(connectionKey, getData, null, TimeSpan.FromHours(1));
        }

        public static ProjectDTO[] GetProjects(int[] projectIDs)
        {
            var sb = SecCommon.SecurityEnvironment.ServiceRef<ISAAdminBridge>(www.SaGateway.SDKHelper.SAAdminBridgeKey);
            using (var wrapper = new SecCommon.ServiceWrapper<ISAAdminBridge>(sb))
                return wrapper.Channel.GetProjects(projectIDs);
        }

        public static int GetDefaultCartID(IDataBase saDB)
        {
            ICartService cs = saDB.CartService;

            var carts = cs.GetCarts();
            int currentCartId;
            if (carts == null || carts.Count == 0)
            {
                var currentCart = new Cart() { Name = Root.GetResource("CartDefaultName"), Description = Root.GetResource("CartDefaultName") };
                currentCartId = cs.CreateCart(currentCart);
            }
            else
                currentCartId = carts.First().Id;

            return currentCartId;
        }
    }
}