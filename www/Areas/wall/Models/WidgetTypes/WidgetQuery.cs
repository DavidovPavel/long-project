namespace www.Areas.wall.Models.WidgetTypes
{
    public class WidgetQuery : Widget, IMarkByRequest
    {
        public RequestParameters requestParameters { get; set; }
        public ColumnCustomizationInfo[] ColumnCustomizations { get; set; }
    }
}