using System;
using System.Data;
using System.Linq;
using Newtonsoft.Json.Linq;
using www.Models.Data.Common;
using www.Models.Data.Out.Base;
using www.Models.Data.Out.Graph;

namespace www.Models.Data.Logic
{
    /// <summary>
    /// Представляет парсер для данных вида
    /// Col 0 - Object_ID
    /// Col 1 - Display_Name
    /// Col 2 - YVal
    /// Col 3 - GroupID
    /// Col 4 - GroupName
    /// </summary>
    public class ParserDataRawGraphCd2 : ParserDataRawGraph
    {
        const int Object_ID = 0;
        const int Display_Name = 1;
        const int YVal = 2;
        const int GroupID = 3;
        const int GroupName = 4;

        static JToken G_CD_2B(DataTable data)
        {
            var query = from r in data.AsEnumerable()
                        group r by new { fnId = r.Field<object>(GroupID), fnName = r.Field<object>(GroupName) }
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

            //для круговых диаграмм данные не возвращаются, если количество серий > 1 
            var res = query.ToList();
            if (res.Count > 1) return null;

            return JToken.FromObject(query);
        }

        static JToken G_CD_2A(DataTable data)
        {
            var query = from r in data.AsEnumerable()
                        group r by new { fnId = r.Field<object>(GroupID), argName = r.Field<object>(GroupName) }
                into g
                        select new
                        {
                            g.Key.fnId,
                            name = g.Key.argName,
                            elId = g.Key.fnId,
                            points = from s in g
                                     orderby s.Field<object>(Display_Name)
                                     select new
                                     {
                                         x = s.Field<object>(Display_Name),
                                         y = s.Field<object>(YVal),
                                         argId = s.Field<object>(Object_ID),
                                         elId = s.Field<object>(Object_ID)
                                     }
                        };

            return JToken.FromObject(query);
        }

        static ParserDataRawGraphCd2()
        {
            RulesTransformation.RegisterRule(OutputDataFamily.Syncfusion_G, InputDataKindType.CD2, nameof(G_CD_2A), G_CD_2A);
            RulesTransformation.RegisterRule(OutputDataFamily.Syncfusion_P, InputDataKindType.CD2, nameof(G_CD_2B), G_CD_2B);
        }

        public ParserDataRawGraphCd2(DataTable data) : base(data)
        {
        }

        protected override InputDataKindType MyInputDataKindType => InputDataKindType.CD2;
    }
}