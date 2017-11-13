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
    /// </summary>
    public class ParserDataRawGraphCd1 : ParserDataRawGraph
    {
        const int Object_ID = 0;
        const int Display_Name = 1;
        const int YVal = 2;

        static JToken G_CD_1A(DataTable data)
        {
            var query = from r in data.AsEnumerable()
                        group r by r.Field<object>(Object_ID)
                into g
                        select new
                        {
                            fnId = g.Key,
                            elId = g.Key,
                            name = "",
                            points = from s in g
                                     orderby s.Field<object>(Display_Name)
                                     select new
                                     {
                                         x = s.Field<object>(Display_Name),
                                         y = s.Field<object>(YVal),
                                         argId = (int?)null,
                                         elId = (s.Field<object>(Display_Name)).GetHashCode()
                                     }
                        };

            return JToken.FromObject(query);
        }

        static JToken G_CD_1B(DataTable data)
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
                new {
                    argId = (int?)null,
                    name = "",
                    points = query.ToArray(),
                    elId = -1
                }
            };

            return JToken.FromObject(flow);
        }

        static ParserDataRawGraphCd1()
        {
            RulesTransformation.RegisterRule(OutputDataFamily.Syncfusion_G, InputDataKindType.CD1, nameof(G_CD_1A), G_CD_1A);
            RulesTransformation.RegisterRule(OutputDataFamily.Syncfusion_P, InputDataKindType.CD1, nameof(G_CD_1B), G_CD_1B);
        }

        public ParserDataRawGraphCd1(DataTable data) : base(data)
        {
        }

        protected override InputDataKindType MyInputDataKindType => InputDataKindType.CD1;
    }
}