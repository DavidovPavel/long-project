using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Hosting;
using ANBR.Common.Contarcts;
using ANBR.SAMetaModel;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using Anbr.Web.SA.CoreLogic;
using ANBR.Monitoring;
using ANBR.Monitoring.Implementation;
using ANBR.SemanticArchive.SDK.MetaModel;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Xml.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using www.SaGateway;
using www.Areas.ExpressDossier.Models;
using www.Areas.inquiry.Models;
using www.Helpers;
using www.Models.ExpressDossier;
using Extensions = System.Xml.Linq.Extensions;
using ABS.Connectivity.Interaction;
using ANBR.Common.Contracts;
using www.Models.Ex.Feed;

namespace www.Controllers.api.ExpressDossier
{
    /*
     * Collection Api
     * 
     *      api/synonyms
     *      api/totalcheck
     *      api/searchTypes
     *      api/searchType/{id}/params
     *      api/interestObjects/top{num}
     *      api/interestObjects/input/id{objectid}
     *      api/interestObjects/id{objectid}
     *      api/mycheck
     *      api/interestObjects
     *      api/interestObjects/10021
     *      api/interestObjects/10022
     *      api/startTaskExpress/10021/{objectid?} (POST, PUT)
     *      api/startTaskExpress/10022/{objectid?} (POST, PUT)
     *      api/interestObjects/10022/addInfo/{kind:int} (POST, PUT)
     *      
     *      api/InterestObj/734332 (SIMPLE)
     *      api/IntersetObj/SetState/{id}
     *      
     */



    public class InterestObjController : ApiController
    {
        private const int PAGE_SIZE = 10;

        /// <summary>
        /// метод для получения общего количества проверок для текущего пользователя и общие 
        /// </summary>
        /// <returns>
        /// массив из двух елементов - первый "мои проверки", второй "все проверки"
        /// </returns>
        [Route("api/totalcheck")]
        [HttpGet]
        public List<int> GetTotalCheck()
        {
            IDataBase saDB = WebSaUtilities.Database;
            var projectID = Scope.GetInternalPrjIDi();
            int myCnt = SDKHelper.GetOnlyMyObjectsLinkedWithMBFTasks(saDB, projectID).Rows.Count;
            int totalCnt = SDKHelper.GetAllObjectsLinkedWithMBFTasks(saDB, projectID).Rows.Count;

            return new List<int> { myCnt, totalCnt };
        }

        /// <summary>
        /// метод для получения статистики по объекту проверки
        /// </summary>
        /// <returns>
        /// массив из 4 елементов - сведения, факты, документы, реквизиыт
        /// </returns>
        [HttpGet]
        public List<int> TotalCheck(int id)
        {
            IDataBase saDB = WebSaUtilities.Database;
            DatabaseMode mode = saDB.ObjectService.GetDatabaseInfo().DatabaseMode;

            int[] idsArr = HelperInquiry.ContextGetSATaskIds(saDB);

            int infoDbCount = HelperDocuments.GetDocumentsInfoStatsOnly(new[] { id }, false, idsArr, "InfoDb", false, mode);
            int factsDbCount = HelperFacts.GetFactsForStatsOnly(saDB, id, idsArr);
            int docsCount = HelperDocuments.GetDocumentsInfoStatsOnly(new[] { id }, false, idsArr, "InfoDb", true, mode);
            int requisitsCount = HelperRequisits.GetRequisitesStatsOnly(saDB, id, idsArr);

            return new List<int> { infoDbCount, factsDbCount, docsCount, requisitsCount };
        }

        /// <summary>
        /// Получить список "предыдущих" проверок на основе исходных данных проверки
        /// </summary>
        /// <param name="id">ID объекта проверки</param>
        /// <param name="page"></param>
        /// <returns></returns>
        [HttpGet]
        public ContentCollection SimilarObjects(int id, int page = 1)
        {
            IDataBase saDB = WebSaUtilities.Database;

            string val = saDB._PropertyFastGet(id, "InterestObjectINPUTDATA");

            if (String.IsNullOrWhiteSpace(val)) return null;

            JToken res = JObject.Parse(val);

            var objData = saDB.ObjectModel.GetObjectInfo(id);

            if (objData.MetaType.IsPerson)
            {
                PersonSearchTaskModel person = res.ToObject<PersonSearchTaskModel>();
                return GetInterestObjectsList(person, page);
            }
            if (objData.MetaType.IsOrganization)
            {
                OrganizationSearchTaskModel org = res.ToObject<OrganizationSearchTaskModel>();
                return GetInterestObjectsList(org, page);
            }

            return null;
        }


        /// <summary>
        /// Устанавливается состояние проверки (в работе, завершен и т.д)
        /// </summary>
        /// <param name="id"></param>
        /// <param name="state"></param>
        /// <param name="title">Наименование объекта</param>
        [HttpGet]
        public void SetState(int id, int state, string title)
        {
            IDataBase saDB = WebSaUtilities.Database;

            int? projectID = Scope.GetInternalPrjIDi();
            if (!projectID.HasValue) throw new InvalidOperationException("Project Id not found");
            int? projectRoleID = SDKHelper.InquiryRoleSystemGet(saDB, InquirySysRoles.state);

            string titleFormat = Root.GetResource("CheckResume_GeneratedTitleForState");
            string moduleName = Root.GetResource("CheckResume_ModuleTitleCheck");
            if (Scope.GetCurrentArea() == "inquiry")
                moduleName = Root.GetResource("CheckResume_ModuleTitleInquire");


            var obj = saDB.ObjectService.GetObjectInfo(id);
            DataTable dt = SDKHelper.InquiryGetObjectsMarkedByRoles(saDB, projectID.Value, projectRoleID.Value, id);
            if (dt != null && dt.Rows.Count != 0)
            {
                var objID = (int)dt.Rows[0][0];
                saDB._FieldFastSet(objID, new Dictionary<string, object>
                {
                    { _SAConst.Наименование, String.Format(titleFormat, moduleName, obj.DisplayName, title)},
                    { _SAConst.ShortName, title },
                    {_SAConst.Целочисленный_показатель, state }
                });
                return;
            }

            var soMain = new SavedObject(obj.TypeName);
            soMain.property[_SAConst.Object_ID] = obj.Object_ID;

            var so = new SavedObject(_SAConst.Type_Pokazatel);
            so.Project_ID = projectID;
            so.Project_RoleID = projectRoleID;
            so.property[_SAConst.Наименование] = String.Format(titleFormat, moduleName, obj.DisplayName, title);
            so.property[_SAConst.Целочисленный_показатель] = state;
            so.property[_SAConst.ShortName] = title;
            so.AddRelation(_SAConst.Role_Ассоциативная_связь, soMain);

            var saver = new DataSaverSA4(saDB);
            saver.CreateObject(so, 0, projectID, projectRoleID);
        }


        /// <summary>
        /// Установка роли проверяемого объекта в заявке
        /// </summary>
        /// <param name="id"></param>
        /// <param name="sysRoleID"></param>
        [HttpGet]
        public void SetSysRole(int id, int sysRoleID)
        {
            IDataBase saDB = WebSaUtilities.Database;
            saDB._FieldFastSet(id, new Dictionary<string, object> { { "ProjectRole_ID", sysRoleID } });
        }


        /// <summary>
        /// Возвращает данные по заданному объекту интереса
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        public ContentCollection Get(int id)
        {
            return InterestObjectsOnlyOne(id);
        }

        /// <summary>
        /// метод для получения синонимов
        /// </summary>
        /// <param name="entity"></param>
        /// <returns></returns>
        [Route("api/synonyms")]
        [HttpPost]
        public List<string> GetSynonims(JObject entity)
        {
            JsonSerializerSettings settings = new JsonSerializerSettings();
            settings.NullValueHandling = NullValueHandling.Ignore;
            settings.MissingMemberHandling = MissingMemberHandling.Ignore;

            var objectTypeID = entity["typeid"].Value<Int32>();
            IMetaType mt = WebSaUtilities.Database.MetaModel.MetaTypes.GetByID(objectTypeID);
            switch (mt.SystemName.ToLower())
            {
                case "organization":
                    {
                        var organization = JsonConvert.DeserializeObject<OrganizationSearchTaskModel>(entity.ToString(), settings);
                        return GetSynonymsForOrganization(organization);
                    }
                case "person":
                    {
                        var person = JsonConvert.DeserializeObject<PersonSearchTaskModel>(entity.ToString(), settings);
                        return GetSynonymsForPerson(person);
                    }
            }

            return null;
        }

