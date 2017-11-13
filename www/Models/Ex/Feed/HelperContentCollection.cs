using System.Collections.Generic;
using System.Data;
using System.Text.RegularExpressions;
using Anbr.Web.SA.CoreLogic;

namespace www.Models.Ex.Feed
{
    public static class HelperContentCollection
    {
        private static readonly Regex _reTemplatedItem;

        static HelperContentCollection()
        {
            _reTemplatedItem = new Regex("\\[(.+?)\\]");
        }

        public static string RenderTemplate(DataRow source, HeadProperty headProp)
        {
            string template = headProp.template;
            return RenderTemplate(source, template);
        }

        internal static string RenderTemplate(DataRow source, string template)
        {
            var m = _reTemplatedItem.Matches(template);
            for (int i = 0; i < m.Count; i++)
            {
                var templateItem = m[i].Groups[1].Value;
                int idx = source.Table.Columns.IndexOf(templateItem);
                var varValue = idx == -1 ? Scope.GetGlobalVariables(templateItem) : source[idx].ToString();
                template = template.Replace(m[i].Value, varValue);
            }

            return template;
        }

        internal static string RenderTemplate(Dictionary<string, string> source, string template)
        {
            var m = _reTemplatedItem.Matches(template);
            for (int i = 0; i < m.Count; i++)
            {
                var templateItem = m[i].Groups[1].Value;
                string val;
                if (!source.TryGetValue(templateItem, out val))
                    val = Scope.GetGlobalVariables(templateItem);
                template = template.Replace(m[i].Value, val);
            }

            return template;
        }
    }
}