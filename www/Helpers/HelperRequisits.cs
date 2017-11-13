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
    public static class HelperRequisits
    {
        /// <summary>
        /// Количество реквизитов(признаков, свзанных с заданным объектом (id)
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="id"></param>
        /// <param name="searchTaskIDFilter"></param>
        /// <returns></returns>
        public static int GetRequisitesStatsOnly(IDataBase saDB, int id, int[] searchTaskIDFilter)
        {
            string sqlTemplate = GetRequisitesSQLStats(searchTaskIDFilter?.Length > 0);
            sqlTemplate = sqlTemplate.Replace("#onlyDefinedSearchTasks#", searchTaskIDFilter?.Length > 0 ? $"and SearchTask.[Object_ID] in ({String.Join(",", searchTaskIDFilter)})" : "");

            var queryParameters = new List<SaQueryParameter>
            {
                new SaQueryParameter {DbType = DbType.Int32, Name = "@LeftObject_ID", Value = new object[] { id }}
            };

            var query = new SQLQuery
            {
                Text = sqlTemplate,
                QueryParameters = queryParameters
            };

            SqlQueryResult qres = saDB.QueryService.ExecuteNativeSQLQueryAsIs(query);

            return (int)qres.Result.Tables[0].Rows[0][0];
        }

        /// <summary>
        /// Список реквизитов(признаков, свзанных с заданным объектом (id)
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="id"></param>
        /// <param name="searchTaskIDFilter"></param>
        /// <param name="page"></param>
        /// <returns></returns>
        public static List<ListElementWithSearchTask> GetRequisites(IDataBase saDB, int id, int[] searchTaskIDFilter, int page)
        {
            string sqlTemplate = GetRequisitesSQLStats(searchTaskIDFilter?.Length > 0);
            sqlTemplate += GetRequisitesSQLWithData(searchTaskIDFilter?.Length > 0);
            sqlTemplate = sqlTemplate.Replace("#onlyDefinedSearchTasks#", searchTaskIDFilter?.Length > 0 ? $"and SearchTask.[Object_ID] in ({String.Join(",", searchTaskIDFilter)})" : "");

            int rowFrom = (page - 1) * Root.PAGE_SIZE + 1;
            int rowTo = page * Root.PAGE_SIZE;
            var queryParameters = new List<SaQueryParameter>
            {
                new SaQueryParameter {DbType = DbType.Int32, Name = "@rowFrom", Value = new object[] {rowFrom}},
                new SaQueryParameter {DbType = DbType.Int32, Name = "@rowTo", Value = new object[] {rowTo}},
                new SaQueryParameter {DbType = DbType.Int32, Name = "@LeftObject_ID", Value = new object[] { id }}
            };

            var query = new SQLQuery
            {
                Text = sqlTemplate,
                QueryParameters = queryParameters
            };

            SqlQueryResult qres = saDB.QueryService.ExecuteNativeSQLQueryAsIs(query);

            List<ListElementWithSearchTask> output =
                (qres.Result.Tables[1].AsEnumerable()
                    .Select(item =>
                            new ListElementWithSearchTask
                            {
                                id = item.Field<Int32>("Object_ID"),
                                uid = item.Field<Guid>("UID").ToString(),
                                typeid = item.Field<Int32>("Type_ID"),
                                title = item.Field<String>("Display_Name"),
                                type = item.Field<String>("TypeDispName"),
                                source = item.FieldOrDefault<string>("SourceName"),
                                searchSATaskUID = item.Field<Guid?>("SearchTaskUID")
                            })
                ).ToList();

            output.Add(new ListElementWithSearchTask
            {
                id = 0,
                page = page,
                pageSize = Root.PAGE_SIZE,
                num = (int)qres.Result.Tables[0].Rows[0][0]
            });

            return output;
        }

        /// <summary>
        /// Запрос - "Признаки - общее количество"
        /// </summary>
        /// <returns></returns>
        public static string GetRequisitesSQLStats(bool onlyLinkedToSources)
        {
            string sql = @"
;with 
onlyone(baseid) as 
(
	select top 1 Meta_Entity_ID from meta_entities (nolock) where SystemName = 'Priznak'
),
excludeTypes(Meta_Type_ID) as
(
	select top 1 Meta_Entity_ID from meta_entities (nolock) where SystemName in ('OKVED')
),
alltypes(Meta_Type_ID) as
(
	select C.Meta_Type_ID from onlyone T cross apply GetChildTypeId(T.baseid) C 
	where C.Meta_Type_ID not in (select Meta_Type_ID from excludeTypes) 
)
select count(distinct d.[Object_ID])
from dbo.Relations r inner join dbo.ObjectData d on (r.RightObject_ID = d.[Object_ID])
inner join dbo.Meta_Entities me on (d.[Type_ID] = me.Meta_Entity_ID)
	inner join alltypes at on (d.[Type_ID] = at.[Meta_Type_ID])" +
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
	d.Deleted = 0
    #onlyDefinedSearchTasks#;
";
            return sql;

        }

        /// <summary>
        /// Запрос - "Признаки - данные"
        /// </summary>
        /// <returns></returns>
        public static string GetRequisitesSQLWithData(bool onlyLinkedToSources)
        {
            string sql = @"
;with 
onlyone(baseid) as 
(
	select top 1 Meta_Entity_ID from meta_entities (nolock) where SystemName = 'Priznak'
),
excludeTypes(Meta_Type_ID) as
(
	select top 1 Meta_Entity_ID from meta_entities (nolock) where SystemName in ('OKVED')
),
alltypes(Meta_Type_ID) as
(
	select C.Meta_Type_ID from onlyone T cross apply GetChildTypeId(T.baseid) C 
	where C.Meta_Type_ID not in (select Meta_Type_ID from excludeTypes) 
),
cte_idsOnRowId as (
	select 
        distinct
		d.[Object_ID]
    from dbo.Relations r 
        inner join dbo.ObjectData d on (r.RightObject_ID = d.[Object_ID])
        inner join alltypes at on (d.[Type_ID] = at.[Meta_Type_ID]) " +
            (onlyLinkedToSources ?
@"          left outer join              (
                    select r.[LeftObject_ID], linked.[Object_ID], linked.[Display_Name]
			        from 
				        [dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                                inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				        where 
					        me.SystemName = 'Contains_found_object'
		        ) SearchTask on (SearchTask.[LeftObject_ID] = d.object_id) " : "") +
@"  where 
	    r.LeftObject_ID = @LeftObject_ID and
	    d.Deleted = 0
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
select distinct d.[Object_ID], d.UID, d.[Type_ID], d.Display_Name, TypeDispName = me.DisplayName,
    SourceName = SearchTask.[Display_Name],
    SearchTaskUID = convert(uniqueidentifier, SearchTask.[TaskTypeUID]) 
    --SearchTaskID = SearchTask.[Object_ID]
from dbo.ObjectData d 
    inner join cte_idsOnPage svp on (d.[Object_ID] = svp.[Object_ID])
    inner join dbo.Meta_Entities me on (d.[Type_ID] = me.Meta_Entity_ID)
    left outer join
        (
            select r.[LeftObject_ID], linked.[TaskTypeUID], linked.[Display_Name]
			from 
				[dbo].[Relations] r inner join [dbo].[ObjectData] linked on (r.[RightObject_ID] = linked.[Object_ID])
                        inner join [dbo].[Meta_Entities] me on (r.[RightRole_ID] = me.Meta_Entity_ID)
				where 
					me.SystemName = 'Contains_found_object'
		) SearchTask on (SearchTask.[LeftObject_ID] = d.object_id)
";
            return sql;
        }
    }
}