        #region ExpressDossier данные по параметрам поиска

        /// <summary>
        /// Получить список типов проверок (используется на форме поиска проверок)
        /// </summary>
        /// <returns></returns>
        [Route("api/searchTypes")]
        public ContentCollection GetSearchTypes()
        {
            var collection = new ContentCollection();

            List<XElement> elements = GetSearchTypeInfos();
            foreach (var element in elements)
            {
                IMetaType mt = WebSaUtilities.Database.MetaModel.MetaTypes.GetByName(element.Attribute("systemname").Value);

                collection.AddNew()
                    .AddProperty("ID", "ID", mt.ID, (int)PropertyType.Integer, false, false)
                    .AddProperty("Title", "Наименование", mt.DisplayName, PropertyType.String,
                        true, false);
            }

            return collection;
        }

        [NonAction]
        private List<XElement> GetSearchTypeInfos()
        {
            string path = HttpContext.Current.Server.MapPath("~/App_Data/ExpressDosierConfiguration.xml");
            var doc = XDocument.Load(path);

            return doc.Descendants("mtype").ToList();
        }


        /// <summary>
        /// Получить список свойств по типу проверки (используется на форме поиска проверок)
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [Route("api/searchType/{id}/params")]
        public ContentCollection GetParamsBySearchType(int id)
        {
            var collection = new ContentCollection();

            List<XElement> elements = GetPropertiesInfoBySearchType(id);
            foreach (var element in elements)
            {
                IMetaProperty mp =
                    WebSaUtilities.Database.MetaModel.MetaProperties.GetByName(element.Attribute("systemname").Value);

                collection.AddNew()
                    .AddProperty("ID", "ID", mp.ID, (int)PropertyType.Integer, false, false)
                    .AddProperty("Title", "Наименование", element.Attribute("title").Value,
                        PropertyType.String, true, false);
            }

            return collection;
        }

        [NonAction]
        private List<XElement> GetPropertiesInfoBySearchType(int id)
        {
            IMetaType mt = WebSaUtilities.Database.MetaModel.MetaTypes.GetByID(id);

            string path = HttpContext.Current.Server.MapPath("~/App_Data/ExpressDosierConfiguration.xml");
            XDocument doc = XDocument.Load(path);
            return
                doc.Descendants("param")
                    .Where(el => el.Parent.Parent.Attribute("systemname").Value.ToLower() == mt.SystemName.ToLower())
                    .ToList();
        }

        /*
         * Использовалось в предыдущей версии (список профилей)
         * 
                [Route("api/searchType/{tid}/params/{pid}")]
                public ContentCollection GetParamsBySearchType(int tid, int pid)
                {
                    var collection = new ContentCollection();

                    IMetaType mt = WebUtilities.Database.MetaModel.MetaTypes.GetByID(tid);
                    IMetaProperty mp = WebUtilities.Database.MetaModel.MetaProperties.GetByID(pid);

                    string path = HttpContext.Current.Server.MapPath("~/App_Data/ExpressDosierConfiguration.xml");
                    XDocument doc = XDocument.Load(path);
                    List<XElement> elements = doc.Descendants("profile").Where(el =>
                        el.Parent.Parent.Attribute("systemname").Value.ToLower() == mp.SystemName.ToLower() &&
                        el.Parent.Parent.Parent.Parent.Attribute("systemname").Value.ToLower() == mt.SystemName.ToLower()
                        ).ToList();

                    foreach (var element in elements)
                    {
                        collection.AddNew()
                            .AddProperty("ID", "ID", element.Attribute("uid").Value, ANBR.Common.Contarcts.PropertyType.String, false, false)
                            .AddProperty("Title", "Наименование", element.Attribute("title").Value, ANBR.Common.Contarcts.PropertyType.String, true, false);
                    }

                    return collection;
                }

        */
        #endregion


        /// <summary>
        /// Получить список последних num проверок
        /// </summary>
        /// <param name="num">Количество на странице</param>
        /// <param name="typeID">Не используется</param>
        /// <param name="paramID">Не используется</param>
        /// <param name="inputText">Не используется</param>
        /// <param name="page">Не используется</param>
        /// <returns></returns>
        [Route("api/interestObjects/top{num}")]
        [HttpGet]
        public ContentCollection GetInterestObjectsList_Top(int num, int? typeID, int? paramID, string inputText, int page = 1)
        {
            return InterestObjectsByCriteria("top", null, typeID, paramID, null, inputText, page, null, null, num, null);
        }


        /// <summary>
        /// Возвращает входные данные введенные пользователем на форме проеверки объекта интереса
        /// </summary>
        /// <param name="objectid"></param>
        /// <returns></returns>
        [Route("api/interestObjects/input/id{objectid}")]
        [HttpGet]
        public JToken GetInterestObjectsInputData(int objectid)
        {
            string val = WebSaUtilities.Database._PropertyFastGet(objectid, "InterestObjectINPUTDATA");

            JToken res = null;
            if (!String.IsNullOrWhiteSpace(val))
                res = JObject.Parse(val);

            return res;
        }


        /// <summary>
        /// Возвращает список проверок, которые сделаны текущим пользователем
        /// </summary>
        /// <returns></returns>
        [Route("api/mycheck")]
        [HttpGet]
        public ContentCollection MyCheck(int page = 1, int? state = null)
        {
            return InterestObjectsByCriteria("mine", null, null, null, null, null, page, null, null, PAGE_SIZE, state);
        }

        /// <summary>
        /// Получить список последних num проверок
        /// </summary>
        /// <param name="onlyMeta">Флаг необходимости получить только мета-данные</param>
        /// <param name="typeID">Поиск проводится по заданому типу</param>
        /// <param name="paramID">Поиск проводится по заданному параметру</param>
        /// <param name="profileID"></param>
        /// <param name="inputText">Критерий поиска</param>
        /// <param name="page">Номер страницы</param>
        /// <param name="ds">Дата создания (от)</param>
        /// <param name="de">Дата создания (до)</param>
        /// <param name="state">Состояние: в работе, завершено и т.д <see cref="ProjectState"/></param>
        /// <returns></returns>
        [Route("api/interestObjects")]
        [HttpGet]
        public ContentCollection GetInterestObjectsList(int? onlyMeta, int? typeID, int? paramID, string profileID,
            string inputText, int page = 1, DateTime? ds = null, DateTime? de = null, int? state = null)
        {
            return InterestObjectsByCriteria("search", onlyMeta, typeID, paramID, profileID, inputText, page, ds, de, 0, state);
        }

