using System;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.DataContracts;
using ANBR.SemanticArchive.SDK;
using www.Areas.ExpressDossier.Models;
using www.SaGateway;

namespace www.Controllers.api.inquiry
{
    public class InquiryResumeController : ApiController
    {
        /// <summary>
        /// Добавляет вывод к проверке/заявке
        /// </summary>
        /// <param name="oid">Идентификатор проверки/заявки</param>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/InquiryResume/add")]
        public ResumeModel Post(int oid, ResumeModel model)
        {
            if (model.id != default(int))
            {
                Put(oid, model);
                return model;
            }

            IDataBase saDB = WebSaUtilities.Database;
            int? projectID = Scope.GetInternalPrjIDi();

            SAProject projectData = saDB.ObjectService.GetProjectByID(projectID.Value);

            string plainText = null;
            if (!String.IsNullOrWhiteSpace(model.NoteHtml))
                plainText = HelperCommon.GetPlainTextFromHtml(model.NoteHtml).Trim();

            projectData.Data = !string.IsNullOrWhiteSpace(plainText) ? model.NoteHtml : "";

            if (model.State != 0)
                projectData.ProjectStatus = model.State;

            saDB.ObjectService.UpdateProject(projectData);

            model.id = projectID.Value;
            return model;
        }

        /// <summary>
        /// Модифицирует вывод по проверке/заявке
        /// </summary>
        /// <param name="id">Идентификатор вывода аналитика</param>
        /// <param name="oid">Идентификатор проверки/заявки</param>
        /// <param name="model"></param>
        [HttpPut]
        [Route("api/InquiryResume/add")]
        public void Put(int oid, ResumeModel model)
        {
            IDataBase saDB = WebSaUtilities.Database;
            int? projectID = Scope.GetInternalPrjIDi();

            string plainText = null;
            if (!String.IsNullOrWhiteSpace(model.NoteHtml))
                plainText = HelperCommon.GetPlainTextFromHtml(model.NoteHtml).Trim();

            SAProject projectData = saDB.ObjectService.GetProjectByID(projectID.Value);
            projectData.Data = !string.IsNullOrWhiteSpace(plainText) ? model.NoteHtml : "";
            if (model.State != 0)
                projectData.ProjectStatus = model.State;

            saDB.ObjectService.UpdateProject(projectData);
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
            int? projectID = Scope.GetInternalPrjIDi();
            SAProject projectData = saDB.ObjectService.GetProjectByID(projectID.Value);
            projectData.Data = "";
            projectData.ProjectStatus = 0;
            saDB.ObjectService.UpdateProject(projectData);
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
            SAProject projectData = saDB.ObjectService.GetProjectByID(projectID.Value);

            return new[] { new  ResumeModel
            {
                id = projectData.ProjectId,
                State = projectData.ProjectStatus ?? 0,
                NoteHtml = projectData.Data
            }};
        }
    }
}
