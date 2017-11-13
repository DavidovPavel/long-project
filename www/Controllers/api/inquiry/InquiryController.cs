using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using ANBR.Common;
using ANBR.Common.Contarcts;
using ANBR.Helpful.Misc.Sql;
using ANBR.SemanticArchive.DataContracts;
using ANBR.SemanticArchive.SDK;
using Model.Utils;
using www.Areas.ExpressDossier.Models;
using www.Areas.inquiry.Models;
using www.Helpers;
using www.Models.Ex.Feed;
using www.SaGateway;
using www.Utilities;

namespace www.Controllers.api.inquiry
{
    public class InquiryController : ApiController
    {
        /// <summary>
        ///     Удаление заявки
        /// </summary>
        /// <param name="id"></param>
        [HttpDelete]
        [Route("api/inquiry/{id:int}")]
        public void Delete(int id)
        {
            IDataBase saDB = WebSaUtilities.Database;
            saDB.ObjectService.DeleteProject(new SAProject {ProjectId = id});
        }

        [ActionName("DefaultAction")]
        [HttpGet]
        public ContentCollection Get(int page = 1, int me = 0, int? state = null)
        {
            IDataBase saDB = WebSaUtilities.Database;

            var query = new ProjectPageQuery
            {
                FromRow = (page - 1) * Root.PAGE_SIZE + 1,
                RowCount = Root.PAGE_SIZE
            };

            if (me == 1)
                query.UserOwner = WebSaUtilities.GetCurrentUserName();

            if (state != null && state != 0)
                query.ProjectState = state.Value;


            BasePageResultTyped<SAProject> res = saDB.ObjectService.GetProjectsPaging(query);
            return ToContentCollection(page, saDB, res, null);
        }

        [HttpPost]
        [Route("api/inquiry/likesearch")]
        public ContentCollection GetInterestObjectsList(ProjectModel prj, int page = 1)
        {
            IDataBase saDB = WebSaUtilities.Database;
            var query = new ProjectPageQuery
            {
                FromRow = (page - 1) * Root.PAGE_SIZE + 1,
                RowCount = Root.PAGE_SIZE
            };

            if (!String.IsNullOrEmpty(prj.projectName))
                query.WhereClause += "and ([ProjectName] like N'%" + prj.projectName.SQLSafe() + "%')";
            if (!String.IsNullOrEmpty(prj.projectCode))
                query.WhereClause += " or ([ProjectCode] = N'" + prj.projectCode.SQLSafe() + "')";
            if (!String.IsNullOrWhiteSpace(query.WhereClause))
                query.WhereClause = query.WhereClause.Remove(0, 4);

            BasePageResultTyped<SAProject> res = saDB.ObjectService.GetProjectsPaging(query);
            return ToContentCollection(page, saDB, res, null);
        }

        /// <summary>
        ///     Возвращает данные по проекту из контекста
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/inquiry/input")]
        public ProjectModel Input()
        {
            IDataBase saDB = WebSaUtilities.Database;
            int? projectID = Scope.GetInternalPrjIDi();
            if (!projectID.HasValue) throw new InvalidOperationException("Project Id not found");

            return HelperInquiry.ProjectGet(saDB, projectID);
        }

        /// <summary>
        ///     Возвращает данные по заданному проекту
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/inquiry/input/{id}")]
        public ProjectModel Input(int id)
        {
            IDataBase saDB = WebSaUtilities.Database;
            if (id == default(int)) throw new InvalidOperationException("Project Id not found");

            return HelperInquiry.ProjectGet(saDB, id);
        }


        /// <summary>
        ///     Создание новой заявки
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/inquiry/input")]
        public ProjectModel Post(ProjectModel model)
        {
            if (model.projectId != default(int))
            {
                Put(model, model.projectId);
                return model;
            }

            string userName = WebSaUtilities.GetCurrentUserName();

            IDataBase saDB = WebSaUtilities.Database;
            model.projectId = saDB.ObjectService.CreateProject(
                new SAProject
                {
                    ProjectId = model.projectId,
                    ProjectName = model.projectName,
                    ProjectCode = model.projectCode,
                    UserOwner = userName,
                    ProjectState = (int) ProjectState.InWork
                });

            ProcessRubrics(saDB, model.projectId, model.Rubrics);

            return model;
        }

