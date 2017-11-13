using System.Threading.Tasks;
using System.Web.Http;
using ANBR.SemanticArchive.SDK;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using www.Models;
using www.SaGateway;
using www.SaGateway.BL;

namespace www.Controllers.api.Common
{
    public class ReportingController : ApiController
    {
        //route - api/Reporting/GetBySAType
        [HttpGet]
        [ActionName("GetBySAType")]
        public ReportingInfoModel[] GetReportsBySATypeID(int id)
        {
            return ReportingBL.GetReportsBySAType(WebSaUtilities.Database, id);
        }

        /// <summary>
        /// Используется для "стены", позволяет получить перечень нзваний отчетов
        /// </summary>
        /// <param name="queryid">Идентификатор запроса, который является источником коллекции</param>
        /// <param name="satypeid">Тип СА, по которому отчеты были зарегистрированы</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/Reporting/ByWidgetQ/{queryid:int}/{satypeid:int}")]
        public async Task<ReportingInfoModel[]> GetReportsBySATypeID(int queryid, int satypeid)
        {
            QueryDTO qDto = await WallBL.WidgetQueryDataAsync(queryid);
            IDataBase saDB = WebSaUtilities.ConnectorInstance.GetDataBase(qDto.DatabaseID, 0, qDto.DatabaseName);

            return ReportingBL.GetReportsBySAType(saDB, satypeid);
        }
    }
}
