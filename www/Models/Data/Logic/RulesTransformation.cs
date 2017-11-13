using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Newtonsoft.Json.Linq;
using www.Models.Data.Common;
using www.Models.Data.Out.Base;
using www.Models.Data.Out.Graph;

namespace www.Models.Data.Logic
{
    public static class RulesTransformation
    {
        private static readonly List<RuleTransformation> _registeredRules = new List<RuleTransformation>();

        public static void RegisterRule(OutputDataFamily family, InputDataKindType inputDataKindType, string code,  Func<DataTable, JToken> transformer)
        {
            _registeredRules.Add(new RuleTransformation(family, inputDataKindType, code, transformer));
        }

        public static IEnumerable<RuleTransformation> RulesByInputDataType(InputDataKindType myInputDataKindType)
        {
            return _registeredRules.Where(item => item.InputDataKind == myInputDataKindType);
        }
        public static IEnumerable<RuleTransformation> RuleByCode(string code)
        {
            return  _registeredRules.Where(item => item.Code == code);
        }
    }
}