using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net.Http;
using System.Web.Hosting;
using System.Web.Http;
using System.Xml.Linq;
using Anbr.Web.SA.CoreLogic;
using ANBR.SemanticArchive.SDK;
using Newtonsoft.Json.Linq;
using www.Models;
using ANBR.SemanticArchive.SDK.ObjectModel;
using www.Models.Ex;
using www.Models.Items;
using www.SaGateway;
using ABS.Connectivity.Interaction;
using ANBR.SDKHelper;
using www.Models.Analyst;
using www.Models.Ex.Feed;
using www.SaGateway.Factories;

namespace www.Controllers.api
{
    public class ObjectController : ApiController
    {
        // GET api/object
        [ActionName("DefaultAction")]
        public IEnumerable<string> Get()
        {
            return new[] { "value1", "value2" };
        }

        // GET api/object/5
        [ActionName("DefaultAction")]
        public ListElement Get(int id)
        {
            var type = 0;
            ListElement output = null;
            var qs = Request.RequestUri.ParseQueryString();
            if (qs != null && qs.Count > 0)
                type = int.Parse(qs["typeid"]);

            var mt = WebSaUtilities.Database.MetaModel.MetaTypes.GetByID(type);

            if (mt != null)
            {
                #region Person

                if (mt.IsPerson)
                {
                    var prs = WebSaUtilities.Database.ObjectModel.GetObjectInfo(id);
                    var passProp = (IObjectMultiProperty)prs.Object.Properties["Паспортные_данные"];

                    output = new Person
                    {
                        id = prs.ObjectId,
                        title = prs.DisplayName,
                        typeid = prs.MetaType.ID,
                        bdate =
                                         (prs.Object.Properties["Дата_рождения"].Value != null && prs.Object.Properties["Дата_рождения"].Value != DBNull.Value)
                                             ? ((DateTime)prs.Object.Properties["Дата_рождения"].Value).ToString(
                                                 "dd.MM.yyyy")
                                             : "",
                        inn =
                                         (prs.Object.Properties["INN_Person"].Value != null && prs.Object.Properties["INN_Person"].Value != DBNull.Value)
                                             ? prs.Object.Properties["INN_Person"].Value.ToString()
                                             : "",
                        ogrnip =
                                         (prs.Object.Properties["OGRN_Person"].Value != null && prs.Object.Properties["OGRN_Person"].Value != DBNull.Value)
                                             ? prs.Object.Properties["OGRN_Person"].Value.ToString()
                                             : "",
                        pass = !passProp.IsEmpty ? passProp.Values[0].ToString() : ""
                    };
                }
                #endregion

                #region Organization

                else if (mt.IsOrganization)
                {
                    var org = WebSaUtilities.Database.ObjectModel.GetObjectInfo(id);
                    output = new Organisation
                    {
                        id = org.ObjectId,
                        title = org.DisplayName,
                        typeid = 10022, //org.MetaType.ParentId,
                        inn =
                                         (org.Object.Properties["INN_Org"].Value != null && org.Object.Properties["INN_Org"].Value != DBNull.Value)
                                             ? org.Object.Properties["INN_Org"].Value.ToString()
                                             : "",
                        ogrn =
                                         (org.Object.Properties["OGRN"].Value != null && org.Object.Properties["OGRN"].Value != DBNull.Value)
                                             ? org.Object.Properties["OGRN"].Value.ToString()
                                             : "",
                        okpo =
                                         (org.Object.Properties["ОКПО"].Value != null && org.Object.Properties["ОКПО"].Value != DBNull.Value)
                                             ? org.Object.Properties["ОКПО"].Value.ToString()
                                             : ""
                    };
                }
                else
                {
                    var obj = WebSaUtilities.Database.ObjectModel.GetObjectInfo(id);

                    output = new ListElement
                    {
                        id = obj.ObjectId,
                        uid = obj.Object.Uid.ToString(),
                        title = obj.DisplayName
                    };
                }

                #endregion
            }

            #region Default

            else
            {
                var obj = WebSaUtilities.Database.ObjectModel.GetObjectInfo(id);

                output = new ListElement
                {
                    id = obj.ObjectId,
                    uid = obj.Object.Uid.ToString(),
                    title = obj.DisplayName
                };
            }

            #endregion

            return output;
        }

