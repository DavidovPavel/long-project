using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using www.Models.Data.Out.Base;

namespace www.Models.Data.Out.Graph
{
    public class RuleTransformationResultGraph: RuleTransformationResultBase
    {
        [JsonConverter(typeof(StringEnumConverter))]
        public AxisType xAxisType { get; set; }

        [JsonConverter(typeof(StringEnumConverter))]
        public AxisType yAxisType { get; set; }
    }
}