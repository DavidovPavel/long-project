using System;
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using Newtonsoft.Json;

namespace www.Models
{
    public class QueryParameter
    {
        public int? id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public object[] Value { get; set; }
        public string Caption { get; set; }
        public string DisplayValue { get; set; }
        public bool IsMultiValues { get; set; }
        public string ParametrType { get; set; }
        public bool AllowNulls { get; set; }
        public string MetaEntity { get; set; }

        public string ValueCombine(string separator = ",")
        {
            return String.Join(separator, Value.Select(ParamToString));
        }

        public void SetValue(string[] value)
        {
            if (value.Length == 0) return;

            switch (ParametrType)
            {
                case "DateTime":
                    {
                        DateTime d;
                        try
                        {
                            d = DateTime.Parse(value[0], null, DateTimeStyles.RoundtripKind);
                        }
                        catch
                        {
                            if (!DateTime.TryParse(value[0], CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
                                DateTime.TryParse(value[0], CultureInfo.CurrentCulture, DateTimeStyles.None, out d);
                        }

                        Value = new[] { (object)d };

                        return;
                    }
            }

            Value = new object[value.Length];
            for (var index = 0; index < value.Length; index++)
                Value[index] = value[index];
        }

        /// <summary>
        /// Признак недействительного параметра (отсутствующего на данный момент в актуальном запросе СА)
        /// </summary>
        public bool IsInvalid { get; set; }

        [JsonIgnore]
        public string this[int index] => ParamToString(Value[index]);

        private string ParamToString(object val)
        {
            switch (ParametrType)
            {
                case "DateTime":
                    {
                        if (val is DateTime)
                            return ((DateTime)val).ToString(CultureInfo.InvariantCulture);

                        try
                        {
                            var d = DateTime.Parse(val.ToString(), null, DateTimeStyles.RoundtripKind);
                            return d.ToString(CultureInfo.InvariantCulture);
                        }
                        // ReSharper disable once EmptyGeneralCatchClause
                        catch
                        { }

                        return val.ToString();
                    }

                default: return val?.ToString() ?? "";
            }
        }
    }
}