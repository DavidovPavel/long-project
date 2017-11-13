using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace www.Models.Common
{
    /// <summary>
    /// Представление динамического содержимого
    /// </summary>
    public class ModelDynamicContent
    {
        /// <summary>
        /// Содержимое WYSIWYG редактора
        /// </summary>
        public string Html { get; set; }

        /// <summary>
        /// Ппозволяет ограничить показ заданными клиентами
        /// </summary>
        public string ForClientsOnly { get; set; }

        /// <summary>
        /// Ппозволяет ограничить показ заданными БД
        /// </summary>
        public string ForDBsOnly { get; set; }
    }
}