using System;

namespace www.Areas.wall.Models
{
    public class LegendItemInfo
    {
        /// <summary>
        /// Идентификатор
        /// </summary>
        public Guid? LegendItemUID { get; set; }

        /// <summary>
        /// Цвет (используется если не задан MarkerUrl)
        /// </summary>
        public string MarkerColor { get; set; }

        /// <summary>
        /// Описание возле элемента
        /// </summary>
        public string MarkerDescription { get; set; }

        /// <summary>
        /// Иконка маркера 
        /// </summary>
        public string MarkerUrl { get; set; }

        public int? SerialNum { get; set; }
    }
}