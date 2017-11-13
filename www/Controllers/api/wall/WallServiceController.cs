using System;
using System.Threading.Tasks;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using www.Areas.wall.Models;

namespace www.Controllers.api.wall
{
    public class WallServiceController : ApiController
    {
        /// <summary>
        /// Клонировать заданный набор виджетов
        /// </summary>
        /// <param name="data">Данные по клонированию</param>
        /// <returns></returns>
        [Route("api/wall/service/widgetclonning")]
        [HttpPost]
        public async Task WidgetClonning(ClonningData data)
        {
            if (data == null) throw new ArgumentNullException(nameof(data));

            await WallBL.WidgetClonning(data.widgets, data.vitrins);
        }

    }
}
