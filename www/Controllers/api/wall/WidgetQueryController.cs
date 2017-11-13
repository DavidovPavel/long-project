using Anbr.Web.SA.CoreLogic;
using System;
using System.Web.Http;
using www.Areas.wall.Models;
using System.Threading.Tasks;

namespace www.Controllers.api.wall
{
    public class WidgetQueryController : ApiController
    {
        /// <summary>
        /// Добавление/изменение сведений о пользовательском представлении колонок (в рамках табличного запроса)
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        [HttpPut]
        [Route("api/widget/{rid:int}/colscustomization")]
        public async Task<ColumnCustomizationInfo[]> WidgetColsAdd(int rid, ColumnCustomizationInfo[] cols)
        {
            foreach (var p in cols) p.QueryCustomizationUID = (p.QueryCustomizationUID ?? Guid.NewGuid());

            var widgetParamsDTO = cols.ToDTOType();
            await WallBL.WidgetQueriesCustomizationsProcess(widgetParamsDTO, rid);

            return cols;
        }

        /// <summary>
        /// Добавление/изменение сведений о пользовательском представлении одной колонки (в рамках табличного запроса)
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        [HttpPut]
        [Route("api/widget/{rid:int}/colcustomization")]
        public async Task<ColumnCustomizationInfo> WidgetColAdd(int rid, ColumnCustomizationInfo col)
        {
            col.QueryCustomizationUID = (col.QueryCustomizationUID ?? Guid.NewGuid());

            var widgetParamsDTO = col.ToDTOType();
            await WallBL.WidgetQueriesCustomizationsProcess(widgetParamsDTO, rid);

            return col;
        }

        [HttpPut]
        [Route("api/widget/{rid:int}/colcustomization/{uid:guid}")]
        public async Task<ColumnCustomizationInfo> WidgetColAdd(int rid, Guid uid, ColumnCustomizationInfo col)
        {
            col.QueryCustomizationUID = (col.QueryCustomizationUID ?? Guid.NewGuid());

            var widgetParamsDTO = col.ToDTOType();
            await WallBL.WidgetQueriesCustomizationsProcess(widgetParamsDTO, rid);

            return col;
        }

        /// <summary>
        /// Удаление пользовательского представления колонки (в рамках табличного запроса)
        /// </summary>
        /// <returns></returns>
        [HttpDelete]
        [Route("api/widget/{rid:int}/colcustomization/{uid:guid}")]
        public async Task WidgetColDelete(Guid uid)
        {
            await WallBL.WidgetQueriesCustomizationsDelete(uid);
        }

        [HttpGet]
        [Route("api/widget/{rid:int}/colscustomization/flush")]
        public async Task WidgetColsFlush(int rid)
        {
            await WallBL.WidgetQueriesCustomizationsFlush(rid);
        }

    }
}