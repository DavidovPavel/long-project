using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using www.Models.Common;
using www.SaGateway;

namespace www.Controllers.api.Common
{
    public class SessionController : ApiController
    {
        /// <summary>
        /// Добавление/изменение сохраняемых данных по состоянию
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        [HttpPut]
        [Route("api/session/data")]
        public ModelSession[] SessionDataAdd(ModelSession[] data)
        {
            string userID = WebSaUtilities.GetCurrentUserID();

            var ModelSessions = data;
            foreach (var p in ModelSessions) p.SessionUID = (p.SessionUID ?? Guid.NewGuid());

            SessionDTO[] sessionDTO = ModelSessions.ToDTOType();

            CommonBL.SessionDataProcess(sessionDTO, userID);

            return ModelSessions;
        }

        /// <summary>
        /// Получить данные состояния
        /// </summary>
        /// <param name="code"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/session/data/{code}")]
        public ModelSession[] SessionDataGet(string code)
        {
            string userID = WebSaUtilities.GetCurrentUserID();

            SessionDTO[] wParamsDto = CommonBL.SessionDataGet(userID, code);
            return wParamsDto.ToLocalType();
        }

        /// <summary>
        /// Добавление/изменение сохраняемых данных по состоянию
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        [HttpPut]
        [Route("api/session/data/{uid:guid}")]
        public ModelSession WidgetParamAdd(ModelSession data)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            data.SessionUID = data.SessionUID ?? Guid.NewGuid();
            CommonBL.SessionDataProcess(data.ToDTOType(), userID);

            return data;
        }
    }
}
