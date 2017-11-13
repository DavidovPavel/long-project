using System;
using System.Configuration;
using System.Text.RegularExpressions;

namespace www.Utilities
{
    public class Share
    {
        private static void TemplateSubsitutionProcessingExtracted(ref string template, string reqExpr, Func<String, String> getParam)
        {
            MatchCollection mc = Regex.Matches(template, reqExpr);
            bool flag = true;
            int idx = 0;
            while (mc.Count > idx || flag)
            {
                String ci = null;
                if (mc.Count != 0)
                {
                    ci = getParam(mc[idx].Groups[1].Value);

                    if (ci != null)
                        template = Regex.Replace(template, mc[idx].Value, ci);

                    mc = Regex.Matches(template, reqExpr);
                }

                if (mc.Count == 0) flag = false;
                if (ci == null)
                {
                    flag = false;
                    idx++;
                }
            }
        }
        public static string TemplateSubsitutionProcessing(object modelObject, string template, params string[] customParametersForLetter)
        {
            for (int i = 0; i < customParametersForLetter.Length; i++)
                template = Regex.Replace(template, "{CUSTOM-" + i + "}", customParametersForLetter[i], RegexOptions.IgnoreCase);

            TemplateSubsitutionProcessingExtracted(ref template, @"{APPSETTING\.(\S+?)}",
                item =>
                {
                    return ConfigurationManager.AppSettings[item];
                });

            TemplateSubsitutionProcessingExtracted(ref template, @"{CUSTOM-(\S+?)}",
                item =>
                {
                    string propValue = null;
                    try
                    {
                        propValue = modelObject.GetType().GetProperty(item).GetValue(modelObject, null).ToString();
                    }
                    catch { }

                    return propValue ?? null;
                });

            string res = "";
            var lines = template.Split(new string[] { Environment.NewLine }, StringSplitOptions.None);
            foreach (var line in lines)
            {
                if (line.IndexOf("deleteCurrentLine", System.StringComparison.Ordinal) == -1)
                    res = res + line;
            }

            return res;
        }
    }

}