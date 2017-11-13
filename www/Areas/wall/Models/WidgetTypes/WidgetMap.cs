namespace www.Areas.wall.Models.WidgetTypes
{
    public class WidgetMap : WidgetQuery
    {
        public int? Zoom { get; set; }
        public double? CenterLat { get; set; }
        public double? CenterLong { get; set; }
        public bool? isClustered { get; set; }
    }
}