using System;
using Newtonsoft.Json.Linq;

namespace www.Areas.wall.Models
{
    public class WidgetsParam
    {
        /// <summary>
        /// Идентификатор параметра
        /// </summary>
        public Guid? WidgetParamUID { get; set; }
        /// <summary>
        /// Системное имя (на уровне соглашения)
        /// </summary>
        public string WidgetParamName { get; set; }
        /// <summary>
        /// Данные JSON-вида
        /// </summary>
        public JToken WidgetParamValue { get; set; }
    }
}