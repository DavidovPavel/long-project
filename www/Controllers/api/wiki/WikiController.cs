using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using ANBR.Highlight.Contracts;
using ANBR.SemanticArchive.DataContracts.Sources;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.ObjectModel;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using www.Areas.wiki.Models;
using www.SaGateway;
using www.SaGateway.BL;

namespace www.Controllers.api
{
    public class WikiController : ApiController
    {
        /// <summary>
        /// Список стартовых объетов (мультимедийные источники)
        /// </summary>
        /// <returns></returns>
        [Route("api/wiki/points")]
        public IEnumerable<WikiPointModel> GetEntryPoints()
        {
            return WikiSABL.GetAllEntryPoints();
        }

        /// <summary>
        /// Получаем разметку для wiki-страницы по заданому объекту
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [Route("api/wiki/points/{id:int}")]
        public WikiDocumentModel GetEntryData(int id)
        {
            string html = "";
            var saDB = WebSaUtilities.Database;

            ISaObject saObj = saDB.ObjectModel.GetObject(id);
            if (saObj == null) throw new ArgumentException("Invalid object ID");


            if (saObj.MetaType.IsSource)
            {
                var src = DetailsController.GetSourceSimple(saDB, id, 1, false);
                
                var highlightModule = new ClientHighlighterModule(saDB, src.id);
                html = highlightModule.DoHighlight();
            }
            else
                html = DetailsController.GetHtml(saDB, id);

            html = html.Replace(Environment.NewLine, "<br>");
            html = html.Replace("\n", "<br>");

            return new WikiDocumentModel() { Content = html, Display_Name = saObj.DisplayName, Object_ID = saObj.Id };
        }
    }
}