        /// <summary>
        /// Получить список совпадений по персонам
        /// </summary>
        /// <param name="person"></param>
        /// <param name="page"></param>
        /// <returns></returns>
        [Route("api/interestObjects/10021")]
        [HttpPost]
        public ContentCollection GetInterestObjectsList(PersonSearchTaskModel person, int page = 1)
        {
            var json = JObject.FromObject(person);

            person.fname_INTERN = person.fname_INTERN?.Trim();
            person.lname_INTERN = person.lname_INTERN?.Trim();
            person.mname_INTERN = person.mname_INTERN?.Trim();
            person.pname_INTERN = person.pname_INTERN?.Trim();

            IDataBase saDB = WebSaUtilities.Database;
            IMetaType metaBase = saDB.MetaModel.MetaTypes.GetByName(_SAConst.Type_Person);

            var reqFilterCriterias = new List<string>();
            if (!String.IsNullOrWhiteSpace(person.lname_INTERN))
            {
                var dn = CalcDisplayName(person);
                reqFilterCriterias.Add(SDKHelper.GenerateFilterCriteria("InterestObjectINPUTDATA", dn));

                foreach (var item in person.synonyms_INTERN)
                {
                    string expr = SDKHelper.GenerateFilterCriteria("InterestObjectINPUTDATA", item);
                    reqFilterCriterias.Add(expr);
                }
            }

            var filterCriterias = new List<string>();
            foreach (JProperty property in json.Properties())
            {
                if (property.Value.Type == JTokenType.Object) continue;
                if (property.Value == null || String.IsNullOrWhiteSpace(property.Value.ToString()) || property.Value.ToString() == "{}" || property.Value.ToString() == "[]") continue;
                if (property.Value.Type == JTokenType.Array || property.Value.Type == JTokenType.Boolean || property.Value.Type == JTokenType.Integer) continue;
                if (",id,typeid,lname_INTERN,fname_INTERN,mname_INTERN,lname_INTERN,pname_INTERN,".Contains("," + property.Name + ",")) continue;
                if (",typeSystemName,RelationsDescriptionData,MasterID,MasterTitle,Project_ID,ProjectRole_ID,AutoExtractionIsActive,".Contains("," + property.Name + ",")) continue;

                string val = property.Value.Parent.ToString();
                string expr = SDKHelper.GenerateFilterCriteria("InterestObjectINPUTDATA", val);
                filterCriterias.Add(expr);
            }

            var sb = new StringBuilder();
            if (reqFilterCriterias.Count > 0)
            {
                sb.Append("(");
                for (int i = 0; i < reqFilterCriterias.Count; i++)
                {
                    sb.Append(reqFilterCriterias[i]);
                    if (i < reqFilterCriterias.Count - 1) sb.Append(" or ");
                }
                sb.Append(")");
            }

            if (filterCriterias.Count > 0)
            {
                sb.Append(" and (");
                for (int i = 0; i < filterCriterias.Count; i++)
                {
                    sb.Append(filterCriterias[i]);
                    if (i < filterCriterias.Count - 1) sb.Append(" or ");
                }
                sb.Append(")");
            }

            if (sb.Length == 0)
            {
                sb.Append(" and (1 = 0)");
            }

            //person.id - оражает идентификатор исходного объекта при клонировании он может изменится
            if (person.id != default(int))
                sb.Append(" and (ov.[Object_ID] <> ").Append(HelperInquiry.ContextGetCurrentCheckId()).Append(")");

            bool onlyForCurrentProject = false;
            var projectID = Scope.GetInternalPrjIDi();
            string sql = SDKHelper.GetObjectsLinkedWithMBFTasksSQL_Ver01(saDB, projectID, metaBase.ID, sb.ToString(), null, null, 0, false, null, null, onlyForCurrentProject);
            DataTable td = SDKHelper.GetObjectsLinkedWithMBFTasksExecute(sql);

            var arr = Root.GetListRows(td, page, 10);
            var collection = new ContentCollection();

            collection
                .AddPageInfo(page, 10, td.Rows.Count);
            collection = GenerateHeadsForCollection(collection, onlyForCurrentProject);

            return ContentCollection(arr, collection, metaBase);
        }

        /// <summary>
        /// Получить список совпадений по организациям
        /// </summary>
        /// <param name="org"></param>
        /// <param name="page"></param>
        /// <returns></returns>
        [Route("api/interestObjects/10022")]
        [HttpPost]
        public ContentCollection GetInterestObjectsList(OrganizationSearchTaskModel org, int page = 1)
        {
            var json = JObject.FromObject(org);

            org.title_INTERN = org.title_INTERN != null ? org.title_INTERN : null;

            IDataBase saDB = WebSaUtilities.Database;
            IMetaType metaBase = saDB.MetaModel.MetaTypes.GetByID(org.typeid);

            var reqFilterCriterias = new List<string>();
            if (!String.IsNullOrWhiteSpace(org.title_INTERN))
            {
                var dn = CalcDisplayName(org);
                reqFilterCriterias.Add(SDKHelper.GenerateFilterCriteria("InterestObjectINPUTDATA", dn));
                foreach (var item in org.synonyms_INTERN)
                {
                    string expr = SDKHelper.GenerateFilterCriteria("InterestObjectINPUTDATA", item);
                    reqFilterCriterias.Add(expr);
                }
            }

            var filterCriterias = new List<string>();
            foreach (JProperty property in json.Properties())
            {
                if (property.Value == null || String.IsNullOrWhiteSpace(property.Value.ToString()) || property.Value.ToString() == "{}" || property.Value.ToString() == "[]") continue;
                if (property.Value.Type == JTokenType.Array || property.Value.Type == JTokenType.Boolean || property.Value.Type == JTokenType.Integer) continue;
                if (",id,typeid,".Contains("," + property.Name + ",")) continue;
                if (",typeSystemName,title_INTERN,RelationsDescriptionData,MasterID,MasterTitle,Project_ID,ProjectRole_ID,AutoExtractionIsActive,".Contains("," + property.Name + ",")) continue;

                string val = property.Value.Parent.ToString();
                string expr = SDKHelper.GenerateFilterCriteria("InterestObjectINPUTDATA", val);
                filterCriterias.Add(expr);
            }

            var sb = new StringBuilder();
            if (reqFilterCriterias.Count > 0)
            {
                sb.Append(" ( ");
                for (int i = 0; i < reqFilterCriterias.Count; i++)
                {
                    sb.Append(reqFilterCriterias[i]);
                    if (i < reqFilterCriterias.Count - 1) sb.Append(" or ");
                }
                sb.Append(" ) ");
            }

            if (filterCriterias.Count > 0)
            {
                if (reqFilterCriterias.Count > 0) sb.Append(" and ");
                sb.Append(" ( ");
                for (int i = 0; i < filterCriterias.Count; i++)
                {
                    sb.Append(filterCriterias[i]);
                    if (i < filterCriterias.Count - 1) sb.Append(" or ");
                }
                sb.Append(" ) ");
            }

            if (sb.Length == 0)
            {
                sb.Append(" (1 = 0) ");
            }

            //org.id - оражает идентификатор исходного объекта при клонировании он может изменится
            if (org.id != default(int))
                sb.Append(" and (ov.[Object_ID] <> ").Append(HelperInquiry.ContextGetCurrentCheckId()).Append(" ) ");

            bool onlyForCurrentProject = false;
            var projectID = Scope.GetInternalPrjIDi();
            string sql = SDKHelper.GetObjectsLinkedWithMBFTasksSQL_Ver01(saDB, projectID, metaBase.ID, sb.ToString(), null, null, 0, false, null, null, onlyForCurrentProject);
            DataTable td = SDKHelper.GetObjectsLinkedWithMBFTasksExecute(sql);

            var arr = Root.GetListRows(td, page, 10);

            var collection = new ContentCollection();

            collection
                .AddPageInfo(page, 10, td.Rows.Count);
            collection = GenerateHeadsForCollection(collection, onlyForCurrentProject);

            return ContentCollection(arr, collection, metaBase);
        }

        /// <summary>
        /// Конвертирует DataTable в ContentCollection (структура зашита в код)
        /// </summary>
        /// <param name="metaBase"></param>
        /// <param name="td"></param>
        /// <param name="page"></param>
        /// <param name="num"></param>
        /// <returns></returns>
        [NonAction]
        private ContentCollection PrepareCollection(IMetaType metaBase, DataTable td, int page, int num)
        {
            int? projectID = Scope.GetInternalPrjIDi();
            var arr = Root.GetListRows(td, page, num);

            var collection = new ContentCollection();
            collection
                .AddPageInfo(page, 10, td.Rows.Count)
                .AddHead("TypeName", metaBase.AllProperties.GetByName("TypeDispName").DisplayName, true)
                .AddHead("CreatedDate", metaBase.AllProperties.GetByName("CreatedDate").DisplayName, true)
                .AddHead("Display_Name", metaBase.AllProperties.GetByName("Display_Name").DisplayName, true)
                .AddHead("Object_ID", "", false)
                .AddHead("Rubric", "", !projectID.HasValue, true)
                .AddHead("Status", "", false, true)
                .AddHead("Dossier", "", false, true);

            var dic = new Dictionary<string, IMetaProperty>();
            for (int rowid = 0; rowid < arr.Length; rowid++)
            {
                DataRow row = arr[rowid];
                var item = new ContentItem();
                collection.items.Add(item);

                foreach (HeadProperty col in collection.head)
                {
                    if (col.isCalc)
                    {
                        item.AddProperty(col.systemName, col.displayName, row[col.systemName], PropertyType.String, true, true, col.htmlEncoded);
                        continue;
                    }

                    try
                    {
                        IMetaProperty mp;
                        if (!dic.TryGetValue(col.systemName, out mp))
                        {
                            mp = WebSaUtilities.Database.MetaModel.MetaProperties.TryGetByName(col.systemName);
                            dic[col.systemName] = mp;
                        }
                    }
                    catch
                    {
                        dic[col.systemName] = null;
                    }

                    IMetaProperty mCol = dic[col.systemName];
                    if (mCol != null)
                        item.AddProperty(mCol, row[col.systemName]);
                    else
                        item.AddProperty(col.systemName, col.displayName, row[col.systemName],
                            PropertyType.String, true, true);
                }
            }

            return collection;
        }

