using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using ANBR.Common.Contracts;
using ANBR.Query.Common;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.DataContracts;
using ANBR.SemanticArchive.SDK;
using www.Models;
using www.Models.Items;

namespace www.SaGateway.Factories
{
    /// <summary>
    /// Разновидность древовидных рубрикаторов
    /// </summary>
    public enum ModuleRubricsKind
    {
        /// <summary>
        /// Базовый рубрикатор СА
        /// </summary>
        ForObjects,
        /// <summary>
        /// Рубрикатор на уровне проектов-заявок
        /// </summary>
        ForProjects,
        /// <summary>
        /// Рубрикатор разделов пояснительной записки
        /// </summary>
        NoteSections
    }

    public static class FactoryModuleRubrics
    {
        public static ModuleRubricsBase GetModule(ModuleRubricsKind kind, IDataBase saDB, Dictionary<string, object> qparams)
        {
            if (kind == ModuleRubricsKind.ForObjects)
                return new ModuleRubricsForObjects(saDB);
            if (kind == ModuleRubricsKind.ForProjects)
                return new ModuleRubricsForProjects(saDB);
            if (kind == ModuleRubricsKind.NoteSections)
                return new ModuleRubricsForNoteSections(saDB, qparams);

            throw new ArgumentException();
        }
    }

    /// <summary>
    /// Управление разделами пояснительной записки
    /// </summary>
    class ModuleRubricsForNoteSections : ModuleRubricsBase
    {
        private readonly int _oid;

        public ModuleRubricsForNoteSections(IDataBase saDb, Dictionary<string, object> qparams) : base(saDb)
        {
            _oid = (int)qparams["oid"];
        }

        static EnumerableRowCollection<DataRow> GetNodeSections(IDataBase saDb, int oid)
        {
            string sql = @"
declare @targetTypeID int;

select 
	@targetTypeID = Meta_Entity_ID from meta_entities (nolock) 
where SystemName =
	case when dbo.IsObjectA(@objectID, 'Person') = 1  then 'Sfera_deyatelnosti_Pers' else 'Sfera_deyatelnosti_Org' end;


;with 
mdata(id) as 
(
	select Meta_Entity_ID from meta_entities (nolock) where SystemName = 'External_ID'
)
select od.[Object_ID], od.[Parent_ID], od.[Display_Name], od.[CreatedDate], od.[Type_ID] from [dbo].[MultiString] ms (nolock) 
	inner join mdata md on (ms.[Property_ID] = md.id)  
	inner join ObjectData od on (ms.[Object_ID] = od.[Object_ID])
where 
	value = 'webcheck' and od.[Type_ID] = @targetTypeID and od.deleted = 0
order by od.CreatedDate 
";

            var data = saDb.QueryService.ExecuteNativeSQLQueryAsIs(new SQLQuery
            {
                QueryParameters = new List<SaQueryParameter>
                {
                  new SaQueryParameter
                  {
                    Name  = "@objectID",
                    DbType = DbType.Int32,
                    Value  = new object[] { oid }
                  }
                },
                Text = sql
            });

            return data.Result.Tables[0].AsEnumerable();
        }

        static TreeElement CreateNodeSections(IDataBase saDb, TreeElement sec, int oid)
        {
            string creator = WebSaUtilities.GetCurrentUserName();

            string sql = @"
    select me.Meta_Entity_ID, me.SystemName from meta_entities me (nolock) 
	where
		me.SystemName = case when dbo.IsObjectA(@objectID, 'Person') = 1  then 'Sfera_deyatelnosti_Pers' else 'Sfera_deyatelnosti_Org' end
";

            var data = saDb.QueryService.ExecuteNativeSQLQueryAsIs(new SQLQuery
            {
                QueryParameters = new List<SaQueryParameter>
                {
                  new SaQueryParameter
                  {
                    Name  = "@objectID",
                    DbType = DbType.Int32,
                    Value  = new object[] { oid }
                  }
                },
                Text = sql
            });

            var targetTypeID = (int)data.Result.Tables[0].Rows[0][0];
            var targetCDate = (sec.cdate.HasValue && sec.cdate > 0) ? new DateTime(sec.cdate.Value) : DateTime.Now;

            int? parentID = null;

            var multiValProps = new Dictionary<string, object>
            {
                {"External_ID", "webcheck"}
            };

            var simpleProps = new Dictionary<string, object>();

            if (!String.IsNullOrWhiteSpace(sec.parentid))
            {
                parentID = Convert.ToInt32(sec.parentid) > 0 ? Convert.ToInt32(sec.parentid) : (int?)null;
                if (parentID.HasValue)
                    simpleProps["Parent_ID"] = parentID.Value;
            }

            int obj_ID = saDb._ObjFastCreate(sec.title, targetTypeID, null, targetCDate, creator, null, null, simpleProps, multiValProps, null);
            sec.id = obj_ID.ToString();

            return sec;
        }

