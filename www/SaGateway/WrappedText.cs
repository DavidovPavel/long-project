using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Web;

namespace www.SaGateway
{
    public class WrappedText
    {
        public enum Mode
        {
            ByCharacter,
            ByPixel
        }

        private int _fontSize;
        private string _fontName;
        private string _textInner;
        private int _minLenthString;
        private Mode _mode;
        private float _heightContraint;
        private string _textFormatted;
        private SizeF _size;
        private string _text;
        public string Text { get { return _text; } }
        public SizeF Size { get { return _size; } }
        public string TextFormatted { get { return _textFormatted; } }

        List<string> _innerLines = new List<string>();
        private float _xtspanValue = 2;

        public List<string> GetLines()
        {
            return _innerLines;
        }

        private void FormatText()
        {
            StringBuilder builder = new StringBuilder();
            int dy = _fontSize + 2;
            const string tmpl = @"<tspan dy='{0}' x='{2}' fill='black'>{1}</tspan>";

            foreach (var line in _innerLines)
                builder.AppendFormat(tmpl, dy, HttpUtility.HtmlEncode(line), _xtspanValue.ToString(CultureInfo.InvariantCulture));

            _textFormatted = builder.ToString(); ;
        }

        public WrappedText(string text, int minLenthString, string fontName, int fontSize, Mode mode, float heightContraint = 0)
        {
            _fontName = fontName;
            _fontSize = fontSize;
            _textInner = text;
            _minLenthString = minLenthString;
            _mode = mode;
            _heightContraint = heightContraint;
        }

        public void DoWrap()
        {
            Build();
            SplitToLines();
            FormatText();
        }

        public void ReFormat()
        {
            FormatText();
        }

        public void SetXTSpanValue(float x)
        {
            _xtspanValue = x;
        }

        private void SplitToLines()
        {
            var lines = _text.Split(new string[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines)
                _innerLines.Add(line.Trim());
        }

        private void Build()
        {
            Font f = new Font(_fontName, _fontSize);
            float lineWidth = _minLenthString;
            if (_mode == Mode.ByCharacter)
            {
                string minLine = "".PadRight(_minLenthString, 'X');
                lineWidth = _graphicsDummy.MeasureString(minLine, f).Width;
            }

            const string space = " ";
            string[] words = _textInner.Split(new string[] { space }, StringSplitOptions.None);
            float spaceWidth = _graphicsDummy.MeasureString(space, f).Width,
                spaceLeft = lineWidth,
                wordWidth;
            StringBuilder result = new StringBuilder();
            bool checkHeight = _heightContraint != 0;

            foreach (string word in words)
            {
                var sizeF = _graphicsDummy.MeasureString(word, f);
                wordWidth = sizeF.Width;
                if (wordWidth + spaceWidth > spaceLeft)
                {
                    result.AppendLine();
                    if (checkHeight)
                    {
                        _heightContraint -= sizeF.Height;
                        if (_heightContraint < 0) break;
                    }
                    spaceLeft = lineWidth - wordWidth;
                }
                else
                {
                    spaceLeft -= (wordWidth + spaceWidth);
                }
                result.Append(word + space);
            }

            _text = result.ToString().Trim();
            _size = _graphicsDummy.MeasureString(_text, f);
        }

        static WrappedText()
        {
            Bitmap dummy = new Bitmap(16, 16);
            dummy.SetResolution(72, 72);
            _graphicsDummy = Graphics.FromImage(dummy);
        }

        public static Graphics _graphicsDummy { get; set; }
    }
}