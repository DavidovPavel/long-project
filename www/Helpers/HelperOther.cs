using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using Ganss.XSS;

namespace www.Helpers
{
    public class HelperOther
    {
        public static List<T> ExtractDataOIDFromText<T>(string text, string oknd) where T : IConvertible
        {
            var res = new List<T>();

            var re = new Regex($@"data-oknd=""{oknd}""\s+data-oid=""(\d+)""");
            MatchCollection mc = re.Matches(text);
            if (mc.Count > 0)
            {
                foreach (Match m in mc)
                    if (m.Groups.Count > 1)
                    {
                        var val = Convert.ChangeType(m.Groups[1].Value, typeof(T));
                        res.Add((T)val);
                    }
            }

            return res;

        }
        
        /// <summary>
        /// Извлекает код страны из кода языка и культуры en-US (будет извлечено US)
        /// </summary>
        /// <param name="languageCultureName"></param>
        /// <returns></returns>
        public static string ExtractCountryNameFromCulture(string languageCultureName)
        {
            if (String.IsNullOrWhiteSpace(languageCultureName)) return languageCultureName;
            if (languageCultureName.Length < 3) return languageCultureName;

            return languageCultureName.Substring(languageCultureName.Length - 2, 2).ToUpper();
        }

        public static string ScriptsTrim(string sourceText, bool onlyMediaContent)
        {
            var mBody = Regex.Match(sourceText, "<body.*?>(.*?)</body>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            if (mBody.Success && mBody.Groups.Count > 1)
                sourceText = mBody.Groups[1].Value;

            if (onlyMediaContent)
            {
                var sb = new StringBuilder();
                sb.Append(@"<div class=""showroom"">");
                var matches = Regex.Matches(sourceText, @"<img.*?src=[""'](.*?)[""'].*?/?>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                foreach (Match m in matches)
                    sb.AppendFormat(@"<img src=""{0}"" /><br/>", m.Groups[1].Value);

                matches = Regex.Matches(sourceText, @"(<video.*?video>)", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                foreach (Match m in matches)
                    sb.Append(m.Groups[1].Value).Append("<br/>");

                matches = Regex.Matches(sourceText, @"<iframe.*?src=[""'](.*?)[""'].*?/?>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                foreach (Match m in matches)
                {
                    sb.AppendFormat(@"
<div>
  <div class=""videowrapper"">
    <iframe  src=""{0}"" frameborder=""0"" allowfullscreen=""true""></iframe>
  </div>
</div><br/>", m.Groups[1].Value);
                }

                sb.Append("</div>");

                sourceText = sb.ToString();
            }
            else
            {
                var sanitizer = new HtmlSanitizer();
                sanitizer.AllowedSchemes.Add("data");
                sanitizer.AllowedTags.Add("picture");
                sanitizer.AllowedTags.Add("video");
                sanitizer.AllowedTags.Add("source");
                sanitizer.Sanitize(sourceText);
                sanitizer.RemovingAttribute += (s, e) => e.Cancel = e.Reason == RemoveReason.NotAllowedUrlValue && e.Attribute.Value.Length >= 0xfff0 && e.Attribute.Value.StartsWith("data:", StringComparison.OrdinalIgnoreCase);

                sourceText = sanitizer.Sanitize(sourceText);

                var doc = new HtmlAgilityPack.HtmlDocument();
                doc.LoadHtml(sourceText);

                foreach (var img in doc.DocumentNode.Descendants("img"))
                {
                    img.Attributes.Remove("width");
                    img.Attributes.Append("width", "100%");
                }

                sourceText = doc.DocumentNode.OuterHtml;
            }

            return sourceText;
        }
    }
}