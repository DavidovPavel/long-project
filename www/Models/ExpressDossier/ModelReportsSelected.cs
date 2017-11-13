using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace www.Models.ExpressDossier
{
    public class ModelReportsSelected
    {
        /// <summary>
        /// ID текущего объекта
        /// </summary>
        public int ObjID { get; set; }

        /// <summary>
        /// Комплексный отче (парадное досье)
        /// </summary>
        public bool main { get; set; }
        
        /// <summary>
        /// Отчеты SqlReporting
        /// </summary>
        public Dictionary<int, string> reports { get; set; }
        
        /// <summary>
        /// Выписки
        /// </summary>
        public Dictionary<int, string> extracts { get; set; }
        
        /// <summary>
        /// Семантическая схема 
        /// </summary>
        public bool semSchema { get; set; }
        
        /// <summary>
        /// Аналитическая записка
        /// </summary>
        public bool analystNote { get; set; }
        
        /// <summary>
        /// 0 - Сформировать архив, 1 - сформировать архив и отправить на E-mail
        /// </summary>
        public int Action { get; set; }
        
        /// <summary>
        /// Email назначения с приложенным архивом
        /// </summary>
        public string Email { get; set; }
    }
}
