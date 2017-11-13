using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web.Hosting;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using Newtonsoft.Json.Linq;
using Omu.ValueInjecter;
using www.Models;
using www.SaGateway;
using www.Helpers;
using www.Models.Items;
using ABS.Connectivity.Interaction;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.SemanticArchive.SDK.ObjectModel;

namespace www.Controllers.api.ExpressDossier
{
    public class CheckNotesController : ApiController
    {
        /// <summary>
        /// Получить список фрагментнов заданного объекта (источник, факт)
        /// </summary>
        /// <param name="oid">iD проверки</param>
        /// <param name="id">ID источника (факта)</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/CheckNotes/GetFor/{oid}")]
        public IEnumerable<NoteFragment> GetBy(int id, int oid)
        {
            IDataBase saDb = WebSaUtilities.Database;
            var data = SDKHelper.GetObjectsLinkedTo(saDb, new[] { "Object_ID", _SAConst.Текст }, oid, _SAConst.Type_AnnotatedNote);
            IEnumerable<NoteFragment> fragmets = new List<NoteFragment>();
            if (data != null && data.Rows.Count > 0)
            {
                string json = data.Rows[0][1] == DBNull.Value ? null : (string)data.Rows[0][1];
                if (!String.IsNullOrWhiteSpace(json))
                {
                    var list = JArray.Parse(json).ToObject<List<ListElement<NoteFragment>>>();
                    list = list.Where(item => item.collection != null).ToList();
                    fragmets = (
                        from l in list
                        from lic in l.collection
                        where lic.SourceObject_ID == id
                        select lic
                        ).ToList();
                    fragmets = fragmets.DistinctBy(item => item.id).OrderByDescending(item => item.cdate);
                }
            }

            return fragmets;
        }

        [HttpGet]
        [Route("api/CheckNotes/SetPos/{oid}/{id}/{cdate}")]
        public void SetPos(int oid, Guid id, long cdate)
        {
            IDataBase saDb = WebSaUtilities.Database;
            var data = SDKHelper.GetObjectsLinkedTo(saDb, new[] { "Object_ID", _SAConst.Текст }, oid, _SAConst.Type_AnnotatedNote);
            if (data != null && data.Rows.Count > 0)
            {
                var json = data.Rows[0][1] == DBNull.Value ? null : (string)data.Rows[0][1];
                var list = new List<ListElement<NoteFragment>>();
                if (!String.IsNullOrWhiteSpace(json))
                    list = JArray.Parse(json).ToObject<List<ListElement<NoteFragment>>>();

                Tuple<ListElement<NoteFragment>, NoteFragment> fragment = GetFragmetnByUid(list, id);
                if (fragment != null)
                {
                    fragment.Item2.cdate = cdate;
                    fragment.Item1.collection = fragment.Item1.collection.OrderBy(item => item.cdate).ToList();

                    json = JArray.FromObject(list).ToString();

                    int noteID = (int)data.Rows[0][0];
                    saDb._FieldFastSet(noteID, _SAConst.Текст, json);
                }
            }
        }

        /// <summary>
        /// Получить пояснительную записку по оъекту проверки
        /// </summary>
        /// <param name="id">iD проверки</param>
        /// <returns></returns>
        [HttpGet]
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement<NoteFragment>> Get(int id)
        {
            IDataBase saDb = WebSaUtilities.Database;

            var data = SDKHelper.GetObjectsLinkedTo(saDb, new[] { "Object_ID", _SAConst.Текст }, id, _SAConst.Type_AnnotatedNote);

            var list = new List<ListElement<NoteFragment>>();
            if (data != null && data.Rows.Count > 0)
            {
                var json = data.Rows[0][1] == DBNull.Value ? null : (string)data.Rows[0][1];
                if (!String.IsNullOrWhiteSpace(json))
                    list = JArray.Parse(json).ToObject<List<ListElement<NoteFragment>>>();
            }

            return list;
        }

