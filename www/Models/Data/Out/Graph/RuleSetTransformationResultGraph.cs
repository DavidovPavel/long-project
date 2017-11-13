using System.Collections.Generic;
using www.Models.Data.Out.Base;

namespace www.Models.Data.Out.Graph
{
    public class RuleSetTransformationResultGraph: RuleSetTransformationResultBase
    {
        public IEnumerable<RuleTransformationResultGraph> variations { get; set; }
    }
}