using System.Web.Mvc;
using ANBR.Web.ExternalCore.Contract;
using Common;
using System.Web.Hosting;
using System.IO;
using System;
using System.Text;

namespace www.Controllers
{
    public class SvgController : BaseController
    {
        [HttpPost]
        [ValidateInput(false)]
        public FileResult Index(string data)
        {
            Uri baseUrl = HttpContext.Request.Url;
            byte[] arr = Convert.FromBase64String(System.Web.HttpUtility.UrlDecode(data));
            data = System.Web.HttpUtility.UrlDecode(Encoding.UTF8.GetString(arr));
            string pathPng = SvgController.GenerateImageFile(baseUrl, data);

            return File(pathPng, "image/png");
        }


        /// <summary>
        /// Делает скриншот страницы, расположеной по заданному адресу
        /// </summary>
        /// <param name="baseUrl"></param>
        /// <param name="data"></param>
        /// <returns>Абсолютный путь (png картинка)</returns>
        public static string GenerateImageFile(Uri baseUrl, string data)
        {
#if (DEBUG)
            //data = System.IO.File.ReadAllText(@"C:\_1\tmp0001.svg");
#endif

            string subFolder = DateTime.Now.ToString("yyyyMMdd");
            string path = Path.Combine(HostingEnvironment.MapPath(Root.GetFolder_Temp()), subFolder);
            if (!Directory.Exists(path))
            {
                try
                {
                    Directory.CreateDirectory(path);
                }
                catch
                {
                }
            }

            string rndFN = Path.GetRandomFileName().Replace(".", "");
            string pathSvg = Path.Combine(path, rndFN + ".html");

            System.IO.File.WriteAllText(pathSvg, String.Format("<html><head><meta charset=\"utf-8\" /></head><body>{0}</body></html>", data));

            string urlSvg = new Uri(baseUrl, Root.GetFolder_Temp() + subFolder + "/" + rndFN + ".html").ToString();

            var proxy = Root.ProxyGetWorker();

            string pathPng = Path.Combine(path, rndFN + ".png");
            var sourcePath = proxy.HtmlpageToImageLocalPath(urlSvg);

            System.IO.File.Copy(sourcePath, pathPng, true);

            /*
            byte[] imgArr;
            var ds = Gateway.ServiceRef<IWebWorker>(Root.GetExternalCoreEndpoint());
            using (var wrapper = new ServiceWrapper<IWebWorker>(ds))
            {
                string echo = wrapper.Channel.Ping("msg");
                imgArr = wrapper.Channel.HtmlpageToImage(urlSvg);
            }

            var converter = new ImageConverter();
            var bmp = (Bitmap)converter.ConvertFrom(imgArr);

            string pathPng = Path.Combine(path, rndFN + ".png");
            using (var tempImage = new Bitmap(bmp)) //http://stackoverflow.com/questions/14866603/a-generic-error-occurred-in-gdi-when-attempting-to-use-image-save
            {
                tempImage.Save(pathPng, ImageFormat.Png);
            }
            */ 

            return pathPng;
        }
    }
}
