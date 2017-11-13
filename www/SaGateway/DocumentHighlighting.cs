using System;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Anbr.Web.SA.CoreLogic;

namespace www.SaGateway
{
    public class DocumentHighlighting
    {
        public enum FormattinKind
        {
            None = 0,
            EntitiesInText = 2,
            Keywords = 3
        }

        public enum Mode
        {
            WholeWord,
            OriginalFragment
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="needles"></param>
        /// <param name="text"></param>
        /// <param name="id">Если 0, то data-oid - отсутствует</param>
        /// <param name="kind"></param>
        /// <param name="mode"></param>
        /// <param name="style"></param>
        /// <param name="anyCharReplacement">позволяет задать символ, который будет обозначать последовательность символов (*, %)</param>
        /// <returns></returns>
        public static string GetFormattedText(string[] needles, string text, string id, FormattinKind kind, Mode mode, string style = null, string anyCharReplacement = null)
        {
            if (text.Trim() == string.Empty) return text;

            ReplaceMatches(mode, needles, ref text, id, kind, anyCharReplacement);

            return FinilizeText(text, style);
        }

        public static string GetFormattedText(string textFragment, string text, string id, FormattinKind kind, Mode mode, string style = null, string anyCharReplacement = null)
        {
            if (text.Trim() == string.Empty) return text;

            ReplaceMatches(mode, new[] { textFragment }, ref text, id, kind, anyCharReplacement);

            return FinilizeText(text, style);
        }


        public static string GetRegexString(string textFragment, ClientType ctype, Mode mode)
        {
            if (textFragment.Trim() == string.Empty) return null;

            StringBuilder sb;
            if (!CalculateRegExpression(mode, new[] { textFragment }, out sb, ctype, null)) return null;

            return sb.ToString();
        }


        static void ReplaceMatches(Mode mode, string[] toFindArr, ref string whereToFind, string id, FormattinKind kind, string anyCharReplacement)
        {
            if (toFindArr == null || toFindArr.Length == 0 || string.IsNullOrWhiteSpace(whereToFind)) return;

            StringBuilder sb;
            if (!CalculateRegExpression(mode, toFindArr, out sb, ClientType.DNET, anyCharReplacement)) return;

            whereToFind = UsePattern(whereToFind, id, kind, sb.ToString());
        }

        private static bool CalculateRegExpression(Mode mode, string[] toFindArr, out StringBuilder sb, ClientType ctype, string anyCharReplacement)
        {
            sb = new StringBuilder();
            if (toFindArr == null || toFindArr.Length == 0) return false;
            if (!String.IsNullOrWhiteSpace(anyCharReplacement))
                anyCharReplacement = Regex.Escape(anyCharReplacement);

            toFindArr = toFindArr.OrderByDescending(item => item.Length).ToArray();

            if (mode == Mode.WholeWord)
            {
                sb.Append(@"(:?");
                for (int idx = 0; idx < toFindArr.Length; idx++)
                {
                    string toFind = toFindArr[idx];
                    string[] sarray = toFind.Split(' ', '\t', '\n');

                    var langCandidated = Root.ProxyGetWorker().IdentifyLanguage(toFind);

                    string wordDivider = @"\s+";
                    if (langCandidated != null && langCandidated.Iso639_2T.StartsWith("zh")) wordDivider = @"\s*"; //в иераглифике напряженка с пробелами

                    int len = sarray.Length;
                    sb.Append($@"(?<start>\b|{wordDivider})(?<key>");
                    string template;
                    for (int i = 0; i < len - 1; i++)
                    {
                        template = Regex.Escape(sarray[i]);
                        if (!String.IsNullOrWhiteSpace(anyCharReplacement))
                            template = template.Replace(anyCharReplacement, "\\w+");

                        sb.Append(template);
                        sb.Append(@"\s+");
                    }
                    template = Regex.Escape(sarray[len - 1]);
                    if (!String.IsNullOrWhiteSpace(anyCharReplacement))
                        template = template.Replace(anyCharReplacement, "\\w+");

                    sb.Append(template);
                    sb.Append($@")(?<end>\b|{wordDivider})");
                    if (idx < toFindArr.Length - 1)
                        sb.Append(@"|");
                }

                sb.Append(@")");
            }

            if (mode == Mode.OriginalFragment)
            {
                int cnt = 1;
                if (ctype == ClientType.DNET) sb.Append(@"(:?");

                for (int idx = 0; idx < toFindArr.Length; idx++)
                {
                    string toFind = toFindArr[idx];
                    toFind = toFind.Trim();
                    toFind = toFind.Replace('\t', ' ').Replace('\n', ' ').Replace('\r', ' ');

                    var parts = toFind.Split(new[] { ' ' }, StringSplitOptions.None);
                    if (parts.Length > 2)
                    {
                        if (ctype == ClientType.DNET) sb.Append("(?<key>");
                        for (int i = 0; i < parts.Length; i++)
                        {
                            var part = parts[i].Trim();
                            int partLen = part.Length;
                            part = Regex.Escape(part);

                            if (String.IsNullOrWhiteSpace(part.Trim()))
                            {
                                cnt++;
                                continue;
                            }

                            if (i > 0)
                            {
                                if (partLen > 1)
                                    sb.Append(".{").Append(cnt).Append(",").Append(cnt + 50).Append("}");
                                else
                                    sb.Append("(\\s|<br />|<br>|<br/>|&nbsp;)+"); //случай вот таких вещей С П Р А В К А

                            }
                            cnt = 1;

                            sb.Append(part);
                        }

                        if (ctype == ClientType.DNET) sb.Append(")");
                    }
                    else
                    {
                        var part = Regex.Escape(toFind);
                        if (ctype == ClientType.DNET) sb.Append("(?<key>");
                        sb.Append(part);
                        if (ctype == ClientType.DNET) sb.Append(")");
                    }

                    if (idx < toFindArr.Length - 1)
                        sb.Append(@"|");
                }
                if (ctype == ClientType.DNET) sb.Append(@")");
            }

            return sb.Length != 0;
        }

