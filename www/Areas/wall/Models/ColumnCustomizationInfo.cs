using System;

namespace www.Areas.wall.Models
{
    public class ColumnCustomizationInfo
    {
        /// <summary>
        /// Уникальный идентификатор (присваивается на серверной стороне)
        /// </summary>
        public Guid? QueryCustomizationUID { get; set; }

        /// <summary>
        /// Системное имя (полученное из ContentProperty.systemName)
        /// </summary>
        public string ColumnSystemName { get; set; }

        /// <summary>
        /// Имя колонки (вводит пользователь)
        /// </summary>
        public string ColumnTitle { get; set; }
        
        /// <summary>
        /// Ширина колонки (вводит пользователь)
        /// </summary>
        public string ColumnWidth { get; set; }

        /// <summary>
        /// Признак видимости колонки (вводит пользователь)
        /// </summary>
        public bool ColumnIsVisible { get; set; }

        /// <summary>
        /// Позиция колонки (вводит пользователь)
        /// </summary>
        public int? SerialNum { get; set; }
    }
}