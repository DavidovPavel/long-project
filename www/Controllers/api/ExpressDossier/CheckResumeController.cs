using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using www.Areas.ExpressDossier.Models;
using www.Models.ExpressDossier;
using www.SaGateway;

namespace www.Controllers.api.ExpressDossier
{
    public class CheckResumeController : ApiController
    {
        /// <summary>
        /// Добавляет вывод к проверке/заявке
        /// </summary>
        /// <param name="oid">Идентификатор проверки/заявки</param>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/CheckResume/add")]
        public ResumeModel Post(int oid, ResumeModel model)
        {
            if (model.id != default(int))
            {
                Put(oid, model);
                return model;
            }

            IDataBase saDB = WebSaUtilities.Database;

            int? projectID = Scope.GetInternalPrjIDi();
            int? projectRoleID = null;
            var obj = saDB.ObjectService.GetObjectInfo(oid);

            if (projectID.HasValue)
                projectRoleID = SDKHelper.InquiryRoleSystemGet(saDB, InquirySysRoles.resume);

            string titleFormat = Root.GetResource("CheckResume_GeneratedTitle");
            string moduleName = Root.GetResource("CheckResume_ModuleTitleCheck");
            if (Scope.GetCurrentArea() == "inquiry")
                moduleName = Root.GetResource("CheckResume_ModuleTitleInquire");

            var soMain = new SavedObject(obj.TypeName);
            soMain.property[_SAConst.Object_ID] = obj.Object_ID;

            var so = new SavedObject(_SAConst.Type_Pokazatel);
            so.Project_ID = projectID;
            so.Project_RoleID = projectRoleID;
            so.property[_SAConst.Наименование] = String.Format(titleFormat, moduleName, obj.DisplayName,
                model.StateTitle);
            so.property[_SAConst.Целочисленный_показатель] = (int)model.State;
            so.property[_SAConst.ShortName] = model.StateTitle;
            so.property[_SAConst.Текстовое_досье] = model.NoteHtml;
            so.AddRelation(_SAConst.Role_Ассоциативная_связь, soMain);

            var saver = new DataSaverSA4(saDB);
            model.id = saver.CreateObject(so, 0, projectID, projectRoleID);

            return model;
        }

        /// <summary>
        /// Модифицирует вывод по проверке/заявке
        /// </summary>
        /// <param name="id">Идентификатор вывода аналитика</param>
        /// <param name="oid">Идентификатор проверки/заявки</param>
        /// <param name="model"></param>
        [HttpPut]
        [Route("api/CheckResume/add")]
        public void Put(int oid, ResumeModel model)
        {
            IDataBase saDB = WebSaUtilities.Database;
            var obj = saDB.ObjectService.GetObjectInfo(oid);
            string titleFormat = Root.GetResource("CheckResume_GeneratedTitle");
            string moduleName = Root.GetResource("CheckResume_ModuleTitleCheck");
            if (Scope.GetCurrentArea() == "inquiry")
                moduleName = Root.GetResource("CheckResume_ModuleTitleInquire");

            string factName = String.Format(titleFormat, moduleName, obj.DisplayName, model.StateTitle);
            Dictionary<string, object> vals = new Dictionary<string, object>
            {
                {_SAConst.Целочисленный_показатель, (int) model.State},
                {_SAConst.Наименование, factName},
                {_SAConst.ShortName, model.StateTitle},
                {_SAConst.Текстовое_досье, model.NoteHtml}
            };

            saDB._FieldFastSet(model.id, vals);
        }

        /// <summary>
        /// Удаляет вывод у проверки/заявки
        /// </summary>
        /// <param name="id">Идентификатор вывода аналитика</param>
        [HttpDelete]
        [ActionName("DefaultAction")]
        public void Delete(int id)
        {
            IDataBase saDB = WebSaUtilities.Database;
            saDB.ObjectService.DeleteObject(id);
        }

        /// <summary>
        /// Получает вывод анаталитика для проверки/заявки
        /// </summary>
        /// <param name="oid">Идентификатор проверки/заявки</param>
        /// <returns></returns>
        [HttpGet]
        [ActionName("DefaultAction")]
        public ResumeModel[] GetResume(int oid)
        {
            IDataBase saDB = WebSaUtilities.Database;
            int? projectID = Scope.GetInternalPrjIDi();
            int projectRoleID = SDKHelper.InquiryRoleSystemGet(saDB, InquirySysRoles.resume);

            var props = new[] { _SAConst.Object_ID, _SAConst.Целочисленный_показатель, _SAConst.ShortName, _SAConst.Текстовое_досье };
            DataTable data = SDKHelper.InquiryGetObjectsMarkedByRoles(saDB, projectID.Value, projectRoleID, props, oid);
            if (data == null) return new ResumeModel[0];

            var row = data.AsEnumerable().FirstOrDefault();
            if (row == null) return null;

            return new[] { new  ResumeModel
            {
                id = (int) row[0],
                State = (int) row[1],
                StateTitle = row[2] == DBNull.Value ? "" :(string) row[2],
                NoteHtml = row[3] == DBNull.Value ? "" : (string)row[3]
            }};
        }
    }
}
