using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;

namespace www.Models.Data.Out.Base
{
    public class RuleTransformationResultBase
    {
        /// <summary>
        /// Представляет собой данные соответствующие правилу трансформации
        /// </summary>
        public JToken flow { get; set; }

        [JsonConverter(typeof(StringEnumConverter))]
        public OutputDataFamily family { get; set; }

        public string ruleCode { get; set; }

    }
}