        /// <summary>
        /// Удалить фрагмента
        /// </summary>
        /// <param name="id">ID проверки</param>
        /// <param name="uid">UID фрагмента</param>
        [HttpDelete]
        [ActionName("DefaultAction")]
        public void Delete(int id, Guid uid)
        {
            IDataBase saDb = WebSaUtilities.Database;

            var data = SDKHelper.GetObjectsLinkedTo(saDb, new[] { "Object_ID", _SAConst.Текст }, id, _SAConst.Type_AnnotatedNote);
            NoteRemoveFragment(uid, saDb, data);
        }

        /// <summary>
        /// Изменить содержимое фрагмента
        /// </summary>
        /// <param name="oid">ID проверки</param>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPut]
        [ActionName("DefaultAction")]
        public IEnumerable<NoteFragment> Put(int oid, NoteFragmentForm model)
        {
            IDataBase saDb = WebSaUtilities.Database;


            var nf = (NoteFragment) new NoteFragment().InjectFrom(model);
            List<NoteFragment> createdFragments;
            var data = SDKHelper.GetObjectsLinkedTo(saDb, new[] { "Object_ID", _SAConst.Текст }, oid, _SAConst.Type_AnnotatedNote);
            NoteAddOrUpdateFragment(nf, saDb, data, out createdFragments);

            if (model.NeedCreateFact)
            {
                int? projectID = Scope.GetInternalPrjIDi();
                CreateFactAsync(oid, projectID, model, saDb);
            }

            return createdFragments;
        }


        /// <summary>
        /// Добавление фрагмента к пояснительной записки
        /// </summary>
        /// <param name="oid">ID проверки</param>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [ActionName("DefaultAction")]
        public IEnumerable<NoteFragment> Post(int oid, NoteFragmentForm model)
        {
            IDataBase saDb = WebSaUtilities.Database;

            model.PlainTextOrig = HelperCommon.GetPlainTextFromHtml(model.HtmlOrig);
            model.SearchExpr = DocumentHighlighting.GetRegexString(model.PlainTextOrig, ClientType.Javascript, DocumentHighlighting.Mode.OriginalFragment);

            var nf = (NoteFragment)new NoteFragment().InjectFrom(model);
            List<NoteFragment> createdFragments;
            var data = SDKHelper.GetObjectsLinkedTo(saDb, new[] { "Object_ID", _SAConst.Текст }, oid, _SAConst.Type_AnnotatedNote);
            if (data == null || data.Rows.Count == 0) //отсутствует связанный объект типа AnnotatedNote, его нужно создать
            {
                var jsonList = NoteAddOrUpdateFragmentInternal(saDb, nf, null, out createdFragments);

                int? projectID = Scope.GetInternalPrjIDi();
                string dn = saDb._PropertyFastGet(oid, _SAConst.Наименование);
                string title = String.Format(Root.GetResource("CheckResume_GeneratedTitleForAnnotatedNote"), dn);
                saDb._ObjFastCreate(title, null, _SAConst.Type_AnnotatedNote, null, null, projectID, null,
                    new Dictionary<string, object>
                    {
                        { _SAConst.Текст, jsonList }
                    },
                    null, new Tuple<int, string>(oid, _SAConst.Rel_Ассоциативная_связь));

                return createdFragments;
            }

            NoteAddOrUpdateFragment(nf, saDb, data, out createdFragments);

            if (model.NeedCreateFact)
            {
                int? projectID = Scope.GetInternalPrjIDi();
                CreateFactAsync(oid, projectID, model, saDb);
            }

            return createdFragments;
        }

        private static void CreateFactAsync(int oid, int? projectID, NoteFragmentForm model, IDataBase saDb)
        {
            HostingEnvironment.QueueBackgroundWorkItem(ct =>
            {
                var factType = saDb.MetaModel.MetaTypes.GetByName(_SAConst.Type_Fact);
                IMetaRole assoc = saDb.MetaModel.MetaRoles.GetByName(_SAConst.Role_Ассоциативная_связь);

                var fact = new ANBR.SemanticArchive.DataContracts.DataObject();
                fact.Type_ID = factType.ID;
                fact.Display_Name = model.Title ?? HelperCommon.GetPlainTextFromHtml(model.Html);

                if (projectID.HasValue)
                    fact.Project_ID = projectID;

                int factId = saDb.ObjectService.CreateObject(fact);
                saDb.ObjectService.CreateRelation(oid, factId, assoc.ID);

                var src = (ISource)saDb.ObjectModel.GetObject(model.SourceObject_ID);
                src.CreateMentioning(oid, null, null);
            });
        }

