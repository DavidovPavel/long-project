using System;
using www.Models.Data.Common;
using www.Models.Data.In;
using www.Models.Data.Logic;
using www.Models.Data.Out.Cloud;
using www.Models.Data.Out.Graph;

namespace www.Models.Data.Out.Base
{
    public abstract class RuleSetTransformationResultBase
    {
        /// <exception cref="ArgumentOutOfRangeException">Condition.</exception>
        internal static RuleSetTransformationResultBase Create(DataRaw data, VisualizatonType vt, string ruleCode)
        {
            var parserDataRaw = data.ParserGet(vt);
            switch (vt)
            {
                case VisualizatonType.WidgetGraph:
                {
                    return new RuleSetTransformationResultGraph
                    {
                        variations = ((ParserDataRawGraph)parserDataRaw).ApplyRules(ruleCode)
                    };
                }

                case VisualizatonType.WidgetCloud:
                {
                    return new RuleSetTransformationResultCloud
                    {
                        variations = ((ParserDataRawCloud)parserDataRaw).ApplyRules(ruleCode)
                    };
                }

                default:
                    throw new ArgumentOutOfRangeException(nameof(vt), vt, null);
            }
        }

        public static string GetDefaultRuleCodeByVisualization(VisualizatonType vt)
        {
            switch (vt)
            {
                case VisualizatonType.WidgetCloud:
                    return ParserDataRawCloud.RuleCodeDefault;
                default:
                    return null;
            }   
        }
    }
}