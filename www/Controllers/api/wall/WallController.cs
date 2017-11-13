using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using Anbr.Web.SA.CoreLogic.Model.Wall;
using www.Areas.wall.Models;
using www.Areas.wall.Models.WidgetTypes;
using www.Helpers;
using www.SaGateway;


namespace www.Controllers.api.wall
{
    public class WallController : ApiController
    {
        /// <summary>
        /// Получить все витрины конкретного пользователя
        /// </summary>
        /// <returns></returns>
        [Route("api/wall")]
        public async Task<IEnumerable<Vitrin>> Get()
        {
            string userID = WebSaUtilities.GetCurrentUserID();

            var u = await HelperAD.UserGetById(userID, true);
            if (u == null) throw new InvalidOperationException("Current user isn't defined");

            List<VitrinDTO> vitrins = await WallBL.VitrinsByUser(userID);

            return vitrins.ConvertAll(item =>
            {
                var v = new Vitrin()
                {
                    id = item.VitrinaUID,
                    title = item.Title,
                    IsShared = item.IsShared,
                    Screen = item.Screen,
                    CDate = item.CDate
                };

                if (item.Decoration != null)
                    v.Decoration = item.Decoration.ToLocalType();

                return v;
            }).OrderByDescending(item => item.CDate);
        }

        /// <summary>
        /// Получить все виджеты заданной витрины
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [Route("api/wall/{id:guid}")]
        public async Task<IEnumerable<Widget>> Get(Guid id)
        {
            var widgetsTask = WallBL.WidgetByVitrina(id);
            var subscribersDataTask = WallBL.VitrinaAllSubscribers(id);

            await Task.WhenAll(widgetsTask, subscribersDataTask);

            List<WidgetDTO> widgets = widgetsTask.Result;
            Dictionary<Guid, List<Tuple<Guid, IEnumerable<QueryParamMapDTO>>>> subscribersData = subscribersDataTask.Result;

            return HelperDashboard.WidgetDtoToModelWithMix(widgets, subscribersData);
        }

        /// <summary>
        /// Добавляет пользователя заданной витрины
        /// </summary>
        /// <param name="id">Идентификатор витрины</param>
        /// <param name="userData">Данные по пользователю</param>
        /// <returns></returns>
        [Route("api/wall/{id:guid}/sharewith")]
        [HttpPost]
        // ReSharper disable once CSharpWarnings::CS1998
        public async Task<VitrinUser> ShareWith(Guid id, VitrinUser userData)
        {
            var user = await HelperAD.UserGetById(userData.UserUID, false);
            if (user == null) return null;

            await WallBL.VitrinaShareWith(id, user, userData.Access == VitrinUser.AccessType.Readonly);

            userData.UserID = user.UserID;
            userData.UserTitle = user.UserTitle;

            return userData;
        }

        /// <summary>
        /// Получает список пользователей заданной витрины
        /// </summary>
        /// <param name="id">Идентификатор витрины</param>
        /// <returns></returns>
        [Route("api/wall/{id:guid}/users")]
        [HttpGet]
        public async Task<IEnumerable<VitrinUser>> VitrinaUsers(Guid id)
        {
            var currentUserUID = WebSaUtilities.GetCurrentUserID();
            List<VitrinUserDTO> vitrinusers = await WallBL.VitrinaUsersGet(id);

            return vitrinusers.Where(item => item.UserUID != currentUserUID).ToLocalType();
        }

        /// <summary>
        /// Исключить пользователя из пользователей текущей витрины
        /// </summary>
        /// <param name="id">Идентификатор витрины</param>
        /// <param name="uid">Идентификатор пользователя</param>
        /// <returns></returns>
        [Route("api/wall/{id:guid}/users/{uid:int}")]
        [HttpDelete]
        public async Task VitrinaUserRemove(Guid id, int uid)
        {
            await WallBL.VitrinaUsersRemove(id, uid);
        }

        /// <summary>
        /// Создать новую витрину
        /// </summary>
        /// <param name="vitrin"></param>
        /// <returns></returns>
        [Route("api/wall")]
        public async Task<Vitrin> Post(Vitrin vitrin)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            vitrin.id = await WallBL.VitrinaNew(userID, new VitrinDTO()
            {
                Title = vitrin.title,
                IsShared = false,
                Screen = vitrin.Screen,
                CDate = vitrin.CDate ?? DateTime.Now
            });

            return vitrin;
        }

        /// <summary>
        /// Изменить заданную
        /// </summary>
        /// <param name="vitrin"></param>
        [Route("api/wall/{id:guid}")]
        public async Task Put(Vitrin vitrin)
        {
            if (vitrin.IsShared)
                throw new InvalidOperationException("Sorry, you can't modify this dashboard");

            //со стороны клиента приходит UTC, но EntityFramework и ADO, это воспринимают как DateTimeKind.Unspecified
            //да уж... надо об этом помнить
            DateTime? localCDate = null;
            if (vitrin.CDate.HasValue)
                localCDate = vitrin.CDate.Value.ToLocalTime();

            await WallBL.VitrinaModify(new VitrinDTO()
            {
                Title = vitrin.title,
                VitrinaUID = vitrin.id,
                Screen = vitrin.Screen,
                CDate = localCDate
            });
        }

        /// <summary>
        /// Удалить витрину
        /// </summary>
        /// <param name="id"></param>
        [Route("api/wall/{id:guid}")]
        public async Task Delete(Guid id)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            await WallBL.VitrinaDelete(userID, id);
        }

        [HttpPost]
        [HttpPut]
        [Route("api/wall/{vitrinaUid:guid}/decoration")]
        public async Task<VitrinaDecorationInfo> SetDecoration(Guid vitrinaUid, VitrinaDecorationInfo decoration)
        {
            await WallBL.VitrinaSetDecoration(vitrinaUid, decoration.ToDTOType());

            return decoration;
        }

        /// <summary>
        /// Позволяет задать размещение для набора виджетов
        /// </summary>
        /// <param name="vitrinaUid"></param>
        /// <param name="pis"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/wall/{vitrinaUid:guid}/positions")]
        public async Task WidgetsSetPosition(Guid vitrinaUid, PositionInfo[] pis)
        {
            var tasks = new Task[pis.Length];
            for (int i = 0; i < pis.Length; i++)
            {
                var pi = pis[i];
                tasks[i] = WallBL.WidgetSetPosition(pi.WidgetUid, pi.PlacementTop, pi.PlacementLeft, pi.PlacementWidth,
                        pi.PlacementHeight, pi.ZIndex);
            }

            await Task.WhenAll(tasks);
        }
    }
}