        /// <summary>
        /// Импортирует заданный объект из другого проекта
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/object/import/{id:int}")]
        public string ImportObjectFromOtherProject(int id)
        {
            int? currentProjectID = Scope.GetInternalPrjIDi();
            if (!currentProjectID.HasValue)
                throw new InvalidOperationException("Available only in project's mode");

            var saDB = WebSaUtilities.Database;
            DataRow row = saDB._PropertyFastGet(id, new[] { _SAConst.Наименование, _SAConst.Project_ID });
            if (row == null)
                throw new InvalidOperationException("Object is not found");

            var dn = row.Field<string>(0);
            var targetProjectID = row.Field<int?>(1);
            if (targetProjectID == currentProjectID)
                throw new InvalidOperationException("Available only in A project is not equal to B project");
            if (!targetProjectID.HasValue) throw new InvalidOperationException("Target project for imported object doesn't defined");


            string userID = WebSaUtilities.GetCurrentUserID();
            string dbID = Scope.GetCurrentDBID();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;
            string dbKey = dbID + "|$|" + dbName;
            var ci = System.Threading.Thread.CurrentThread.CurrentUICulture;

            HostingEnvironment.QueueBackgroundWorkItem(ct =>
            {
                var jobUid = Import(id, saDB, targetProjectID.Value, currentProjectID.Value);
                NotificationBL.RegisterExportToProjectEvent(currentProjectID.Value, dn, userID, dbKey, jobUid, ci);
            });
            
            return Root.GetResource("ImportCheck_Message", ci);
        }

        [HttpGet]
        [Route("api/object/card/{id:int}")]
        public ContentCollection ObjectCardGet(int id)
        {
            var saDB = WebSaUtilities.Database;
            var module = FactoryModuleEntities.GetModule(ModuleEntitiesKind.Organization, saDB, new Dictionary<string, object>());

            return module.Get(id);
        }


        [HttpGet]
        [Route("api/object/card/{id:int}/tpl_{kind:int}")]
        public ContentCollection ObjectCardSectionGet(int id, FactoryModuleEntities.SectionsTemplate kind, int page = 1)
        {
            var saDB = WebSaUtilities.Database;

            switch (kind)
            {
                case FactoryModuleEntities.SectionsTemplate.Organization_Activities:
                    return SDKHelper.GetDataByTypeName(saDB, id, _SAConst.Type_OKVED, page);
                case FactoryModuleEntities.SectionsTemplate.Organization_Addresses:
                    return SDKHelper.GetDataByTypeName(saDB, id, _SAConst.Type_Адрес, page);
                case FactoryModuleEntities.SectionsTemplate.Organization_Phones:
                    return SDKHelper.GetDataByTypeName(saDB, id, _SAConst.Type_Phone_number, page);
                case FactoryModuleEntities.SectionsTemplate.Organization_Sites:
                    return SDKHelper.GetDataByTypeName(saDB, id, _SAConst.Type_Website, page);
                case FactoryModuleEntities.SectionsTemplate.Organization_Management:
                    return SDKHelper.GetDataByTypeName(saDB, id, _SAConst.Type_Rabota_v_dolgnosti, page);
                default:
                    throw new ArgumentOutOfRangeException(nameof(kind), kind, null);
            }
        }

        [HttpPost]
        [Route("api/object/card/{id:int}/tpl_{kind:int}")]
        public JObject ObjectCardSectionNew(int id, FactoryModuleEntities.SectionsTemplate kind, JObject model)
        {
            var saDB = WebSaUtilities.Database;

            switch (kind)
            {
                case FactoryModuleEntities.SectionsTemplate.Organization_Activities:
                case FactoryModuleEntities.SectionsTemplate.Organization_Addresses:
                case FactoryModuleEntities.SectionsTemplate.Organization_Phones:
                case FactoryModuleEntities.SectionsTemplate.Organization_Sites:
                case FactoryModuleEntities.SectionsTemplate.Organization_Management:
                default:
                    throw new ArgumentOutOfRangeException(nameof(kind), kind, null);
            }
        }

        [HttpPut]
        [Route("api/object/card/{id:int}/tpl_{kind:int}/{linkedid:int}")]
        public JObject ObjectCardSectionModify(int id, FactoryModuleEntities.SectionsTemplate kind, int linkedid, JObject model)
        {
            var saDB = WebSaUtilities.Database;

            switch (kind)
            {
                case FactoryModuleEntities.SectionsTemplate.Organization_Activities:
                case FactoryModuleEntities.SectionsTemplate.Organization_Addresses:
                case FactoryModuleEntities.SectionsTemplate.Organization_Phones:
                case FactoryModuleEntities.SectionsTemplate.Organization_Sites:
                case FactoryModuleEntities.SectionsTemplate.Organization_Management:
                default:
                    throw new ArgumentOutOfRangeException(nameof(kind), kind, null);
            }
        }

