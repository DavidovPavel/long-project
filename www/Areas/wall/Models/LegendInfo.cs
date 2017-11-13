using System.Collections.Generic;

namespace www.Areas.wall.Models
{
    public class LegendInfo
    {
        public List<LegendItemInfo> WidgetsLegendItems { get; set; }

        /// <summary>
        /// Заголовок легенды 
        /// </summary>
        public string Title { get; set; }

        public bool? LegendIsVisible { get; set; }
        public string LegendPosition { get; set; }
    }
}