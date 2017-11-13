using System.Data;
using System.Collections.Generic;
using System.Web.Http;
using www.Models;
using System.Linq;
using www.SaGateway;
using System.Net.Http;
using System.Net;
using ANBR.Tasks.RobotContracts.Common;
using EntityFinder;
using Anbr.Web.SA.CoreLogic;
using System;
using www.Helpers;
using www.Models.Analyst;
using www.Models.Items;

namespace www.Controllers.api
{
    public class DocsController : ApiController
    {
        [ActionName("DefaultAction")]
        public List<ListSources> Get(int id, int page = 1)
        {
            var saDB = WebSaUtilities.Database;

            int[] idsArr = HelperInquiry.ContextGetSATaskIds(saDB);
            var result = HelperDocuments.GetDocumentsInfo(new[] { id }, false, "InfoDb", true, page, idsArr);


            result.ForEach(item => item.originoid = id);
            return result;
        }


        /// <summary>
        /// Получить список выписок
        /// param od = 0, null - все выписки, 1 - выписки, которые содержат оригинал документа
        /// </summary>
        /// <param name="id"></param>
        /// <param name="page"></param>
        /// <param name="uid">идентификатор проверки</param>
        /// <param name="od">флаг, который позволяет получить выписки только с оригиналом документа</param>
        /// <returns></returns>
        [HttpGet]
        public List<ListSources> InfoDB(int id, int page = 1, Guid? uid = null, int? od = 0)
        {
            var saDB = WebSaUtilities.Database;

            //фильтры по типам роботов
            int[] idsArr = HelperInquiry.ContextGetSATaskIds(saDB);
            List<ListSources> result = HelperDocuments.GetDocumentsInfo(new[] { id }, od == 1, "InfoDb", false, page, idsArr);


            result.ForEach(item => item.originoid = id);
            return result;
        }

        [HttpGet]
        public Source Item(int id)
        {
            return SDKHelper.GetSourceByID(id);
        }

        [HttpGet]
        public IEnumerable<ListElement> LinkedFactsAndObjects(int id)
        {
            List<ListElement> result;

            var qnv = Request.GetQueryNameValuePairs();
            var qp = qnv.FirstOrDefault(item => item.Key == "page");
            int page;
            int.TryParse(qp.Value, out page);

            var obj = WebSaUtilities.Database.ObjectModel.GetObject(id);
            if (!obj.MetaType.IsSource)
            {
                DataTable dt = SDKHelper.GetAllRelatedObjects(id);
                result = Root.GetList(dt);
            }
            else
                result = SDKHelper.GetMentions(id);

            if (page != default(int))
                result = Root.GetList(result, page);

            result.ForEach(item => item.originoid = id);
            return result;
        }

        [HttpPost]
        [ActionName("DefaultAction")]
        public HttpResponseMessage StartAutoExtracting(QueryAutoExtraction model)
        {
            if (model.MainObject == default(int) || model.Sources.Length == 0) return Request.CreateResponse(HttpStatusCode.InternalServerError, "Model state is invalid");

            bool extractObjects = model.AutoGetObjects ?? true;
            bool allowDuplFacts = model.AutoAllowDuplFacts ?? true;
            bool allowDuplObjs = model.AutoAllowDuplObjs ?? false;

            var so = WebSaUtilities.Database.ObjectModel.GetObject(model.MainObject);
            var t = so.MetaType;
            if (t != null)
            {
                if (t.SystemName == _SAConst.Type_Request)
                {
                    WebSaUtilities.Database.ServiceTools.AutoExtractFactByRequest(model.MainObject, model.Sources);
                }
                else
                    if ((t.IsPerson || t.IsOrganization))
                {
                    var en = EntityTypeSa.None;
                    if (model.Marked_Persons ?? true) en = en | EntityTypeSa.Person;
                    if (model.Marked_Orgs ?? true) en = en | EntityTypeSa.Organization;
                    if (model.Marked_Region ?? false) en = en | EntityTypeSa.Region;
                    if (model.Marked_Object ?? true) en = en | EntityTypeSa.Object;
                    if (model.Marked_Dates ?? false) en = en | EntityTypeSa.Date;
                    if (model.Marked_Money ?? false) en = en | EntityTypeSa.Money;


                    string userID = WebSaUtilities.GetCurrentUserID();
                    string dbID = Scope.GetCurrentDBID();
                    string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;


                    string message = String.Format(Resources.Client.Docs_AutoExtractJobNameTemplate, so.DisplayName);

                    Guid factAutoExtractionJobUID = WebSaUtilities.Database.SourceService.AutoExtractFactsEntitiesComplexByDocsByJob(userID, "", model.Sources.ToList(), true, EntityTypeSa.Object | EntityTypeSa.Person | EntityTypeSa.Organization, true, true);


                    NotificationBL.RegisterAutoFactExtraction(userID, dbID + "|$|" + dbName, model.MainObject, factAutoExtractionJobUID, message, System.Threading.Thread.CurrentThread.CurrentUICulture);
                }

                return Request.CreateResponse(HttpStatusCode.Created);
            }

            return Request.CreateResponse(HttpStatusCode.InternalServerError, "Model state is invalid");
        }
    }
}
