using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Xml.Linq;
using www.SaGateway;

namespace www.Models
{
    /// <summary>
    /// Информация о пользовательских раскладках
    /// </summary>
    public class UserSNMeta
    {
        public UserSNMeta()
        {
            Tabs = new List<SemNetUser>();
        }

        public List<SemNetUser> Tabs { get; set; }
    }

    /// <summary>
    /// Данные по пользовательской раскладке
    /// </summary>
    public class SemNetUser
    {
        public int id { get; set; }
        public string html { get; set; }
        public string title { get; set; }
        public int snid { get; set; }
    }

    /// <summary>
    /// Данные по автоматической раскладке
    /// </summary>
    public class SemNet : SemNetUser
    {
        public int width { get; set; }
        public int height { get; set; }
        public int level { get; set; }
        public int astree { get; set; }
        public int[] filter { get; set; }
        public string filterName { get; set; }
        public string filterValue { get; set; }
        public int[] eparam { get; set; }
    }

    public class SemNetRelation
    {
        private XElement connectionFormat;

        public SemNetRelation(XElement path, XElement connectionFormat, IEnumerable<XElement> border)
        {
            this.connectionFormat = connectionFormat;

            FromElementID = Convert.ToInt32(path.Attributes("FromElementID").First().Value);
            ToElementID = Convert.ToInt32(path.Attributes("ToElementID").First().Value);

            //Id =
            //    xElement1.Attributes("ID_Rel").First() != null
            //        ? Convert.ToInt32(xElement1.Attributes("ID_Rel").First().Value)
            //        : 0,
            //ID_RelType = Convert.ToInt32(xElement1.Attributes("ID_RelType").First().Value),
            //ID_Obj = Convert.ToInt32(xElement1.Attributes("ID_Obj").First().Value),
            //ID_Obj2 = Convert.ToInt32(xElement1.Attributes("ID_Obj2").First().Value),
            //FromRoleId = Convert.ToInt32(xElement1.Attributes("FromRoleId").First().Value),
            //ToRoleId = Convert.ToInt32(xElement1.Attributes("ToRoleId").First().Value),
            ConnectionStyle =
                Convert.ToInt32(connectionFormat.Attributes("ConnectionStyle").First().Value);
            Color = connectionFormat.Attributes("Color").FirstOrDefault() != null
                ? connectionFormat.Attributes("Color").First().Value
                : ColorTranslator.ToHtml(System.Drawing.Color.Black);
            BorderVisible = border.Attributes("BorderVisible").FirstOrDefault() != null && Convert.ToBoolean(
                border.Attributes("BorderVisible").First().Value);
            BorderStyle = connectionFormat.Elements("Border").Attributes("BorderStyle").First().Value;
            BorderColor =
                ColorTranslator.ToHtml(ColorTranslator.FromWin32(
                    Convert.ToInt32(
                        border.Attributes("BorderColor").First().Value)));
            BorderWidth =
                Convert.ToInt32(
                    border.Attributes("BorderWidth").First().Value);
        }

        public string CalcPath()
        {
            //return null;
            string res = null;
            var points = connectionFormat.Element("Points");
            if (points != null)
            {
                var pointOne = points.Elements().FirstOrDefault();
                if (pointOne != null)
                {
                    res = points.Elements()
                        .Skip(1)
                        .Aggregate(new StringBuilder("M" + pointOne.Attribute("X").Value + "," + pointOne.Attribute("Y").Value),
                            (current, next) =>
                                current.Append("L").Append(next.Attribute("X").Value).Append(",").Append(next.Attribute("Y").Value)
                        ).ToString();
                }
            }

            return res;
        }

        public int FromElementID { get; set; }
        public int ToElementID { get; set; }
        public int Id { get; set; }
        public int ID_RelType { get; set; }
        public int ID_Obj { get; set; }
        public int ID_Obj2 { get; set; }
        public int FromRoleId { get; set; }
        public int ToRoleId { get; set; }
        public int ConnectionStyle { get; set; }
        public string Color { get; set; }
        public bool BorderVisible { get; set; }
        public string BorderStyle { get; set; }
        public string BorderColor { get; set; }
        public int BorderWidth { get; set; }
    }

