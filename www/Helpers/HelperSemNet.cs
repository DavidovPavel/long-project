using System;
using System.Collections.Generic;
using System.Configuration;
using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Web.Hosting;
using System.Web;
using System.Xml.Linq;
using ANBR.DiagramLayouter.Contracts;
using ANBR.Helpful.Misc.Serializer;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using Model.Utils;
using www.Controllers;
using www.Models;
using www.SaGateway;

namespace www.Helpers
{
    public static class HelperSemNet
    {
        public static string GetSNInternal(int id, int semnetid, IDataBase saDB, string currentDatabaseID, int layout, int level, SnStruct asTree, out int width, out int height, SnFilter filter, SnExtendedProperties ep)
        {
            width = 0;
            height = 0;
            XDocument xDoc;
            Dictionary<string, SemNetElement> semNetElements = null;
            var linkToEl = new Dictionary<int, string>();
            var linkFromEl = new Dictionary<int, string>();
            var info = saDB.ObjectModel.GetObjectInfo(id);
            string mainObjectUID = info.Object.Uid.ToString();

            //здесь у нас хранится информация о размерах загруженных картинок
            var snCache = new Dictionary<int, string>();
            string currentSNCachePath = string.Format(@"{0}{1}/{2}", Root.GetFolder_SemanticNet(), currentDatabaseID, mainObjectUID);
            currentSNCachePath = HostingEnvironment.MapPath(currentSNCachePath);
            string currentSNCacheFile = Path.Combine(currentSNCachePath, "data.statistics_v001");

            //общий шаблон документа
            string svg;
            string xml;
            if (semnetid <= 0)
            {
                svg = @"<svg id=""svgSN"" width=""100%"" height=""100%"" xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>
    <g id=""graph0"" transform=""translate(-93,0)"">        
        {0}
    </g>
</svg>
";
                xml = GenerateAutomateLayout(id, saDB, level, asTree, ref filter, ep, ref snCache, currentSNCachePath, currentSNCacheFile);
            }
            else
            {
                svg = @"<svg id=""svgSN"" width=""100%"" height=""100%"" xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>
    <g id=""graph0"">        
        {0}
    </g>
</svg>
";
                xml = saDB.ObjectService.GetSemanticReportXmlData(semnetid);
            }

            xDoc = XDocument.Parse(xml);

            int maxX = 0;
            int maxY = 0;

            var sb = new StringBuilder();
            var dotsb = new StringBuilder();
            var dd = new DiagramData();

            if (xDoc.Root != null)
            {
                var elements = xDoc.Root.Elements("Elements").Elements("Element");
                var paths = xDoc.Root.Elements("ElementRelations").Elements("ElementRelation");
                var r = from el in paths
                        let element = el.Element("ConnectionFormat")
                        where element != null
                        let border = element.Elements("Border")
                        where border != null
                        select new SemNetRelation(el, element, border);

                IEqualityComparer<XElement> snElementComparer = Equality<XElement>.CreateComparer(
                    item => Convert.ToInt32(item.Attributes("ElementId").First().Value)
                );

                semNetElements = elements.Distinct(snElementComparer).Select(el =>
                {
                    ImageInfo link = null;
                    try
                    {
                        link = SaveImage(el, currentDatabaseID, mainObjectUID, snCache);
                    }
                    catch
                    {
                    }

                    return new SemNetElement(el, link);

                }).ToDictionary(item => item.Id.ToString());



                //шаблон связи
                const string path = @"
<g id=""{5}"" data-fromid=""{0}"" data-toid=""{4}"" class=""edge"" style=""fill: none; stroke: {3};"">
    <title>{1}</title>
    <path fill=""none"" stroke=""black"" stroke-width=""0.6"" stroke-dasharray=""3,3"" d=""{2}"" />
</g>";
                foreach (var rel in r)
                {
                    SemNetElement fromEl, toEl;
                    try
                    {
                        fromEl = semNetElements[rel.FromElementID.ToString()];
                        toEl = semNetElements[rel.ToElementID.ToString()];

                    }
                    catch (KeyNotFoundException)
                    {
                        continue;
                    }

                    string refEdge = "#edge" + fromEl.Id + "_" + toEl.Id;
                    string refTo = refEdge;
                    if (linkToEl.ContainsKey(toEl.Id))
                        refTo = refTo + "," + linkToEl[toEl.Id];
                    linkToEl[toEl.Id] = refTo;

                    string refFrom = refEdge;
                    if (linkFromEl.ContainsKey(fromEl.Id))
                        refFrom = refFrom + "," + linkFromEl[fromEl.Id];
                    linkFromEl[fromEl.Id] = refFrom;

                    string pathD = rel.CalcPath();
                    if (String.IsNullOrWhiteSpace(pathD))
                        pathD = String.Format("M{0},{1}L{2},{3}",
                            fromEl.ShapeLeft + fromEl.ShapeWidth / 2,
                            fromEl.ShapeTop + fromEl.ShapeHeight / 2,
                            toEl.ShapeLeft + toEl.ShapeWidth / 2,
                            toEl.ShapeTop + toEl.ShapeHeight / 2);

                    sb.AppendFormat(path,
                        fromEl.Id,
                        string.Format("{0}&#45;&gt;{1}", System.Web.HttpUtility.HtmlEncode(fromEl.Text), System.Web.HttpUtility.HtmlEncode(toEl.Text)),
                        pathD,  //2
                        rel.BorderColor == "#000000" ? "#ccc" : rel.BorderColor, //3
                        toEl.Id, //4
                        "edge" + fromEl.Id + "_" + toEl.Id //5
                    );
                }


                const string node = @"
<g id=""el{0}"" class=""node"" data-edgesTo=""{20}"" data-edgesFrom=""{21}""  data-objectid=""{11}"" data-text=""{7}""  width=""{4}"" height=""{5}"" x=""{2}"" y=""{3}"" transform=""translate({2},{3})"">
    {15}
    {27}
      <clipPath id=""clip{0}"">
        <rect x=""-1"" y=""-1"" width=""{16}"" height=""{17}""/>
      </clipPath>
    <title>{7}</title>
    <rect y=""{25}"" width=""{4}"" height=""{24}"" rx=""5"" ry=""5"" fill='{14}' stroke='{13}' stroke-width=""1""/>
      <switch>
        <foreignObject x=""0"" y=""{26}"" width=""{4}"" height=""{24}"" style=""overflow: hidden;text-overflow: ellipsis;line-height: {9}pt;text-align: center;font:{8} {9}pt {10}"" >
          <span xmlns=""http://www.w3.org/1999/xhtml"" style=""{23}vertical-align: middle;overflow:hidden;text-overflow: ellipsis;color:{12};height:{24}px;width:{4}px"" title=""{18}"">{18}</span>
        </foreignObject>
        <text clip-path=""url(#clip{0})"" width=""{4}"" id='{11}' style=""font:{8} {9}pt {10};color:{12};text-anchor: middle"" fill='black' x=""{22}"" y=""{26}"">{1}</text>    
      </switch>
</g>";

                const string gradientDataTemplate = @"
  <defs>
    <linearGradient id=""grad{0}"" x1=""0%"" y1=""100%"" x2=""0%"" y2=""0%"">
      <stop offset=""0%"" style=""stop-color:{1};stop-opacity:1"" />
      <stop offset=""100%"" style=""stop-color:{2};stop-opacity:1"" />
    </linearGradient>
  </defs>
";

                /*
                                if (layout > 0)
                                    node = @"
                <g id=""el{0}"" class=""node"" data-edgesTo=""{20}"" data-edgesFrom=""{21}""  data-objectid=""{11}"" data-text=""{7}""  width=""{4}"" height=""{5}"" x=""{2}"" y=""{3}"" transform=""translate({2},{3})"">
                      <clipPath id=""clip{0}"">
                        <rect x=""-1"" y=""-1"" width=""{16}"" height=""{17}""/>
                      </clipPath>
                    <title>{7}</title>
                    <rect width=""{4}"" height=""{5}"" rx=""5"" ry=""5"" fill='{14}' stroke='{13}' stroke-width=""1""/>
                      <switch>
                        <foreignObject x=""0"" y=""0"" width=""{4}"" height=""{5}"" style=""text-align: center;font:{8} {9}pt {10}"" >
                          <span xmlns=""http://www.w3.org/1999/xhtml"" style=""{23}vertical-align: middle;overflow:hidden;color:{12};height:{5}px;width:{4}px"" title=""{18}"">{18}</span>
                        </foreignObject>
                        <text clip-path=""url(#clip{0})"" width=""{4}"" id='{11}' style=""font:{8} {9}pt {10};color:{12};text-anchor: middle"" fill='black' x=""{22}"" y=""1"">{1}</text>    
                      </switch>
                    {15}
                </g>";
                 */
                foreach (KeyValuePair<string, SemNetElement> pair in semNetElements)
                {
                    SemNetElement el = pair.Value;

                    string edgesTo = "";
                    linkToEl.TryGetValue(el.Id, out edgesTo);

                    string edgesFrom = "";
                    linkFromEl.TryGetValue(el.Id, out edgesFrom);

                    if ((Math.Abs(el.ShapeLeft) + el.ShapeWidth) > maxX) maxX = Math.Abs(el.ShapeLeft) + el.ShapeWidth;
                    if ((Math.Abs(el.ShapeTop) + el.ShapeHeight) > maxY) maxY = Math.Abs(el.ShapeTop) + el.ShapeHeight;
                    int dy = el.ShapeTop + el.ShapeHeight / 2 + el.FontSize / 2;
                    //string txtWrap = GetText(el, out dy);


                    string gradientData = "";
                    if (el.GradientVisible)
                    {
                        Color colorStart = ColorTranslator.FromWin32(el.GradientColorStart);
                        Color colorEnd = ColorTranslator.FromWin32(el.GradientColorEnd);

                        gradientData = String.Format(gradientDataTemplate, el.Id, ColorTranslator.ToHtml(colorStart),
                            ColorTranslator.ToHtml(colorEnd));
                    }

                    if (layout == 0)
                        sb.AppendFormat(node,
                            el.Id,
                            el.WrapText.TextFormatted,
                            el.ShapeLeft,
                            el.ShapeTop,
                            el.ShapeWidth + 4,
                            el.ShapeHeight,
                            dy, //6
                            HttpUtility.HtmlEncode(el.Text == "..." ? el.FullText : el.Text),
                            el.FontStyle == 0 ? "normal" : "bold",
                            el.FontSize, //9
                            el.FontName,
                            el.ObjectId,
                            el.FontColor,
                            el.BorderColor,
                            el.GradientVisible ? String.Format("url(#grad{0})", el.Id) :
                                (el.ShapeColor == "#000000" ? "#fff" : el.ShapeColor),
                            string.IsNullOrWhiteSpace(el.Image.FilePath) //15
                                ? ""
                                : string.Format(
                                    @"<image x=""{0}"" y=""{1}"" width=""{2}"" height=""{3}"" xlink:href=""{4}"" />",
                                    ((float)el.ShapeWidth / 2 - (float)el.Image.Width / 2).ToString(CultureInfo.InvariantCulture),
                                    0.ToString(CultureInfo.InvariantCulture), /*(el.WrapText.Size.Height + (el.ShapeHeight - el.Image.Height - el.WrapText.Size.Height) / 2).ToString(CultureInfo.InvariantCulture),*/
                                    el.Image.Width,
                                    el.Image.Height,
                                    el.Image.FilePath),
                            el.ShapeWidth + 4 + 2,  //clip area 16
                            el.ShapeHeight + 2,  //clip area 17
                            HttpUtility.HtmlEncode(el.Text),  //18 исходный, не разбитый на строки текст 
                            el.FontSize + 2, //19 сдвиг текста по оси Y (чтобы он вошел в фигуру) (базовая линия)
                            edgesTo, //20 data-edgesTo
                            edgesFrom, //21 data-edgesFrom
                            el.ShapeWidth / 2, // 22
                            String.IsNullOrWhiteSpace(el.Image.FilePath) ? "display: table-cell;" : "", //23
                            ((string.IsNullOrWhiteSpace(el.Image.FilePath) ? el.ShapeHeight - 4 : Math.Abs(el.ShapeHeight - el.Image.Height - 5))).ToString(CultureInfo.InvariantCulture), //24 высота текстовой метки фигуры
                            ((string.IsNullOrWhiteSpace(el.Image.FilePath) ? 0 : (el.Image.Height + 5))).ToString(CultureInfo.InvariantCulture), //25 сдвиг текста, если есть картинка
                            ((string.IsNullOrWhiteSpace(el.Image.FilePath) ? 0 : (el.Image.Height + 9))).ToString(CultureInfo.InvariantCulture), //26 сдвиг текста с учетом высоты рамки обводки
                            gradientData //27 градиент
                        );
                    /*
                                        if (layout > 0)
                                            sb.AppendFormat(node,
                                                            el.Id,
                                                            el.WrapText.TextFormatted,
                                                            el.ShapeLeft,
                                                            el.ShapeTop,
                                                            el.ShapeWidth + 4,
                                                            el.ShapeHeight,
                                                            dy, //6
                                                            HttpUtility.HtmlEncode(el.Text == "..." ? el.FullText : el.Text),
                                                            el.FontStyle == 0 ? "normal" : "bold",
                                                            el.FontSize, //9
                                                            el.FontName,
                                                            el.ObjectId,
                                                            el.FontColor,
                                                            el.BorderColor,
                                                            el.ShapeColor == "#000000" ? "#fff" : el.ShapeColor,
                                                            string.IsNullOrWhiteSpace(el.Image.FilePath) //15
                                                                ? ""
                                                                : string.Format(
                                                                    @"<image x=""{0}"" y=""{1}"" width=""{2}"" height=""{3}"" xlink:href=""{4}"" />",
                                                                    ((float)el.ShapeWidth / 2 - (float)el.Image.Width / 2).ToString(CultureInfo.InvariantCulture),
                                                                    (el.WrapText.Size.Height + (el.ShapeHeight - el.Image.Height - el.WrapText.Size.Height) / 2).ToString(CultureInfo.InvariantCulture),
                                                                    el.Image.Width,
                                                                    el.Image.Height,
                                                                    el.Image.FilePath),
                                                           el.ShapeWidth + 4 + 2,  //clip area 16
                                                           el.ShapeHeight + 2,  //clip area 17
                                                           HttpUtility.HtmlEncode(el.Text),  //18 исходный, не разбитый на строки текст 
                                                           el.FontSize + 2, //19 сдвиг текста по оси Y (чтобы он вошел в фигуру) (базовая линия)
                                                           edgesTo, //20 data-edgesTo
                                                           edgesFrom, //21 data-edgesFrom
                                                           el.ShapeWidth / 2, // 22
                                                           String.IsNullOrWhiteSpace(el.Image.FilePath) ? "display: table-cell;" : ""
                                                                    );
                    */
                }

                dotsb.AppendLine("graph graph0 {");
                dotsb.AppendLine(@"
    fontsize=8; 
    fontname=""Arial"";
    splines=true; 
    sep=1;
    overlap=false;
");
                if (layout >= 1) layout++;

                if (layout == 1 || layout == 2) //dot (c
                {
                    dotsb.AppendLine(@"
    rankdir=LR;

");

                }

                dotsb.AppendLine(@"{ 
    node [shape=rect,fontname=""Arial"",fontsize=8,margin=0,penwidth=0.5,fillcolor=none];
");



                foreach (KeyValuePair<string, SemNetElement> pair in semNetElements)
                {
                    SemNetElement elItem = pair.Value;
                    dd.Nodes.AddNode(elItem.Id, elItem.ShapeWidth, elItem.ShapeHeight);
                }

                foreach (var relItem in r)
                {
                    SemNetElement fromEl, toEl;
                    try
                    {
                        fromEl = semNetElements[relItem.FromElementID.ToString()];
                        toEl = semNetElements[relItem.ToElementID.ToString()];
                        var Id = Guid.NewGuid();

                        dd.Edges.AddEdge(Id, fromEl.Id, toEl.Id);

                    }
                    catch (KeyNotFoundException)
                    {
                        continue;
                    }
                }


                foreach (KeyValuePair<string, SemNetElement> pair in semNetElements)
                {
                    SemNetElement elItem = pair.Value;

                    if (layout == 1) //dot
                    {
                        //dotsb.AppendFormat("    {0} [pin=true,fixedsize=true,label=\"{1}\",id=\"el{0}#?#{7}#?#{2}\",width={3},height={4},pos=\"{5},{6}\"];\n", elItem.Id, text, elItem.ObjectId, newShapeWidth.ToString("0.000", new CultureInfo("en-US")), newShapeHeight.ToString("0.000", new CultureInfo("en-US")), elItem.ShapeLeft + (int)(wt.Size.Width / 2), -elItem.ShapeTop - (int)(wt.Size.Height / 2), HttpUtility.HtmlEncode(elItem.Text)/*7*/);
                    }
                    else
                    {

                        float newShapeWidth = (elItem.WrapText.Size.Width + 6/*margin*/) / 72;
                        float newShapeHeight = (elItem.WrapText.Size.Height + elItem.Image.Height + 5 /*margin*/) / 72;
                        dotsb.AppendFormat("    {0} [fixedsize=true,id=\"el{0}\",width={1},height={2}];\n", elItem.Id, newShapeWidth.ToString("0.000", CultureInfo.InvariantCulture), newShapeHeight.ToString("0.000", CultureInfo.InvariantCulture));
                    }

                }
                dotsb.AppendLine("}");
                dotsb.AppendLine("edge [penwidth=0.2];");
                foreach (var relItem in r)
                {
                    SemNetElement fromEl, toEl;
                    try
                    {
                        fromEl = semNetElements[relItem.FromElementID.ToString()];
                        toEl = semNetElements[relItem.ToElementID.ToString()];

                    }
                    catch (KeyNotFoundException)
                    {
                        continue;
                    }

                    dotsb.AppendFormat("{0} -- {1} [id=\"{2}\",dir=\"none\"];\n", relItem.FromElementID, relItem.ToElementID, "edge" + fromEl.Id + "_" + toEl.Id);
                }
                dotsb.AppendLine("}");
            }


#warning Проблема конкурентной работы!
            snCache.Serialize(currentSNCacheFile);

            string svgText;
            if (layout > 0)
                svgText = Root.Layout(dotsb.ToString(), layout, mainObjectUID, currentSNCachePath, semNetElements,
                    linkToEl, linkFromEl, out maxX, out maxY);
            else
            {
                svgText = string.Format(svg, sb);
                maxX = maxX + 3 - 93;
                maxY = maxY + 3;
            }

            svgText = svgText +
                      @"
";

            width = maxX;
            height = maxY;

#if (DEBUG)
            //File.WriteAllText(@"C:\Temp\svg01.dot", dotsb.ToString());
            //xDoc.Save(@"C:\Temp\Temp\svg01.xml");
            //File.WriteAllText(@"C:\Temp\Temp\svg01.html", String.Format("<html><body>{0}</body></html>", svgText));
#endif

            return svgText;

        }

        private static string GenerateAutomateLayout(int id, IDataBase saDB, int level, SnStruct asTree, ref SnFilter filter, SnExtendedProperties ep, ref Dictionary<int, string> snCache, string currentSNCachePath, string currentSNCacheFile)
        {
#warning Проблема конкурентной работы!

            Directory.CreateDirectory(currentSNCachePath);

            if (File.Exists(currentSNCacheFile))
                snCache = ANBR.Helpful.Misc.Serializer.Helper.Deserialize<Dictionary<int, string>>(currentSNCacheFile);


            var f2 = saDB.SemanticNet.BeginPrepareForObjectByFilterSync(id, level, asTree, filter, ep);

            return f2.Xml;
        }

        private static ImageInfo SaveImage(XElement el, string DBID, string mainObjectUID, Dictionary<int, string> snCacheFile)
        {
            string link = string.Empty;
            int width = 0;
            int height = 0;

            var xElement = el.Element("Object");
            if (xElement != null)
            {
                var xAttribute = el.Attribute("Image");
                if (xAttribute != null)
                {
                    var objIDAttr = xElement.Attribute("ID_Obj");
                    if (objIDAttr != null)
                    {
                        int objID = Convert.ToInt32(objIDAttr.Value);
                        link = string.Format(@"{0}{1}/{2}/{3}.jpg", Root.GetFolder_SemanticNet(), DBID, mainObjectUID, objID);
                        string path = HostingEnvironment.MapPath(link);

                        var objImage_base64 = xAttribute.Value;
                        if (!string.IsNullOrWhiteSpace(objImage_base64))
                        {
                            string imgData;
                            bool isNew = true;
                            if (snCacheFile.TryGetValue(objID, out imgData))
                            {
                                var parts = imgData.Split(new char[] { '$' });
                                int size = Convert.ToInt32(parts[0]);
                                width = Convert.ToInt32(parts[1]);
                                height = Convert.ToInt32(parts[2]);
                                isNew = objImage_base64.Length != size;
                            }

                            if (isNew)
                            {
                                if (File.Exists(path))
                                    File.Delete(path);

                                try
                                {
                                    byte[] bd = Convert.FromBase64String(objImage_base64);
                                    using (Bitmap bmp = HelperImage.LimitHeight(64, bd))
                                    {
                                        bmp.Save(path, ImageFormat.Jpeg);
                                        snCacheFile[objID] = String.Format("{0}${1}${2}", objImage_base64.Length, bmp.Width, bmp.Height);
                                        height = bmp.Height;
                                        width = bmp.Width;
                                    }
                                }
                                catch
                                {
                                    snCacheFile.Remove(objID);
                                }
                            }
                        }
                    }
                }
            }
            return new ImageInfo { FilePath = link, Height = height, Width = width };
        }

        /*
                [NonAction]
                private string GetText(SemNetElement el, out int dy)
                {
                    string output;
                    dy = el.ShapeTop + el.ShapeHeight / 2 + el.FontSize / 2;
                    const string tmpl = @"<tspan dy='{2}' x='{3}' fill='black'>{0}</tspan>";
                    int height = el.ShapeHeight;
                    int lineHeight = el.FontSize + 4;
                    string txt = HttpUtility.HtmlEncode(el.Text);
                    int countLine = height / lineHeight;
                    if (countLine > 1)
                    {
                        dy = el.ShapeTop + el.ShapeHeight / 2 + el.FontSize / 2 - lineHeight / 2;
                        string[] spltxt = txt.Split(new[] { " " }, StringSplitOptions.RemoveEmptyEntries);
                        var line1 = spltxt.Take(spltxt.Count() / 2);
                        output = string.Concat(
                            string.Join(" ", line1),
                            string.Format(tmpl,
                                          string.Join(" ", spltxt.Skip(spltxt.Count() / 2)),
                                          lineHeight, el.FontSize, el.ShapeWidth / 2));
                    }
                    else
                    {
                        output = txt;
                    }

                    return output;
                }
        */

        private static int FontSizeToPixel(string fontName, int points)
        {
            var pixels = (double)points * 96 / 72;
            return (int)Math.Ceiling(pixels);
        }

        public static void CalcConfigurationParams(IDataBase saDB, ref int? layout, ref int? level, ref SnStruct? snStruct, ref SnExtendedProperties ep, ref SnFilter filter, ref int[] eparam)
        {
            layout = layout ?? 0;
            level = level ?? 2;
            snStruct = snStruct ?? SnStruct.StrategicNet;

            eparam = new[] { 0, 0, 0 };
            ep = ep ?? new SnExtendedProperties
            {
                FactNameFormat = FactNameFormat.FullName,
                ShowLegend = eparam[1] == 1,
                StrategTypeGroupLevel = eparam[2] == 1
            };

            if (filter == null)
            {
                string[] defaultExcludedTypesNames = { "Sfera_deyatelnosti", "ServiceItem", "InfoDB", "Отрасль" };
                var defaultExcludedTypesIds = defaultExcludedTypesNames.Select(item =>
                {
                    var mType = saDB.MetaModel.MetaTypes.GetByName(item);
                    return mType.ID;
                }).ToArray();

                filter = new SnFilter { ExcludeObjectTypes = defaultExcludedTypesIds };
            }
        }

        public static string HtmlEncode1(string s)
        {
            if (s == null)
                return null;

            var result = new StringBuilder(s.Length);
            foreach (char ch in s)
            {
                if (ch <= '>')
                {
                    switch (ch)
                    {
                        case '<':
                        case '>':
                            result.Append(" ");
                            break;

                        case '"':
                            result.Append(" ");
                            break;

                        case '\'':
                            result.Append(" ");
                            break;

                        case '&':
                            result.Append(" ");
                            break;

                        default:
                            result.Append(ch);
                            break;
                    }
                }
                else
                    if (ch >= 160 && ch < 256)
                    result.Append("&#").Append(((int)ch).ToString(CultureInfo.InvariantCulture)).Append(';');
                else
                    result.Append(ch);
            }

            return result.ToString();
        }

        /// <summary>
        /// Генерирует изображение сем. сети с настройками по умолчанию
        /// </summary>
        /// <param name="mainObjectID"></param>
        /// <param name="layoutID"></param>
        /// <param name="databaseID"></param>
        /// <param name="externalDB"></param>
        /// <returns>Абсолютный путь (png картинка)</returns>
        public static string GetImageSemNet(int mainObjectID, int? layoutID, string databaseID, IDataBase externalDB)
        {
            int? layout = null;
            int? level = null;
            SnStruct? snStruct = null;
            SnExtendedProperties ep = null;
            SnFilter filter = null;
            int[] eparam = null;

            CalcConfigurationParams(externalDB, ref layout, ref level, ref snStruct, ref ep, ref filter, ref eparam);

            int width;
            int height;
            // ReSharper disable PossibleInvalidOperationException
            string svgText = GetSNInternal(mainObjectID, 0, externalDB, databaseID, layout.Value, level.Value, snStruct.Value, out width, out height, filter, ep);

            svgText = svgText.Replace(@"<svg id=""svgSN"" width=""100%"" height=""100%""", String.Format(@"<svg id=""svgSN"" width=""{0}px"" height=""{1}px""", width, height));

            var baseUrl = new Uri(@"http:\\" + ConfigurationManager.AppSettings["SiteHost"], UriKind.Absolute);

            string pathImage = SvgController.GenerateImageFile(baseUrl, svgText);

            /*
            var settings = new WpfDrawingSettings { TextAsGeometry = true };
            var converter = new StreamSvgConverter(settings);

            string pathImage = HostingEnvironment.MapPath(Root.GetFolder_Temp() + Path.GetRandomFileName() + ".png");
            using (var reader = XmlReader.Create(new System.IO.StringReader(svgText)))
            {
                using (MemoryStream ms = new MemoryStream())
                using (FileStream file = new FileStream(pathImage, FileMode.Create, System.IO.FileAccess.Write))
                {
                    if (converter.Convert(reader, ms))
                    {
                        var bytes = ms.ToArray();
                        file.Write(bytes, 0, bytes.Length);
                    }
                }
            }
            */

            return pathImage;
        }
    }
}