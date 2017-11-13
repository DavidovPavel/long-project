using System.Globalization;
using System.Web;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.SemanticArchive.SDK.ObjectModel;
using ANBR.SemanticArchive.Web;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web.Http;
using Common;
using Microsoft.Owin.Infrastructure;
using Newtonsoft.Json.Linq;
using www.SaGateway;

namespace www.Controllers
{
    public class FilesController : ApiController
    {
        readonly string imgpath = string.Concat(AppDomain.CurrentDomain.BaseDirectory, "/images/folder.png");

        // GET api/files
        //[ActionName("DefaultAction")]
        //public HttpResponseMessage Get()
        //{
           
        //}

        // GET api/files/5

        [ActionName("DefaultAction")]
        public HttpResponseMessage Get(int id)
        {
            var img = new byte[2048];
            var response = new HttpResponseMessage();
            IMetaEntity m = WebSaUtilities.Database.MetaModel.GetEntityById(id);
            if (m != null)
            {
                if (m.Image16 != null)
                {
                    response.Content = new ByteArrayContent(m.Image16);
                    response.Content.Headers.ContentLength = m.Image16.Length;
                    response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment");
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                }
                else
                {
                    if (File.Exists(imgpath))
                    {
                        response.Content = new StreamContent(new FileStream(imgpath, FileMode.Open, FileAccess.Read, FileShare.Read, img.Length, true));
                        response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment");
                        response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                    }
                }
            }
            else
            {
                if (File.Exists(imgpath))
                {
                    response.Content = new StreamContent(new FileStream(imgpath, FileMode.Open, FileAccess.Read, FileShare.Read, img.Length, true));
                    response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment");
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                }
            }
            return response;
        }

        [ActionName("DefaultAction")]
        public HttpResponseMessage Upload()
        {
            var output = "";
            var response = new HttpResponseMessage();
            if (HttpContext.Current.Request.Files.Count > 0 && HttpContext.Current.Request.Files[0].ContentLength > 0)
            {
                var objid = 0;
                if (int.TryParse(HttpContext.Current.Request.Form["objId"], out objid))
                {
                    var s = WebUtilities.Database.ObjectModel.GetObjectInfo(objid);
                    var prop = s.Object.Properties["Файл_оригинала"];
                    if (prop != null)
                    {
                        var v = (IFilePropertyValue) prop.Value;
                        var f = HttpContext.Current.Request.Files[0];
                        v.FileName = f.FileName.Substring(f.FileName.LastIndexOf("\\", StringComparison.Ordinal) + 1);
                        
                        //v.Delete(true);
                        v.Upload(f.InputStream);

                        s.Object.Save();
                        output = string.Format("<a target='_blank' href='/fileupload/?id={0}'>{1} <span title='extlink' class='ui-icon ui-icon-extlink'></span></a>",
                                               objid.ToString(CultureInfo.InvariantCulture), v.FileName);
                    }
                    else output = "Ошибка: Объект не содержит свойство для загрузки.";
                }
                else output = "Ошибка: Не задан объект.";
            }
            else output = "Ошибка: Выберите файл.";

            response.Content = new StringContent(output);
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
            return response;
        }

        [HttpPost("api/Files/UploadDoc")]
        public HttpResponseMessage UploadDoc()
        {
            /*
                        var output = "";
                        if (HttpContext.Current.Request.Files.Count > 0 && HttpContext.Current.Request.Files[0].ContentLength > 0)
                        {

                            // сохраняем файл после создания документа? данные для создания документа, если документ уже создан то будет предаваться еще один параметр - objID, 
                            //если пользователь грузит файл не создав объект то этого параметра нет или он равен null

                            //HttpContext.Current.Request.Form["typeid"];
                            //HttpContext.Current.Request.Form["smi"];
                            //HttpContext.Current.Request.Form["author"];
                            //HttpContext.Current.Request.Form["author"];
                            //HttpContext.Current.Request.Form["pdate"];
                            //HttpContext.Current.Request.Form["rubricid"];

                            if (!string.IsNullOrWhiteSpace(HttpContext.Current.Request.Form["title"]))
                            {
                                var f = HttpContext.Current.Request.Files[0];

                            }
                            else output = "Ошибка: Нет названия.";
                        }
                        else output = "Ошибка: Выберите файл.";
            */

            var response = new HttpResponseMessage();
            response.Content = new StringContent("");
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
            return response;
        }
    }
}
