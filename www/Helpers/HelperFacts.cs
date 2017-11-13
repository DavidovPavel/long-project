using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using ANBR.Common;
using ANBR.Query.Common;
using ANBR.SemanticArchive.SDK;
using www.Models.Items;
using www.SaGateway;

namespace www.Helpers
{
    public static class HelperFacts
    {
        /// <summary>
        /// Количество фактов, свзанных с заданным объектом (id)
        /// </summary>
        /// <param name="saDb"></param>
        /// <param name="id"></param>
        /// <param name="searchTaskIDFilter">фильтр по Поисковым задачам</param>
        /// <returns></returns>
        public static int GetFactsForStatsOnly(IDataBase saDb, int id, int[] searchTaskIDFilter)
        {
            string sqlTemplate = GetFactsForSQLStats(searchTaskIDFilter?.Length > 0);
            sqlTemplate = sqlTemplate.Replace("#onlyDefinedSearchTasks#", searchTaskIDFilter?.Length > 0 ? $"and SearchTask.[Object_ID] in ({String.Join(",", searchTaskIDFilter)})" : "");

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

        /// <summary>
        /// Список фактов, свзанных с заданным объектом (id)
        /// </summary>
        /// <param name="saDb"></param>
        /// <param name="id"></param>
        /// <param name="searchTaskIDFilter">фильтр по Поисковым задачам</param>
        /// <param name="page"></param>
        /// <returns></returns>
        public static List<ListElementWithSearchTask> GetFactsFor(IDataBase saDb, int id, int[] searchTaskIDFilter, int page)
        {
            int totalNum = GetFactsForStatsOnly(saDb, id, searchTaskIDFilter);

            string sqlTemplate = GetFactsForSQLWithData(searchTaskIDFilter?.Length > 0);
            sqlTemplate = sqlTemplate.Replace("#onlyDefinedSearchTasks#", searchTaskIDFilter?.Length > 0 ? $"and SearchTask.[Object_ID] in ({String.Join(",", searchTaskIDFilter)})" : "");

            int rowFrom = (page - 1) * Root.PAGE_SIZE + 1;
            int rowTo = page * Root.PAGE_SIZE;
            var queryParameters = new List<SaQueryParameter>
                {
                    new SaQueryParameter {DbType = DbType.Int32, Name = "@rowFrom", Value = new object[] {rowFrom}},
                    new SaQueryParameter {DbType = DbType.Int32, Name = "@rowTo", Value = new object[] {rowTo}},
                    new SaQueryParameter {DbType = DbType.Int32, Name = "@LeftObject_ID", Value = new object[] {id}}
                };

            var query = new SQLQuery
            {
                Text = sqlTemplate,
                QueryParameters = queryParameters
            };

            SqlQueryResult qres = saDb.QueryService.ExecuteNativeSQLQueryAsIs(query);


            List<ListElementWithSearchTask> output =
                (qres.Result.Tables[0].AsEnumerable()
                    .Select(row =>
                        new ListElementWithSearchTask()
                        {
                            id = row.Field<Int32>("Object_ID"),
                            uid = row.Field<Guid>("UID").ToString(),
                            typeid = row.Field<Int32>("Type_ID"),
                            title = row.Field<String>("Display_Name"),
                            type = row.Field<String>("TypeDispName"),
                            linkToSourceID = row.Field<int?>("Source_ID"),
                            source = row.FieldOrDefault<string>("SourceName"),
                            searchSATaskUID = row.Field<Guid?>("SearchTaskUID")

                        })).ToList();

            output.Add(new ListElementWithSearchTask
            {
                id = 0,
                page = page,
                pageSize = Root.PAGE_SIZE,
                num = totalNum
            });

            return output;
        }


        private static string GetFactsForSQLStats(bool onlyLinkedToSources)
        {
            return @"
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
        select count(distinct d.[Object_ID])
        from dbo.Relations r inner join dbo.ObjectData d on (r.RightObject_ID = d.[Object_ID]) " +
    (onlyLinkedToSources ? " inner join " : " left outer join ") +
@"             (
                    select r.[LeftObject_ID], linked.[Object_ID], linked.[Display_Name]
			        from 
				        [dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                                inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				        where 
					        me.SystemName = 'Contains_found_object'
		        ) SearchTask on (SearchTask.[LeftObject_ID] = d.object_id)
        where 
	        r.LeftObject_ID = @LeftObject_ID and
	        d.Deleted = 0 and d.ProjectRole_ID is NULL and
	        [dbo].[IsMyParentAFact](d.[Type_ID]) = 1
            #onlyDefinedSearchTasks#;

    END ELSE
    BEGIN
        select count(distinct d.[Object_ID])
        from [dbo].[SourceRelations] r inner join dbo.ObjectData d on (r.[Object_ID] = d.[Object_ID]) " +
    (onlyLinkedToSources ? " inner join " : " left outer join ") +
@"             (
                    select r.[LeftObject_ID], linked.[Object_ID], linked.[Display_Name]
			        from 
				        [dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                                inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				        where 
					        me.SystemName = 'Contains_found_object'
		        ) SearchTask on (SearchTask.[LeftObject_ID] = d.object_id)
        where 
	        r.[Source_ID] = @LeftObject_ID and
	        d.Deleted = 0 and d.ProjectRole_ID is NULL and
	        [dbo].[IsMyParentAFact](d.[Type_ID]) = 1
             #onlyDefinedSearchTasks#;
    END
";
        }

        private static string GetFactsForSQLWithData(bool onlyLinkedToSources)
        {
            return @"
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
        ;with cte_idsOnRowId as (
	        select 
                distinct
		        d.[Object_ID]
            from dbo.Relations r inner join dbo.ObjectData d on (r.RightObject_ID = d.[Object_ID])" +
            (onlyLinkedToSources ?
@"          left outer join              (
                    select r.[LeftObject_ID], linked.[Object_ID], linked.[Display_Name]
			        from 
				        [dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                                inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				        where 
					        me.SystemName = 'Contains_found_object'
		        ) SearchTask on (SearchTask.[LeftObject_ID] = d.object_id) " : "") +
@"          where 
	            r.LeftObject_ID = @LeftObject_ID and
	            d.Deleted = 0 and d.ProjectRole_ID is NULL and
	            [dbo].[IsMyParentAFact](d.[Type_ID]) = 1
                #onlyDefinedSearchTasks#
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
            d.[Object_ID], d.UID, d.[Type_ID], d.Display_Name, TypeDispName = me.DisplayName, sr.Source_ID,
            SourceName = SearchTask.[Display_Name],
            SearchTaskUID = convert(uniqueidentifier, SearchTask.[TaskTypeUID])
            --SearchTaskID = SearchTask.[Object_ID]
        from dbo.ObjectData (NOLOCK) d inner join cte_idsOnPage svp on (d.[Object_ID] = svp.[Object_ID])
            inner join dbo.Meta_Entities me on (d.[Type_ID] = me.Meta_Entity_ID)
            left outer join [dbo].[SourceRelations] sr on (sr.[Object_ID] = d.[Object_ID]) 
            left outer join (
                    select r.[LeftObject_ID], linked.[TaskTypeUID], linked.[Display_Name]
			        from 
				        [dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                                inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				        where 
					        me.SystemName = 'Contains_found_object'
		        ) SearchTask on (SearchTask.[LeftObject_ID] = d.object_id)
    END ELSE
    BEGIN
        ;with cte_idsOnRowId as (
	        select 
                distinct
		        d.[Object_ID]
	        from [dbo].[SourceRelations] r inner join dbo.ObjectData d on (r.[Object_ID] = d.[Object_ID]) " +
            (onlyLinkedToSources ? 
@"          left outer join              (
                    select r.[LeftObject_ID], linked.[Object_ID], linked.[Display_Name]
			        from 
				        [dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                                inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				        where 
					        me.SystemName = 'Contains_found_object'
		        ) SearchTask on (SearchTask.[LeftObject_ID] = d.object_id) " : "") +

@"          where 
	            r.[Source_ID] = @LeftObject_ID and
	            d.Deleted = 0 and d.ProjectRole_ID is NULL and
	            [dbo].[IsMyParentAFact](d.[Type_ID]) = 1
                #onlyDefinedSearchTasks#
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
        select distinct d.[Object_ID], d.UID, d.[Type_ID], d.Display_Name, TypeDispName = me.DisplayName, Source_ID = @LeftObject_ID,
            SourceName = SearchTask.[Display_Name],
            SearchTaskUID = convert(uniqueidentifier, SearchTask.[TaskTypeUID])
            --SearchTaskID = SearchTask.[Object_ID]
        from dbo.ObjectData (NOLOCK) d inner join cte_idsOnPage svp on (d.[Object_ID] = svp.[Object_ID])
            inner join dbo.Meta_Entities me on (d.[Type_ID] = me.Meta_Entity_ID) 
            left outer join              (
                    select r.[LeftObject_ID], linked.[TaskTypeUID], linked.[Display_Name]
			        from 
				        [dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                                inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				        where 
					        me.SystemName = 'Contains_found_object'
		        ) SearchTask on (SearchTask.[LeftObject_ID] = d.object_id)

    END
";
        }

    }
}