        [NonAction]
        private static void NoteAddOrUpdateFragment(NoteFragment model, IDataBase saDb, System.Data.DataTable data, out List<NoteFragment> createdFragments)
        {
            var objNoteID = (int)data.Rows[0][0];
            var jsonList = data.Rows[0][1] == DBNull.Value ? null : (string)data.Rows[0][1];

            jsonList = NoteAddOrUpdateFragmentInternal(saDb, model, jsonList, out createdFragments);

            saDb._FieldFastSet(objNoteID, _SAConst.Текст, jsonList);
        }

        [NonAction]
        private static void NoteRemoveFragment(Guid uid, IDataBase saDb, System.Data.DataTable data)
        {
            var objNoteID = (int)data.Rows[0][0];
            var jsonList = data.Rows[0][1] == DBNull.Value ? null : (string)data.Rows[0][1];

            jsonList = NoteRemoveFragmentInternal(uid, jsonList);
            saDb._FieldFastSet(objNoteID, _SAConst.Текст, jsonList);
        }

        [NonAction]
        private static string NoteAddOrUpdateFragmentInternal(IDataBase saDb, NoteFragment model, string jsonList, out List<NoteFragment> createdFragments)
        {
            List<ListElement<NoteFragment>> list = !String.IsNullOrWhiteSpace(jsonList)
                ? JArray.Parse(jsonList).ToObject<List<ListElement<NoteFragment>>>()
                : new List<ListElement<NoteFragment>>();

            AddOrUpdateFragmentToList(ref list, model, out createdFragments);

            var allsec = new List<int>();
            CollectSecIds(list, allsec);

            var secDataRaw = saDb._PropertyFastGetSome(
                allsec.ToArray(),
                new[] { "Object_ID", "CreatedDate", "Display_Name" }).ToArray();

            var secDataOrderedAll = secDataRaw.OrderBy(item => item.Field<DateTime>(1)).Select(item => item).ToArray();
            var secDataOrdered = secDataOrderedAll.Select(item => (int)item[0]).ToList();

            list = list
                .Select(item => (ListElement<NoteFragment>)UpdateSectionTitle(item, secDataOrderedAll, secDataOrdered))
                .OrderBy(item => secDataOrdered.IndexOf(item.id)).ToList();

            foreach (var li in list)
            {
                if (li.Childs != null && li.Childs.Count > 1)
                    li.Childs = li.Childs
                        .Select(item => UpdateSectionTitle(item, secDataOrderedAll, secDataOrdered))
                        .OrderBy(item => secDataOrdered.IndexOf(item.id)).ToList();
            }

            jsonList = JArray.FromObject(list).ToString();

            return jsonList;
        }

        private static ListElement<NoteFragment> UpdateSectionTitle(ListElement<NoteFragment> item, DataRow[] secData, List<int> secDataOrdered)
        {
            int idx = secDataOrdered.IndexOf(item.id);
            if (idx != -1)
                item.title = (string)secData[idx]["Display_Name"];
            return item;
        }

        private static void CollectSecIds<T>(List<T> lst, List<int> res) where T : ListElement
        {
            if (lst == null) return;
            foreach (var li in lst)
            {
                res.Add(li.id);
                CollectSecIds(li.Childs, res);
            }
        }

        [NonAction]
        private static string NoteRemoveFragmentInternal(Guid uid, string jsonList)
        {
            List<ListElement<NoteFragment>> list = !String.IsNullOrWhiteSpace(jsonList)
                ? JArray.Parse(jsonList).ToObject<List<ListElement<NoteFragment>>>()
                : new List<ListElement<NoteFragment>>();

            RemoveFragmentFromList(ref list, uid);

            if (list == null) return null;
            jsonList = JArray.FromObject(list).ToString();

            return jsonList;
        }


