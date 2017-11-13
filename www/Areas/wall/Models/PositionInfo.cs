using System;

namespace www.Areas.wall.Models
{
    public class PositionInfo
    {
        public Guid WidgetUid { get; set; }
        public int PlacementWidth { get; set; }
        public int PlacementHeight { get; set; }
        public int PlacementTop { get; set; }
        public int PlacementLeft { get; set; }
        public int? ZIndex { get; set; }
    }
}