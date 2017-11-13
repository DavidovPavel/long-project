using System;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using Newtonsoft.Json.Linq;
using www.Areas.ExpressDossier.Models;
using www.Models.ExpressDossier;
using www.SaGateway;
using ABS.Connectivity.Interaction;

namespace www.Controllers.api.ExpressDossier
{
    public class ObjectRolesController : ApiController
    {
        [HttpDelete]
        [ActionName("DefaultAction")]
        public void Delete(int id, int oid)
        {
            int? projectID = Scope.GetInternalPrjIDi();
            if (!projectID.HasValue) throw new InvalidOperationException("ProjectID should be defined.");

            IDataBase saDB = WebSaUtilities.Database;
            saDB.ObjectService.DeleteObject(id);
            var propVal = saDB._PropertyFastGet(oid, "InterestObjectINPUTDATA");
            var jData = JObject.Parse(propVal);
            JToken jRelationsDescription;
            if (jData.TryGetValue("RelationsDescriptionData", StringComparison.Ordinal, out jRelationsDescription))
            {
                var relData = jRelationsDescription.ToObject<RelationsDescriptionModel>();
                relData.Roles = SDKHelper.InquiryDictionaryRolesGetBy(saDB, InquirySysRoles.partrel, projectID.Value, oid);
                jData["RelationsDescriptionData"] = JObject.FromObject(relData);

                saDB._FieldFastSet(oid, "InterestObjectINPUTDATA", jData.ToString());
            }
        }

        [HttpPost]
        [ActionName("DefaultAction")]
        public RelationsDescriptionModel AddRole(int mid, int oid, RelationsDescriptionModel model)
        {
            if (model?.Roles == null) return model;

            IDataBase saDB = WebSaUtilities.Database;
            int? projectID = Scope.GetInternalPrjIDi();
            if (!projectID.HasValue) throw new InvalidOperationException("ProjectID should be defined.");
            var obj = saDB.ObjectModel.GetObjectInfo(oid);
            if (obj == null) throw new InvalidOperationException("oid is invalid");

            var projectData = saDB.ObjectService.GetProjectByID(mid);


            var saver = new DataSaverSA4(saDB);
            var so = new SavedObject(obj.MetaType.SystemName);
            so.property[_SAConst.Object_ID] = oid;


            if (model != null)
            {
                var existsRoles = SDKHelper.InquiryDictionaryRolesGetBy(saDB, InquirySysRoles.partrel, projectID.Value, oid);

                int projectRoleForRel = SDKHelper.InquiryRoleSystemGet(saDB, InquirySysRoles.partrel);
                foreach (var rolePair in model.Roles)
                {
                    if (rolePair.Value != default(int)) continue;
                    if (existsRoles.ContainsKey(rolePair.Key)) continue;

                    string roleName = rolePair.Key;
                    var fact = new SavedObject(_SAConst.Type_EntityRelation);
                    fact.Project_ID = projectID;
                    fact.Project_RoleID = projectRoleForRel;
                    fact.property[_SAConst.ShortName] = roleName;
                    fact.property[_SAConst.Наименование] =
                        String.Format(Root.GetResource("Check_RoleRelationNameTemplate"), obj.DisplayName, roleName, projectData.ProjectName);
                    so.AddRelation(_SAConst.Role_Ассоциативная_связь, fact);
                    saver.CreateObject(so, oid);
                }

                if (so.relatedObj.ContainsKey(_SAConst.Role_Ассоциативная_связь))
                    model.Roles = SDKHelper.InquiryDictionaryRolesGetBy(saDB, InquirySysRoles.partrel, projectID.Value, oid);

                var propVal = saDB._PropertyFastGet(oid, "InterestObjectINPUTDATA");
                var jData = JObject.Parse(propVal);
                jData["RelationsDescriptionData"] = JObject.FromObject(model);
                saDB._FieldFastSet(oid, "InterestObjectINPUTDATA", jData.ToString());
            }

            return model;
        }
    }
}
