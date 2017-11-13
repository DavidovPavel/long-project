using System.Collections.Generic;
using www.Models.Data.Out.Base;

namespace www.Models.Data.Out.Cloud
{
    public class RuleSetTransformationResultCloud: RuleSetTransformationResultBase
    {
        public IEnumerable<RuleTransformationResultCloud> variations { get; set; }
    }
}