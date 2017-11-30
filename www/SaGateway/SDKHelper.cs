using System.Drawing;
using System.Text.RegularExpressions;
using ANBR.Common.Contarcts;
using ANBR.Common.Filters;
using ANBR.Monitoring;
using ANBR.Reporting.Contracts;
using ANBR.SAMetaModel;
using ANBR.SAQueryBuilder;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.Dictionaries;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.SemanticArchive.SDK.ObjectModel;
using ANBR.SemanticArchive.SDK.Queries;
using ANBR.Tasks.RobotContracts.CommonSettings;
using ANBR.Tasks.Saver;
using Model.Utils;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Web.Hosting;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model.check;
using ANBR.Common;
using ANBR.Query.Common;
using ANBR.Web.ExternalCore.Common;
using www.Helpers;
using www.Models;
using www.Models.Ex.Feed;
using www.Models.ExpressDossier;
using www.Models.Items;
using www.SaGateway.BL;
using Color = System.Drawing.Color;
using Source = www.Models.Analyst.Source;
using Task = ANBR.Monitoring.Task;

namespace www.SaGateway
{
    public static class SDKHelper
    {
#warning Необходимо перенести логику взаимодействия с СА в единственный общий proxy класс ANBR.SDKHelper.SDKExt

        public static Guid SAAdminBridgeKey => new Guid("026BA06C-68B2-4648-B74F-7390A543A7EC");

