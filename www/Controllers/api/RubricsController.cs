using ANBR.SemanticArchive.SDK.Dictionaries;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using www.Models;
using www.SaGateway;
using ANBR.SemanticArchive.SDK;
using www.Models.Items;
using www.SaGateway.Factories;

namespace www.Controllers.api
{
    /// <summary>
    /// Работа с деревом рубрик
    /// </summary>
    public class RubricsController : ApiController
    {
        /// <summary>
        /// Получить стандартный рубрикатор СА
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/Rubrics")]
        [Route("api/Rubrics/ForObjects")]
        [Route("api/Rubric")]
        [Route("api/Rubric/ForObjects")]
        public IEnumerable<TreeElement> GetForObjects()
        {
            IDataBase saDB = WebSaUtilities.Database;
            ModuleRubricsKind kind = ModuleRubricsKind.ForObjects;

            ModuleRubricsBase module = FactoryModuleRubrics.GetModule(kind, saDB, null);
            return module.Get();
        }

        /// <summary>
        /// Получить дерево рубрик (для кокона/проекта/заявки)
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/Rubrics/ForProjects")]
        [Route("api/Rubric/ForProjects")]
        public IEnumerable<TreeElement> GetForProjects()
        {
            IDataBase saDB = WebSaUtilities.Database;
            ModuleRubricsKind kind = ModuleRubricsKind.ForProjects;

            ModuleRubricsBase module = FactoryModuleRubrics.GetModule(kind, saDB, null);
            return module.Get();
        }


        /// <summary>
        /// Получить дерево разделов для фрагмента 
        /// </summary>
        /// <param name="oid">Связанный ID-объекта (необязательный)</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/Rubrics/NoteSections/oid{oid:int?}")]
        [Route("api/Rubric/NoteSections/oid{oid:int?}")]
        public IEnumerable<TreeElement> Get(int? oid = null)
        {
            IDataBase saDB = WebSaUtilities.Database;
            ModuleRubricsKind kind = ModuleRubricsKind.NoteSections;

            ModuleRubricsBase module = FactoryModuleRubrics.GetModule(kind, saDB, new Dictionary<string, object> { { "oid", oid } });
            return module.Get();
        }

        [HttpGet]
        [Route("api/Rubric/{id:int}")]
        public IEnumerable<ListElement> Get(int id, int page = 1, int typeid = 0, int rubricid = -1, string title = null, string phrase = null)
        {
            IDataBase saDB = WebSaUtilities.Database;
            if (typeid == 0)
                typeid = saDB.MetaModel.RootType.ID;

            // показ содержимого рубрики без подсветки фразы
            if (rubricid != -1)
            {

                var qr = saDB.QueriesProvider.ExecuteRubricQuery(id, typeid);
                var td = qr.DataSet.Tables[0];
                return Root.GetList(td, page);
            }
            // показ документов с подсвткой по выбранным параметрам
            else
            {
                var qr = SDKHelper.FullTextSearchQuery(title, phrase, page, id,
                    typeid == default(int) ? null : (int?)typeid);

                if (qr != null)
                {
                    var td = qr.DataSet.Tables[1];
                    return Root.GetList(td, page, (int)qr.DataSet.Tables[0].Rows[0]["TotalRowsNumber"]);
                }
                return new List<ListElement> { new ListElement { id = 0, num = 0 } };
            }
        }

        [HttpGet]
        public TreeElement Item(int id, int page = 1)
        {
            var r = WebSaUtilities.Database.Rubricator.Items.ElementById(id);

            return new TreeElement
            {
                id = r.Id.ToString(),
                title = r.DisplayName
            };
        }

        [HttpGet]
        [Route("api/Rubrics/ByObjectID/{id:int}")]
        [Route("api/Rubric/ByObjectID/{id:int}")]
        public IEnumerable<ListElement<ListElement>> ByObjectID(int id)
        {
            var obj = WebSaUtilities.Database.ObjectModel.GetObjectInfo(id);
            if (obj == null) return new ListElement<ListElement>[0];

            var rubrics = new ListElement<ListElement>[obj.Object.Rubrics.Count];
            for (int i = 0; i < rubrics.Length; i++)
            {
                IRubricatorItem rubric = obj.Object.Rubrics[i].RubricatorItem;
                var path = new List<ListElement>();
                while (rubric != null)
                {
                    path.Add(new ListElement { id = rubric.Id, title = rubric.DisplayName });
                    rubric = rubric.Parent;
                }
                path.Reverse();
                string titleComplex = string.Join(" / ", path.Select(item => item.title).ToList());

                var li = new ListElement<ListElement> { id = obj.Object.Rubrics[i].RubricatorItem.Id, title = titleComplex, collection = path.ToList() };
                rubrics[i] = li;
            }

            return rubrics;
        }

        [HttpPost]
        [Route("api/Rubrics/{kind?}")]
        [Route("api/Rubrics/{kind?}/oid{oid:int?}")]
        [Route("api/Rubric/{kind?}")]
        [Route("api/Rubric/{kind?}/oid{oid:int?}")]
        public TreeElement Post(TreeElement model, ModuleRubricsKind? kind = null, int? oid = null)
        {
            IDataBase saDB = WebSaUtilities.Database;
            if (kind == null)
                kind = ModuleRubricsKind.ForObjects;

            ModuleRubricsBase module = FactoryModuleRubrics.GetModule(kind.Value, saDB, new Dictionary<string, object> { { "oid", oid } });
            return module.Post(model);
        }

        [HttpPut]
        [Route("api/Rubrics/{id}")]
        [Route("api/Rubrics/{kind?}/{id}")]
        [Route("api/Rubrics/{kind?}/oid{oid:int?}/{id}")]
        [Route("api/Rubric/{kind?}/{id}")]
        [Route("api/Rubric/{kind?}/oid{oid:int?}/{id}")]
        [Route("api/Rubric/{id}")]
        public TreeElement Put(TreeElement model, ModuleRubricsKind? kind = null, int? oid = null)
        {
            IDataBase saDB = WebSaUtilities.Database;
            if (kind == null)
                kind = ModuleRubricsKind.ForObjects;

            ModuleRubricsBase module = FactoryModuleRubrics.GetModule(kind.Value, saDB, new Dictionary<string, object> { { "oid", oid } });
            return module.Put(model);
        }

        [Route("api/Rubrics/{kind?}/{id}")]
        [Route("api/Rubrics/{kind?}/oid{oid:int?}/{id}")]
        [Route("api/Rubric/{kind?}/{id}")]
        [Route("api/Rubric/{kind?}/oid{oid:int?}/{id}")]
        [Route("api/Rubric/{id}")]
        [HttpDelete]
        public void Delete(int id, ModuleRubricsKind? kind = null, int? oid = null)
        {
            IDataBase saDB = WebSaUtilities.Database;
            if (kind == null)
                kind = ModuleRubricsKind.ForObjects;

            ModuleRubricsBase module = FactoryModuleRubrics.GetModule(kind.Value, saDB, new Dictionary<string, object> { { "oid", oid } });
            module.Delete(id);
        }
    }
}
