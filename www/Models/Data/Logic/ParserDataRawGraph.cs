using System;
using System.Collections.Generic;
using System.Data;
using www.Models.Common;
using www.Models.Data.Out.Graph;

namespace www.Models.Data.Logic
{
    public abstract class ParserDataRawGraph : ParserDataRaw<RuleTransformationResultGraph>
    {
        protected readonly AxisType _xAxisType;
        protected readonly AxisType _yAxisType;

        protected override IEnumerable<RuleTransformationResultGraph> ApplyRulesInternal(string ruleCode)
        {
            var query = !String.IsNullOrWhiteSpace(ruleCode) ? RulesTransformation.RuleByCode(ruleCode) : RulesTransformation.RulesByInputDataType(MyInputDataKindType);
            foreach (RuleTransformation rule in query)
            {
                var flow = rule.Transform(_data);
                if (flow == null) continue;

                yield return new RuleTransformationResultGraph
                {
                    family = rule.Family,
                    flow = flow,
                    xAxisType = _xAxisType,
                    yAxisType = _yAxisType,
                    ruleCode = rule.Code
                };
            }
        }

        protected ParserDataRawGraph(DataTable data) : base(data)
        {
            _xAxisType = data.Columns[1].DataType.ToAxisType();
            _yAxisType = data.Columns[2].DataType.ToAxisType();
        }
    }
}