        /// <summary>
        /// 
        /// </summary>
        /// <param name="title"></param>
        /// <param name="phrase"></param>
        /// <param name="page"></param>
        /// <param name="rubricid"></param>
        /// <param name="rootTypeID"></param>
        /// <returns></returns>
        public static IQueryResult FullTextSearchQuery(string title, string phrase, int page, int rubricid,
            int? rootTypeID = null)
        {
#warning rootTypeID - при поиске по рубрике фильтр по типу не реализован

            SqlCommand cmd = null;
            if (!String.IsNullOrWhiteSpace(phrase) && !String.IsNullOrWhiteSpace(title))
            {
                cmd = new SqlCommand(String.Format(@"
                    SET ROWCOUNT 0;
                    select count('x') as TotalRowsNumber
                    from 
	                    [dbo].[ObjectData] o inner join containstable(dbo.ObjectData, 
		                    ([TextSource]), @searchText) AS KEY_TBL
                    ON (o.[Object_ID] = KEY_TBL.[KEY]) inner join containstable(dbo.ObjectData, 
		                    ([Display_Name]), @titleText) AS KEY_TBL1
                    ON (o.[Object_ID] = KEY_TBL1.[KEY]) 
                    where o.Deleted = 0 
                       and ( -1 = {0} or exists (
								    select 'x'
									    from [dbo].[ObjectByRubric] obr inner join [dbo].[GetChildRubrics]({0}) cbr on
									    (obr.[Rubric_ID] = cbr.[Rubric_ID])
								    where obr.[Object_ID] = o.[Object_ID]
							     ));

                    WITH sources_veiw AS (
                    select
                        ROW_NUMBER() OVER (order by o.[Object_ID]) as RowNumber,
	                    o.[Object_ID], 
	                    o.[Display_Name], 
	                    o.[Type_ID], 
	                    o.[TypeDispName],
	                    o.[CreatedDate], 
	                    o.[ModifyDate], 
	                    o.[UID],
	                    o.[FullName], 
	                    o.[LastModificator], 
	                    o.[Creator]
                    from 
	                    [dbo].[ObjectData] o inner join containstable(dbo.ObjectData, 
		                    ([TextSource]), @searchText) AS KEY_TBL
                    ON (o.[Object_ID] = KEY_TBL.[KEY]) inner join containstable(dbo.ObjectData, 
		                    ([Display_Name]), @titleText) AS KEY_TBL1
                    ON (o.[Object_ID] = KEY_TBL1.[KEY]) 
                    where o.Deleted = 0 --and o.[Display_Name] like @title
                       and ( -1 = {0} or exists (
								    select 'x'
									    from [dbo].[ObjectByRubric] obr inner join [dbo].[GetChildRubrics]({0}) cbr on
									    (obr.[Rubric_ID] = cbr.[Rubric_ID])
								    where obr.[Object_ID] = o.[Object_ID]
							     ))
                )
                SELECT * from sources_veiw
                WHERE
                    RowNumber >= {1} and RowNumber <= {2};
                ", rubricid, (page - 1) * Root.PAGE_SIZE + 1,
                    page * Root.PAGE_SIZE));

                string searchText = $"FORMSOF(INFLECTIONAL, \"{phrase.Replace(@"""", @"""""")}\")";
                var titleText = $"FORMSOF(INFLECTIONAL, \"{title.Replace(@"""", @"""""")}\")";
                cmd.Parameters.Add(new SqlParameter("@searchText", searchText.SQLSafe()));
                cmd.Parameters.Add(new SqlParameter("@titleText", titleText.SQLSafe()));
            }
            else if (!String.IsNullOrWhiteSpace(phrase))
            {
                cmd = new SqlCommand(String.Format(@"
                        SET ROWCOUNT 0;
                        select count('x') as TotalRowsNumber
                        from 
	                        [dbo].[ObjectData] o inner join containstable(dbo.ObjectData, 
		                        ([TextSource]), @searchText) AS KEY_TBL
                        ON (o.[Object_ID] = KEY_TBL.[KEY]) where o.Deleted = 0 and
                        ( -1 = {0} or exists (
								select 'x'
									from [dbo].[ObjectByRubric] obr inner join [dbo].[GetChildRubrics]({0}) cbr on
									(obr.[Rubric_ID] = cbr.[Rubric_ID])
								where obr.[Object_ID] = o.[Object_ID]
							 ));
            
                        WITH sources_veiw AS (
                        select 
                            ROW_NUMBER() OVER (order by o.[Object_ID]) as RowNumber,
	                        o.[Object_ID], 
                            o.[UID],
	                        o.[Display_Name], 
	                        o.[Type_ID], 
	                        o.[TypeDispName],
	                        o.[CreatedDate], 
	                        o.[ModifyDate], 
	                        o.[FullName], 
	                        o.[LastModificator], 
	                        o.[Creator]
                        from 
	                        [dbo].[ObjectData] o inner join containstable(dbo.ObjectData, 
		                        ([TextSource]), @searchText) AS KEY_TBL
                        ON (o.[Object_ID] = KEY_TBL.[KEY]) where o.Deleted = 0 and
                             (-1 = {0} or exists (
								    select 'x'
									    from [dbo].[ObjectByRubric] obr inner join [dbo].[GetChildRubrics]({0}) cbr on
									    (obr.[Rubric_ID] = cbr.[Rubric_ID])
								    where obr.[Object_ID] = o.[Object_ID]))
                        )
                        SELECT * from sources_veiw
                        WHERE
                            RowNumber >= {1} and RowNumber <= {2};

", rubricid, (page - 1) * Root.PAGE_SIZE + 1, page * Root.PAGE_SIZE));

                var paramValue = $"FORMSOF(INFLECTIONAL, \"{phrase.Replace(@"""", @"""""")}\")";
                cmd.Parameters.Add(new SqlParameter("@searchText", paramValue.SQLSafe()));
            }
            else if (!String.IsNullOrWhiteSpace(title))
            {
                cmd = new SqlCommand(String.Format(@"
                        SET ROWCOUNT 0;
                        select count('x') as TotalRowsNumber
                        from 
	                        [dbo].[ObjectData] o inner join containstable(dbo.ObjectData, 
		                        ([Display_Name]), @searchText) AS KEY_TBL
                        ON (o.[Object_ID] = KEY_TBL.[KEY]) where o.Deleted = 0 and
                        ( -1 = {0} or exists (
								select 'x'
									from [dbo].[ObjectByRubric] obr inner join [dbo].[GetChildRubrics]({0}) cbr on
									(obr.[Rubric_ID] = cbr.[Rubric_ID])
								where obr.[Object_ID] = o.[Object_ID]
							 ));
            
                        WITH sources_veiw AS (
                        select 
                            ROW_NUMBER() OVER (order by o.[Object_ID]) as RowNumber,
	                        o.[Object_ID], 
                            o.[UID],
	                        o.[Display_Name], 
	                        o.[Type_ID], 
	                        o.[TypeDispName],
	                        o.[CreatedDate], 
	                        o.[ModifyDate], 
	                        o.[FullName], 
	                        o.[LastModificator], 
	                        o.[Creator]
                        from 
	                        [dbo].[ObjectData] o inner join containstable(dbo.ObjectData, 
		                        ([Display_Name]), @searchText) AS KEY_TBL
                        ON (o.[Object_ID] = KEY_TBL.[KEY]) where o.Deleted = 0 and
                             (-1 = {0} or exists (
								    select 'x'
									    from [dbo].[ObjectByRubric] obr inner join [dbo].[GetChildRubrics]({0}) cbr on
									    (obr.[Rubric_ID] = cbr.[Rubric_ID])
								    where obr.[Object_ID] = o.[Object_ID]))
                        )
                        SELECT * from sources_veiw
                        WHERE
                            RowNumber >= {1} and RowNumber <= {2};

", rubricid, (page - 1) * Root.PAGE_SIZE + 1, page * Root.PAGE_SIZE));

                var paramValue = $"FORMSOF(INFLECTIONAL, \"{title.Replace(@"""", @"""""")}\")";
                cmd.Parameters.Add(new SqlParameter("@searchText", paramValue.SQLSafe()));
            }
            if (cmd != null)
            {
                var sql = cmd.CommandAsSql();
                return WebSaUtilities.Database.QueriesProvider.ExecuteQuery(sql);
            }
            return null;
        }

        internal static List<Tuple<int, Task>> GetLinkedTasks(int mainObjectID, IGateway mbf = null, IDataBase db = null)
        {
            if (mbf == null)
                mbf = WebSaUtilities.MBF;
            if (db == null)
                db = WebSaUtilities.Database;

            var result = new List<Tuple<int, Task>>();

            DataTable data = GetObjectsLinkedTo(db, new[] { _SAConst.Object_ID, _SAConst.Assembly_Name }, mainObjectID, _SAConst.Type_WebTask);
            foreach (DataRow row in data.Rows)
            {
                Guid taskUid;
                var tuid = row.Field<string>(_SAConst.Assembly_Name);
                Guid.TryParse(tuid, out taskUid);

                Task task = null;
                if (taskUid != default(Guid))
                    task = mbf.Tasks.GetTaskById(taskUid);

                if (task != null)
                    result.Add(new Tuple<int, Task>(row.Field<int>(_SAConst.Object_ID), task));
            }

            return result;


            /*
                        ISaObject saO = GetSAObject(mainObjectID, db);
                        if (saO == null) return result;

                        var skipZayInRels = !TypeIsChild(_SAConst.Type_Request, saO.MetaType.SystemName, db);
                        if (saO.Relations != null)
                        {
                            for (int index = 0; index < saO.Relations.Count; index++)
                            {
                                IRelationInfo rel;
                                try
                                {
                                    rel = saO.Relations[index];
                                }
                                catch (System.ArgumentOutOfRangeException)
                                //экранируем исключение нечасто, но возникает (возможно коллизии конкурентной работы...)
                                {
                                    continue;
                                }

                                if (rel.OtherObject.MetaType != null)
                                //////////////////////////////////////////////////////////////// && rel.Relation.FromRole.SystemName==_SAConst.Role_Является_проверяемым_объектом)
                                {
                                    // если id - не заявка, то отбросить все поисковые задачи, связанные с заявками! 
                                    // То есть поисковая задача должна быть связана только с персоной, но не с заявкой по ней.
                                    if (rel.OtherObject.MetaType.SystemName == _SAConst.Type_WebTask)
                                    {
                                        int searchTaskID = rel.OtherObject.ObjectId;
                                        var sa1 = GetSAObject(searchTaskID, db);
                                        if (sa1.Properties[_SAConst.Assembly_Name] != null) //для совместимости со старыми версиями
                                        {
                                            var taskUid = default(Guid);
                                            var guidStr = (string)sa1.Properties[_SAConst.Assembly_Name].Value;
                                            Guid.TryParse(guidStr, out taskUid);

                                            Task task = null;
                                            if (taskUid != default(Guid))
                                                task = mbf.Tasks.GetTaskById(taskUid);

                                            if (task != null)
                                                result.Add(new Tuple<int, Task>(searchTaskID, task));
                                        }
                                    }
                                }
                            }

                        }
                        return result;
            */
        }

        internal static List<Tuple<int, Task>> GetLinkedTasks(int mainObjectID, List<Tuple<int, Guid>> linkedTaskIds,
            IGateway mbf = null, IDataBase db = null)
        {
            if (mbf == null)
                mbf = WebSaUtilities.MBF;
            if (db == null)
                db = WebSaUtilities.Database;

            return
                linkedTaskIds.Select(item => new Tuple<int, Task>(item.Item1, mbf.Tasks.GetTaskById(item.Item2)))
                    .ToList();
        }


        /// <summary>
        /// Создаёт объекта СА - поисковую задачу, связывает с объектом мониторинга monitoringObjectID
        /// </summary>
        internal static int CreateSearchTask(int monitoringObjectID, int requestId, string searchTaskUid,
            string taskName, int searchTaskObjectID, IDataBase dataBase, int? projectID)
        {
            if (searchTaskObjectID <= 0 && !string.IsNullOrEmpty(searchTaskUid))
            {
                var vals = new Dictionary<string, object>();
                vals[_SAConst.Assembly_Name] = searchTaskUid;
                if (projectID.HasValue)
                    vals[_SAConst.Project_ID] = projectID.Value;
                searchTaskObjectID = GetObjectIDByProps(_SAConst.Type_WebTask, vals, dataBase);
            }

            if (searchTaskObjectID <= 0)
                try
                {
                    if (string.IsNullOrEmpty(searchTaskUid))
                        throw new Exception("CreateSearchTask_ErrorSaveSearchTask, TaskName" + taskName);

                    var saO =
                        dataBase.ObjectModel.CreateObject(dataBase.MetaModel.MetaTypes.GetByName(_SAConst.Type_WebTask));
                    saO.DisplayName = string.Format(Properties.Resources.MBF_CreatedTaskName, taskName);
                    saO.Properties[_SAConst.Assembly_Name].Value = searchTaskUid;
                    if (projectID.HasValue)
                        saO.ProjectId = projectID;
                    saO.Save();
                    if (monitoringObjectID > 0)
                    {
                        var r = dataBase.MetaModel.MetaRoles.TryGetByName(_SAConst.Role_Содержит_проверяемые_объекты);
                        if (r == null)
                            throw new TaskException(
                                string.Format(Properties.Resources.SAHelper_CreateSearchTask_NoMetaRole,
                                    _SAConst.Role_Содержит_проверяемые_объекты), ResultCode.ErrorSave);
                        saO.CreateRelation(r, monitoringObjectID);
                    }
                    if (requestId > 0)
                    {
                        var r = dataBase.MetaModel.MetaRoles.GetByName(_SAConst.Role_Относится_к_заявке_или_проверке);
                        if (r == null)
                            throw new TaskException(
                                string.Format(Properties.Resources.SAHelper_CreateSearchTask_NoMetaRole,
                                    _SAConst.Role_Относится_к_заявке_или_проверке), ResultCode.ErrorSave);
                        saO.CreateRelation(r, requestId);
                    }
                    saO.Save();
                    searchTaskObjectID = saO.Id;
                }
                catch (Exception eee)
                {
                    if (eee is TaskException) throw;

                    throw new Exception("CreateSearchTask error, TaskName = " + taskName, eee);
                }
            return searchTaskObjectID;
        }

        /// <summary>
        /// Позволяет вернуть идентификатор объекта на основе списка критериев
        /// </summary>
        /// <param name="typeName">Тип объекта</param>
        /// <param name="vals">Справочник свойство=значение</param>
        /// <param name="externalDB">БД</param>
        /// <returns></returns>
        private static int GetObjectIDByProps(string typeName, Dictionary<string, object> vals,
            IDataBase externalDB = null)
        {
            var mt = (externalDB ?? WebSaUtilities.Database).MetaModel.MetaTypes.GetByName(typeName);
            if (mt == null) return -1;

            IQuery qr = (externalDB ?? WebSaUtilities.Database).QueriesProvider.CreateQuery();
            qr.Sql = "select object_id from [" + mt.TableName + "] where deleted=0";
            string and = " and ";
            foreach (string prName in vals.Keys)
            {
                qr.Sql += and + prName + "=@Prrr" + prName;
                if (vals[prName] is DateTime)
                    qr.Parameters.CreateParam("@Prrr" + prName, QueryParameterType.DateTime).Value = new object[]
                        {vals[prName]};
                else if (vals[prName] is int)
                    qr.Parameters.CreateParam("@Prrr" + prName, QueryParameterType.Int).Value = new object[]
                        {vals[prName]};
                else
                    qr.Parameters.CreateParam("@Prrr" + prName, QueryParameterType.String).Value = new object[]
                        {vals[prName].ToString()};
            }
            IQueryResult qres = qr.Execute();
            foreach (DataRow row in qres.DataSet.Tables[0].Rows)
            {
                return (int)row.ItemArray[0];
            }

            return -1;
        }

        internal static ISaObject GetSAObject(int id, IDataBase db = null)
        {
            db = db ?? WebSaUtilities.Database;

            if (id <= 0) return null;
            var sa = db.ObjectModel.GetObject(id);
            if (sa != null && !sa.IsDeleted)
                return sa;

            return null;
        }

        private static bool TypeIsChild(string rootTName, string typeName, IDataBase db = null)
        {
            db = db ?? WebSaUtilities.Database;

            var root = db.MetaModel.MetaTypes.GetByName(rootTName);
            var second = db.MetaModel.MetaTypes.GetByName(typeName);
            return root.AllChildren().Contains(second);
        }

        internal static string GetPropValue(IObjectProperty prop)
        {
            return WebSaUtilities.Database._PropValue(prop);
        }

        public static Source GetSourceByID(int id)
        {
            ISaObject obj = WebSaUtilities.Database.ObjectModel.GetObject(id);
            if (obj.MetaType.IsSource)
            {
                var source = (ISource)obj;
                if (!string.IsNullOrWhiteSpace(source.Text))
                {
                    //source.TranslateText();
                    return new Source { Text = source.Text };
                }
            }

            return new Source();
        }

        public static IEnumerable<AutocompleteItem> GetDictionaryItems(string systemPropName)
        {
            IMetaProperty mp = WebSaUtilities.Database.MetaModel.MetaProperties.GetByName(systemPropName);
            IMetaDictionary md = mp.Dictionary;
            var dic = WebSaUtilities.Database.DictionaryModel.GetDictionary(md);
            IDictionaryValues listValues = dic.Values;

            var resList = new AutocompleteItem[listValues.Count];

            int i = 0;
            foreach (IDataElement item in listValues)
                resList[i++] = new AutocompleteItem { id = item.Id, value = item.DisplayName, label = item.DisplayName };

            return resList;
        }

        public static IEnumerable<ListElement> GetRolesForLink(int leftTypeID, int rigthTypeID)
        {
            List<ListElement> list = new List<ListElement>();

            foreach (IMetaRole metaRole in WebSaUtilities.Database.MetaModel.MetaRoles)
            {
                try
                {
                    if (WebSaUtilities.Database.MetaModel.ValidateRelation(leftTypeID, rigthTypeID, metaRole.ID))
                        list.Add(new ListElement { id = metaRole.ID, title = metaRole.DisplayName });
                }
                catch
                {
                }
            }

            return list;
        }


        /// <summary>
        /// Количество фактов
        /// </summary>
        /// <param name="saDb"></param>
        /// <param name="id">ID объекта</param>
        /// <param name="group">Группа объектов</param>
        /// <returns></returns>
        public static int GetFactsForStats(IDataBase saDb, int id, SAObjectsGroup group)
        {

            string sqlTemplate = @"
    declare @typeid int;
	select @typeid = type_ID from objectdata (nolock) where object_ID = @LeftObject_ID
	IF (exists 
		        (
		        select 1 from [dbo].[GetParentTypeId](@typeid) P inner join 
		        meta_entities M (nolock) on M.meta_entity_id = P.meta_type_id 
		        where M.SystemName = 'Entity'
		        )
    )
	BEGIN
        select count(d.[Object_ID])
        from dbo.Relations r inner join dbo.ObjectData d on (r.RightObject_ID = d.[Object_ID])
        where 
	        r.LeftObject_ID = @LeftObject_ID and
	        d.Deleted = 0 and
	        [dbo].[IsMyParentAFact](d.[Type_ID]) = 1
    END ELSE
    BEGIN
        select count(d.[Object_ID])
        from [dbo].[SourceRelations] r inner join dbo.ObjectData d on (r.[Object_ID] = d.[Object_ID])
        where 
	        r.[Source_ID] = @LeftObject_ID and
	        d.Deleted = 0 and
	        [dbo].[IsMyParentAFact](d.[Type_ID]) = 1
    END
";

            var queryParameters = new List<SaQueryParameter>
            {
                new SaQueryParameter {DbType = DbType.Int32, Name = "@LeftObject_ID", Value = new object[] {id}}
            };

            var query = new SQLQuery
            {
                Text = sqlTemplate,
                QueryParameters = queryParameters
            };

            SqlQueryResult qres = saDb.QueryService.ExecuteNativeSQLQueryAsIs(query);

            return (int)qres.Result.Tables[0].Rows[0][0];
        }

        public static List<ListElement> GetMentions(int id)
        {
            var obj = WebSaUtilities.Database.ObjectModel.GetObject(id) as ISource;
            if (obj != null)
            {
                return (from IMentioning item in obj.Mentionings
                        orderby item.Object.TypeName, item.DisplayName
                        select new ListElement
                        {
                            id = item.Object.ObjectId,
                            uid = item.Object.Object.Uid.ToString(),
                            typeid = item.Object.MetaType.ID,
                            title = item.Object.DisplayName,
                            type = item.Object.TypeName
                        }

                ).ToList();
            }

            return new List<ListElement>();
        }

        public static IEnumerable<ListElement> GetEntityObjects(int id)
        {
            IMetaType metaEntityObject = WebSaUtilities.Database.MetaModel.MetaTypes.GetByName("EntityObject");

            ISaObject obj = WebSaUtilities.Database.ObjectModel.GetObject(id);

            return (from IRelationInfo item in obj.Relations
                    where item.OtherObject.MetaType.IsType(metaEntityObject)
                    select item.OtherObject.Object
                into eo
                    select new ListElement
                    {
                        id = eo.ObjectId,
                        uid = eo.Object.Uid.ToString(),
                        typeid = eo.MetaType.ID,
                        title = eo.DisplayName,
                        type = eo.TypeName
                    }).ToArray();
        }

        private static Dictionary<string, ISettingsCommon> _cacheISettingsTypes = new Dictionary<string, ISettingsCommon>();

        private static Dictionary<string, string> _cacheSettingsTypeNames = new Dictionary<string, string>();
        private static readonly Dictionary<string, Type> _cacheSettingsTypes = new Dictionary<string, Type>();


        public static List<TaskTypeByCategoriesInfo> Search_GetRobotsByType(IMetaType metaType, int? profileID)
        {
            string sysNamesParents = metaType.SystemName;
            while (metaType.ParentEntity != null)
            {
                sysNamesParents += "," + metaType.ParentEntity.SystemName;
                metaType = (IMetaType)metaType.ParentEntity;
            }

            TypesCategory[] typesCategory = WebSaUtilities.MBF.GetAllCategoriesLinkedBy(sysNamesParents, profileID,
                WebSaUtilities.GetCurrentContextData());
            return typesCategory.Select(item => new TaskTypeByCategoriesInfo
            {
                id = item.Id,
                parentid = item.ParentId,
                title = item.Name,
                TaskTypes = item.Types.Select(tt => new TaskTypeInfo
                {
                    id = tt.TypeUid,
                    title = tt.Name,
                    Kind = tt.Kind,
                    price = tt.Goods != null ? tt.Goods.Sum(g => g.Price ?? 0) : (decimal?)null,
                    goods =
                        tt.Goods != null
                            ? tt.Goods.Select(g => new GoodsInfo { id = g.ID, title = g.Title, price = g.Price })
                                .ToArray()
                            : null
                }).ToArray()
            }).ToList();
        }

        public static List<TaskTypeByCategoriesInfo> Search_GetAllRobots()
        {
            TypesCategory[] typesCategory = WebSaUtilities.MBF.GetAllCategories(WebSaUtilities.GetCurrentContextData());
            return typesCategory.Select(item => new TaskTypeByCategoriesInfo
            {
                id = item.Id,
                parentid = item.ParentId,
                title = item.Name,
                TaskTypes = item.Types.Select(tt => new TaskTypeInfo
                {
                    id = tt.TypeUid,
                    title = tt.Name,
                    Kind = tt.Kind,
                    price = tt.Goods != null ? tt.Goods.Sum(g => g.Price ?? 0) : (decimal?)null,
                    goods =
                        tt.Goods != null
                            ? tt.Goods.Select(g => new GoodsInfo { id = g.ID, title = g.Title, price = g.Price })
                                .ToArray()
                            : null
                }).ToArray()
            }).ToList();
        }

        public static ISaObject AssignSimpleValues(this ISaObject saObject, IDataBase saDB, JObject jObject,
            int? projectId, int? projectRole_Id,
            Tuple<string, string>[] mappings)
        {
            var so = new SavedObject();
            so.typeName = saObject.MetaType.SystemName;
            so.property[_SAConst.Наименование] = saObject.DisplayName;

            foreach (var pair in mappings)
            {
                string saPropName = pair.Item2;
                JProperty jProp = jObject.Property(pair.Item1);
                if (jProp == null) continue;
                IObjectProperty saProp = saObject.Properties[saPropName];
                string strVal = jProp.Value != null ? jProp.Value.ToString().Trim() : null;
                if (String.IsNullOrWhiteSpace(strVal)) continue;

                so.property[saPropName] = strVal;
            }

            var saverSA4 = new ANBR.SDKHelper.DataSaverSA4(saDB);
            int objID = saverSA4.CreateObject(so, saObject.Id, projectId, projectRole_Id);

            return saDB.ObjectModel.GetObject(objID);
        }

        public static Type GetTypeByName(string assemblyName, string className)
        {
            var key = assemblyName + "\\" + className;
            if (_cacheSettingsTypes.ContainsKey(key))
                return _cacheSettingsTypes[key];
            string assemblyPath = Path.Combine(System.Windows.Forms.Application.StartupPath, assemblyName);
            if (!File.Exists(assemblyPath)) return null;
            Assembly asm = SettingsCache.Instance.GetAssembly(assemblyPath);
            try
            {
                var t = asm.GetType(className);
                _cacheSettingsTypes[key] = t;
                return t;
            }
            catch
            {
            }
            _cacheSettingsTypes.Add(key, null);
            return null;
        }

        public static String ParameterValueForSQL(this SqlParameter sp)
        {
            String retval = "";

            switch (sp.SqlDbType)
            {
                case SqlDbType.Char:
                case SqlDbType.NChar:
                case SqlDbType.NText:
                case SqlDbType.NVarChar:
                case SqlDbType.Text:
                case SqlDbType.Time:
                case SqlDbType.VarChar:
                case SqlDbType.Xml:
                    retval = "N'" + sp.Value.ToString().Replace("'", "''") + "'";
                    break;
                case SqlDbType.Date:
                    retval = "'" + ((DateTime)sp.Value).ToString("yyyy-MM-dd") + "'";
                    break;
                case SqlDbType.DateTime2:
                case SqlDbType.DateTimeOffset:
                case SqlDbType.DateTime:
                    retval = "'" + ((DateTime)sp.Value).ToString("yyyy-MM-ddTHH:mm:ss.fff") + "'";
                    break;
                case SqlDbType.Bit:
                    retval = (bool)sp.Value ? "1" : "0";
                    break;
                default:
                    retval = sp.Value.ToString();
                    break;
            }

            return retval;
        }

        public static String CommandAsSql(this SqlCommand sc)
        {
            StringBuilder sql = new StringBuilder();
            Boolean FirstParam = true;

            switch (sc.CommandType)
            {
                case CommandType.StoredProcedure:
                    sql.AppendLine("declare @return_value int;");

                    foreach (SqlParameter sp in sc.Parameters)
                    {
                        if ((sp.Direction == ParameterDirection.InputOutput) ||
                            (sp.Direction == ParameterDirection.Output))
                        {
                            sql.Append("declare " + sp.ParameterName + "\t" + sp.SqlDbType.ToString() + "\t= ");

                            sql.AppendLine((sp.Direction == ParameterDirection.Output
                                               ? "null"
                                               : sp.ParameterValueForSQL()) + ";");

                        }
                    }

                    sql.AppendLine("exec [" + sc.CommandText + "]");

                    foreach (SqlParameter sp in sc.Parameters)
                    {
                        if (sp.Direction != ParameterDirection.ReturnValue)
                        {
                            sql.Append(FirstParam ? "\t" : "\t, ");

                            if (FirstParam) FirstParam = false;

                            if (sp.Direction == ParameterDirection.Input)
                                sql.AppendLine(sp.ParameterName + " = " + sp.ParameterValueForSQL());
                            else

                                sql.AppendLine(sp.ParameterName + " = " + sp.ParameterName + " output");
                        }
                    }
                    sql.AppendLine(";");

                    sql.AppendLine("select 'Return Value' = convert(nvarchar, @return_value);");

                    foreach (SqlParameter sp in sc.Parameters)
                    {
                        if ((sp.Direction == ParameterDirection.InputOutput) ||
                            (sp.Direction == ParameterDirection.Output))
                        {
                            sql.AppendLine("select '" + sp.ParameterName + "' = convert(nvarchar, " + sp.ParameterName +
                                           ");");
                        }
                    }
                    break;
                case CommandType.Text:
                    {
                        sql.AppendLine(sc.CommandText);
                        foreach (SqlParameter sp in sc.Parameters)
                            sql.Replace(sp.ParameterName, sp.ParameterValueForSQL());

                        break;
                    }
            }

            return sql.ToString();
        }


        internal static IEnumerable<TaskTypeInfo> Search_GetRobotsByTypeSimple(IMetaType metaType, int? profileID)
        {
            string sysNamesParents = metaType.SystemName;
            while (metaType.ParentEntity != null)
            {
                sysNamesParents += "," + metaType.ParentEntity.SystemName;
                metaType = (IMetaType)metaType.ParentEntity;
            }

            TypesCategory[] typesCategory = WebSaUtilities.MBF.GetAllCategoriesLinkedBy(sysNamesParents, profileID,
                WebSaUtilities.GetCurrentContextData());
            List<TaskTypeData> list = new List<TaskTypeData>();
            foreach (var item in typesCategory)
                list.AddRange(item.Types);

            return list.Select(item => new TaskTypeInfo
            {
                id = item.TypeUid,
                title = item.Name,
                Kind = item.Kind,
                price = item.Goods != null ? item.Goods.Sum(g => g.Price ?? 0) : (decimal?)null,
                goods =
                    item.Goods != null
                        ? item.Goods.Select(g => new GoodsInfo { id = g.ID, title = g.Title, price = g.Price })
                            .ToArray()
                        : null
            }).Distinct().ToList();
        }

        public static T FieldOrDefault<T>(this DataRow row, string columnName)
        {
            return row.IsNull(columnName) ? default(T) : row.Field<T>(columnName);
        }

        public static void LinkToRubric(ISaObject obj, int rubricid)
        {
            if (rubricid == 0) return;

            var ru = WebSaUtilities.Database.Rubricator.Items.ElementById(rubricid);
            obj.Rubrics.CreateNew(ru);
        }

        public static ISaObject PrepareSource(IDataBase saDb, int? projectId, int? projectRoleId, ISaObject obj,
            JObject jObject)
        {
            obj = obj.AssignSimpleValues(saDb, jObject, projectId, projectRoleId, new[]
            {
                new Tuple<string, string>("title", "Display_Name"),
                new Tuple<string, string>("smi", "MassMedia"),
                new Tuple<string, string>("author", "Author"),
                new Tuple<string, string>("pdate", "Дата_публикации"),
                new Tuple<string, string>("content", "TextSource"),
                new Tuple<string, string>("IsMedia", "IsMedia")
            });

            JToken jtIsMedia;
            bool isMedia = jObject.TryGetValue("IsMedia", out jtIsMedia) && jtIsMedia.Value<bool>();
            isMedia = isMedia || WikiSABL.IsMediaDocument(obj.Id);

            if (isMedia)
            {
                var text = jObject.Value<string>("content");
                WikiSABL.CreateRelationsFromText(WebSaUtilities.Database, obj.Id, text);
            }

            return obj;
        }

        public static ISaObject PreparePerson(IDataBase saDb, int? projectId, int? projectRoleId, ISaObject obj,
            JObject jObject)
        {
            obj = obj.AssignSimpleValues(saDb, jObject, projectId, projectRoleId, new[]
            {
                new Tuple<string, string>("title", "Display_Name"),
                new Tuple<string, string>("inn", "INN_Person"),
                new Tuple<string, string>("ogrnip", "OGRN_Person"),
                new Tuple<string, string>("bdate", "Дата_рождения"),
                new Tuple<string, string>("bdate2", "Дата_рождения_не_раньше"),
                new Tuple<string, string>("bdate1", "Дата_рождения_не_позднее"),
                new Tuple<string, string>("pass", "Паспортные_данные")
            });

            return obj;
        }

        public static ISaObject PrepareOrganization(IDataBase saDb, int? projectId, int? projectRoleId, ISaObject obj,
            JObject jObject)
        {
            obj = obj.AssignSimpleValues(saDb, jObject, projectId, projectRoleId, new[]
            {
                new Tuple<string, string>("title", "Display_Name"),
                new Tuple<string, string>("inn", "INN_Org"),
                new Tuple<string, string>("okpo", "ОКПО"),
                new Tuple<string, string>("ogrn", "OGRN")
            });

            return obj;
        }

        public static void SaveObject(IDataBase saDb, int? projectId, int? projectRoleId, ref ISaObject obj,
            JObject jObject)
        {
#warning требует рефакторинга
            if (jObject != null && jObject.Count != 0)
            {
                int typeid = jObject.Property("typeid").Value.ToObject<Int32>();
                int? rubricid = jObject.Property("rubricid") != null &&
                                !String.IsNullOrWhiteSpace(jObject.Property("rubricid").Value.ToString())
                    ? jObject.Property("rubricid").Value.ToObject<Int32>()
                    : (int?)null;
                int? linkid = jObject.Property("linkid") != null &&
                              !String.IsNullOrWhiteSpace(jObject.Property("linkid").Value.ToString())
                    ? jObject.Property("linkid").Value.ToObject<Int32>()
                    : (int?)null;
                int? linktoid = jObject.Property("linktoid") != null &&
                                !String.IsNullOrWhiteSpace(jObject.Property("linktoid").Value.ToString())
                    ? jObject.Property("linktoid").Value.ToObject<Int32>()
                    : (int?)null;

                bool notPersistentType = obj.MetaType.IsFact || obj.MetaType.IsSource || obj.MetaType.IsPerson ||
                                         obj.MetaType.IsOrganization;

                if (!notPersistentType)
                {
                    obj = obj.AssignSimpleValues(saDb, jObject, projectId, projectRoleId, new[]
                    {
                        new Tuple<string, string>("title", "Display_Name")
                    });
                }

                if (obj.MetaType.IsFact)
                {
                    obj = obj.AssignSimpleValues(saDb, jObject, projectId, projectRoleId, new[]
                    {
                        new Tuple<string, string>("title", "Display_Name")
                    });
                }

                if (obj.MetaType.IsSource)
                {
                    obj = PrepareSource(saDb, projectId, projectRoleId, obj, jObject);
                }

                if (obj.MetaType.IsOrganization)
                {
                    obj = PrepareOrganization(saDb, projectId, projectRoleId, obj, jObject);
                }

                if (obj.MetaType.IsPerson)
                {
                    obj = PreparePerson(saDb, projectId, projectRoleId, obj, jObject);
                }

                if (rubricid.HasValue)
                    LinkToRubric(obj, rubricid.Value);

                obj.Save();

                if (linktoid.HasValue && linktoid > 0)
                {
                    if (obj.MetaType.IsFact && linkid.HasValue && linkid > 0)
                        saDb.ObjectService.CreateRelation(linktoid.Value, obj.ObjectId, linkid.Value);
                    if (obj.MetaType.IsSource)
                        saDb.ObjectModel.LinkObjectInSource(obj.ObjectId, linktoid.Value);
                }
            }
        }

        /// <summary>
        /// Возвращает имя файла с учетом максимально допустимой длины пути = 256 символам
        /// </summary>
        /// <param name="fileDir"></param>
        /// <param name="fileName"></param>
        /// <returns></returns>
        public static string PurifyFileName(string fileDir, string fileName)
        {
            string newFileNameFull = Path.Combine(fileDir, fileName);
            if (newFileNameFull.Length > 254)
            {
                string fn = Path.GetFileNameWithoutExtension(newFileNameFull);
                string ext = Path.GetExtension(newFileNameFull);

                int removeCharCount = newFileNameFull.Length - 254;
                return fn.Substring(0, fn.Length - Math.Abs(removeCharCount)) + ext;
            }

            return fileName;
        }

        public static string CheckModule_ReportsExport(IDataBase saDB, IReportingService reporting, ReportsSelectedDTO dataObj, Guid notificationUid, ContextData context, CultureInfo ci)
        {
            var relPath = Root.GetFolder_Export() + notificationUid;
            relPath = HostingEnvironment.MapPath(relPath);
            // ReSharper disable once AssignNullToNotNullAttribute
            Directory.CreateDirectory(relPath);

            if (dataObj.main)
            {
                var proxy = Root.ProxyGetWReports();
                string mainRepPath = proxy.GenerateWReportDefaultToPdf(Root.GetResource("ReportComplexTitle", ci), dataObj.ObjID, context);

                File.Copy(mainRepPath, Path.Combine(relPath, "ComplexReport.pdf"));
            }

            if (dataObj.semSchema)
            {
                try
                {
                    var semnetPath = HelperSemNet.GetImageSemNet(dataObj.ObjID, null, saDB.Id.ToString(CultureInfo.InvariantCulture), saDB);
                    File.Copy(semnetPath, Path.Combine(relPath, "SemantciSchema.png"));
                }
                catch (Exception e)
                {
                    LogBL.Write("CheckModule_ReportsExport", e.ToString());
                }
            }

            if (dataObj.analystNote)
            {
                try
                {
                    int? projectID = saDB.CurrentProjectId;
                    int projectRoleID = InquiryRoleSystemGet(saDB, InquirySysRoles.resume);

                    var props = new[] { _SAConst.Object_ID, _SAConst.Целочисленный_показатель, _SAConst.ShortName, _SAConst.Текстовое_досье };
                    DataTable data = InquiryGetObjectsMarkedByRoles(saDB, projectID.Value, projectRoleID, props, dataObj.ObjID);
                    if (data != null)
                    {
                        var row = data.AsEnumerable().FirstOrDefault();
                        if (row != null)
                        {
                            if (row[3] != DBNull.Value)
                            {
                                string htmlResume = $@"<!doctype html>
<html>
<head>
    <meta charset=""utf-8"">
    <title>Analitical Report</title>
</head >
<body>{(string)row[3]}</body>
</html>";
                                var anPath = Root.ProxyGetWorker().HtmlpageToPdfLocalPath("Analitical Report", htmlResume);
                                File.Copy(anPath, Path.Combine(relPath, "AnaliticalReport.pdf"));
                            }
                        }
                    }
                }
                catch (Exception e)
                {
                    LogBL.Write("CheckModule_ReportsExport", e.ToString());
                }
            }

            Parallel.ForEach(dataObj.reports,
                item =>
                {
                    try
                    {
                        int repID = item.Key;
                        if (repID != default(Int32))
                        {
                            string fileName = item.Value;
                            if (String.IsNullOrWhiteSpace(fileName)) fileName = item.Key.ToString();
                            fileName = fileName + ".pdf";
                            fileName = NormalizeFileName(fileName);
                            fileName = PurifyFileName(relPath, fileName);
                            // ReSharper disable once AssignNullToNotNullAttribute
                            fileName = Path.Combine(relPath, fileName);

                            GenerateReport(reporting, dataObj.ObjID, repID, fileName);
                        }
                    }
                    catch (Exception e)
                    {
                        LogBL.Write("CheckModule_ReportsExport", e.ToString());
                    }
                });
            Parallel.ForEach(dataObj.extracts,
                item =>
                {
                    try
                    {
                        ISaObject obj = saDB.ObjectModel.GetObject(item.Key);
                        var meta = saDB.MetaModel.MetaProperties;
                        if (obj == null) throw new InvalidOperationException("Object is not found");
                        if (!obj.MetaType.IsSource) throw new ArgumentException("Object is not Source type");

                        var prop = obj.Properties["Файл_оригинала"];
                        string fileName = "";
                        IFilePropertyValue v = null;
                        if (prop != null && prop.Value != null && prop.Value != DBNull.Value &&
                            !String.IsNullOrWhiteSpace(((IFilePropertyValue)prop.Value).FileName))
                        {
                            v = (IFilePropertyValue)prop.Value;
                            fileName = v.FileName;
                        }
                        bool hasFile = !String.IsNullOrWhiteSpace(fileName);
                        if (hasFile)
                        {
                            fileName = Path.GetFileName(fileName);
                            fileName = NormalizeFileName(fileName);
                            fileName = PurifyFileName(relPath, fileName);
                            fileName = Path.Combine(relPath, fileName);
                            using (FileStream fs = File.Create(fileName))
                            {
                                Stream serverFile = v.Download();
                                CopyStream(serverFile, fs);
                                serverFile.Close();
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        LogBL.Write("CheckModule_ReportsExport", e.ToString());
                    }
                });

            return relPath;
        }

        public static string NormalizeFileName(string fileName)
        {
            string regexSearch = new string(Path.GetInvalidFileNameChars()) + new string(Path.GetInvalidPathChars());
            var _invalidCharsInFileNameRE = new Regex($"[{Regex.Escape(regexSearch)}]");
            return _invalidCharsInFileNameRE.Replace(fileName, "_");
        }

        public static string GenerateReport(IReportingService reporting, int objectID, string reportName,
            bool returnUrl = false)
        {
            string path = null;
            var reports = reporting.GetReports(objectID);
            var report =
                reports.FirstOrDefault(item => item.ReportPath.ToLower().EndsWith(reportName.ToLower()));
            string fn = Path.GetRandomFileName() + ".pdf";
            if (report != null)
            {
                byte[] buffer = reporting.RenderReportToBytes(report.ReportServer, report.ReportPath, objectID,
                    ReportFormat.PDF);

                path = HostingEnvironment.MapPath(Root.GetFolder_Temp() + fn);
                File.WriteAllBytes(path, buffer);
            }

            if (returnUrl)
                return Root.GetFolder_Temp() + fn;

            return path;
        }

        public static void GenerateReport(IReportingService reporting, int objectID, int reportID, string fileName)
        {
            var reports = reporting.GetReports(objectID);
            var report = reports.FirstOrDefault(item => item.ReportId == reportID);
            if (report != null)
            {
                byte[] buffer = reporting.RenderReportToBytes(report.ReportServer, report.ReportPath, objectID,
                    ReportFormat.PDF);
                File.WriteAllBytes(fileName, buffer);
            }
        }


        /// <summary>
        ///  namespace AnalystSDK.Controls.Data.DataModel method ExecuteMonitoringQuery
        /// </summary>
        /// <param name="webTaskIds">(1,2,3) or (-1)</param>
        /// <param name="from">"YYYY-MM-DD" or "NO"</param>
        /// <param name="to">"YYYY-MM-DD" or "NO"</param>
        /// <param name="strToFind"></param>
        /// <returns></returns>
        public static DataTable ExecuteMonitoringQuery(string webTaskIds, string from, string to, string strToFind)
        {
            var sql = $@"
SET ROWCOUNT 0;

Declare @idTask integer
set @idTask = {webTaskIds};

with 
doc_types(id) as 
(
	select top 1 Meta_Entity_ID  from meta_entities (nolock)   where systemname ='T_Object'
),
all_doc_types(id)  as 
(
	select C.Meta_Type_ID from doc_types T cross apply GetChildTypeId(T.id) C  
),
rel_type(rid) as
(
	select top 1 Meta_Entity_ID  from meta_entities me  (nolock)     
	inner join Meta_Relations mr  (nolock)  on		me.Meta_Entity_ID = mr.Meta_Relation_ID 
	where systemname = 'Rel_Found_object'	
), 
docs(id) as 
(
	select	distinct o.object_id from objectdata (nolock) o 
	inner   join  dbo.Relations r (nolock)   
	on		o.object_id= r.rightobject_ID 
	where	r.deleted =0 and o.deleted = 0 and r.leftobject_id = @idTask 
	and     r.meta_relation_id = (select top 1 rid from rel_type) 
	and		o.Type_ID in (select  id from all_doc_types)
),
tresult as 
( 
	select o.Object_ID as Object_ID, 
           o.Display_Name as DisplayName, 
           o.CreatedDate

	from  docs d
	inner join objectdata (nolock) o on  d.id = o.object_id
	inner join meta_entities me (nolock) on me.meta_entity_id = o.type_id 	
)
select * from tresult;
";


            sql = @"
declare @text nvarchar(max), @d1 nvarchar(10), @d2 nvarchar(10), 
		@dd1 datetime, @dd2 datetime, @isdate1 bit, @isdate2 bit, @istext bit;
set		@dd1 = CONVERT(datetime, '1900-01-01'); 
set		@dd2 = CONVERT(datetime, '2999-01-01'); 
set		@d1 =  '#dfrom#' ; -- 'NO'; --
set		@d2 =  '#dto#' ;   -- 'NO'; -- 

if @d1 = 'NO'  set @isdate1 = 0;
else           
begin 
	set @isdate1 = 1;   
	set	@dd1 = CONVERT(datetime, @d1);
end

if @d2 = 'NO'  set @isdate2 = 0;
else           
begin
	set @isdate2 = 1;
	set @dd2 = DATEADD(day, 1, CONVERT(datetime, @d2));
end

set @text = N'#phrase#' ; -- ' путина  ';   --   
set @istext = 1;  -- if 0: no text specified -> show all 
if len(rtrim(isnull(@text, ''))) = 0 
	set @istext = 0;

with 
doc_types(id) as 
(
	select top 1 Meta_Entity_ID  from meta_entities (nolock)   where systemname ='T_Object'
),
all_doc_types(id)  as 
(
	select C.Meta_Type_ID from doc_types T cross apply GetChildTypeId(T.id) C  
),
rel_type(rid) as
(
	select top 1 Meta_Entity_ID  from meta_entities me  (nolock)     
	inner join Meta_Relations mr  (nolock)  on		me.Meta_Entity_ID = mr.Meta_Relation_ID 
	where systemname = 'Rel_Found_object'	
), 
docs(id) as 
(
	select	distinct o.object_id from objectdata (nolock) o 
	inner   join  dbo.Relations r (nolock)   
	on		o.object_id = r.rightobject_ID 
	where	r.deleted = 0 and o.deleted = 0  and r.leftobject_id in #tasklist# 
	and     r.meta_relation_id = (select top 1 rid from rel_type) 
	and		o.Type_ID in (select  id from all_doc_types)
),
tresult as 
( 
	select o.Object_ID as Object_ID, o.Object_ID  as ID,  
		   o.Display_Name as DisplayName, me.DisplayName as TypeName,
		   o.Type_ID,  o.CreatedDate, o.ModifyDate, o.UID, o.FullName, o.LastModificator, o.Creator
	from  docs d
	inner join objectdata (nolock) o on  d.id = o.object_id
	inner join meta_entities me (nolock) on me.meta_entity_id = o.type_id 	
	where 
		(@istext = 0  or contains(o.textsource , N'formsof(inflectional, ""#phrase#"")')  )
		and 	
		(
			(@isdate1 = 0 or #date# >= @dd1) and
			(@isdate2 = 0 or #date# < @dd2)
		)
)
select top 5000 * from tresult order by Object_ID desc;
";
            strToFind = strToFind.Replace("'", "''");
            sql = sql.Replace("#tasklist#", webTaskIds);
            sql = sql.Replace("#dfrom#", from);
            sql = sql.Replace("#dto#", to);
            sql = sql.Replace("#phrase#", strToFind);
            sql = sql.Replace("#date#", "CreatedDate");

            //"select 0 as Object_ID, 'Документ мониторинга' as DisplayName, '2013-12-01' as CreatedDate");
            DataTable res = WebSaUtilities.Database.QueriesProvider.ExecuteQuery(sql).DataSet.Tables[0];

            return res;
        }

        public static DataTable GetAllObjectsLinkedWithMBFTasks(IDataBase saDB, int? projectID)
        {
            string sql = GetObjectsLinkedWithMBFTasksSQL_Ver01(saDB, projectID, null, null, null, null, 0);
            return GetObjectsLinkedWithMBFTasksExecute(sql);
        }



        public static DataTable GetOnlyMyObjectsLinkedWithMBFTasks(IDataBase saDB, int? projectId)
        {
            string sql = GetObjectsLinkedWithMBFTasksSQL_Ver01(saDB, projectId, null, null, null, null, 0, true);
            return GetObjectsLinkedWithMBFTasksExecute(sql);
        }

        public enum LOperator
        {
            OR,
            AND
        }

        public static string CombineCriterias(string filterCriteriaLeft, string filterCriteriaRight,
            LOperator lOp = LOperator.AND, bool doAgregation = false)
        {
            string lOpVal = "";
            switch (lOp)
            {
                case LOperator.OR:
                    lOpVal = " OR ";
                    break;
                case LOperator.AND:
                    lOpVal = " AND ";
                    break;
            }

            string complexCriteria = filterCriteriaLeft + lOpVal + filterCriteriaRight;

            if (doAgregation)
                complexCriteria = " ( " + complexCriteria + " ) ";

            return complexCriteria;
        }

        public static void CombineCriteria(ref string filterCriteria, IMetaType metaBase, string propName,
            string propValue, LOperator lOp = LOperator.AND, bool doAgregation = false)
        {
            string lOpVal = "";
            switch (lOp)
            {
                case LOperator.OR:
                    lOpVal = " OR ";
                    break;
                case LOperator.AND:
                    lOpVal = " AND ";
                    break;
            }

            string criteria = GenerateFilterCriteria(propName, propValue);
            if (!String.IsNullOrWhiteSpace(criteria))
                filterCriteria = filterCriteria + (!String.IsNullOrWhiteSpace(filterCriteria)
                                     ? lOpVal + "(" + criteria + ") "
                                     : " (" + criteria + ") ") + System.Environment.NewLine;
            if (doAgregation)
                filterCriteria = " ( " + filterCriteria + " ) ";
        }

        /// <summary>
        /// Подготовка SQL Where критерия для поиска проверок
        /// </summary>
        /// <param name="propertyName"></param>
        /// <param name="propertyValue"></param>
        /// <param name="objectDataTableSuffix"></param>
        /// <returns></returns>
        public static string GenerateFilterCriteria(string propertyName, string propertyValue,
            string objectDataTableSuffix = "ov")
        {
            propertyValue = propertyValue ?? "";
            string prop = propertyName.ToLower();
            switch (prop)
            {
                case "interestobjectinputdata":
                    {
                        if (!String.IsNullOrWhiteSpace(propertyValue))
                        {
                            string pv = propertyValue.SQLSafe();
                            pv = pv.Trim();
                            pv = "%" + Regex.Replace(pv, @"\s+", "%") + "%";

                            return $"{objectDataTableSuffix}.{propertyName} like N'{pv}'";
                        }

                        return $"{objectDataTableSuffix}.InterestObjectINPUTDATAFlag = 1";
                    }
                case "display_name":
                    {
                        string pv = propertyValue.Replace("\"", "").SQLSafe();

                        return $"CONTAINS({objectDataTableSuffix}.{propertyName}, N'\"{pv}\"')";
                    }
                case "паспортные_данные":
                    {
                        IMetaProperty mp = WebSaUtilities.Database.MetaModel.MetaProperties.GetByName(propertyName);
                        string pv = propertyValue.SQLSafe();

                        return
                            $"({objectDataTableSuffix}.[Object_ID] in (select ms.[Object_ID] from [dbo].[MultiString] ms where ms.[Property_ID] = {mp.ID}  and ms.value like N'%{pv}%'))";
                    }
                default:
                    {
                        propertyValue = propertyValue.SQLSafe();
                        return $"{objectDataTableSuffix}.{propertyName} = N'{propertyValue}'";
                    }
            }
        }

        public static DataTable GetObjectsLinkedWithMBFTasksExt()
        {
            //Pagination<WorkContestInfo> res = Docs.GetRepository<WorkContestInfo>().SearchFinal(
            //    new Search<WorkContestInfo>() { Status = status, Page = pageNum, PageSize = count, IsParent = true }
            //    .AddCriteria(field => field.ID == contestID)
            //    );

            MetaType mt = WebSaUtilities.Database.MetaModel.GetEntityById(10001) as MetaType;
            var ctx = new SearchContext<MetaProperty>(mt)
                .AddCriteria(prop => prop.Value("Display_Name").ToString() == "test");

            var ce = new ClauseExtractor(ctx, "data");
            string wc = ce.WhereClause;

            return null;

        }


        /// <summary>
        /// Нельзя использовать в фоновом режиме (получает идентификатор заявки из контекста)
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="projectID"></param>
        /// <param name="typeID"></param>
        /// <param name="filterCriteria"></param>
        /// <param name="ds"></param>
        /// <param name="de"></param>
        /// <param name="top">Убран - атавизм</param>
        /// <param name="onlyMine"></param>
        /// <param name="objID"></param>
        /// <param name="state">Состояние: в работе, завершено и т.д</param>
        /// <param name="projectContstraint">Включает фильтр по текущему проекту, в противном случае все кроме текущего</param>
        /// <returns></returns>
        public static string GetObjectsLinkedWithMBFTasksSQL_Ver01(IDataBase saDB, int? projectID, int? typeID,
            string filterCriteria, DateTime? ds,
            DateTime? de, int top = 0, bool onlyMine = false, int? objID = null, int? state = null,
            bool projectContstraint = true)
        {
            string AddInqueryConstraint(string alias)
            {
                return projectContstraint ? $"{alias}.[Project_ID] = {projectID} and " : "";
            }


            string sqlTemplates = $@"
SET ROWCOUNT 0;
with InquiriesOnly as
(
    select ov.[Object_ID],p.[ProjectId],p.[ProjectName] from ObjectData ov LEFT OUTER JOIN Projects p on (ov.Project_ID = p.ProjectId)
	where 
		{AddInqueryConstraint("ov")} 
		ov.InterestObjectINPUTDATAFlag = 1 and ov.deleted = 0
        #PROPERTY#
        #CREATION_DATE#
        #INQUIRY#
)
select 
      [TypeName] = me1.[DisplayName]
      ,ov.[Display_Name]
      ,ov.[uid]
      ,ov.[Object_ID]
      ,ov.[Project_ID]
      ,ov.[ProjectRole_ID]
      ,ov.[CreatedDate]
      ,ov.[Creator]/*, r.LeftObject_ID, r.RightObject_ID*/ 
      ,ov.[Type_ID]
	  ,ov.[Creator]/*, r.LeftObject_ID, r.RightObject_ID*/ 
      ,[RoleName] = pr2t.[Title]
      ,[MarkNames] = STUFF(( 
					                        SELECT ', ' +  RES.ShortName
					                        FROM (
							                        select ov.[Object_ID], [Fact_ID] = ov2.[Object_ID], ov2.ShortName
                                                    from
                                                        [dbo].[Relations] r INNER JOIN [dbo].[ObjectData] ov2 
                                                            on (r.RightObject_ID = ov2.[Object_ID] and ov2.[ProjectRole_ID] = 3)
                                                    where r.[LeftObject_ID] = ov.[Object_ID] and ov2.deleted = 0
                                            ) RES
					                        WHERE ([Object_ID] = RES.[Object_ID]) 
					                        FOR XML PATH(''),TYPE
			                        ).value('(./text())[1]','NVARCHAR(MAX)')
	                        ,1,2,'')
      ,[Status] = ov2.TSelochislennii_pokazatel
      ,[State] = ov3.TSelochislennii_pokazatel
      ,[Dossier] = ov2.[Dossier]
	  ,iOnly.[ProjectId]
	  ,iOnly.[ProjectName]
      ,JobCDate = (SELECT top 1 ies.CDate FROM dbo.[ImportExportState] ies WHERE ies.Type = 100 and ies.ParamInt1 = ov.[Object_ID] ORDER BY ies.ID DESC)
from [dbo].[ObjectData] ov inner join InquiriesOnly iOnly on (ov.[Object_ID] = iOnly.[Object_ID])
        #INQUIRY_JOIN#
        INNER JOIN
            dbo.Meta_Entities AS me1 WITH (NOLOCK) ON (ov.Type_ID = me1.Meta_Entity_ID)

		LEFT OUTER JOIN [dbo].[Relations] r2 
			INNER JOIN [dbo].[ObjectData] ov2 on ({AddInqueryConstraint("ov2")}r2.RightObject_ID = ov2.[Object_ID])
			INNER JOIN ProjectRoles pr2 on (pr2.[ProjectRoleId] = ov2.ProjectRole_ID and pr2.RoleName = 'resume')
		on (r2.LeftObject_ID = ov.[Object_ID])
		
		LEFT OUTER JOIN [dbo].[Relations] r3 
			INNER JOIN [dbo].[ObjectData] ov3 on ({AddInqueryConstraint("ov3")}r3.RightObject_ID = ov3.[Object_ID])
			INNER JOIN ProjectRoles pr3 on (pr3.[ProjectRoleId] = ov3.ProjectRole_ID and pr3.RoleName = 'state')
		on (r3.LeftObject_ID = ov.[Object_ID])
where 
    (1 = 1)
    #ONLY_MINE_TASKS#
    #ONLY_ONE#
    #TYPE_ID#
    #STATE#
order by ov.Object_ID DESC
                ";

            string sql = sqlTemplates;

            if (Scope.GetCurrentArea() == "inquiry")
            {
                sql = sql.Replace("#INQUIRY_JOIN#", @"
		INNER JOIN  dbo.[ProjectRoles] pr on (ov.ProjectRole_ID = pr.ProjectRoleId)
			LEFT OUTER JOIN ProjectRoles2Titles pr2t on (pr.RoleName = pr2t.RoleName and pr2t.Culture = '{0}')
");

                int roleRelID = InquiryRoleSystemGet(saDB, InquirySysRoles.partrel);

                sql = sql.Replace("#INQUIRY#", !projectContstraint ? $"and ov.[Project_ID] <> {projectID}" : "");

                sql = sql.Replace(@"#INQUIRY_SELECT#",
                    $@"STUFF(( 
					                        SELECT ', ' +  RES.ShortName
					                        FROM (
							                        select ov.[Object_ID], [Fact_ID] = ov2.[Object_ID], ov2.ShortName
                                                    from
                                                        [dbo].[Relations] r INNER JOIN [dbo].[ObjectData] ov2 
                                                            on (r.RightObject_ID = ov2.[Object_ID] and ov2.[ProjectRole_ID] = {
                            roleRelID
                        })
                                                    where r.[LeftObject_ID] = ov.[Object_ID] and ov2.deleted = 0
                                            ) RES
					                        WHERE ([Object_ID] = RES.[Object_ID]) 
					                        FOR XML PATH(''),TYPE
			                        ).value('(./text())[1]','NVARCHAR(MAX)')
	                        ,1,2,'')");
            }
            else
            {
                sql = sql.Replace("#INQUIRY_JOIN#", @"
		LEFT OUTER JOIN  dbo.[ProjectRoles] pr on (ov.ProjectRole_ID = pr.ProjectRoleId)
			LEFT OUTER JOIN ProjectRoles2Titles pr2t on (pr.RoleName = pr2t.RoleName and pr2t.Culture = '{0}' )
");
                sql = sql.Replace("#INQUIRY#", "");
                sql = sql.Replace("#INQUIRY_SELECT#", "''");
            }
            sql = String.Format(sql, Root.GetCurrentLang());



            string deStr = "2999-01-01";
            string dsStr = "1900-01-01";
            if (de.HasValue)
                deStr = de.Value.ToString("yyyy-MM-dd");
            if (ds.HasValue)
                dsStr = ds.Value.ToString("yyyy-MM-dd");

            sql = sql.Replace("#ONLY_MINE_TASKS#",
                onlyMine ? $"and ov.Creator = N'{WebSaUtilities.GetCurrentUserName()}'" : "");

            if (typeID.HasValue)
                sql = sql.Replace("#TYPE_ID#", $"and ov.Type_ID = {typeID.Value}");
            else sql = sql.Replace("#TYPE_ID#", "");

            if (!String.IsNullOrWhiteSpace(filterCriteria) && filterCriteria != "()")
                sql = sql.Replace("#PROPERTY#", " AND " + filterCriteria);
            else sql = sql.Replace("#PROPERTY#", "");

            string dtTemplate =
                @"and (({0} = 0 or ov.[CreatedDate] >= '{2}') and ({1} = 0 or ov.[CreatedDate] < '{3}'))";
            if (ds.HasValue && de.HasValue)
                sql = sql.Replace("#CREATION_DATE#", String.Format(dtTemplate, 1, 1, dsStr, deStr));
            else if (ds.HasValue)
                sql = sql.Replace("#CREATION_DATE#", String.Format(dtTemplate, 1, 0, dsStr, deStr));
            else if (de.HasValue)
                sql = sql.Replace("#CREATION_DATE#", String.Format(dtTemplate, 0, 1, dsStr, deStr));
            else sql = sql.Replace("#CREATION_DATE#", "");

            sql = objID.HasValue
                ? sql.Replace("#ONLY_ONE#", "and ov.[Object_ID] = " + objID.Value)
                : sql.Replace("#ONLY_ONE#", "");
            sql = state.HasValue
                ? sql.Replace("#STATE#", "and ov3.TSelochislennii_pokazatel = " + state)
                : sql.Replace("#STATE#", "");

            return sql;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="typeID"></param>
        /// <param name="filterCriteria"></param>
        /// <param name="ds"></param>
        /// <param name="de"></param>
        /// <param name="top"></param>
        /// <param name="onlyMine">Флаг не используется</param>
        /// <returns></returns>
        public static string GetObjectsLinkedWithMBFTasksSQL(int? typeID, string filterCriteria, DateTime? ds,
            DateTime? de, int top = 0, bool onlyMine = false)
        {
            /*
             * Исключительно не эфективное решение - поиск объектов по поисковым задачам, на основе факта наличия связи
             */
            string sqlTemplates = @"
SET ROWCOUNT 0;
select distinct #TOP# 
      [TypeName] = me1.[DisplayName]
      ,ov.[Display_Name]
      ,ov.[uid]
      ,ov.[Object_ID]
      ,ov.[Project_ID]
      ,ov.[CreatedDate]
      ,ov.[Dossier]
      ,ov.[Creator]/*, r.LeftObject_ID, r.RightObject_ID*/ 
from dbo.webtask_view wtv inner join [dbo].[Relations] r on (wtv.[Object_id] = [RightObject_ID])
    inner join [dbo].[Meta_Entities] me on (r.[LeftRole_ID] = me.[Meta_Entity_ID])
    inner join [dbo].[ObjectData] ov on (r.LeftObject_ID = ov.[Object_ID])
    inner join
        dbo.GetChildTypeId(10001) AS t1 ON ov.Type_ID = t1.Meta_Type_ID 
        INNER JOIN
            dbo.Meta_Entities AS me1 WITH (NOLOCK) ON ov.Type_ID = me1.Meta_Entity_ID 
where 
    #ONLY_MINE_TASKS#
	--wtv.Assembly_Name in ({0}) and --ограничение только мои задачи
	me.[SystemName] = 'Is_object_of_interest' and
	ov.deleted = 0
    #TYPE_ID#
    #PROPERTY#
    #CREATION_DATE#
order by ov.Object_ID desc
                ";


            string sql = sqlTemplates;
            if (onlyMine)
            {
                sql = sql.Replace("#ONLY_MINE_TASKS#", "");
                //раньше использовался фильтр (только мои задачи), в дальнейшем это ограничение было исключено
                /*
                 * самам по себе идея получения от МБФ всех задач и использования в IN выражении - утопия 
                string[] myTasks = WebUtilities.MBF.Tasks.GetTasks(true).Select(item => "'" + item.UID.ToString() + "'").ToArray();
                if (myTasks.Length > 0)
                {
                    sql = sql.Replace("#ONLY_MINE_TASKS#", "wtv.Assembly_Name in ({0}) and");
                    sql = String.Format(sql, String.Join(",", myTasks));
                }
                else
                    sql = sql.Replace("#ONLY_MINE_TASKS#", "(1 = 0) and");
                */
            }
            else
                sql = sql.Replace("#ONLY_MINE_TASKS#", "");

            string deStr = "2999-01-01";
            string dsStr = "1900-01-01";
            if (de.HasValue)
                deStr = de.Value.ToString("yyyy-MM-dd");
            if (ds.HasValue)
                dsStr = ds.Value.ToString("yyyy-MM-dd");

            if (top != 0)
                sql = sql.Replace("#TOP#", $"top ({top})");
            else
                sql = sql.Replace("#TOP#", "");

            if (typeID.HasValue)
                sql = sql.Replace("#TYPE_ID#", $"and ov.Type_ID = {typeID.Value}");
            else sql = sql.Replace("#TYPE_ID#", "");
            if (!String.IsNullOrWhiteSpace(filterCriteria))
                sql = sql.Replace("#PROPERTY#", " AND " + filterCriteria);
            else sql = sql.Replace("#PROPERTY#", "");
            string dtTemplate =
                @"and (({0} = 0 or ov.[CreatedDate] >= '{2}') and ({1} = 0 or ov.[CreatedDate] < '{3}'))";
            if (ds.HasValue && de.HasValue)
                sql = sql.Replace("#CREATION_DATE#", String.Format(dtTemplate, 1, 1, dsStr, deStr));
            else if (ds.HasValue)
                sql = sql.Replace("#CREATION_DATE#", String.Format(dtTemplate, 1, 0, dsStr, deStr));
            else if (ds.HasValue)
                sql = sql.Replace("#CREATION_DATE#", String.Format(dtTemplate, 0, 1, dsStr, deStr));
            else sql = sql.Replace("#CREATION_DATE#", "");

            return sql;
        }

        public static DataTable GetObjectsLinkedWithMBFTasksExecute(string sql)
        {
            DataTable res =
                WebSaUtilities.Database.QueryService.ExecuteNativeSQLQueryAsIs(new SQLQuery { Text = sql }).Result.Tables[
                    0];

            return res;
        }

        public static PropertyType SAPropTypeByDataType(Type dataType)
        {
            switch (dataType.ToString())
            {
                case "System.DateTime":
                    return PropertyType.DateTime;
                default:
                    return PropertyType.String;
            }
        }

        public static string GetPrameterValueFromSaQueryByName(this IDataBase saDB, int saQueryID, string paramName)
        {
            QueryInfo qi = saDB.QueryService.QueryGet(saQueryID);
            QueryFileData qfd = QueryFileData.FromXmlContent(qi.XmlText);

            paramName = paramName.StartsWith("#") ? paramName : $"#{paramName}#";
            var par =
                qfd.StandardQuery.Parametrs.FirstOrDefault(
                    el => String.Equals(el.Name, paramName, StringComparison.OrdinalIgnoreCase));
            if (qfd.CrossQuery != null && par == null)
                par =
                    qfd.CrossQuery.Parametrs.FirstOrDefault(
                        el => String.Equals(el.Name, paramName, StringComparison.OrdinalIgnoreCase));

            return par?.Value;
        }

        public static string DoHighlight(this IDataBase saDB, string highlightPhrase, string sourceText, int id)
        {
            if (String.IsNullOrWhiteSpace(highlightPhrase)) return sourceText;

            var synList = saDB.ServiceTools.GetPhraseFormsSimple(new[] { highlightPhrase }, sourceText);
            var txt = DocumentHighlighting.GetFormattedText(synList, sourceText, id.ToString(),
                DocumentHighlighting.FormattinKind.EntitiesInText, DocumentHighlighting.Mode.OriginalFragment);
            return txt;
        }

        /// <summary>
        /// Подсвечивает ключевые слова с учетом морфологии
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="kwArr"></param>
        /// <param name="sourceText"></param>
        /// <param name="color">Если не задан - то Color.Green</param>
        /// <returns></returns>
        public static string HighligtKeywords(IDataBase saDB, string[] kwArr, string sourceText, string color = null)
        {
            if (kwArr == null || kwArr.Length == 0) return sourceText;
            if (String.IsNullOrWhiteSpace(color))
                color = ColorTranslator.ToHtml(Color.Green);

            kwArr = saDB.ServiceTools.GetPhraseFormsSimple(kwArr, sourceText);
            sourceText = DocumentHighlighting.GetFormattedText(kwArr, sourceText, null,
                DocumentHighlighting.FormattinKind.Keywords, DocumentHighlighting.Mode.OriginalFragment,
                $"color:{color};font-weight: 600;");

            return sourceText;
        }

        /// <summary>
        /// Подсвечивает фрагменты по точному совпадению
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="fragments"></param>
        /// <param name="sourceText"></param>
        /// <param name="color">Если не задан - то Color.Brown</param>
        /// <returns></returns>
        public static string HighligtKeywords(IDataBase saDB, Tuple<Guid, string>[] fragments, string sourceText,
            string color = null)
        {
            if (fragments == null || fragments.Length == 0) return sourceText;
            if (String.IsNullOrWhiteSpace(color))
                color = ColorTranslator.ToHtml(Color.Brown);

            foreach (var fragment in fragments)
            {
                sourceText = DocumentHighlighting.GetFormattedText(fragment.Item2, sourceText, fragment.Item1.ToString(),
                    DocumentHighlighting.FormattinKind.None, DocumentHighlighting.Mode.OriginalFragment,
                    $"color:{color};font-weight: 600;");
            }

            return sourceText;
        }

        public static void CopyStream(Stream input, Stream output)
        {
            var buffer = new byte[32768];
            int read;
            while ((read = input.Read(buffer, 0, buffer.Length)) > 0)
                output.Write(buffer, 0, read);
        }

        public enum SelectRelType
        {
            All,
            Object,
            Subject,
            Predmet,
            DirectSome,
            ExtractedFrom
        }

        private static List<int> GetRoleIdList(IDataBase saDB, SelectRelType sRelType, ref bool includeMentionObject)
        {
            //see: ObjectRelationsManager in analyst

            string relObjectText = "Является_объектом_отношения";
            string relSubjectText = "Является_предметом_отношения";
            string relPredmetText = "Является_предметом_отношения";
            string relExtractedFromText = "Элемент_извлечен_из_Источника";
            string relDirectSomeRelText = "Прямая_некая_связь";

            var roleIdList = new List<int>();
            ;
            includeMentionObject = false;
            switch (sRelType)
            {
                case SelectRelType.Object:
                    roleIdList.Add(saDB.MetaModel.MetaRoles.GetByName(relObjectText).ID);
                    break;
                case SelectRelType.Subject:
                    roleIdList.Add(saDB.MetaModel.MetaRoles.GetByName(relSubjectText).ID);
                    break;
                case SelectRelType.Predmet:
                    roleIdList.Add(saDB.MetaModel.MetaRoles.GetByName(relPredmetText).ID);
                    break;
                case SelectRelType.ExtractedFrom:
                    includeMentionObject = true;
                    roleIdList.Add(saDB.MetaModel.MetaRoles.GetByName(relExtractedFromText).ID);
                    break;

                case SelectRelType.DirectSome:
                    roleIdList.Add(saDB.MetaModel.MetaRoles.GetByName(relDirectSomeRelText).ID);
                    break;
                case SelectRelType.All:
                    {
                        foreach (MetaRole role in saDB.MetaModel.MetaRoles)
                            roleIdList.Add(role.ID);
                        includeMentionObject = true;

                        break;
                    }
            }

            return roleIdList;
        }


        private static List<int> RelStat(IDataBase saDB, SelectRelType SRelType)
        {
            bool includeMentionObject = false;
            var roleIdList = new List<int>();

            roleIdList = GetRoleIdList(saDB, SRelType, ref includeMentionObject);

            //ucTypeStat.DataSource = OS.GetTypeStatisticByObjectAndRelTypeList(_ObjectInstance.Object_ID, RoleIdList, includeMentionObject);
            //int index = OS.GetCountRelatedObjectByRole(_ObjectInstance.Object_ID, RoleIdList[0]);

            return roleIdList;
        }

        public static DataTable GetAllRelatedObjects(int objectID)
        {
            string sql =
                @"
select r.Relation_ID, r.RightObject_ID as [Object_ID], o.Display_Name, o.[UID], o.Type_ID, TypeDispName = me.DisplayName
from 
    Relations r inner join ObjectData o on (r.RightObject_ID = o.[Object_ID])
    inner join dbo.Meta_Entities me on (o.[Type_ID] = me.Meta_Entity_ID)
where 
    r.LeftObject_ID = @LeftObject_ID and r.Deleted = 0 and o.Deleted = 0
order by 
    me.DisplayName, o.Display_Name
";

            IQuery qr = WebSaUtilities.Database.QueriesProvider.CreateQuery();
            qr.Sql = sql;
            qr.Parameters.CreateParam("@LeftObject_ID", QueryParameterType.Int).Value = new object[] { objectID };
            IQueryResult qres = qr.Execute();

            return qres.DataSet.Tables[0];
        }

        public static SARelationData[] GetRelations(IDataBase saDB, SelectRelType SRelType, bool includeMentionObject,
            ISaObject saObj)
        {
            /* почему то не возвращает все связанные объекты
            var role_IDList = GetRoleIdList(saDB, SRelType, ref includeMentionObject);

            var dt = new DataTable();
            if (role_IDList != null && role_IDList.Count > 0 && saObj.MetaType.ID > 0 && saObj.Id > 0)
                dt = saDB.ObjectService.GetRelatedObjectsByRoleList(saObj.Id, role_IDList, saObj.MetaType.ID, false).Tables[0];
             */
            var dt = GetAllRelatedObjects(saObj.Id);

            return
                dt.AsEnumerable()
                    .Select(
                        item =>
                            new SARelationData
                            {
                                Relation_ID = item.Field<int>("Relation_ID"),
                                Object_ID = item.Field<int>("Object_ID")
                            })
                    .ToArray();
        }


        public static void GenerateFactDigest(ModelFactDigest digestInfo)
        {
            //new FactDigestFormat()
        }

        public static bool _ObjectTypeOf(this IDataBase saDB, int objectId, string systemTypeName)
        {
            const string sqlTemplate = @"
select dbo.IsObjectA({0}, N'{1}')
";
            var qr = new SQLQuery { Text = String.Format(sqlTemplate, objectId, systemTypeName.SQLSafe()) };
            var qres = saDB.QueryService.ExecuteNativeSQLQueryAsIs(qr).Result;

            return (bool)qres.Tables[0].Rows[0][0];
        }




        public static DataRow _PropertyFastGet(this IDataBase saDB, int objectId,
            Tuple<string[], string[]> propertyNames, string linkRelType, string linkTypeNameConstraint)
        {
            const string sqlTemplate = @"
select 
    #0#
from dbo.ObjectData od left outer join
	(
	select r.LeftObject_ID, #1#
	from dbo.ObjectData od2
		inner join dbo. Relations r on (od2.[Object_ID] = r.[RightObject_ID])
		inner join dbo.[Meta_Entities] (nolock) me on (r.[Meta_Relation_ID] = me.[Meta_Entity_ID])
		inner join dbo.[Meta_Entities] (nolock) me2 on (od2.[Type_ID] = me2.[Meta_Entity_ID])
	where
		me.SystemName = @relName
		and me2.SystemName = @typeName
	) as od2 on (od.[Object_ID] = od2.[LeftObject_ID])

where 
	od.[Object_ID] = @objectId

";
            StringBuilder sb = new StringBuilder();
            StringBuilder sb2 = new StringBuilder();
            if (propertyNames.Item1.Length > 0)
                foreach (string s in propertyNames.Item1)
                    sb.Append("od.[" + s + "], ");

            if (propertyNames.Item2.Length > 0)
                foreach (string s in propertyNames.Item2)
                {
                    sb.Append("od2.[" + s + "], ");
                    sb2.Append("od2.[" + s + "], ");
                }

            if (sb.Length > 0)
                sb.Remove(sb.Length - 2, 2);
            if (sb2.Length > 0)
                sb2.Remove(sb2.Length - 2, 2);

            var qr = new SQLQuery();
            qr.Text = sqlTemplate.Replace("#0#", sb.ToString());
            qr.Text = qr.Text.Replace("#1#", sb2.ToString());
            qr.QueryParameters = new List<SaQueryParameter>
            {
                new SaQueryParameter
                {
                    Name = "@objectId",
                    DbType = DbType.Int32,
                    Value = new object[] {objectId}
                },
                new SaQueryParameter
                {
                    Name = "@relName",
                    DbType = DbType.String,
                    Value = new object[] {linkRelType}
                },
                new SaQueryParameter
                {
                    Name = "@typeName",
                    DbType = DbType.String,
                    Value = new object[] {linkTypeNameConstraint}
                }
            };
            var qres = saDB.QueryService.ExecuteNativeSQLQueryAsIs(qr).Result;

            return qres.Tables[0].AsEnumerable().FirstOrDefault();
        }


        public static string _PropertyFastGetSomeSql(this IDataBase saDB, int objectId, string[] propertyNames,
            string linkWithEntityType, bool substitueParams = false)
        {
            const string sqlTemplate = @"
select SearchTaskName = SearchTask.[Display_Name], SearchTask.[TaskTypeUID], #0# /*od.[Object_ID], od.[Display_Name]*/  from 
	dbo.Relations rMain inner join dbo.ObjectData od on (rMain.RightObject_ID = od.[Object_ID])
		inner join dbo.Meta_Entities me on (od.[Type_ID] = me.[Meta_Entity_ID])
		left outer join  (
            select r.[LeftObject_ID], linked.[Object_ID], linked.[Display_Name], linked.[TaskTypeUID]
			from 
				[dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                        inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				where 
					me.SystemName = 'Contains_found_object'
		) SearchTask on (SearchTask.[LeftObject_ID] = rMain.[RightObject_ID])
where
	rMain.deleted = 0 and me.[SystemName] = @typeName and rMain.[LeftObject_ID] = @objectId
";
            StringBuilder sb = new StringBuilder();
            if (propertyNames.Length > 0)
                foreach (string s in propertyNames)
                    sb.Append("od.[" + s + "], ");

            if (sb.Length > 0)
                sb.Remove(sb.Length - 2, 2);

            var sql = sqlTemplate.Replace("#0#", sb.ToString());

            if (!substitueParams) return sql;


            SqlCommand cmd = new SqlCommand(sql);
            cmd.Parameters.Add(new SqlParameter("@objectId", objectId));
            cmd.Parameters.Add(new SqlParameter("@typeName", linkWithEntityType.SQLSafe()));

            return cmd.CommandAsSql();
        }

        public static DataTable _PropertyFastGetSome(this IDataBase saDB, int objectId, string[] propertyNames,
            string linkWithEntityType)
        {
            var qr = new SQLQuery
            {
                Text = _PropertyFastGetSomeSql(saDB, objectId, propertyNames, linkWithEntityType),
                QueryParameters = new List<SaQueryParameter>
                {
                    new SaQueryParameter
                    {
                        Name = "@objectId",
                        DbType = DbType.Int32,
                        Value = new object[] {objectId}
                    },
                    new SaQueryParameter
                    {
                        Name = "@typeName",
                        DbType = DbType.String,
                        Value = new object[] {linkWithEntityType}
                    }
                }
            };
            var qres = saDB.QueryService.ExecuteNativeSQLQueryAsIs(qr).Result;

            return qres.Tables[0];
        }


        public static T _PropertyFastGet<T>(this IDataBase saDB, int objectId, string propertyName)
        {
            const string sqlTemplate = @"
select 
    #0#
from [dbo].[ObjectData] 
where [Object_ID] = {0}
";
            var selBlock = $"[{propertyName}]";

            var qr = new SQLQuery();
            qr.Text = String.Format(sqlTemplate.Replace("#0#", selBlock), String.Join(",", objectId));
            var qres = saDB.QueryService.ExecuteNativeSQLQueryAsIs(qr).Result;

            var row = qres.Tables[0].AsEnumerable().FirstOrDefault();
            if (row == null) return default(T);

            return row.Field<T>(0);
        }

        /// <summary>
        /// В результирующем наборе присутствует поля: TypeName
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="objectId"></param>
        /// <param name="propertyNames"></param>
        /// <returns></returns>
        public static string _PropertyFastGetSomeSql(this IDataBase saDB, int objectId, string[] propertyNames)
        {
            return _PropertyFastGetSomeSql(saDB, new[] { objectId }, propertyNames);
        }

        /// <summary>
        /// В результирующем наборе присутствует поля: TypeName
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="objectId"></param>
        /// <param name="propertyNames"></param>
        /// <returns></returns>
        public static DataRow _PropertyFastGetSome(this IDataBase saDB, int objectId, string[] propertyNames)
        {
            return _PropertyFastGetSome(saDB, new[] { objectId }, propertyNames).FirstOrDefault();
        }

        /// <summary>
        /// В результирующем наборе присутствует поля: TypeName
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="objectIds"></param>
        /// <param name="propertyNames"></param>
        /// <returns></returns>
        public static string _PropertyFastGetSomeSql(this IDataBase saDB, int[] objectIds, string[] propertyNames)
        {
            const string sqlTemplate = @"
select 
    #0#
    ,TypeName = me.DisplayName 
from [dbo].[ObjectData] od inner 
	join dbo.Meta_Entities me on (od.[Type_ID] = me.[Meta_Entity_ID])
where od.[Object_ID] in ({0})
";
            StringBuilder sb = new StringBuilder();
            if (propertyNames.Length > 0)
            {
                foreach (string s in propertyNames)
                    sb.Append("od.[" + s + "], ");
                sb.Remove(sb.Length - 2, 2);
            }

            var selBlock = sb.ToString();

            return String.Format(sqlTemplate.Replace("#0#", selBlock), String.Join(",", objectIds));
        }

        /// <summary>
        /// В результирующем наборе присутствует поля: TypeName
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="objectIds"></param>
        /// <param name="propertyNames"></param>
        /// <returns></returns>
        public static EnumerableRowCollection<DataRow> _PropertyFastGetSome(this IDataBase saDB, int[] objectIds,
            string[] propertyNames)
        {
            return _PropertyFastGetSomeAsTable(saDB, objectIds, propertyNames).AsEnumerable();
        }

        /// <summary>
        /// В результирующем наборе присутствует поля: TypeName
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="objectIds"></param>
        /// <param name="propertyNames"></param>
        /// <returns></returns>
        public static DataTable _PropertyFastGetSomeAsTable(this IDataBase saDB, int[] objectIds,
            string[] propertyNames)
        {
            var qr = new SQLQuery { Text = _PropertyFastGetSomeSql(saDB, objectIds, propertyNames) };
            var qres = saDB.QueryService.ExecuteNativeSQLQueryAsIs(qr).Result;

            return qres.Tables[0];
        }



        public static void _FieldFastSet<T>(this IDataBase saDB, int objectId, string propertyName, T value)
        {
            var dbType = SqlHelper.GetDbTypeByType(typeof(T));

            const string sqlTemplate = @"
update [dbo].[ObjectData]
SET 
    [{0}] = @value
where [Object_ID] = @objectID
";

            var qr = new SQLQuery();
            qr.Text = String.Format(sqlTemplate, propertyName);
            qr.QueryParameters = new List<SaQueryParameter>();
            qr.QueryParameters.Add(new SaQueryParameter
            {
                Name = "@value",
                DbType = dbType,
                Value = new object[] { value }
            });
            qr.QueryParameters.Add(new SaQueryParameter
            {
                Name = "@objectId",
                DbType = DbType.Int32,
                Value = new object[] { objectId }
            });

            saDB.QueryService.ExecuteNativeSQLQueryAsIs(qr);
        }

        public static void _PropertyFastSetDicValue<T>(this IDataBase saDB, int objectId, string propertyName, T value, string dicFieldName = "DisplayName")
        {
            var mProp = saDB.MetaModel.MetaProperties.GetByName(propertyName);
            if (mProp == null) throw new ArgumentException($"Property name [{propertyName}] doesn't exist");
            if (mProp.IsMultiVal) throw new ArgumentException("Only simple dictionary properties are supported");
            if (mProp.Dictionary == null) throw new ArgumentException("Only simple dictionary properties are supported");

            var dbType = SqlHelper.GetDbTypeByType(typeof(T));
            string sqlTemplate = $@"
update [dbo].[ObjectData]
SET 
    [{propertyName}] = (select top 1 d.Value_ID from [dbo].[Dictionaries] d where d.Meta_Dictionary_ID = @Meta_Dictionary_ID and d.[{dicFieldName}] =  @value)
where [Object_ID] = @objectID
";

            var qr = new SQLQuery();
            qr.Text = sqlTemplate;
            qr.QueryParameters = new List<SaQueryParameter>();
            qr.QueryParameters.Add(new SaQueryParameter
            {
                Name = "@value",
                DbType = dbType,
                Value = new object[] { value }
            });
            qr.QueryParameters.Add(new SaQueryParameter
            {
                Name = "@Meta_Dictionary_ID",
                DbType = DbType.Int32,
                Value = new object[] { mProp.Dictionary.ID }
            });
            qr.QueryParameters.Add(new SaQueryParameter
            {
                Name = "@objectId",
                DbType = DbType.Int32,
                Value = new object[] { objectId }
            });

            saDB.QueryService.ExecuteNativeSQLQueryAsIs(qr);
        }


        public static void _ObjFastDelete(this IDataBase saDB, int objectId)
        {
            const string sqlTemplate = @"
update [dbo].[ObjectData]
SET 
    [deleted] = 1
where [Object_ID] = @objectID
";

            var qr = new SQLQuery();
            qr.Text = sqlTemplate;
            qr.QueryParameters = new List<SaQueryParameter>();
            qr.QueryParameters.Add(new SaQueryParameter
            {
                Name = "@objectId",
                DbType = DbType.Int32,
                Value = new object[] { objectId }
            });

            saDB.QueryService.ExecuteNativeSQLQueryAsIs(qr);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="saDb"></param>
        /// <param name="display_Name"></param>
        /// <param name="type_ID">Если Тип не задан, то используется systemTypeName</param>
        /// <param name="systemTypeName">Если задан type_ID, то данный параметр не используется</param>
        /// <param name="createdDate">Если null, то DateTime.Now</param>
        /// <param name="creator">Если null, то текущий пользователь</param>
        /// <param name="project_ID"></param>
        /// <param name="projectRole_ID"></param>
        /// <param name="simpleProps"></param>
        /// <param name="multiValProps"></param>
        /// <param name="linkTo">Представлен парой ID объекта, Системеное имя связи</param>
        /// <returns></returns>
        public static int _ObjFastCreate(this IDataBase saDb,
            string display_Name,
            int? type_ID,
            string systemTypeName,
            DateTime? createdDate,
            string creator,
            int? project_ID,
            int? projectRole_ID,
            Dictionary<string, object> simpleProps,
            Dictionary<string, object> multiValProps,
            Tuple<int, string> linkTo
        )
        {
            createdDate = createdDate ?? DateTime.Now;
            creator = creator ?? WebSaUtilities.GetCurrentUserName();


            string sqlTemplate = @"
		BEGIN TRY
			BEGIN TRANSACTION;

            /*s----simpleValProps----*/
            {0}
            /*e----simpleValProps----*/

            declare @obj_id int;
			select @obj_id = Scope_Identity();


            declare @prop_id int;
            /*s----multiValProps----*/
            {1}
            /*e----multiValProps----*/

            /*s----relations block----*/
            {2}
            /*e----relations block----*/

            COMMIT TRANSACTION;

            select @obj_id;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
					ROLLBACK TRAN;
		END CATCH
";

            var mt = type_ID.HasValue
                ? saDb.MetaModel.GetEntityById(type_ID.Value) as IMetaType
                : saDb.MetaModel.MetaTypes.GetByName(systemTypeName);

            var scritpSimpleProps = GenerateScritpSimpleProps(saDb,
                display_Name,
                mt,
                createdDate.Value,
                creator,
                project_ID,
                projectRole_ID,
                simpleProps, out var qpScritpSimpleProps);


            var scritpMultiValues = GenerateScritpMultiValues(saDb, multiValProps, out var qpScritpMultiValues);

            string scriptLinkTo = linkTo != null ? GenerateRelationWith(saDb, linkTo) : "";

            //List<SaQueryParameter> qpScritpMultiValuesDic;
            //var sbScritpMultiValuesDic = GenerateScritpMultiValuesDic(multiValPropsDic, out qpScritpMultiValuesDci);

            var query = new SQLQuery();
            query.Text = String.Format(sqlTemplate, scritpSimpleProps, scritpMultiValues, scriptLinkTo);
            query.QueryParameters = new List<SaQueryParameter>();
            query.QueryParameters.AddRange(qpScritpSimpleProps);
            query.QueryParameters.AddRange(qpScritpMultiValues);

            var data = saDb.QueryService.ExecuteNativeSQLQueryAsIs(query);

            return (int)data.Result.Tables[0].Rows[0][0];
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="saDb"></param>
        /// <param name="linkTo">Представлен парой ID объекта, Системеное имя связи</param>
        /// <returns></returns>
        private static string GenerateRelationWith(IDataBase saDb, Tuple<int, string> linkTo)
        {
            string sqlTemplate = @"
		declare @relID int;  
		select  @relID = Meta_Entity_ID  from meta_entities (nolock) 
		where   systemname = N'{0}';

		declare @Rel_LR int, @Rel_RR int;  							
		select @Rel_LR = Left_Role_ID, @Rel_RR = [Right_Role_ID]
		from   meta_relations where [Meta_Relation_ID] = @relID;
										
		exec [dbo].[CreateRelation]	@obj_id , {1}, @Rel_LR, @Rel_RR, @relID;					
";

            return String.Format(sqlTemplate, linkTo.Item2, linkTo.Item1);
        }

        private static string GenerateScritpMultiValuesDic(Dictionary<string, object> multiValPropsDic,
            out List<SaQueryParameter> parameters)
        {
            string sqlTemplate = @"
				CREATE TABLE #t_authors(id INT); CREATE TABLE #t_authors2(id INT);				
				insert into #t_authors select ID from [dbo].[CharArrayToInt](@AuthorsIds, '|');

				SELECT  top 1 @meta_dic_id  = md.Meta_Dictionary_ID FROM Meta_Dictionaries AS md (NOLOCK) 
				INNER JOIN Meta_Entities AS me (NOLOCK) ON me.Meta_Entity_ID = md.Meta_Dictionary_ID 
				WHERE me.SystemName = 'Author';

				SELECT TOP 1 @prop_id = mp.Meta_Property_ID FROM Meta_Properties AS mp (nolock) 
				INNER JOIN Meta_Entities AS me (nolock)           
				ON me.Meta_Entity_ID = mp.Meta_Property_ID WHERE me.SystemName = 'Author';

				INSERT INTO #t_authors2  
				SELECT ta.id FROM Dictionaries AS d (NOLOCK) 
				INNER JOIN #t_authors AS ta ON ta.id = d.Value_ID  
				WHERE d.Meta_Dictionary_ID = @meta_dic_id ; 

				INSERT INTO dbo.[MultiDictionary] ([Object_ID], Property_ID, [Value])  
				SELECT @obj_id, @prop_id, id FROM #t_authors2;  

				DROP TABLE #t_authors;	DROP TABLE #t_authors2;
";

            parameters = new List<SaQueryParameter>();
            return "";
        }

        private static string GenerateScritpSimpleProps(IDataBase saDb, string display_Name,
            IMetaType mt,
            DateTime createdDate,
            string creator,
            int? project_ID,
            int? projectRole_ID,
            Dictionary<string, object> simpleProps, out List<SaQueryParameter> parameters)
        {
            string sqlTemplate = @"
			INSERT INTO dbo.ObjectData
			(
				Display_Name,
				[Type_ID],
				CreatedDate,
				Creator,
				[Project_ID],  [ProjectRole_ID]
                {0}) 
			VALUES 
			(
				@Display_Name,
				@Type_ID,
				@CreatedDate,
				@Creator,
				@Project_ID, @ProjectRole_ID
                {1});
";

            parameters = new List<SaQueryParameter>();
            var sqlFields = new StringBuilder();
            var sqlParams = new StringBuilder();

            if (simpleProps != null)
            {
                var translit = new Transliteration();
                translit.ReplacemetSpaceChar = "_";

                foreach (var pair in simpleProps)
                {
                    MetaProperty mp = mt.AllProperties.GetByName(pair.Key) as MetaProperty;

                    string fieldName = ",[" + pair.Key + "]";
                    sqlFields.Append(fieldName);

                    string paramName = "@" + translit.Front(pair.Key);
                    sqlParams.Append(", ").Append(paramName);
                    parameters.Add(new SaQueryParameter
                    {
                        Name = paramName,
                        DbType = mp.GetDbType(),
                        Value = new[] { pair.Value }
                    });
                }
            }

            parameters.Add(new SaQueryParameter
            {
                Name = "@Display_Name",
                DbType = DbType.String,
                Value = new object[] { display_Name }
            });
            parameters.Add(new SaQueryParameter
            {
                Name = "@Type_ID",
                DbType = DbType.Int32,
                Value = new object[] { mt.ID }
            });
            parameters.Add(new SaQueryParameter
            {
                Name = "@CreatedDate",
                DbType = DbType.DateTime,
                Value = new object[] { createdDate }
            });
            parameters.Add(new SaQueryParameter
            {
                Name = "@Creator",
                DbType = DbType.String,
                Value = new object[] { creator }
            });

            parameters.Add(new SaQueryParameter
            {
                Name = "@Project_ID",
                DbType = DbType.Int32,
                Value = project_ID.HasValue ? new object[] { project_ID.Value } : new object[] { null }
            });

            parameters.Add(new SaQueryParameter
            {
                Name = "@ProjectRole_ID",
                DbType = DbType.Int32,
                Value = projectRole_ID.HasValue ? new object[] { projectRole_ID.Value } : new object[] { null }
            });

            return String.Format(sqlTemplate, sqlFields, sqlParams);
        }

        private static string GenerateScritpMultiValues(IDataBase saDb, Dictionary<string, object> multyValProps,
            out List<SaQueryParameter> parameters)
        {
            string sqlTemplate = @"
                /*start---  {0} ----*/
                SELECT TOP 1 @prop_id = mp.Meta_Property_ID 
                FROM Meta_Properties AS mp (nolock) 
				    INNER JOIN Meta_Entities AS me (nolock) ON (me.Meta_Entity_ID = mp.Meta_Property_ID) 
                WHERE me.SystemName = N'{0}';

                select val
                INTO #mv_{1}  
                from dbo.SplitToString({2}, '§');

				INSERT INTO dbo.MultiString (Property_ID, [Object_ID], [Value])  
				SELECT @prop_id, @obj_id, val FROM #mv_{1};  
                /*end-----  {0} ----*/";

            parameters = new List<SaQueryParameter>();
            var sql = new StringBuilder();

            if (multyValProps != null)
            {
                var translit = new Transliteration();
                translit.ReplacemetSpaceChar = "_";

                int i = 0;
                foreach (var pair in multyValProps)
                {
                    string paramName = "@" + translit.Front(pair.Key);
                    sql.AppendFormat(sqlTemplate, pair.Key, i++, paramName).AppendLine().AppendLine();
                    parameters.Add(new SaQueryParameter
                    {
                        Name = paramName,
                        DbType = DbType.String,
                        Value = new[] { pair.Value }
                    });
                }
            }

            return sql.ToString();
        }

        public static void _FieldFastSet(this IDataBase saDB, int objectId, Dictionary<string, object> vals)
        {
            const string sqlTemplate = @"
update [dbo].[ObjectData]
SET 
    #0#
where [Object_ID] = @objectID
";
            var transliteration = new Transliteration { ReplacemetSpaceChar = "_" };

            StringBuilder sb = new StringBuilder();
            if (vals.Count > 0)
            {
                foreach (string s in vals.Keys)
                    sb.Append("[" + s + "] = @Prrr" + transliteration.Front(s) + ", ");
                sb.Remove(sb.Length - 2, 2);
            }
            IQuery qr = saDB.QueriesProvider.CreateQuery();
            qr.Sql = sqlTemplate.Replace("#0#", sb.ToString());

            SqlCommand cmd = new SqlCommand(sqlTemplate.Replace("#0#", sb.ToString()));
            foreach (string prName in vals.Keys)
            {
                var param = new SqlParameter("@Prrr" + transliteration.Front(prName),
                    SqlHelper.GetDbTypeByType(vals[prName].GetType()));
                param.Value = vals[prName];
                cmd.Parameters.Add(param);
            }

            var paramObjID = new SqlParameter("@objectID", SqlDbType.Int);
            paramObjID.Value = objectId;
            cmd.Parameters.Add(paramObjID);

            saDB.QueryService.ExecuteNativeSQLQueryAsIs(new SQLQuery
            {
                Text = cmd.CommandAsSql()
            });
        }

        public static DataTable GetOnlyOneForMbf(IDataBase saDB, int? projectId, int objectId)
        {
            string sql = GetObjectsLinkedWithMBFTasksSQL_Ver01(saDB, projectId, null, null, null, null, 1, false,
                objectId);
            return GetObjectsLinkedWithMBFTasksExecute(sql);
        }

        public static int InquiryRoleSystemGet(IDataBase saDB, InquirySysRoles role)
        {
            var roleID = saDB.ObjectService.CreateProjectRole(role.ToString());

            return roleID;
        }

        public static Dictionary<string, int> InquiryDictionaryRolesGetBy(IDataBase saDB, InquirySysRoles role,
            int projectID, int objectID)
        {
            var res = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            int rolePartRel = InquiryRoleSystemGet(saDB, InquirySysRoles.partrel);
            DataTable rolesData = InquiryGetObjectsMarkedByRoles(saDB, projectID, rolePartRel, objectID);
            if (rolesData == null) return res;

            foreach (DataRow row in rolesData.Rows)
            {
                int relID = (int)row[0];
                string relShortName = (string)row[1];
                res[relShortName] = relID;
            }

            return res;
        }

        public static DataTable InquiryGetObjectsMarkedByRoles(IDataBase saDb, int projectID, int roleID,
            int? linkToObjectID)
        {
            return InquiryGetObjectsMarkedByRolesInternal(saDb, projectID, roleID, null, linkToObjectID,
                new[] { "Object_ID", "ShortName", "Display_Name" });
        }

        public static DataTable InquiryGetObjectsMarkedByRoles(IDataBase saDb, int projectID, int roleID,
            string[] simpleProperties, int? linkToObjectID)
        {
            return InquiryGetObjectsMarkedByRolesInternal(saDb, projectID, roleID, null, linkToObjectID,
                simpleProperties);
        }

        public static DataTable GetObjectsLinkedTo(IDataBase saDb, string[] simpleProperties, int linkToObjectID,
            string targetObjectTypeSysName)
        {
            return InquiryGetObjectsMarkedByRolesInternal(saDb, null, null, targetObjectTypeSysName, linkToObjectID,
                simpleProperties);
        }

        static DataTable InquiryGetObjectsMarkedByRolesInternal(IDataBase saDb, int? projectID, int? roleID,
            string targetObjectTypeSysName, int? linkToObjectID, string[] simpleProperties)
        {
            StringBuilder sb = new StringBuilder();
            if (simpleProperties.Length > 0)
            {
                foreach (string s in simpleProperties)
                    sb.Append("ov.[" + s + "], ");
                sb.Remove(sb.Length - 2, 2);
            }

            var selSec = sb.ToString();

            string sql;
            if (linkToObjectID.HasValue)
            {
                if (roleID.HasValue)
                {
                    string sqlTemplate = @"
select #0#
from
    [dbo].[ObjectData] ov inner join [dbo].[Relations] r 
        on (r.LeftObject_ID = {2} and r.RightObject_ID = ov.[Object_ID])
where ov.Project_ID = {0} and ov.ProjectRole_ID = {1} and ov.deleted = 0 and r.deleted = 0
";
                    sql = String.Format(sqlTemplate, projectID, roleID, linkToObjectID);
                }
                else
                {
                    string sqlTemplate = @"
select #0#
from
    [dbo].[ObjectData] ov inner join [dbo].[Relations] r 
        on (r.LeftObject_ID = {2} and r.RightObject_ID = ov.[Object_ID])
where ov.[Type_ID] = (select top 1 Meta_Entity_ID from meta_entities (nolock) where SystemName = N'{1}')
    and ov.deleted = 0 and r.deleted = 0
";
                    sql = String.Format(sqlTemplate, projectID, targetObjectTypeSysName, linkToObjectID);
                }
            }
            else
            {
                string sqlTemplate = @"
select #0#
from [dbo].[ObjectData] ov 
where ov.Project_ID = {0} and ov.ProjectRole_ID = {1} and ov.deleted = 0
";

                sql = String.Format(sqlTemplate, projectID, roleID);
            }

            sql = sql.Replace("#0#", selSec);
            sql = "SET ROWCOUNT 0; " + System.Environment.NewLine + sql;
            DataSet res = saDb.QueriesProvider.ExecuteQuery(sql).DataSet;

            return res.Tables[0];
        }

        public static ContentCollection GetDataByTypeName(IDataBase saDB, int objectId, string typeName, int page)
        {
            return GetDataByTypeName(saDB, objectId, new[] { _SAConst.Object_ID, _SAConst.Наименование }, typeName, page);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="objectId"></param>
        /// <param name="mainProps"></param>
        /// <param name="typeName"></param>
        /// <param name="page"></param>
        /// <returns></returns>
        public static ContentCollection GetDataByTypeName(IDataBase saDB, int objectId, string[] mainProps, string typeName, int page)
        {
            var query = typeName != null ? saDB._PropertyFastGetSomeSql(objectId, mainProps, typeName, true) : saDB._PropertyFastGetSomeSql(objectId, mainProps);

            var dataQuery = Root.GetDataRawPagedV2(saDB, query, page, null);
            var coolection = HelperContent.WrapDataTableV2(saDB, dataQuery, saDB.Id, new Dictionary<string, string> { { "SearchTaskName", "Источник" } });

            return coolection;
        }
    }

    public enum SAObjectsGroup
    {
        Sources,
        Objects
    }


    public class SARelationData
    {
        public int Relation_ID { get; set; }
        public int Object_ID { get; set; }
    }
}