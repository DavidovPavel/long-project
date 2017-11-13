using System;

namespace www.Areas.wall.Models
{
    public class ReportItemInfo
    {
        /// <summary>
        /// Идентификатор
        /// </summary>
        public Guid? UID { get; set; }

        /// <summary>
        /// Тип СА
        /// </summary>
        public string TypeSysName { get; set; }

        /// <summary>
        /// Идентификатор выбранного отчета
        /// </summary>
        public string ReportSysName { get; set; }
    }
}