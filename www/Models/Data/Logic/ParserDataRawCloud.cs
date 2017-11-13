using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Newtonsoft.Json.Linq;
using www.Models.Data.Common;
using www.Models.Data.Out.Base;
using www.Models.Data.Out.Cloud;

namespace www.Models.Data.Logic
{
    /// <summary>
    /// ѕредставл€ет парсер дл€ данных дл€ виджета облако тегов
    /// </summary>
    public class ParserDataRawCloud : ParserDataRaw<RuleTransformationResultCloud>
    {
        const int Object_ID = 0;
        const int Display_Name = 1;
        const int YVal = 2;
        const int GroupID = 3;
        const int GroupName = 4;

        public ParserDataRawCloud(DataTable data) : base(data)
        {
        }

        protected override IEnumerable<RuleTransformationResultCloud> ApplyRulesInternal(string ruleCode)
        {
            ruleCode = String.IsNullOrWhiteSpace(ruleCode) ? RuleCodeDefault : ruleCode;

            var query = RulesTransformation.RuleByCode(ruleCode);
            foreach (RuleTransformation rule in query)
            {
                var flow = rule.Transform(_data);
                if (flow == null) continue;

                yield return new RuleTransformationResultCloud
                {
                    family = rule.Family,
                    flow = flow,
                    ruleCode = rule.Code
                };
            }
        }

        protected override InputDataKindType MyInputDataKindType => InputDataKindType.Unknown;

        static JToken WidgetCloud_01(DataTable data)
        {
            if (data.DataSet.Tables[0].Columns.Count == 3)
            {
                var query = from r in data.AsEnumerable()
                    orderby r.Field<object>(Display_Name)
                    select new
                    {
                        x = r.Field<object>(Display_Name),
                        y = r.Field<object>(YVal),
                        text = r.Field<object>(Display_Name),
                        fnId = r.Field<object>(Object_ID),
                        elId = r.Field<object>(Object_ID)
                    };


                var flow = new[]
                {
                    new
                    {
                        argId = (int?) null,
                        name = "",
                        points = query.ToArray(),
                        elId = -1
                    }
                };

                return JToken.FromObject(flow);
            }

            if (data.DataSet.Tables[0].Columns.Count >= 4)
            {
                var query = from r in data.AsEnumerable()
                    group r by new {fnId = r.Field<object>(GroupID), fnName = r.Field<object>(GroupName)}
                    into g
                    select new
                    {
                        g.Key.fnId,
                        name = g.Key.fnName,
                        elId = g.Key.fnId,
                        points = from s in g
                        orderby s.Field<object>(Display_Name)
                        select new
                        {
                            x = s.Field<object>(Display_Name),
                            y = s.Field<object>(YVal),
                            text = s.Field<object>(Display_Name),
                            argId = s.Field<object>(Object_ID),
                            elId = s.Field<object>(Object_ID)
                        }
                    };

                //дл€ круговых диаграмм данные не возвращаютс€, если количество серий > 1 
                var res = query.ToList();
                if (res.Count > 1) return null;

                return JToken.FromObject(query);
            }

            throw new ArgumentException("ParserDataRawCloud can't process data");
        }

        static ParserDataRawCloud()
        {
            RuleCodeDefault = "WidgetCloud_01";
            RulesTransformation.RegisterRule(OutputDataFamily.InternalWidgetCloud, InputDataKindType.Unknown, nameof(WidgetCloud_01), WidgetCloud_01);
        }

        public static string RuleCodeDefault { get; }
    }
}