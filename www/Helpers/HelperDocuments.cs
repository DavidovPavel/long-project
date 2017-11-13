using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Anbr.Web.SA.CoreLogic;
using ANBR.Common;
using ANBR.Common.Contracts;
using ANBR.Query.Common;
using ANBR.SemanticArchive.SDK;
using www.Models.Items;
using www.SaGateway;

namespace www.Helpers
{
    public static class HelperDocuments
    {
        /// <summary>
        /// Запрос - "Сведения из БД - общее количество"
        /// </summary>
        /// <param name="mode"></param>
        /// <param name="onlyLinkedToSources"></param>
        /// <param name="projectId"></param>
        /// <returns></returns>
        public static string GetDocumentsInfoSQLStats(DatabaseMode mode, bool onlyLinkedToSources, int? projectId)
        {
            string sql = @"
;with 
doc_types(id) as 
(
	select Meta_Entity_ID from meta_entities (nolock) where SystemName = 'Source'
),
all_doc_types(id)  as 
(
	select C.Meta_Type_ID from doc_types T cross apply GetChildTypeId(T.id) C  
    where
        #mtSystemNameFilter#
)
select count(distinct sv.[Object_ID])
from dbo.ObjectData sv (nolock) inner join all_doc_types t1 (nolock) on (sv.[Type_ID] = t1.id) " +
    (onlyLinkedToSources ? " inner join " : " left outer join ") +
@"      (
            select r.[LeftObject_ID], linked.[Object_ID], linked.[Display_Name]
			from 
				[dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                        inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				where 
					me.SystemName = 'Contains_found_object'
		) SearchTask on (SearchTask.[LeftObject_ID] = sv.object_id)
where
	(sv.[Object_ID] in (select [Source_ID] from [dbo].[SourceRelations] sr where sr.[Object_ID]  in ({0})) or
	 sv.[Object_ID] in (select [LeftObject_ID] from [dbo].[Relations] r where r.RightObject_ID  in ({0})) or
	 sv.[Object_ID] in (select RightObject_ID from [dbo].[Relations] r where r.[LeftObject_ID]  in ({0})))
    and sv.Deleted = 0 
";

            sql += (mode == DatabaseMode.Request) ? $@"and sv.Project_ID = {projectId} and sv.ProjectRole_ID is NULL " : " ";
            sql += @"  #onlyWithOriginalFiles#";
            sql += @"  #onlyDefinedSearchTasks#";

            return sql;
        }