        [NonAction]
        private ContentCollection InterestObjectsOnlyOne(int objectID, IMetaType metaBase = null)
        {
            int? projectID = Scope.GetInternalPrjIDi();
            IDataBase saDB = WebSaUtilities.Database;

            DataTable td = SDKHelper.GetOnlyOneForMbf(saDB, projectID, objectID);
            if (metaBase == null && td.Rows.Count == 0)
                throw new InvalidOperationException("entity type is unknown");

            var arr = Root.GetListRows(td, 1, 10);
            if (metaBase == null && td.Rows.Count > 0)
            {
                var typeID = td.Rows[0].Field<int>("Type_ID");
                metaBase = WebSaUtilities.Database.MetaModel.MetaTypes.GetByID(typeID);
            }

            var collection = new ContentCollection();
            collection
                .AddPageInfo(1, 10, td.Rows.Count);
            collection = GenerateHeadsForCollection(collection, false);

            return ContentCollection(arr, collection, metaBase);
        }

        [NonAction]
        private ContentCollection GenerateHeadsForCollection(ContentCollection collection, bool onlyForCurrentProject)
        {
            collection
                .AddHead("Object_ID", "", false)
                .AddHead("Type_ID", "", false)
                .AddHead("TypeName", Root.GetResource("InterestObjController_LabelTypeName"), true)
                .AddHead("RoleName", Root.GetResource("InterestObjController_LabelRoles"), true)
                .AddHead("Display_Name", Root.GetResource("InquiryController_SAProject_Title"), true)
                .AddHead("Creator", Root.GetResource("InquiryController_SAProject_Owner"), true)
                .AddHead("CreatedDate", Root.GetResource("InquiryController_SAProject_CDate"), true)
                .AddHead("JobCDate", Root.GetResource("InquiryController_SAProject_CheckDate"), true);

            int? projectID = Scope.GetInternalPrjIDi();
            string area = Scope.GetCurrentArea();
            if (area == "inquiry" && projectID.HasValue)
                collection.AddHead("MarkNames", Root.GetResource("InterestObjController_LabelMark"), true, true);
            if (!onlyForCurrentProject)
            {
                collection
                    .AddHead("Project_ID", "", false);

                var item = collection.NewHeadItem();
                item.systemName = "ProjectName";
                item.displayName = Root.GetResource("Inquiry");
                item.isVisible = true;
                item.template = @"[baseurl]?prjid=[Project_ID]";
                collection.AddHead(item);
            }

            collection
                .AddHead("Status", Root.GetResource("InquiryController_SAProject_Status"), true, true)
                .AddHead("State", Root.GetResource("InquiryController_SAProject_State"), true, true)
                .AddHead("Dossier", "", false, true);

            return collection;
        }

        [NonAction]
        private ContentCollection InterestObjectsByCriteria(string kind, int? onlyMeta, int? typeID, int? paramID, string profileID, string inputText, int page, DateTime? ds, DateTime? de, int num, int? state)
        {
            //значение по умолчанию обрабатываем как отсутстве значения
            if (state == 0) state = null;

            IDataBase saDB = WebSaUtilities.Database;
            IMetaType metaBase = saDB.MetaModel.MetaTypes.TryGetByName("T_Object");
            var projectID = Scope.GetInternalPrjIDi();
            string propertyName = "";
            string propertyValue = inputText != null ? inputText.Trim() : null;

            if (typeID.HasValue && typeID != 0)
            {
                metaBase = WebSaUtilities.Database.MetaModel.MetaTypes.GetByID(typeID.Value);
                if (paramID.HasValue && paramID != 0)
                {
                    IMetaProperty mp = WebSaUtilities.Database.MetaModel.MetaProperties.GetByID(paramID.Value);
                    if (mp != null)
                        propertyName = mp.SystemName;
                }
            }

            DataTable td = null;
            if (kind == "search")
            {
                string filterCriteria = SDKHelper.GenerateFilterCriteria("InterestObjectINPUTDATA", inputText);

                if (!typeID.HasValue || typeID == 0) //не задан ни тип, ни свойство
                {
                    string sql = SDKHelper.GetObjectsLinkedWithMBFTasksSQL_Ver01(saDB, projectID, null, filterCriteria, ds, de, 0, false, null, state);
                    td = SDKHelper.GetObjectsLinkedWithMBFTasksExecute(sql);
                }
                else
                {
                    string sql = SDKHelper.GetObjectsLinkedWithMBFTasksSQL_Ver01(saDB, projectID, typeID.Value, filterCriteria, ds, de, 0, false, null, state);
                    td = SDKHelper.GetObjectsLinkedWithMBFTasksExecute(sql);

                    /*
                     * Пока видится как бестолковая задача использование свойств для поиска проверок
                     * 
                        if (!paramID.HasValue || paramID == 0) //задан только тип
                        {

                        }
                        else //задан тип и свойство
                        {

                            SDKHelper.CombineCriteria(ref filterCriteria, metaBase, propertyName, propertyValue);
                            string sql = SDKHelper.GetObjectsLinkedWithMBFTasksSQL(typeID, filterCriteria, ds, de);
                            td = SDKHelper.GetObjectsLinkedWithMBFTasksExecute(sql);
                        }
                    */
                }

            }
            if (kind == "mine")
                td = SDKHelper.GetOnlyMyObjectsLinkedWithMBFTasks(saDB, projectID);
            if (kind == "top")
                td = SDKHelper.GetAllObjectsLinkedWithMBFTasks(saDB, projectID);

            var arr = Root.GetListRows(td, page, 10);

            var collection = new ContentCollection();

            collection
                .AddPageInfo(page, 10, td.Rows.Count);
            collection = GenerateHeadsForCollection(collection, true);

            if (onlyMeta.HasValue && onlyMeta.Value == 1) return collection;

            return ContentCollection(arr, collection, metaBase);
        }

        [NonAction]
        private static ContentCollection ContentCollection(DataRow[] arr, ContentCollection collection, IMetaType metaBase)
        {
            for (int rowid = 0; rowid < arr.Length; rowid++)
            {
                DataRow row = arr[rowid];
                var item = new ContentItem();
                collection.items.Add(item);

                string href;
                href = Scope.GetCurrentArea() == "inquiry"
                    ? $"lang-{Root.GetCurrentLang()}/db{Scope.GetCurrentDBID()}/inquiry?prjid={arr[rowid]["Project_ID"]}#id={arr[rowid]["Object_ID"]}"
                    : $"lang-{Root.GetCurrentLang()}/db{Scope.GetCurrentDBID()}/check#id={arr[rowid]["Object_ID"]}";

                item.href = href;

                foreach (HeadProperty col in collection.head)
                {
                    IMetaProperty mCol = null;
                    try
                    {
                        if (!col.isCalc)
                        {
                            if (!metaBase.AllProperties.TryGetByName(col.systemName, out mCol))
                            {
                                var rowcol = row.Table.Columns[col.systemName];
                                item.AddProperty(col.systemName, col.displayName, row[col.systemName], SDKHelper.SAPropTypeByDataType(rowcol.DataType), true, true);
                            }
                        }
                        else
                        {
                            var rowcol = row.Table.Columns[col.systemName];
                            item.AddProperty(col.systemName, col.displayName, row[col.systemName],
                                SDKHelper.SAPropTypeByDataType(rowcol.DataType),
                                true, true, col.htmlEncoded);
                        }
                    }
                    catch
                    {
                        var rowcol = row.Table.Columns[col.systemName];
                        item.AddProperty(col.systemName, col.displayName, row[col.systemName], SDKHelper.SAPropTypeByDataType(rowcol.DataType), true, true);
                    }

                    if (mCol != null)
                        item.AddProperty(mCol, row[col.systemName]);

                    var lastProp = item.GetLastAddedProperty;
                    if (col.template != null)
                        lastProp.href = HelperContentCollection.RenderTemplate(row, col);

                    if (String.CompareOrdinal(lastProp.systemName.ToLower(), _SAConst.Наименование.ToLower()) == 0)
                        lastProp.href = href;
                }
            }

            return collection;
        }

