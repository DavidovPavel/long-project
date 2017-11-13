using System;
using System.Collections.Generic;
using System.Web.Http;
using www.Helpers;
using www.Hub;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api.ExpressDossier
{
    /// <summary>
    /// Работа с результатами
    /// </summary>
    public class CheckResController : ApiController
    {
        /// <summary>
        /// Позволяет получить список поисковых задач по заданному объекту
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get(int id)
        {
            List<ListElement> jobsData = HelperInquiry.GetAllJobs(WebSaUtilities.Database, WebSaUtilities.MBF, SaJobType.CheckInterestObject, id);
            //первый системный элемент, фактически обозначаетм "все" или "без задачи"
            jobsData.Insert(0, new ListElement
            {
                id = 0,
                date = null,
                uid = Guid.Empty.ToString(),
                data = null

            });

            return jobsData;
        }
    }
}
