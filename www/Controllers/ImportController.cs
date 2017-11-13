using System;
using System.IO;
using System.Web.Hosting;
using System.Web.Mvc;
using www.SaGateway;

namespace www.Controllers
{
    public class ImportController : Controller
    {
        [HttpPost]
        public string Index()
        {
            var output = "";
            if (Request.Files.Count > 0)
            {
                var httpPostedFileBase = Request.Files[0];
                if (httpPostedFileBase != null && (Request.Files.Count > 0 && httpPostedFileBase.ContentLength > 0))
                {
                    var ext = Path.GetExtension(Request.Files[0].FileName).ToLower();
                    if (ext != ".xls" && ext != ".xlsx") return  "Ошибка: Неверный формат файла";

                    byte[] buff = new byte[httpPostedFileBase.ContentLength];
                    httpPostedFileBase.InputStream.Read(buff, 0, httpPostedFileBase.ContentLength);

                    string path = HostingEnvironment.MapPath(Root.GetFolder_Temp() + Path.GetRandomFileName() + ext);
                    System.IO.File.WriteAllBytes(path, buff);

                    ImportFromExcel import = new ImportFromExcel();
                    try
                    {
                        import.Execute(path);
                    }
                    catch (ApplicationException ex)
                    {
                        return ex.Message;
                    }
                }
                else output = "Ошибка: Выберите файл.";
            }
            else output = "Ошибка: Выберите файл.";
            return output;
        }
    }
}