        [NonAction]
        Guid Import(int id, IDataBase saDB, int sourceProjectId, int targetProjectId)
        {
            var typeIDRoot = saDB.MetaModel.RootType.ID;

            var listEntityObjInclAll =
                saDB.ObjectService.GetLinkedObjectsByBaseType(
                    new[] { id }, typeIDRoot)
                    .Where(item => !item.Deleted && item.Project_ID == sourceProjectId)
                    .Select(item => item.Object_ID).ToList();

            listEntityObjInclAll.Add(id);

            var spec = new XDocument(
                new XElement("doc",
                    new XAttribute("kind", "o2p"),
                    new XElement("Data",
                        new XAttribute("sourceProject", sourceProjectId),
                        new XAttribute("targetProject", targetProjectId),
                        new XText(string.Join(",", listEntityObjInclAll.Distinct().Select(item => item.ToString())))
                        )
                    )
                );

            return saDB.ObjectService.ExportData(spec.ToString());
        }


        [Route("api/object/universal/{id:int}")]
        public ContentItem GetUniversalData(int id)
        {
            IDataBase saDB = WebSaUtilities.Database;

            ISaObject obj = saDB.ObjectModel.GetObject(id);
            var meta = saDB.MetaModel.MetaProperties;

            var mObject_ID = meta.GetByName("Object_ID");
            var mDisplay_Name = meta.GetByName("Display_Name");
            var mTextSource = meta.GetByName("TextSource");
            var mAuthor = meta.GetByName("Author");
            var mPublicationDate = meta.GetByName("Дата_публикации");
            var mMassMedia = meta.GetByName("MassMedia");
            var mIsMedia = meta.GetByName("IsMedia");

            var ci = new ContentItem()
                .AddProperty(mObject_ID, obj.ObjectId)
                .AddProperty(mDisplay_Name, obj.DisplayName)
                .AddProperty(mTextSource, saDB._PropValue(obj.Properties[mTextSource.SystemName], ", "))
                .AddProperty(mAuthor, saDB._PropValue(obj.Properties[mAuthor.SystemName], ", "))
                .AddProperty(mPublicationDate, saDB._PropValue(obj.Properties[mPublicationDate.SystemName], ", "))
                .AddProperty(mMassMedia, saDB._PropValue(obj.Properties[mMassMedia.SystemName], ", "))
                .AddProperty(mIsMedia, saDB._PropValue(obj.Properties[mIsMedia.SystemName], ", "));

            ci.LinkAdd("meta", "MetaType.ID", obj.MetaType.ID.ToString());
            ci.LinkAdd("meta", "MetaType.IsOrganization", obj.MetaType.IsOrganization.ToString());
            ci.LinkAdd("meta", "MetaType.IsFact", obj.MetaType.IsFact.ToString());
            ci.LinkAdd("meta", "MetaType.IsSource", obj.MetaType.IsSource.ToString());
            ci.LinkAdd("meta", "MetaType.IsPerson", obj.MetaType.IsPerson.ToString());

            return ci;
        }

        // POST api/object
        [ActionName("DefaultAction")]
        public int Post(JObject value)
        {
            var jObject = value;
            if (jObject != null)
            {
                IDataBase saDb = WebSaUtilities.Database;
                int? projectId = Scope.GetInternalPrjIDi();

                var typeid = jObject.Property("typeid").Value.ToObject<Int32>();
                var mt = saDb.MetaModel.MetaTypes.GetByID(typeid);
                var obj = saDb.ObjectModel.CreateObject(mt);
                obj.ProjectId = projectId;
                obj.ProjectRoleId = null;

                SDKHelper.SaveObject(saDb, projectId, null, ref obj, jObject);
                return obj.ObjectId;
            }
            return -1;
        }

        // PUT api/object/5
        [ActionName("DefaultAction")]
        public void Put(JObject value)
        {
            var jObject = value;
            if (jObject == null) return;
            var id = jObject.Property("id").Value.ToObject<Int32>();

            IDataBase saDb = WebSaUtilities.Database;
            int? projectId = Scope.GetInternalPrjIDi();

            var obj = saDb.ObjectModel.GetObject(id);

            SDKHelper.SaveObject(saDb, obj.ProjectId, obj.ProjectRoleId, ref obj, jObject);
        }

        // DELETE api/object/5
        [ActionName("DefaultAction")]
        public void Delete(int id)
        {
            var obj = WebSaUtilities.Database.ObjectModel.GetObject(id);
            obj.Delete(true);
        }

    }
}
