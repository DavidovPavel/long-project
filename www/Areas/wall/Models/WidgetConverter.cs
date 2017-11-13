using System;
using www.Areas.wall.Models.WidgetTypes;
using www.SaGateway;

namespace www.Areas.wall.Models
{
    internal class WidgetConverter : JsonCreationConverter<Widget>
    {
        /// <exception cref="ArgumentException">typeName is invalid</exception>
        protected override Widget Create(Type objectType,
            Newtonsoft.Json.Linq.JObject jObject)
        {
            //or we can analyze - if (FieldExists("FieldName", jObject))...

            var typeName = jObject.Value<string>("typeName");
            WidgetTypes.WidgetTypes wt;
            if (Enum.TryParse(typeName, true, out wt))
            {
                switch (wt)
                {
                    case WidgetTypes.WidgetTypes.WidgetQuery:
                        return new WidgetQuery();
                    case WidgetTypes.WidgetTypes.WidgetSource:
                        return new WidgetSource();
                    case WidgetTypes.WidgetTypes.WidgetSemNet:
                        return new WidgetSemNet();
                    case WidgetTypes.WidgetTypes.WidgetHtml:
                        return new WidgetHtml();
                    case WidgetTypes.WidgetTypes.WidgetGraph:
                        return new WidgetGraph();
                    case WidgetTypes.WidgetTypes.WidgetTable:
                        return new WidgetTable();
                    case WidgetTypes.WidgetTypes.WidgetRunning:
                        return new WidgetRunning();
                    case WidgetTypes.WidgetTypes.WidgetMap:
                        return new WidgetMap();
                    case WidgetTypes.WidgetTypes.WidgetReporting:
                        return new WidgetReporting();
                    case WidgetTypes.WidgetTypes.WidgetCloud:
                        return new WidgetCloud();
                    default:
                        throw new ArgumentException("typeName is invalid");
                }
            }
            throw new ArgumentException("typeName is invalid");
        }
    }
}