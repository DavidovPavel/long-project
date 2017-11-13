using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ANBR.SemanticArchive.SDK;
using www.Areas.inquiry.Models;
using www.SaGateway;

namespace www.Controllers.api.inquiry
{
    public class InquiryRolesController : ApiController
    {
        [ActionName("DefaultAction")]
        [HttpGet]
        public IEnumerable<ProjectRoleModel> Get()
        {
            IDataBase saDB = WebSaUtilities.Database;

            var roles = saDB.ObjectService.GetProjectRoles();

            string currentCulture = Root.GetCurrentLang();

            var res = roles.Where(item => !item.IsSystem && item.Culture == currentCulture).Select(item =>
                new ProjectRoleModel {ID = item.ProjectRoleId, ProjectRoleName = item.Title}).ToList();

            return res;
        }
    }
}