        [NonAction]
        private static void AddOrUpdateFragmentToList(ref List<ListElement<NoteFragment>> list, NoteFragment model, out List<NoteFragment> createdFragments)
        {
            bool isNew = !model.id.HasValue;
            int? currentSection = null;
            if (!isNew)
            {
                currentSection = GetSectionByNoteUid(list, model.id.Value);

                RemoveFragmentFromList(ref list, model.id.Value);
                if (list == null) list = new List<ListElement<NoteFragment>>();
            }

            createdFragments = new List<NoteFragment>();


            double i = -1;
            foreach (var sec in model.Sections)
            {
                NoteFragment el = model;
                el = (NoteFragment)new NoteFragment().InjectFrom(model);
                el.id = Guid.NewGuid();
                if (isNew || currentSection == null || currentSection != sec.id)
                    el.cdate = DateTime.Now.AddMinutes(i--).Ticks;
                else
                    el.cdate = model.cdate;

                el.Sections = new List<NoteFragmentSection> { new NoteFragmentSection { id = sec.id, pid = sec.pid, title = sec.title, parentTitle = sec.parentTitle } };
                createdFragments.Add(el);

                var li = CreateSection(ref list, sec.id, sec.title, sec.pid, sec.parentTitle);


                if (li.collection == null) li.collection = new List<NoteFragment>();
                li.collection.Add(el);
                li.collection = li.collection.OrderBy(item => (item.cdate ?? 0)).ToList();
            }
        }

        private static ListElement<NoteFragment> GetSectionByID(List<ListElement<NoteFragment>> list, int id)
        {
            foreach (var sec in list)
            {
                if (sec.id == id) return sec;
                if (sec.Childs != null && sec.Childs.Any())
                    return GetSectionByID(sec.Childs, id);
            }

            return null;
        }

        private static int? GetSectionByNoteUid(List<ListElement<NoteFragment>> list, Guid uid)
        {
            foreach (var sec in list)
            {
                if (sec.collection != null && sec.collection.Any(item => item.id == uid)) return sec.id;

                if (sec.Childs != null && sec.Childs.Any())
                    GetSectionByNoteUid(sec.Childs, uid);
            }

            return null;
        }

        private static Tuple<ListElement<NoteFragment>, NoteFragment> GetFragmetnByUid(List<ListElement<NoteFragment>> list, Guid uid)
        {
            foreach (var sec in list)
            {
                NoteFragment foundFragment;
                if (sec.collection != null)
                {
                    foundFragment = sec.collection.FirstOrDefault(item => item.id == uid);
                    if (foundFragment != null)
                        return new Tuple<ListElement<NoteFragment>, NoteFragment>(sec, foundFragment);
                }

                if (sec.Childs != null && sec.Childs.Any())
                {
                    var found = GetFragmetnByUid(sec.Childs, uid);
                    if (found != null)
                        return found;
                }
            }

            return null;
        }

        private static ListElement<NoteFragment> CreateSection(ref List<ListElement<NoteFragment>> list, int id, string title, int pid, string ptitle)
        {
            ListElement<NoteFragment> li = GetSectionByID(list, id) ?? new ListElement<NoteFragment> { title = title };

            if (li.id > 0) return li;
            li.id = id;

            if (pid > 0)
            {
                var pli = GetSectionByID(list, pid) ?? new ListElement<NoteFragment> { title = ptitle };

                if (pli.Childs == null) pli.Childs = new List<ListElement<NoteFragment>>();

                pli.Childs.Add(li);

                if (pli.id > 0) return li;
                pli.id = pid;

                list.Add(pli);
            }
            else
                list.Add(li);

            return li;
        }


        [NonAction]
        private static void RemoveFragmentFromList(ref List<ListElement<NoteFragment>> list, Guid uid)
        {
            if (list == null) return;

            foreach (var li in list)
            {
                if (li.collection != null)
                {
                    li.collection = li.collection.Where(item => item.id != uid).ToList();
                    if (li.collection.Count == 0) li.collection = null;
                }

                var childs = li.Childs;
                RemoveFragmentFromList(ref childs, uid);
                li.Childs = childs;
            }

            list = list.Where(item => item.collection != null || item.Childs != null).ToList();
            if (list.Count == 0) list = null;
        }
    }
}