        /// <summary>
        ///     Модификация данных по заявке
        /// </summary>
        /// <param name="model"></param>
        /// <param name="id">Идентификатор заявки/проекта</param>
        /// <returns></returns>
        [HttpPut]
        [Route("api/inquiry/input/{id:int}")]
        public ProjectModel Put(ProjectModel model, int id)
        {
            id = Scope.GetInternalPrjIDi() ?? model.projectId;
            if (id == default(int)) throw new InvalidOperationException("Project Id not found");
            if (model.Rubrics == null) model.Rubrics = new RubricsDescriptionModel[0];


            IDataBase saDB = WebSaUtilities.Database;
            var project = HelperInquiry.ProjectGet(saDB, id);


            var intersectSet = project.Rubrics.Intersect(model.Rubrics).ToList();
            var addSet = model.Rubrics.Except(intersectSet);
            var removeSet = project.Rubrics.Except(intersectSet);

            foreach (var rubric in removeSet)
                saDB.ObjectService.ProjectRubricsObjectRemoveFor(id, rubric.id);
            foreach (var rubric in addSet)
                saDB.ObjectService.ProjectRubricsObjectAddFor(id, rubric.id);


            saDB.ObjectService.UpdateProject(
                new SAProject
                {
                    ProjectId = model.projectId,
                    ProjectName = model.projectName,
                    ProjectCode = model.projectCode
                });

            return model;
        }



