using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;

namespace www.Models
{
    public class LoginModel
    {
        [Display(Name = "Введите IP-сервера")]
        public string ServerIP { get; set; }

        [Required()]
        [Display(Name = "Логин")]
        public string UserName { get; set; }

        [Required()]
        [DataType(DataType.Password)]
        [Display(Name = "Пароль")]
        public string Password { get; set; }

        [Required()]
        [RegularExpression(@"\d+")]
        [Display(Name = "ID базы данных")]
        public int? DatabaseID { get; set; }

        [Display(Name = "ID сервера")]
        public int? ServerID { get; set; }

        [Display(Name = "Запомнить меня?")]
        public bool RememberMe { get; set; }

        public IEnumerable<SelectListItem> Databases { get; set; }
        public IEnumerable<SelectListItem> Servers { get; set; }
    }
}
