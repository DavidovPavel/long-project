using System;
using System.Collections.Generic;
using ANBR.Common.Filters;
using Newtonsoft.Json;
using www.Models.Data.Common;

namespace www.Areas.wall.Models.WidgetTypes
{
    [JsonConverter(typeof(WidgetConverter))]
    public class Widget
    {
        public Guid id { get; set; }
        public string title { get; set; }
        public bool update { get; set; }
        public int timeUpdate { get; set; }
        public int width { get; set; }
        public int height { get; set; }
        public int top { get; set; }
        public int left { get; set; }
        public int? zIndex { get; set; }
        public string Visualization { get; set; }

        public DecorationInfo Decoration { get; set; }
        public LegendInfo Legend { get; set; }

        /// <summary>
        /// Содержит список издателей, на события которых подписан данный виджет
        /// Позволяет задать список подписчиков ТОЛЬКО на этапе создания нового виджета 
        /// </summary>
        public Guid[] publishers { get; set; }

        public Dictionary<Guid, List<QueryParamMap>> publishersSubscriberMap { get; set; }

        /// <summary>
        /// Приизвольный набор данных у виджета
        /// </summary>
        public WidgetsParam[] Characteristics { get; set; }

        public virtual string typeName => GetType().Name;

        public VisualizatonType VisualizatonTypeByWidget()
        {
            Enum.TryParse<VisualizatonType>(typeName, true, out var ret);

            return ret;
        }

        public static int QueryTypeByWidgetType(string widgetTypeName)
        {
            switch (widgetTypeName.ToLower())
            {
                case "widgetrunning":
                case "widgettable":
                    return (int)TypeObjectListView.Table;
                case "widgetcloud":
                case "widgetgraph":
                    return (int)TypeObjectListView.Graph;
                case "widgetmap":
                    return (int)TypeObjectListView.Map;
                case "all":
                    return -1;
                default:
                    throw new ArgumentException($"There aren't any queries for widget type '{widgetTypeName}'");
            }
        }
    }
}