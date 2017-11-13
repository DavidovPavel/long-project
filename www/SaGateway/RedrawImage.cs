using System;
using System.Collections.Concurrent;
using System.Configuration;
using System.Drawing.Imaging;
using System.IO;
using System.Drawing;
using System.Web.Hosting;

namespace www.SaGateway
{
    public class RedrawImage
    {
        static readonly ConcurrentDictionary<string, Tuple<Image, string>> _baseImagesCache = new ConcurrentDictionary<string, Tuple<Image, string>>();
        static readonly ConcurrentDictionary<string, string> _imagesCache = new ConcurrentDictionary<string, string>();
        private readonly string _baseImageName;
        private static Uri _baseUri;
        private static string _rootFolder;

        public RedrawImage(string baseImageName)
        {
            _baseImageName = Path.Combine(_rootFolder, baseImageName);
        }

        static RedrawImage()
        {
            InitStorage();
        }

        private static void InitStorage()
        {
            string relativePath = ConfigurationManager.AppSettings["Path_MapMarkers"];
            _baseUri = new Uri(relativePath, UriKind.Relative);
            _rootFolder = HostingEnvironment.MapPath(relativePath);
        }

        public string Redraw(Color toColor)
        {
            Tuple<Image, string> data;
            if (!_baseImagesCache.TryGetValue(_baseImageName, out data))
            {
                int index = _baseImageName.LastIndexOf('.');
                string baseName = index == -1 ? _baseImageName : _baseImageName.Substring(0, index);
                data = new Tuple<Image, string>(Image.FromFile(_baseImageName), baseName);
                _baseImagesCache[_baseImageName] = data;
            }

            string destFileName = data.Item2 + System.Drawing.ColorTranslator.ToHtml(toColor).Replace('#', '-') + ".png";

            string url;
            if (!_imagesCache.TryGetValue(destFileName, out url))
            {
                url = _baseUri.ToString() + Path.GetFileName(destFileName); //generates "/Temp/MapMarkers/" + fileName
                if (!File.Exists(destFileName))
                {
                    using (var img = (Image)_baseImagesCache[_baseImageName].Item1.Clone())
                    using (var g = Graphics.FromImage(img))
                    {
                        var colorMaps = new[] { new ColorMap { OldColor = Color.Black, NewColor = toColor } };
                        var attr = new ImageAttributes();
                        attr.SetRemapTable(colorMaps);

                        g.DrawImage(img, new Rectangle(0, 0, img.Width, img.Height), 0, 0, img.Width, img.Height,
                            GraphicsUnit.Point, attr);
                        img.Save(destFileName);


                        _imagesCache[destFileName] = url;
                    }
                }
                _imagesCache[destFileName] = url;
            }

            return url;
        }
    }
}