        /// <summary>
        ///     Поиск заявки
        /// </summary>
        /// <param name="onlyMeta">Флаг необходимости получить только мета-данные</param>
        /// <param name="typeID">Поиск проводится по заданому типу</param>
        /// <param name="paramID">Поиск проводится по заданному параметру</param>
        /// <param name="profileID"></param>
        /// <param name="inputText">Критерий поиска</param>
        /// <param name="page">Номер страницы</param>
        /// <param name="ds">Дата создания (от)</param>
        /// <param name="de">Дата создания (до)</param>
        /// <param name="rubid"></param>
        /// <param name="result">Статус: негатив, сомнительно и т.д. <see cref="ProjectStatus"/> </param>
        /// <param name="state">Состояние: в работе, завершено и т.д <see cref="ProjectState"/></param>
        /// <param name="executor"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/inquiry/search")]
        public ContentCollection Search(
            int? onlyMeta, int? typeID, int? paramID, string profileID, string inputText, int page, DateTime? ds,
            DateTime? de, int? rubid, int? result, int? state, string executor)
        {

            //важно отметить, что поиск заявок заключается и в поиске проверок, если в проверке упоминается искомая фраза 


            string GenWhereForDates(string clause, string alias = "")
            {
                if (ds.HasValue && de.HasValue)
                    clause +=
                        $@" and {alias}DateOfCreation >= '{ds?.ToISO8601()}' and {alias}DateOfCreation <= '{de?.ToISO8601()}'";
                else if (ds.HasValue) clause += $@" and {alias}DateOfCreation >= '{ds?.ToISO8601()}'";
                else if (de.HasValue) clause += $@" and {alias}DateOfCreation <= '{de?.ToISO8601()}'";

                return clause;
            }


            IDataBase saDB = WebSaUtilities.Database;
            bool isEmptyRequest = String.IsNullOrWhiteSpace(inputText) && !ds.HasValue && !de.HasValue &&
                                   !rubid.HasValue && !result.HasValue && !state.HasValue
                                   && String.IsNullOrWhiteSpace(executor);

            ProjectPageQuery query;
            BasePageResultTyped<SAProject> res;
            string sql;
            DataTable td = null;
            if (isEmptyRequest)
            {
                query = new ProjectPageQuery
                {
                    FromRow = (page - 1) * Root.PAGE_SIZE + 1,
                    RowCount = Root.PAGE_SIZE
                };

                query.WhereClause = "(1 = 0)";
                sql = SDKHelper.GetObjectsLinkedWithMBFTasksSQL_Ver01(saDB, -1, null, "(1 = 0)", null, null,
                    0, false, null, null, false);
                td = SDKHelper.GetObjectsLinkedWithMBFTasksExecute(sql);

                res = saDB.ObjectService.GetProjectsPaging(query);
                return ToContentCollection(page, saDB, res, td);
            }

            string prjInCriteria = null;
            if (!String.IsNullOrWhiteSpace(inputText))
            {
                string filterCriteria = SDKHelper.GenerateFilterCriteria("InterestObjectINPUTDATA", inputText);
                filterCriteria = GenWhereForDates(filterCriteria, "p.");

                sql = SDKHelper.GetObjectsLinkedWithMBFTasksSQL_Ver01(saDB, -1, null, filterCriteria, null, null,
                    0, false, null, null, false);
                td = SDKHelper.GetObjectsLinkedWithMBFTasksExecute(sql);
                var prjInCriteriaList = td.AsEnumerable()
                    .Select(item => item.Field<int?>("Project_ID") ?? -1)
                    .Distinct()
                    .Where(item => item > 0)
                    .Select(item => item.ToString()).ToList();

                if (prjInCriteriaList.Count > 0)
                    prjInCriteria = prjInCriteriaList.Aggregate((val, agg) => agg + "," + val);
            }


            query = new ProjectPageQuery
            {
                FromRow = (page - 1) * Root.PAGE_SIZE + 1,
                RowCount = Root.PAGE_SIZE
            };

            string searchText = inputText?.SQLSafe();
            if (!String.IsNullOrEmpty(searchText))
                query.WhereClause = $@"([ProjectName] like N'%{searchText}%'" +
                                    $@" or [ProjectCode] like N'%{searchText}%'" +
                                    $@" or [Data] like N'%{searchText}%')";

            if (!String.IsNullOrWhiteSpace(prjInCriteria))
            {
                if (!String.IsNullOrWhiteSpace(query.WhereClause))
                    query.WhereClause = "(" + query.WhereClause + $"or ProjectId in ({prjInCriteria}))";
                else
                    query.WhereClause = $"ProjectId in ({prjInCriteria})";
            }

            if (!String.IsNullOrEmpty(executor))
                query.UserOwner = $@"%{executor}%";

            if ((state ?? 0) != default)
                query.ProjectState = state;

            if ((result ?? 0) != default)
                query.ProjectStatus = result;

            if ((rubid ?? 0) != default)
                query.WhereClause += " and (" + $@"
exists (
		select 'x' 
		from [dbo].[ProjectByProjectRubric] p2r 
			inner join [dbo].[ProjectRubrics] pr on (p2r.ProjectRubric_ID = pr.Rubric_ID) 
		where p2r.Project_ID = [dbo].[Projects].[ProjectId] and p2r.ProjectRubric_ID = {rubid.Value}
	)
)";
            query.WhereClause = GenWhereForDates(query.WhereClause);

            if (query.WhereClause != null && query.WhereClause.StartsWith(" and"))
                query.WhereClause = query.WhereClause.Remove(0, 4);
            res = saDB.ObjectService.GetProjectsPaging(query);


            return ToContentCollection(page, saDB, res, td);
        }

        [HttpGet]
        public int SeqNumber(int id)
        {
            IDataBase saDB = WebSaUtilities.Database;
            return HelperInquiry.GetSeqNumberForInquiry(saDB);
        }

        [HttpGet]
        public void SetState(int id, int state)
        {
            IDataBase saDB = WebSaUtilities.Database;
            int? projectID = Scope.GetInternalPrjIDi();
            if (id == default)
                // ReSharper disable once PossibleInvalidOperationException
                id = projectID.Value;

            saDB.ObjectService.UpdateProject(new SAProject {ProjectId = id, ProjectState = state});
        }

        [HttpGet]
        public List<int> TotalCheck(int id)
        {
            IDataBase saDB = WebSaUtilities.Database;
            InquiryStatsModel stats = HelperInquiry.GetStats(saDB, id);

            return new List<int> {stats.MineCount, stats.TotalCount};
        }

        private void ProcessRubrics(IDataBase saDB, int objectid, RubricsDescriptionModel[] rubrics)
        {
            if (rubrics == null || rubrics.Length == 0) return;

            saDB.ObjectService.ProjectRubricsObjectsAddFor(objectid,
                rubrics.Select(item => item.id).ToList()
            );
        }

