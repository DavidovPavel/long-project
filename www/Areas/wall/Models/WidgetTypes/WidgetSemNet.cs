using Newtonsoft.Json;

namespace www.Areas.wall.Models.WidgetTypes
{
    public class WidgetSemNet : Widget, IMarkByRequest
    {
        public int? SNLevel { get; set; }
        public int? SNLayout { get; set; }
        public int? SNStruct { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public RequestParameters requestParameters { get; set; }
    }
}