        static TreeElement UpdateNodeSections(IDataBase saDb, TreeElement model)
        {
            var targetCDate = model.cdate.HasValue ? new DateTime(model.cdate.Value) : DateTime.Now;
            var targetObj_ID = Convert.ToInt32(model.id);

            saDb._FieldFastSet(targetObj_ID, new Dictionary<string, object>
                {
                    {_SAConst.Наименование, model.title},
                    {"CreatedDate", targetCDate}
                });

            return model;
        }

        public static void DeleteNodeSection(IDataBase saDb, int id)
        {
            saDb._ObjFastDelete(id);
            SQLQuery query = new SQLQuery
            {
                Text = @"
declare @targetTypeID int;
select @targetTypeID = [Type_ID] from dbo.[ObjectData] where [Object_ID] = @id;

update dbo.ObjectData set Deleted = 1 where [Parent_ID] = @id and [Type_ID] = @targetTypeID"
,
                QueryParameters = new List<SaQueryParameter>
                {
                    new SaQueryParameter {DbType = DbType.Int32, Name = "@id", Value = new object[] {id}}
                }
            };
            saDb.QueryService.ExecuteNativeSQLQueryAsIs(query);
        }

        /// <summary>
        /// Получить список разделов
        /// </summary>
        /// <returns></returns>
        public override IEnumerable<TreeElement> Get()
        {
            var data = GetNodeSections(saDB, _oid);
            var res = data.Select(item => new TreeElement
            {
                id = item.Field<int>(0).ToString(),
                parentid = (item.Field<int?>(1)?.ToString()) ?? "-1",
                title = item.Field<string>(2),
                cdate = item.Field<DateTime>(3).Ticks,
                isdoc = false
            }).ToList();

            res = res.Select(item =>
            {
                item.children = res.Any(el => el.parentid == item.id) ? 1 : 0;
                return item;
            }).ToList();


            res.Add(new TreeElement { id = "-1", parentid = "0", title = @"...", isdoc = false, children = res.Count > 0 ? 1 : 0 });

            return res;
        }

        /// <summary>
        /// Доавить раздел
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public override TreeElement Post(TreeElement model)
        {
            return CreateNodeSections(saDB, model, _oid);
        }

        /// <summary>
        /// Изменить существующий раздел
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public override TreeElement Put(TreeElement model)
        {
            return UpdateNodeSections(saDB, model);
        }

        /// <summary>
        /// Удалить раздел пояснительной записки
        /// </summary>
        /// <param name="id"></param>
        public override void Delete(int id)
        {
            DeleteNodeSection(saDB, id);
        }
    }

    /// <summary>
    /// Управление рубриками проектов
    /// </summary>
    class ModuleRubricsForProjects : ModuleRubricsBase
    {
        public ModuleRubricsForProjects(IDataBase saDb) : base(saDb)
        {
        }