        #region ExpressDossier запуск роботов

        #region ФИО шаблоны по созданию синонимического ряда
        private static readonly string[] templatesFIO =
        {
            "{0} {1} {2}", //Фамилия Имя Отчество
            "{1} {2} {0}"  //Имя Отчество Фамилия
/*          "{1} {0}",     //Имя Фамилия
            "{0} {1}",     //Фамилия Имя
            "{0}"          //Фамилия
*/ 
        };
        private static readonly string[] templatesFIO_i =
        {
            "{3}.{4} {0}", //И.О. Фамилия
            "{0} {3}.{4}." //Фамилия И.О.
        };

        private static readonly string[] templatesFI =
        {
            "{1} {0}", //Имя Фамилия
            "{0} {1}"  //Фамилия Имя
//          "{0}"      //Фамилия
        };
        private static readonly string[] templatesFI_i =
        {
            "{3}. {0}", //И.О. Фамилия
            "{0} {3}.", //Фамилия И.О.
        };

        private static readonly string[] templatesF =
        {
            "{0}" //Фамилия
        };
        #endregion

        [NonAction]
        private List<string> GetSynonymsForPerson(PersonSearchTaskModel person)
        {
            if (String.IsNullOrWhiteSpace(person.lname_INTERN)) return new List<string>();

            var langInfo = Root.ProxyGetWorker().IdentifyLanguage(person.lname_INTERN);
            if (langInfo == null) return new List<string>();
            if (langInfo.Iso639_2T.ToLower() != "ru") return new List<string>();

            #region Блок работы с синонимами
            /*
        Для сущности типа «Персона» необходимо задать синонимы. Для каждого синонима должны быть установлены свойства «Подсвечивать», «Искать» и «Морфология»:
        •	Фамилия Имя Отчество
        •	Имя Отчество Фамилия
        •	Имя Фамилия
        •	Фамилия Имя
        •	И.О. Фамилия
        •	Фамилия И.О.
        •	Фамилия

        Последний синоним «Фамилия» - спорный. С одной стороны, использование фамилии тащит в базу тексты с множественными однофамильцами, которые очень долго перебирать. 
        С другой стороны, встречаются тексты, типа «Работает в ООО РИК инженер по фамилии Смирнов» или «слесарь Иван Иванович, фамилия которого не то Смирнов, не то Смирновкин» и т.д., которые не хотелось бы упустить.
        */
            #endregion

            var templateSyn = new List<string>();
            string[] templateRefSyn;
            if (!String.IsNullOrWhiteSpace(person.lname_INTERN) && !String.IsNullOrWhiteSpace(person.fname_INTERN) &&
                !String.IsNullOrWhiteSpace(person.mname_INTERN))
            {
                templateRefSyn = templatesFIO;
                if (person.searchByInitials_INTERN)
                    templateRefSyn = templateRefSyn.Concat(templatesFIO_i).ToArray();
            }
            else if (!String.IsNullOrWhiteSpace(person.lname_INTERN) &&
                     !String.IsNullOrWhiteSpace(person.fname_INTERN))
            {
                templateRefSyn = templatesFI;
                if (person.searchByInitials_INTERN)
                    templateRefSyn = templateRefSyn.Concat(templatesFI_i).ToArray();
            }
            else
                templateRefSyn = templatesF;

            foreach (var t in templateRefSyn)
            {
                var firstNameFirstLatter = default(char);
                var middleNameFirstLatter = default(char);
                if (person.searchByInitials_INTERN)
                {
                    if (!String.IsNullOrWhiteSpace(person.fname_INTERN))
                        firstNameFirstLatter = Char.ToUpper(person.fname_INTERN[0]);
                    if (!String.IsNullOrWhiteSpace(person.mname_INTERN))
                        middleNameFirstLatter = Char.ToUpper(person.mname_INTERN[0]);
                }

                string phrase = String.Format(t, person.lname_INTERN, person.fname_INTERN, person.mname_INTERN,
                    firstNameFirstLatter, middleNameFirstLatter);
                templateSyn.Add(phrase);

                if (!String.IsNullOrWhiteSpace(person.pname_INTERN))
                {
                    phrase = String.Format(t, person.pname_INTERN, person.fname_INTERN, person.mname_INTERN,
                        firstNameFirstLatter, middleNameFirstLatter);
                    templateSyn.Add(phrase);
                }
            }

            string displayName = CalcDisplayName(person);
            templateSyn = templateSyn.Distinct().ToList();
            templateSyn.Remove(displayName);

            return templateSyn;
        }

        /// <summary>
        /// Обновление данных 
        /// </summary>
        [HttpPost]
        [ActionName("DefaultAction")]
        public void SaveObjectData(JObject data)
        {
            var objectID = data.Value<int>("id");
            if (objectID > 0)
            {

                IDataBase saDB = WebSaUtilities.Database;
                var mp = (MetaProperty)saDB.MetaModel.MetaProperties.GetByName("InterestObjectINPUTDATA");

                saDB.ObjectService.UpdatePropValue(objectID, mp.AsDMetaProperty(), new object[] { data.ToString() });
            }
        }

