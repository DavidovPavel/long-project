namespace www.Areas.wall.Models.WidgetTypes
{
    public class WidgetSource : Widget
    {
        public bool? extractOnlyMedia;
        public bool? isHtmlContent { get; set; }
        public string contentProp { get; set; }
        public bool? hideTitle { get; set; }
        public bool? highlightMentionObj { get; set; }

    }
}