        public override IEnumerable<TreeElement> Get()
        {
            List<ProjectRubric> rubrics = saDB.ObjectService.ProjectRubricsGetAll();
            List<RubricStatistics> rubricStatistics = saDB.ObjectService.ProjectRubricsGetStatistics();

            var query =
                from r in rubrics
                join rs in rubricStatistics on r.ID equals rs.RubricID into gj
                from stat in gj.DefaultIfEmpty()
                orderby r.Parent_ID ?? 0 descending, r.SortIndex ?? 0 descending
                select new TreeElement
                {
                    id = r.ID.ToString(),
                    parentid = (r.Parent_ID ?? -1).ToString(),
                    title = r.Name,
                    isdoc = false,
                    children = rubrics.Any(item => item.Parent_ID == r.ID) ? 1 : 0,
                    linkedObjectCount = stat?.Count ?? 0,
                    iconexist = false
                };

            var res = query.ToList();
            res.Add(new TreeElement { id = "-1", parentid = "0", title = @"...", isdoc = false, children = res.Count > 0 ? 1 : 0 });

            return res;
        }

        public override TreeElement Post(TreeElement model)
        {
            int rubricPID = 0;
            if (!String.IsNullOrWhiteSpace(model.parentid))
                rubricPID = Convert.ToInt32(model.parentid);

            model.id = saDB.ObjectService.ProjectRubricsAdd(new ProjectRubric
            {
                Parent_ID = Convert.ToInt32(rubricPID) > 0 ? Convert.ToInt32(rubricPID) : (int?)null,
                Name = model.title
            }).ToString();

            return model;
        }

        public override TreeElement Put(TreeElement model)
        {
            int rubricID = Convert.ToInt32(model.id);
            ProjectRubric r = saDB.ObjectService.ProjectRubricsGet(rubricID);
            r.Name = model.title;
            saDB.ObjectService.ProjectRubricsEdit(r);

            return model;
        }

        public override void Delete(int id)
        {
            saDB.ObjectService.ProjectRubricsDelete(id);
        }
    }

    class ModuleRubricsForObjects : ModuleRubricsBase
    {
        public ModuleRubricsForObjects(IDataBase saDb) : base(saDb)
        {
        }

        public override IEnumerable<TreeElement> Get()
        {
            List<Rubric> rubrics = saDB.ObjectService.GetAllRubrics();
            List<RubricStatistics> rubricStatistics = saDB.ObjectService.GetRubricStatistics();


            var query =
                        from r in rubrics
                        join rs in rubricStatistics on r.ID equals rs.RubricID into gj
                        from stat in gj.DefaultIfEmpty()
                        select new TreeElement
                        {
                            id = r.ID.ToString(),
                            parentid = (r.Parent_ID == 0 ? -1 : r.Parent_ID).ToString(),
                            title = r.Name,
                            children = rubrics.Any(item => item.Parent_ID == r.ID) ? 1 : 0,
                            linkedObjectCount = stat?.Count ?? 0,
                            iconexist = false,
                            isdoc = false
                        };

            var res = query.ToList();
            res.Add(new TreeElement { id = "-1", parentid = "0", title = @"...", isdoc = false, children = res.Count > 0 ? 1 : 0 });


            return res;
        }

        public override TreeElement Post(TreeElement model)
        {
            int rubricPID = 0;
            if (!String.IsNullOrWhiteSpace(model.parentid))
                rubricPID = Convert.ToInt32(model.parentid);

            model.id = saDB.ObjectService.AddRubric(new Rubric
            {
                Parent_ID = rubricPID == -1 ? 0 : rubricPID,
                Name = model.title
            }).ToString();

            return model;
        }

        public override TreeElement Put(TreeElement model)
        {
            int rubricID = Convert.ToInt32(model.id);
            Rubric r = saDB.ObjectService.GetRubric(rubricID);
            r.Name = model.title;
            saDB.ObjectService.EditRubric(r);

            return model;
        }

        public override void Delete(int id)
        {
            saDB.ObjectService.DeleteRubric(id);
        }
    }

    public abstract class ModuleRubricsBase
    {
        protected readonly IDataBase saDB;

        protected ModuleRubricsBase(IDataBase saDb)
        {
            saDB = saDb;
        }

        public abstract IEnumerable<TreeElement> Get();
        public abstract TreeElement Post(TreeElement model);
        public abstract TreeElement Put(TreeElement model);
        public abstract void Delete(int id);
    }
}