        /// <summary>
        /// Запуск проверки по персоне
        /// </summary>
        /// <param name="person"></param>
        /// <returns></returns>
        [Route("api/startTaskExpress/10021/{objectid?}")]
        [HttpPost]
        [HttpPut]
        public ModelStartedCheckData QueryPerson(PersonSearchTaskModel person)
        {
            int? projectID = Scope.GetInternalPrjIDi();
            if (Scope.GetCurrentArea() == "inquiry")
            {
                if (!projectID.HasValue)
                    throw new ArgumentException("Invalid environment object is out of the project's scope");
                if (!person.ProjectRole_ID.HasValue)
                    throw new ArgumentException("ProjectRole_ID should be defined");

                person.Project_ID = projectID;
            }

            IDataBase saDB = WebSaUtilities.Database;
            string userID = WebSaUtilities.GetCurrentUserID();
            string doStart = Request.GetParamFrom("start"); //признак необходимости создать и запустить проверку

            string sp = Request.GetParamFrom("sp"); //коллекция источников
            Guid searchPackUID = default(Guid);
            if (doStart == "1")
            {
                Guid.TryParse(sp, out searchPackUID);

                if (searchPackUID == default(Guid))
                    throw new ArgumentException("sp parameter should be defined");
            }

            Task<List<Tuple<Guid, string>>> tTaskTypes = null;
            if (doStart == "1")
            {
                IGateway mbf = WebSaUtilities.MBF;
                ContextData context = WebSaUtilities.GetCurrentContextData();
                tTaskTypes = System.Threading.Tasks.Task.Run(() => GetRobotsTypesBySearchPackUID(userID, searchPackUID, context, mbf));
            }

            int objectid = person.id;

            if (String.IsNullOrWhiteSpace(person.lname_INTERN)) throw new ArgumentException("Last name must be filled");
            person.fname_INTERN = person.fname_INTERN != null ? person.fname_INTERN.Trim() : null;
            person.lname_INTERN = person.lname_INTERN != null ? person.lname_INTERN.Trim() : null;
            person.mname_INTERN = person.mname_INTERN != null ? person.mname_INTERN.Trim() : null;
            person.pname_INTERN = person.pname_INTERN != null ? person.pname_INTERN.Trim() : null;

            var saver = new DataSaverSA4(saDB);
            IMetaType saType = saDB.MetaModel.MetaTypes.GetByName(_SAConst.Type_Person);
            person.typeSystemName = saType.SystemName;

            bool isNewObjectID = objectid == 0;
#if (RELEASE_IS || DEBUG)
            //using (WindowsImpersonationContext wic = ((System.Security.Principal.WindowsIdentity)User.Identity).Impersonate())
            //{
#endif
            var so = new SavedObject(_SAConst.Type_Person);
#warning 2015-11-18 Необходимо сохранить приложенные картинки в объекте
            // _objectService.UpdatePropValue(objectID, mp.AsDMetaProperty(), new[] { data });

            string personName = CalcDisplayName(person);

            so.property[_SAConst.Наименование] = personName;
            so.property[_SAConst.IsMonitoringEntity] = 1;

            var kind = person.birthDateUsingKind_INTERN;
            switch (kind)
            {
                case PersonSearchTaskModel.BirthDateUsingKindEnum.None:
                    break;
                case PersonSearchTaskModel.BirthDateUsingKindEnum.Exact:
                    so.property[_SAConst.Дата_рождения] = person.birthDateExact_INTERN?.ToLocalTime();
                    break;
                case PersonSearchTaskModel.BirthDateUsingKindEnum.Range:
                    so.property[_SAConst.Дата_рождения_не_позднее] = person.birthDateTo_INTERN?.ToLocalTime();
                    so.property[_SAConst.Дата_рождения_не_раньше] = person.birthDateFrom_INTERN?.ToLocalTime();
                    break;
                case PersonSearchTaskModel.BirthDateUsingKindEnum.Age:
                    {
                        if (person.age_INTERN.HasValue && person.age_INTERN != default(int))
                        {
                            var birthDate = DateTime.Now.Date.AddYears(-person.age_INTERN.Value);
                            person.birthDateFrom_INTERN = new DateTime(birthDate.Year, 1, 1);
                            person.birthDateTo_INTERN = new DateTime(birthDate.Year, 12, 31);
                            if (person.ageFromTo_INTERN.HasValue)
                            {
                                person.birthDateFrom_INTERN = birthDate.AddYears(-person.ageFromTo_INTERN.Value);
                                person.birthDateTo_INTERN = birthDate.AddYears(person.ageFromTo_INTERN.Value);
                            }
                            so.property[_SAConst.Дата_рождения_не_позднее] = person.birthDateTo_INTERN;
                            so.property[_SAConst.Дата_рождения_не_раньше] = person.birthDateFrom_INTERN;
                        }
                        break;
                    }
            }

            var country = person.selectedCountries[0].Substring(person.selectedCountries[0].Length - 2, 2).ToUpper();

            objectid = saver.CreateObject(so, objectid, person.Project_ID, person.ProjectRole_ID);
            person.id = objectid;
            if (!isNewObjectID && person.ProjectRole_ID.HasValue) //обновление не распространяется на Идентификатор Роли
                saDB._FieldFastSet(objectid, "ProjectRole_ID", person.ProjectRole_ID.Value);
            saDB._PropertyFastSetDicValue(objectid, "Country", country, "CountryAlpha2");

            InquryDataProcessingAndSetState(saDB, projectID, so, person.RelationsDescriptionData, isNewObjectID);
            saver.CreateObject(so, objectid); //создаем информационные признаки и связи с ними

            person.RelationsDescriptionData.Roles = new Dictionary<string, int>();
            if (so.relatedObj.ContainsKey(_SAConst.Role_Ассоциативная_связь))
            {
                var rels = so.relatedObj[_SAConst.Role_Ассоциативная_связь];
                foreach (var rel in rels)
                {
                    int relID = (int)rel.property[_SAConst.Object_ID];
                    string relShortName = (string)rel.property[_SAConst.ShortName];
                    person.RelationsDescriptionData.Roles[relShortName] = relID;
                }
            }
            so.relatedObj.Clear();

            InquryDataSetStartState(saDB, projectID, so, isNewObjectID);
            saver.CreateObject(so, objectid);
            so.relatedObj.Clear();

            string personJSON = JsonConvert.SerializeObject(person);
            so.property["InterestObjectINPUTDATA"] = personJSON;
            so.property["InterestObjectINPUTDATAFlag"] = Boolean.TrueString;

            //Для РФ

            switch (country)
            {
                case "RU":
                    so.property[_SAConst.INN_Person] = person.inn__ru_RU;
                    so.property[_SAConst.Паспортные_данные] = person.pasSerial__ru_RU + " " + person.pasNumber__ru_RU +
                                                              " " +
                                                              person.pasDate__ru_RU?.ToLocalTime().ToString("dd.MM.yyyy");

                    so.property[_SAConst.OGRN_Person] = person.ogrnip__ru_RU;
                    break;
                case "UA":
                    break;
                case "BY":
                    break;
                case "KZ":
                    so.property[_SAConst.INN_Person] = person.inn__kk_KZ;
                    so.property[_SAConst.Паспортные_данные] = person.pasSerial__ru_RU + " " + person.pasNumber__ru_RU +
                                                              " " +
                                                              person.pasDate__ru_RU?.ToLocalTime().ToString("dd.MM.yyyy");
                    break;
                case "AM":
                    break;
                case "CN":
                    so.property[_SAConst.INN_Person] = person.TaxNumber__zh_CN;
                    break;
                case "TW":
                    so.property[_SAConst.INN_Person] = person.TaxNumber__zh_TW;
                    break;
                case "HK":
                    so.property[_SAConst.INN_Person] = person.TaxNumber__zh_HK;
                    break;
            }


            ProcessSynonyms(person.synonyms_INTERN, saver, objectid);
            saver.CreateObject(so, objectid, false);

#if (RELEASE_IS || DEBUG)
            //}
#endif

            ProcessRubrics(saDB, objectid, person.Rubrics, isNewObjectID);

            int? checkId = null;
            Guid checkUid = default(Guid);
            if (doStart == "1")
                checkId = DoStartSearchTasks(saDB, userID, saType, objectid, searchPackUID, projectID, person.AutoExtractionIsActive, out checkUid);

            return new ModelStartedCheckData
            {
                id = objectid,
                checkId = checkId,
                checkUid = checkUid == default(Guid) ? (Guid?)null : checkUid,
                typesOfSearchTasks = tTaskTypes?.Result
            };
        }

        private static string CalcDisplayName(PersonSearchTaskModel person)
        {
            var langInfo = Root.ProxyGetWorker().IdentifyLanguage(person.lname_INTERN);
            string personName = $"{person.lname_INTERN} {person.fname_INTERN} {person.mname_INTERN}";
            if (langInfo?.Iso639_2T.ToLower() != "ru")
                personName = $"{person.fname_INTERN} {person.lname_INTERN}";

            return personName;
        }

        List<Tuple<Guid, string>> GetRobotsTypesBySearchPackUID(string userID, Guid searchPackUID, ContextData context, IGateway mbf)
        {
            Guid[] sources = SearchBL.SelectedSourcesGet(userID, searchPackUID);
            return HelperISS.GetRobotsBySources(mbf, context, sources);
        }

        /// <summary>
        /// Осуществляет запуск поисковых задач, в рамках заднной коллекции и заданного объекта
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="userID"></param>
        /// <param name="saType"></param>
        /// <param name="objectid"></param>
        /// <param name="searchPackUID"></param>
        /// <param name="projectID"></param>
        /// <param name="autoExtractionIsActive"></param>
        /// <param name="checkUid"></param>
        /// <returns>Возвращает идентификатор проверки</returns>
        private int DoStartSearchTasks(IDataBase saDB, string userID, IMetaType saType, int objectid,
            Guid searchPackUID, int? projectID, bool autoExtractionIsActive, out Guid checkUid)
        {
            string dbID = Scope.GetCurrentDBID();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;

            checkUid = Guid.NewGuid();
            LogBL.Write("info", "StartRobots assigned taskUID:" + checkUid);
            int checkId = saDB.ObjectService.CustomTaskCreateDescriptor(checkUid, 100, userID); //получаем идентификатор проверки
            LogBL.Write("info", "StartRobots created taskID:" + checkId);


            ContextData context = WebSaUtilities.GetCurrentContextData();
            HostingEnvironment.QueueBackgroundWorkItem(ct =>
            {
                var sources = SearchBL.SelectedSourcesGet(userID, searchPackUID);
                var tasks = HelperISS.StartRobots(saDB, WebSaUtilities.MBF, userID, saType, objectid, sources, context, projectID, checkId);

                if (autoExtractionIsActive && tasks.Length > 0)
                {
                    NotificationBL.RegisterAutoFactExtractionAfterMBFEvent(userID, dbID + "|$|" + dbName, objectid, tasks, System.Threading.Thread.CurrentThread.CurrentUICulture, projectID);
                }

            });

            return checkId;
        }