        /// <summary>
        /// Запрос - "Сведения из БД - постраничные данные"
        /// </summary>
        /// <param name="mode"></param>
        /// <param name="onlyLinkedToSources"></param>
        /// <param name="projectId"></param>
        /// <returns></returns>
        public static string GetDocumentsInfoSQLWithData(DatabaseMode mode, bool onlyLinkedToSources, int? projectId)
        {
#warning В ряде случаев наблюдается картина когда одна и та же выписка привязана к разным типам задач??? тогда количество расходится с результирующим набором

            string sql = @"
;with 
doc_types(id) as 
(
	select Meta_Entity_ID from meta_entities (nolock) where SystemName = 'Source'
),
all_doc_types(id)  as 
(
	select C.Meta_Type_ID from doc_types T cross apply GetChildTypeId(T.id) C  
    where
        #mtSystemNameFilter#
),
cte_idsOnRowId as (
	select 
        distinct
		sv.[Object_ID]
	from dbo.ObjectData sv inner join all_doc_types as t1 on (sv.[Type_ID] = t1.id) " +

    (onlyLinkedToSources ?
@"    inner join
        (
            select r.[LeftObject_ID], linked.[Object_ID], linked.[Display_Name]

            from
                [dbo].[Relations] r inner join[dbo].[ObjectData] linked on(r.[RightObject_ID] = linked.[Object_ID])
                        inner join[dbo].[Meta_Entities] me on(r.[RightRole_ID] = me.Meta_Entity_ID)

                where
                    me.SystemName = 'Contains_found_object'
		) SearchTask on (SearchTask.[LeftObject_ID] = sv.object_id)
" : "") +
@"	where
	        (sv.[Object_ID] in (select [Source_ID] from [dbo].[SourceRelations] sr where sr.[Object_ID]  in ({0})) or
	         sv.[Object_ID] in (select [LeftObject_ID] from [dbo].[Relations] r where r.RightObject_ID  in ({0})) or
	         sv.[Object_ID] in (select RightObject_ID from [dbo].[Relations] r where r.[LeftObject_ID]  in ({0})))
			and sv.Deleted = 0 " + " #onlyDefinedSearchTasks# " +
(mode == DatabaseMode.Request ? $@"and sv.Project_ID = {projectId} and sv.ProjectRole_ID is NULL " : " ") +
@" #onlyWithOriginalFiles#
	), 
	cte_ids as ( 
	select  
		rowid = ROW_NUMBER() OVER ( ORDER BY [object_id]), 
		[Object_ID] 
	from cte_idsOnRowId 
	), 
	cte_idsOnPage as ( 
	select  
		[Object_ID] 
	from cte_ids 
	WHERE   rowid >= @rowFrom AND rowid <= @rowTo
	)
select distinct
	sv.[object_id], 
	KnowledgeExtracted = (
	select dic.[DisplayName]
	from
		[dbo].[Dictionaries] dic 
	where 
		dic.[Meta_Dictionary_ID] = (select top 1 Dictionary_ID from [dbo].[V_Meta_Properties] where [SystemName] = 'знания_выделены')
		and dic.[Value_ID] = sv.[знания_выделены]),
	size = len(TextSource),
	Title = sv.[Display_Name],
    SourceName = SearchTask.[Display_Name],
    SearchTaskUID = convert(uniqueidentifier, SearchTask.[TaskTypeUID])
--    SearchTaskID = SearchTask.[Object_ID]
from dbo.source_view sv inner join cte_idsOnPage svp on (sv.[Object_ID] = svp.[Object_ID])  
    left outer join 
        (
            select r.[LeftObject_ID], linked.[Object_ID], linked.[Display_Name], linked.[TaskTypeUID]
			from 
				[dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                        inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				where 
					me.SystemName = 'Contains_found_object'
		) SearchTask on (SearchTask.[LeftObject_ID] = sv.object_id)
";
            return sql;
        }

        /// <summary>
        /// Получить сведения о документах (фильтр по заявкам)
        /// </summary>
        /// <param name="ids">IDs объектов</param>
        /// <param name="onlyWithOriginalFiles"></param>
        /// <param name="searchTaskIDFilter">фильтр по источникам</param>
        /// <param name="mtSystemNameFilter">фильтра по типу (и его наследникам)</param>
        /// <param name="without">кроме указанного типа</param>
        /// <param name="mode"></param>
        /// <returns></returns>
        public static int GetDocumentsInfoStatsOnly(int[] ids, bool onlyWithOriginalFiles, int[] searchTaskIDFilter, string mtSystemNameFilter, bool without, DatabaseMode mode)
        {
            IDataBase saDB = WebSaUtilities.Database;
            int? projectID = Scope.GetInternalPrjIDi();

            string sqlTemplate = GetDocumentsInfoSQLStats(mode, searchTaskIDFilter?.Length > 0, projectID);
            sqlTemplate = GetDocumentsInfoFillSubstitution(onlyWithOriginalFiles, searchTaskIDFilter, mtSystemNameFilter, without, sqlTemplate);

            var query = new SQLQuery
            {
                Text = String.Format(sqlTemplate, String.Join(",", ids))
            };

            SqlQueryResult qres = saDB.QueryService.ExecuteNativeSQLQueryAsIs(query);

            return (int)qres.Result.Tables[0].Rows[0][0];
        }


        /// <summary>
        /// Получить сведения о документах (фильтр по заявкам)
        /// </summary>
        /// <param name="ids">IDs объектов</param>
        /// <param name="onlyWithOriginalFiles"></param>
        /// <param name="mtSystemNameFilter">фильтра по типу (и его наследникам)</param>
        /// <param name="without">кроме указанного типа</param>
        /// <param name="page"></param>
        /// <param name="searchTaskIDFilter">Устанавливает фильтра по поисковым задачам</param>
        /// <returns></returns>
        public static List<ListSources> GetDocumentsInfo(int[] ids, bool onlyWithOriginalFiles, string mtSystemNameFilter, bool without, int page, int[] searchTaskIDFilter)
        {
            IDataBase saDB = WebSaUtilities.Database;
            DatabaseMode mode = saDB.ObjectService.GetDatabaseInfo().DatabaseMode;
            int? projectId = Scope.GetInternalPrjIDi();

            string sqlTemplate = GetDocumentsInfoSQLStats(mode, searchTaskIDFilter?.Length > 0, projectId);
            sqlTemplate += GetDocumentsInfoSQLWithData(mode, searchTaskIDFilter?.Length > 0, projectId);

            int rowFrom = (page - 1) * Root.PAGE_SIZE + 1;
            int rowTo = page * Root.PAGE_SIZE;
            var queryParameters = new List<SaQueryParameter>
            {
                new SaQueryParameter {DbType = DbType.Int32, Name = "@rowFrom", Value = new object[] {rowFrom}},
                new SaQueryParameter {DbType = DbType.Int32, Name = "@rowTo", Value = new object[] {rowTo}}
            };

            sqlTemplate = GetDocumentsInfoFillSubstitution(onlyWithOriginalFiles, searchTaskIDFilter, mtSystemNameFilter, without, sqlTemplate);

            var query = new SQLQuery
            {
                Text = String.Format(sqlTemplate, String.Join(",", ids)),
                QueryParameters = queryParameters
            };

            SqlQueryResult qres = saDB.QueryService.ExecuteNativeSQLQueryAsIs(query);

            List<ListSources> output =
                (qres.Result.Tables[1].AsEnumerable()
                    .Select(item =>
                        new ListSources()
                        {
                            id = item.Field<int>("object_id"),
                            title = item.Field<string>("Title"),
                            source = item.FieldOrDefault<string>("SourceName"),
                            sel = item.FieldOrDefault<string>("KnowledgeExtracted"),
                            size = item.FieldOrDefault<long>("size"),
                            searchSATaskUID = item.Field<Guid?>("SearchTaskUID")
                        })).ToList();

            output.Add(new ListSources
            {
                id = 0,
                page = page,
                pageSize = Root.PAGE_SIZE,
                num = (int)qres.Result.Tables[0].Rows[0][0]
            });


            return output;
        }

        private static string GetDocumentsInfoFillSubstitution(bool onlyWithOriginalFiles, int[] onlyDefinedSearchTasks, string mtSystemNameFilter, bool without, string sqlTemplate)
        {
            if (onlyWithOriginalFiles)
                sqlTemplate = sqlTemplate.Replace("#onlyWithOriginalFiles#", " and sv.[Файл_оригинала] is not null");
            else
                sqlTemplate = sqlTemplate.Replace("#onlyWithOriginalFiles#", "");

            if (onlyDefinedSearchTasks != null && onlyDefinedSearchTasks.Length > 0)
                sqlTemplate = sqlTemplate.Replace("#onlyDefinedSearchTasks#", $"and SearchTask.[Object_ID] in ({String.Join(",", onlyDefinedSearchTasks)})");
            else
                sqlTemplate = sqlTemplate.Replace("#onlyDefinedSearchTasks#", "");

            if (mtSystemNameFilter != null)
            {
                //InfoDB заявки
                if (!without)
                    sqlTemplate = sqlTemplate.Replace("#mtSystemNameFilter#", String.Format(
                            "C.[Meta_Type_ID] in (select Meta_Type_ID from [dbo].[GetChildTypeId]((select [Meta_Type_ID] from [dbo].[V_Meta_Types] where SystemName = '{0}')))",
                            "InfoDB"));
                else
                    sqlTemplate = sqlTemplate.Replace("#mtSystemNameFilter#", String.Format(
                            "C.[Meta_Type_ID] not in (select Meta_Type_ID from [dbo].[GetChildTypeId]((select [Meta_Type_ID] from [dbo].[V_Meta_Types] where SystemName = '{0}')))",
                            "InfoDB"));
            }

            return sqlTemplate;
        }
    }
}
