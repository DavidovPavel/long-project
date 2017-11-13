using System;
using System.Data;
using Newtonsoft.Json.Linq;
using www.Models.Data.Common;
using www.Models.Data.Out.Base;

namespace www.Models.Data.Logic
{
    public class RuleTransformation
    {
        private readonly Func<DataTable, JToken> _transformer;

        public JToken Transform(DataTable data)
        {
            return _transformer(data);
        }

        public RuleTransformation(OutputDataFamily family, InputDataKindType inputDataKindType, string code, Func<DataTable, JToken> transformer)
        {
            _transformer = transformer;
            Family = family;
            InputDataKind = inputDataKindType;
            Code = code;
        }

        public string Code { get; }

        public OutputDataFamily Family { get; }
        public InputDataKindType InputDataKind { get; }
    }
}