        private static ContentCollection ToContentCollection(int page, IDataBase saDB, BasePageResultTyped<SAProject> res, DataTable additionalData)
        {
            var collection = new ContentCollection();
            collection
                .AddPageInfo(page, Root.PAGE_SIZE, res.TotalResultCount)
                .AddHead("Object_ID", "", false, true)
                .AddHead("ProjectCode", Root.GetResource("InquiryController_SAProject_ProjectCode"), true, true)
                .AddHead("Title", Root.GetResource("InquiryController_SAProject_Title"), true, true);
            if (additionalData != null)
            {
                var headItemTitleCheck = collection.NewHeadItem();
                headItemTitleCheck.systemName = "TitleObject";
                headItemTitleCheck.displayName = Root.GetResource("Object");
                headItemTitleCheck.isVisible = true;
                collection.AddHead(headItemTitleCheck);
            }
            collection
                .AddHead("Owner", Root.GetResource("InquiryController_SAProject_Owner"), true, true)
                .AddHead("CDate", Root.GetResource("InquiryController_SAProject_CDate"), true, true)
                .AddHead("Rubrics", Root.GetResource("InquiryController_SAProject_Rubrics"), true, true)
                .AddHead("Status", Root.GetResource("InquiryController_SAProject_Status"), true, true)
                .AddHead("State", Root.GetResource("InquiryController_SAProject_State"), true, true)
                .AddHead("Dossier", "", false, true);

            foreach (var saProject in res.Result)
            {
                string rubrics = "";
                if (saProject.Rubrics != null)
                {
                    foreach (var r in saProject.Rubrics)
                        rubrics += ", " + r.RubricName;
                    if (rubrics.Length > 2) rubrics = rubrics.Remove(0, 2);
                }

                var item = collection.AddNew();
                var propTitle = item.NewProperty();
                propTitle.systemName = "Title";
                propTitle.isVisible = true;
                propTitle.displayName = "";
                propTitle.value = saProject.ProjectName;

                item.AddProperty("Object_ID", "", saProject.ProjectId, PropertyType.String, false, true)
                    .AddProperty("ProjectCode", "", saProject.ProjectCode, PropertyType.String, false, true)
                    .AddProperty(propTitle);
                if (additionalData != null)
                {
                    var propCheckObject = item.NewProperty();
                    propCheckObject.systemName = "TitleObject";
                    propCheckObject.isVisible = true;
                    propCheckObject.displayName = "";
                    propCheckObject.value = "";

                    var rowCheckObject =
                        additionalData
                            .AsEnumerable()
                            .FirstOrDefault(row => row.Field<int?>("Project_ID") == saProject.ProjectId);
                    propCheckObject.value = rowCheckObject?.Field<string>("Display_Name");

                    var template = @"[baseurl]?prjid=[Project_ID]#id=[Object_ID]";
                    if (rowCheckObject != null)
                        propCheckObject.href =
                            HelperContentCollection.RenderTemplate(
                                new Dictionary<string, string>
                                {
                                    {"Project_ID", saProject.ProjectId.ToString()},
                                    {"Object_ID", rowCheckObject["Object_ID"].ToString()}
                                }, template);
                    item.AddProperty(propCheckObject);
                }
                item.AddProperty("Owner", "", saProject.UserOwner, PropertyType.String, false, true)
                    .AddProperty("CDate", "", saProject.DateOfCreation, PropertyType.DateTime, false, true)
                    .AddProperty("Rubrics", "", rubrics, PropertyType.String, false, true)
                    .AddProperty("Status", "", saProject.ProjectStatus, PropertyType.Integer, false, true)
                    .AddProperty("State", "", saProject.ProjectState, PropertyType.Integer, false, true)
                    .AddProperty("Dossier", "", saProject.Data, PropertyType.Integer, false, true, false);

                var href =
                    $"lang-{Root.GetCurrentLang()}/db{Scope.GetCurrentDBID()}/inquiry?prjid={saProject.ProjectId}";
                item.href = href;
                propTitle.href = href;
            }

            return collection;
        }
    }
}