        private void InquryDataSetStartState(IDataBase saDB, int? projectID, SavedObject so, bool isNewObjectId)
        {
            if (!isNewObjectId)
            {
                SetState(so.objId, (int)ProjectState.InWork, (string)so.property[_SAConst.Наименование]);
                return;
            }

            string titleFormat = Root.GetResource("CheckResume_GeneratedTitleForState");
            string moduleName = Root.GetResource("CheckResume_ModuleTitleCheck");
            if (Scope.GetCurrentArea() == "inquiry")
                moduleName = Root.GetResource("CheckResume_ModuleTitleInquire");

            int projectRoleForState = SDKHelper.InquiryRoleSystemGet(saDB, InquirySysRoles.state);
            var state = new SavedObject(_SAConst.Type_Pokazatel);
            state.Project_ID = projectID;
            state.Project_RoleID = projectRoleForState;
            state.property[_SAConst.Наименование] = String.Format(titleFormat, moduleName, so.property[_SAConst.Наименование],
                Root.GetResource("InterestObjController_CheckState_InWork"));
            state.property[_SAConst.Целочисленный_показатель] = ProjectState.InWork;
            state.property[_SAConst.ShortName] = Root.GetResource("InterestObjController_CheckState_InWork");

            so.AddRelation(_SAConst.Role_Ассоциативная_связь, state);
        }

        [NonAction]
        private void ProcessSynonyms(string[] synList, DataSaverSA4 saver, int objectid)
        {
            foreach (var synonymItem in synList)
            {
                var langInfo = Root.ProxyGetWorker().IdentifyLanguage(synonymItem);
                if (langInfo == null) continue;

                var ls = new List<Tuple<string, bool, bool, bool>>
                {
                    new Tuple<string, bool, bool, bool>(synonymItem, true, true, true)  //SA Notation
                };

                CultureInfo ci = new CultureInfo(langInfo.Iso639_2T);
                if (ci.EnglishName.StartsWith("Unknown")) continue;

                saver.ProcessSysnonyms(objectid, ci.LCID, ci.Name, ls);
            }
        }

        [NonAction]
        private void ProcessRubrics(IDataBase saDB, int objectid, RubricsDescriptionModel[] rubrics, bool isNewObjectID)
        {
            if (!isNewObjectID)
            {
                var relRubrics = saDB.ObjectService.GetObjectRubrics(objectid);
                var forDel = relRubrics.Where(item => rubrics.Any(r => r.id != item.ID)).ToList();
                foreach (var delRubric in forDel)
                    saDB.ObjectService.RemoveRubricFromObject(objectid, delRubric.ID);
            }

            if (rubrics == null || rubrics.Length == 0) return;

            saDB.ObjectService.AddRubricsToObject(objectid,
                rubrics.Where(item => item.id != 0).Select(item => item.id).ToList()
                );
        }

        [NonAction]
        ContentItem AddProjectData(ContentItem item, int objectID, int? projectID)
        {
            var propDN = item.GetPropertyBySystemName(_SAConst.Наименование);

            string href;
            href = Scope.GetCurrentArea() == "inquiry"
                ? $"lang-{Root.GetCurrentLang()}/db{Scope.GetCurrentDBID()}/inquiry?prjid={projectID}#id={objectID}"
                : $"lang-{Root.GetCurrentLang()}/db{Scope.GetCurrentDBID()}/inquiry#id={objectID}";
            item.href = href;
            propDN.href = href;

            return item;

        }

        /// <summary>
        /// Запуск процедуры получения дополнительный сведений по заданному типу объекта 
        /// </summary>
        /// <param name="entity">Данные по объету</param>
        /// <param name="otype">тип объекта</param>
        /// <param name="kind">вид проверки</param>
        /// <returns></returns>
        [Route("api/interestObjects/{otype:int}/addInfo/{kind:int}")]
        [HttpPost]
        [HttpPut]
        public JObject QueryOrganizationAdditionalInfo(JObject entity, int otype, int kind)
        {
            string wnd = Request.GetParamFrom("wnd"); //передается информация об окне, которое инициировало запрос

            JsonSerializerSettings settings = new JsonSerializerSettings();
            settings.NullValueHandling = NullValueHandling.Ignore;
            settings.MissingMemberHandling = MissingMemberHandling.Ignore;

            switch (otype)
            {
                case 10021: //персона
                    {
                        PersonSearchTaskModel person = JsonConvert.DeserializeObject<PersonSearchTaskModel>(entity.ToString(), settings);
                        return HelperInquiry.GetRealDataBy(person, kind, wnd);
                    }
                case 10022: //организация
                    {
                        OrganizationSearchTaskModel organization = JsonConvert.DeserializeObject<OrganizationSearchTaskModel>(entity.ToString(), settings);
                        return HelperInquiry.GetRealDataBy(organization, kind, wnd);
                    }
            }

            return null;
        }


        /// <summary>
        /// Запуск проверки по организации
        /// </summary>
        /// <param name="organization"></param>
        /// <returns></returns>
        [Route("api/startTaskExpress/10022/{objectid?}")]
        [HttpPost]
        [HttpPut]
        public ModelStartedCheckData QueryOrganization(OrganizationSearchTaskModel organization)
        {
            int? projectID = Scope.GetInternalPrjIDi();
            if (Scope.GetCurrentArea() == "inquiry")
            {
                if (!projectID.HasValue)
                    throw new ArgumentException("Invalid environment object is out of the project's scope");
                if (!organization.ProjectRole_ID.HasValue)
                    throw new ArgumentException("ProjectRole_ID should be defined");

                organization.Project_ID = projectID;
            }

            IDataBase saDB = WebSaUtilities.Database;
            string userID = WebSaUtilities.GetCurrentUserID();
            string doStart = Request.GetParamFrom("start"); //признак необходимости создать и запустить проверку

            string sp = Request.GetParamFrom("sp"); //коллекция источников
            Guid searchPackUID = default(Guid);
            if (doStart == "1")
            {
                Guid.TryParse(sp, out searchPackUID);

                if (searchPackUID == default(Guid))
                    throw new ArgumentException("sp parameter should be defined");
            }

            Task<List<Tuple<Guid, string>>> tTaskTypes = null;
            if (doStart == "1")
            {
                IGateway mbf = WebSaUtilities.MBF;
                ContextData context = WebSaUtilities.GetCurrentContextData();
                tTaskTypes = System.Threading.Tasks.Task.Run(() => GetRobotsTypesBySearchPackUID(userID, searchPackUID, context, mbf));
            }


            int objectid = organization.id;

            if (String.IsNullOrWhiteSpace(organization.title_INTERN)) throw new ArgumentException("Company name must be filled");
            organization.title_INTERN = organization.title_INTERN.Trim();
            string displayName = CalcDisplayName(organization);

            var saver = new DataSaverSA4(saDB);
            string dbID = Scope.GetCurrentDBID();
            string dbName = saDB.ConnectionInfo.DatabaseName;
            IMetaType saType = saDB.MetaModel.MetaTypes.GetByName(_SAConst.Type_Organization);
            organization.typeSystemName = saType.SystemName;

            bool isNewObjectID = objectid == 0;

#if (RELEASE_IS || DEBUG)
            //using (WindowsImpersonationContext wic = ((System.Security.Principal.WindowsIdentity)User.Identity).Impersonate())
            //{
#endif
            var so = new SavedObject(_SAConst.Type_Organization);
            so.property[_SAConst.Наименование] = displayName;
            so.property[_SAConst.IsMonitoringEntity] = 1;

            if (!String.IsNullOrWhiteSpace(organization.address_INTERN))
                so.property[_SAConst.Адрес] = organization.address_INTERN;

            var country = HelperOther.ExtractCountryNameFromCulture(organization.selectedCountries[0]);

            objectid = saver.CreateObject(so, objectid, organization.Project_ID, organization.ProjectRole_ID);
            organization.id = objectid;
            if (!isNewObjectID && organization.ProjectRole_ID.HasValue) //обновление не распространяется на Идентификатор Роли
                saDB._FieldFastSet(objectid, "ProjectRole_ID", organization.ProjectRole_ID.Value);
            saDB._PropertyFastSetDicValue(objectid, "Country", country, "CountryAlpha2");

            InquryDataProcessingAndSetState(saDB, projectID, so, organization.RelationsDescriptionData, isNewObjectID);
            saver.CreateObject(so, objectid); //создаем информационные признаки и связи с ними

            organization.RelationsDescriptionData.Roles = new Dictionary<string, int>();
            if (so.relatedObj.ContainsKey(_SAConst.Role_Ассоциативная_связь))
            {
                var rels = so.relatedObj[_SAConst.Role_Ассоциативная_связь];
                foreach (var rel in rels)
                {
                    int relID = (int)rel.property[_SAConst.Object_ID];
                    string relShortName = (string)rel.property[_SAConst.ShortName];
                    organization.RelationsDescriptionData.Roles[relShortName] = relID;
                }
            }
            so.relatedObj.Clear();

            InquryDataSetStartState(saDB, projectID, so, isNewObjectID);
            saver.CreateObject(so, objectid);
            so.relatedObj.Clear();


            string organizationJSON = JsonConvert.SerializeObject(organization);
            so.property["InterestObjectINPUTDATA"] = organizationJSON;
            so.property["InterestObjectINPUTDATAFlag"] = Boolean.TrueString;


            switch (country)
            {
                case "RU":
                    so.property[_SAConst.INN_Org] = organization.inn__ru_RU;
                    so.property[_SAConst.OGRN] = organization.ogrn__ru_RU;
                    so.property[_SAConst.ОКПО] = organization.okpo__ru_RU;
                    break;
                case "UA":
                    so.property[_SAConst.INN_Org] = organization.edrpou__uk_UA;
                    break;
                case "BY":
                    break;
                case "KZ":
                    so.property[_SAConst.INN_Org] = organization.rnn__kk_KZ;
                    so.property[_SAConst.OGRN] = organization.bin__kk_KZ;
                    break;
                case "AM":
                    break;
                case "CN":
                    so.property[_SAConst.OGRN] = organization.RegistrationNumber__zh_CN;
                    break;
                case "TW":
                    so.property[_SAConst.OGRN] = organization.RegistrationNumber__zh_TW;
                    so.property[_SAConst.INN_Org] = organization.TaxID__zh_TW;
                    break;
                case "HK":
                    so.property[_SAConst.OGRN] = organization.RegistrationNumber__zh_HK;
                    break;
            }

            ProcessSynonyms(organization.synonyms_INTERN, saver, objectid);
            saver.CreateObject(so, objectid, false);


#if (RELEASE_IS || DEBUG)
            //}
#endif

            ProcessRubrics(saDB, objectid, organization.Rubrics, isNewObjectID);

            int? checkId = null;
            Guid checkUid = default(Guid);
            if (doStart == "1")
                checkId = DoStartSearchTasks(saDB, userID, saType, objectid, searchPackUID, projectID, organization.AutoExtractionIsActive, out checkUid);

            return new ModelStartedCheckData
            {
                id = objectid,
                checkId = checkId,
                checkUid = checkUid == default(Guid) ? (Guid?)null : checkUid,
                typesOfSearchTasks = tTaskTypes?.Result
            };
        }

