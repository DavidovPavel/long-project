namespace www.Areas.wall.Models
{
    /// <summary>
    /// Состояние карты
    /// </summary>
    public class WidgetStateMap
    {
        public int? Zoom { get; set; }
        public float? CenterLat { get; set; }
        public float? CenterLong { get; set; }
    }
}