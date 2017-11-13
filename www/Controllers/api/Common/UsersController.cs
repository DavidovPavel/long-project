using System.Threading.Tasks;
using System.Web.Http;
using Omu.ValueInjecter;
using www.Common.Models;
using www.Helpers;

namespace www.Controllers.api.Common
{
    public class UsersController : ApiController
    {
        /// <summary>
        /// Позволяет произвести проверку/поиск пользователя по домену 
        /// </summary>
        /// <param name="name">Алиас пользователя: имя, почтовый ящик, логин</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/users/checkname")]
        public async Task<UserW> CheckName(string name)
        {
            var user = await HelperAD.UserGetById(name, false);
            if (user == null) return null;

            return (UserW)new UserW().InjectFrom(user);
        }
    }
}