        private string CalcDisplayName(OrganizationSearchTaskModel organization)
        {
            return organization.title_INTERN;
        }

        private static void InquryDataProcessingAndSetState(IDataBase saDB, int? projectID, SavedObject so, RelationsDescriptionModel relsData, bool isNewObjectId)
        {
            string dn = so.property[_SAConst.Наименование].ToString();
            int projectRoleForRel = SDKHelper.InquiryRoleSystemGet(saDB, InquirySysRoles.partrel);

            if (!isNewObjectId)
            {
                DataTable dt = SDKHelper.InquiryGetObjectsMarkedByRoles(saDB, projectID.Value, projectRoleForRel, so.objId);
                if (dt != null && dt.Rows.Count != 0)
                {
                    var objID = (int)dt.Rows[0][0];
                    saDB._ObjFastDelete(objID);
                }
            }

            foreach (var rolePair in relsData.Roles)
            {
                string roleName = rolePair.Key;
                if (String.IsNullOrEmpty(roleName)) continue;

                var fact = new SavedObject(_SAConst.Type_EntityRelation);
                fact.Project_ID = projectID;
                fact.Project_RoleID = projectRoleForRel;
                fact.property[_SAConst.ShortName] = roleName;
                
                fact.property[_SAConst.Наименование] = String.Format(Root.GetResource("Check_MarkRelationNameTemplate"), dn, roleName);
                so.AddRelation(_SAConst.Role_Ассоциативная_связь, fact);
            }
        }

        [NonAction]
        private List<string> GetSynonymsForOrganization(OrganizationSearchTaskModel organization)
        {
            if (String.IsNullOrWhiteSpace(organization.title_INTERN)) return new List<string>();

            var langInfo = Root.ProxyGetWorker().IdentifyLanguage(organization.title_INTERN);
            if (langInfo == null) return new List<string>();
            if (langInfo.Iso639_2T.ToLower() != "ru") return new List<string>();


            #region Блок работы с синонимами
            /*
        Автоматическое формирование синонимов для организаций сложно. Например, название организации:
        Общество с ограниченной ответственностью «Строительная компания «Российский Промышленный Союз» Интернейшнл» - Нижегородский филиал (СК РПС И).
        Оно может иметь сокращения:
        Общество с ограниченной ответственностью = ООО
        Строительная компания = СК
        Российский Промышленный Союз = РПС
        Интернейшнл = Инт. или Iht.
        Нижегородский филиал = Ниж. Или НН или Н

        Название такой организации может быть записано различными комбинациями из приведённых сокращений.

        Универсальным можно назвать только одно правило – смотреть на кавычки (если они есть). 
        Если есть одна пара кавычек, то брать в синоним всё, что находится между крайней правой кавычкой и ближайшей к ней кавычкой слева.
        Если кавычек 3, то один синоним создаём по предыдущему правилу, второй – всё, что есть между крайней левой и крайней правой кавычками.
        Если кавычек четыре, то первый синоним – между внутренними кавычками, второй синоним – между самой первой и третьей кавычками, третий синоним – между второй и четвертой кавычками.
        Если в названии компании  есть круглые или квадратные скобки, то их содержимое сохраняем, как ещё один синоним с отключенной морфологией.
        */
            #endregion

            var re = new Regex("[\"|«](.+)[\"|»]");
            var m = re.Match(organization.title_INTERN);

            var templateSyn = new List<string>() { organization.title_INTERN };
            if (!String.IsNullOrWhiteSpace(m.Value))
            {
                var m1 = re.Match(m.Groups[1].Value);
                if (String.IsNullOrWhiteSpace(m1.Value))
                    templateSyn.Add(m.Groups[1].Value);
                else
                {
                    templateSyn.Add(m1.Groups[1].Value);
                    templateSyn.Add(m.Groups[1].Value);
                    re = new Regex("[\"|«](?<=[\"|«])(.+?)[\"|»]");
                    m1 = re.Match(organization.title_INTERN);
                    if (!String.IsNullOrWhiteSpace(m1.Value))
                        templateSyn.Add(m1.Groups[1].Value);

                    re = new Regex("(?<=[\"|«].+)[\"|«](.+)[\"|»]");
                    m1 = re.Match(organization.title_INTERN);
                    if (!String.IsNullOrWhiteSpace(m1.Value))
                        templateSyn.Add(m1.Groups[1].Value);
                }

                re = new Regex("(?<=[\"|«].+)[\"|«](.+)[\"|»]");
                m1 = re.Match(organization.title_INTERN);
                if (!String.IsNullOrWhiteSpace(m1.Value))
                    templateSyn.Add(m1.Groups[1].Value);
            }

            string displayName = CalcDisplayName(organization);
            templateSyn = templateSyn.Distinct().ToList();
            templateSyn.Remove(displayName);

            return templateSyn;
        }

        [NonAction]
        private List<Guid> GetTaskTypesByProfile(string profileID)
        {
            string path = HttpContext.Current.Server.MapPath("~/App_Data/ExpressDosierConfiguration.xml");
            XDocument doc = XDocument.Load(path);
            List<XElement> elements = Extensions.Descendants(doc.Descendants("profile").Where(el =>
                    el.Attribute("uid").Value.ToLower() == profileID.ToLower()
                    )).ToList();

            return elements.Select(item => new Guid(item.Attribute("uid").Value)).ToList();
        }

        #endregion
    }
}