    public class SemNetElement
    {
        public SemNetElement(XElement el, ImageInfo link)
        {
            string txt = el.Attributes("Text").First() != null
                           ? el.Attributes("Text").First().Value
                           : "";
            string fontName =
                el.Elements("ShapeFormat").Elements(
                    "Font").Attributes(
                        "FontName").First() != null
                    ? el.Elements("ShapeFormat").
                          Elements("Font").
                          Attributes("FontName").First()
                          .Value
                    : "";
            int fontSize = el.Elements("ShapeFormat").Elements(
                    "Font").Attributes(
                        "FontSize").First() != null
                    ? Convert.ToInt32(
                        el.Elements("ShapeFormat").
                            Elements("Font").
                            Attributes("FontSize").First
                            ().Value)
                    : 0;

            //fontSizeInPixels = FontSizeToPixel(fontName, fontSize);

            int shapeWidth = el.Elements("ShapeFormat").Attributes(
                "ShapeWidth").
                First() != null
                ? Convert.ToInt32(
                    el.Elements("ShapeFormat").
                        Attributes(
                            "ShapeWidth").First().
                        Value)
                : 0;

            Color color = ColorTranslator.FromWin32(
                        Convert.ToInt32(
                            el.Elements("ShapeFormat").
                                Attributes("ShapeColor")
                                .First().Value));

            if (color == Color.Black) color = Color.White;
            string shapeColor = ColorTranslator.ToHtml(color);

            var wt = new WrappedText(txt, shapeWidth, fontName, fontSize, WrappedText.Mode.ByPixel);
            wt.SetXTSpanValue((float)shapeWidth / 2);
            wt.DoWrap();


            Id =
                Convert.ToInt32(
                    el.Attributes("ElementId").First().Value);
            Text = txt;
            FullText =
                el.Attributes("FullText").FirstOrDefault() !=
                null
                    ? el.Attributes("FullText").First().Value
                    : "";
            ObjectId =
                el.Elements("Object").FirstOrDefault() !=
                null
                    ? Convert.ToInt32(el.Elements("Object").Attributes("ID_Obj").First().Value)
                    : 0;
            ObjectType =
                el.Elements("Object").FirstOrDefault() != null
                    ? el.Elements("Object").Attributes("ID_ObjType").First() != null
                        ? Convert.ToInt32(el.Elements("Object").Attributes("ID_ObjType").First().Value)
                        : 0
                    : 0;
            ShapeColor = shapeColor;
            ShapeLeft =
                el.Elements("ShapeFormat").Attributes(
                    "ShapeLeft").
                    First() != null
                    ? Convert.ToInt32(
                        el.Elements("ShapeFormat").
                            Attributes(
                                "ShapeLeft").First().
                            Value)
                    : 0;
            ShapeTop =
                el.Elements("ShapeFormat").Attributes(
                    "ShapeTop").First
                    () != null
                    ? Convert.ToInt32(
                        el.Elements("ShapeFormat").
                            Attributes(
                                "ShapeTop").First().
                            Value)
                    : 0;
            ShapeWidth = shapeWidth;
            ShapeHeight =
                el.Elements("ShapeFormat").Attributes(
                    "ShapeHeight").
                    First() != null
                    ? Convert.ToInt32(
                        el.Elements("ShapeFormat").
                            Attributes(
                                "ShapeHeight").First().
                            Value)
                    : 0;
            FontName = fontName;
            FontSize = fontSize;
            FontColor =
                el.Elements("ShapeFormat").Elements(
                    "Font").Attributes(
                        "FontColor").FirstOrDefault() != null
                    ? ColorTranslator.ToHtml(
                        ColorTranslator.FromWin32(
                            Convert.ToInt32(
                                el.Elements("ShapeFormat").Elements("Font").Attributes("FontColor").First().Value)))
                    : "#666";
            FontStyle =
                el.Elements("ShapeFormat").Elements(
                    "Font").Attributes(
                        "FontStyle").FirstOrDefault() != null
                    ? Convert.ToInt32(
                        el.Elements("ShapeFormat").
                            Elements("Font").
                            Attributes("FontStyle").
                            First().Value)
                    : 0;
            BorderVisible = el.Elements("ShapeFormat").Elements(
                "Border").Attributes("BorderVisible").FirstOrDefault() != null && Convert.ToBoolean(
                    el.Elements("ShapeFormat").Elements(
                        "Border").
                        Attributes("BorderVisible").
                        First().Value);
            BorderStyle =
                el.Elements("ShapeFormat").Elements(
                    "Border").
                    Attributes("BorderStyle").First().Value;
            BorderColor =
                ColorTranslator.ToHtml(
                    ColorTranslator.FromWin32(
                        Convert.ToInt32(
                            el.Elements("ShapeFormat").
                                Elements(
                                    "Border").Attributes
                                ("BorderColor").
                                First().Value)));
            BorderWidth =
                Convert.ToInt32(
                    el.Elements("ShapeFormat").Elements(
                        "Border").
                        Attributes("BorderWidth").First()
                        .Value);

            GradientVisible = false;
            if (el.Elements("ShapeFormat").Elements("Gradient").FirstOrDefault() != null)
            {
                GradientVisible = Convert.ToBoolean(
                    el.Elements("ShapeFormat").Elements("Gradient").Attributes("GradientVisible").First().Value
                );
                GradientColorStart = Convert.ToInt32(
                    el.Elements("ShapeFormat").Elements("Gradient").Attributes("GradientColorStart").First().Value
                );
                GradientColorMiddle = 0;
                GradientColorEnd = Convert.ToInt32(
                    el.Elements("ShapeFormat").Elements("Gradient").Attributes("GradientColorEnd").First().Value
                );
            }
            GradientStyle = "";
            ShadowColor = 0;
            ShadowHorizontalSize = 0;
            ShadowVerticalSize = 0;
            Image = link;
            WrapText = wt;
        }

        public int Id { get; set; }
        public string Text { get; set; }
        public int ObjectId { get; set; }
        public string FullText { get; set; }
        public int ObjectType { get; set; }
        public int ShapeLeft { get; set; }
        public int ShapeTop { get; set; }
        public int ShapeWidth { get; set; }
        public int ShapeHeight { get; set; }
        public string FontName { get; set; }
        public int FontSize { get; set; }
        public string FontColor { get; set; }
        public int FontStyle { get; set; }
        public bool GradientVisible { get; set; }
        public int GradientColorStart { get; set; }
        public int GradientColorMiddle { get; set; }
        public int GradientColorEnd { get; set; }
        public string GradientStyle { get; set; }
        public int ShadowColor { get; set; }
        public int ShadowHorizontalSize { get; set; }
        public int ShadowVerticalSize { get; set; }

        public bool BorderVisible { get; set; }
        public string BorderStyle { get; set; }
        public string BorderColor { get; set; }
        public int BorderWidth { get; set; }

        public ImageInfo Image
        {
            get;
            set;
        }

        public string ShapeColor
        {
            get;
            set;
        }

        public WrappedText WrapText { get; set; }
    }
}