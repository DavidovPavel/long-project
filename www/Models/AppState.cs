using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace www.Models
{
    public class AppState
    {
        /// <summary>
        /// сессия 0 - закрыта, 1 - открыта
        /// </summary>
        public int AuthState { get; set; }

        /// <summary>
        /// модуль управления пользовательским сервисом,  0 - не доступна, 1 - OK
        /// </summary>
        public int MMCSState { get; set; }

        public bool IsMBFStandAlone { get; set; }
    }
}