        private static string UsePattern(string whereToFind, string id, FormattinKind kind, string pattern)
        {
            var options = RegexOptions.IgnoreCase | RegexOptions.Singleline;

            Regex reIsRightToLeft = new Regex(@"\p{IsArabic}|\p{IsHebrew}");
            if (reIsRightToLeft.IsMatch(whereToFind)) options = options | RegexOptions.RightToLeft;


            whereToFind = "<div></div>" + whereToFind + "<div></div>"; //без этого патерн (?<=>[^<>]*?) не будет работать

            pattern = "(?<=>[^<>]*?)" + pattern + "(?=[^<>]*?<)";
            try
            {
                var r1 = new Regex(pattern, options, TimeSpan.FromSeconds(5));

                whereToFind = r1.Replace(whereToFind, m =>
                {
                    if (m.Groups.Count > 2)
                        return m.Groups["start"].Value + GetTextFormatter2(m.Groups["key"].Value, id, kind, out _, out _) +
                               m.Groups["end"].Value;
                    return GetTextFormatter2(m.Groups["key"].Value, id, kind, out _, out _);
                });

                whereToFind = whereToFind.Substring(11);
                return whereToFind;

            }
            catch (RegexMatchTimeoutException ex)
            {
                LogBL.Write("DocumentHighlighting.UsePattern", ex.ToString());

                return whereToFind;
            }
        }

        static string FinilizeText(string input, string style)
        {
            string substitution = "<span data-oknd=\"$2\" data-oid=\"$1\" {0}>";
            substitution = String.Format(substitution, style != null ? "style=\"" + style + "\"" : "");

            Regex regex = new Regex(@"_STARTTAG(.+?)STARTTAGT(\d)T_", RegexOptions.Singleline);
            string replace = regex.Replace(input, substitution);

            regex = new Regex(@"_ENDTAG_", RegexOptions.Singleline);
            replace = regex.Replace(replace, "</span>");

            replace = replace.Replace("data-oid=\"0\"", "");

            return replace;
        }

        static string GetTextFormatter2(string text, string id, FormattinKind kind, out int lengthSuffix, out int lengthPrefix)
        {
            var sb = new StringBuilder(@"_STARTTAG");
            sb.Append(id ?? "0");
            sb.Append(@"STARTTAGT").Append((int)kind).Append("T_");
            lengthPrefix = sb.Length;

            sb.Append(text);
            sb.Append("_ENDTAG_");

            lengthSuffix = 8;

            return sb.ToString();
        }
    }

    public enum ClientType
    {
        Javascript,
        DNET
    }
}
