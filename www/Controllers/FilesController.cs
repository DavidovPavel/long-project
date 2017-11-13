using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;
using System.Web.UI;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.SemanticArchive.SDK.ObjectModel;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using ANBR.Common;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using Microsoft.Ajax.Utilities;
using Newtonsoft.Json.Linq;
using www.SaGateway;

namespace www.Controllers
{
    public class FilesController : Controller
    {
        readonly string imgpath = string.Concat(AppDomain.CurrentDomain.BaseDirectory, "images\\folder.png");

        [HttpGet]
        public ActionResult ImageTransform(string path, int? width, int? height)
        {
            path = path.ToLowerInvariant();

            if (String.IsNullOrWhiteSpace(path)) throw new InvalidOperationException("Invalid parameters");
            if ((width ?? 0) == 0 && (height ?? 0) == 0) throw new InvalidOperationException("Invalid parameters");

            if (path.StartsWith("http"))
            {
                String baseUrl = Scope.GetCurrentBaseUrl();
                if (path.StartsWith(baseUrl))
                    path = path.Replace(baseUrl, "/");

                if (path.StartsWith("http"))
                    throw new InvalidOperationException("Image url problem. The Image should be local file.");
            }

            string imagePath = HttpContext.Server.MapPath(path);
            if (!System.IO.File.Exists(imagePath)) return new HttpNotFoundResult("File doesn't exist");

            string fn = Path.GetFileNameWithoutExtension(imagePath);
            string newFileName = fn + "_" + (width ?? 0) + "x" + (height ?? 0) + ".png";
            string newImagePath = Path.Combine(HttpContext.Server.MapPath(Root.GetFolder_Temp()), newFileName);

            if (!System.IO.File.Exists(newImagePath))
            {
                byte[] bd;
                using (var img = Image.FromFile(imagePath))
                    bd = img.ToBytes(ImageFormat.Png);

                if (width.HasValue && height.HasValue)
                    using (Bitmap bmp = HelperImage.Limit(bd, width.Value, height.Value, HelperImage.LimitMode.ToFit))
                        bmp.Save(newImagePath, ImageFormat.Png);
                else if (width.HasValue)
                    using (Bitmap bmp = HelperImage.LimitWidth(width.Value, bd))
                        bmp.Save(newImagePath, ImageFormat.Png);
                else
                    using (Bitmap bmp = HelperImage.LimitHeight(height.Value, bd))
                        bmp.Save(newImagePath, ImageFormat.Png);
            }

            return new FilePathResult(newImagePath, "image/png");
        }

        [OutputCache(Duration = 86400, VaryByParam = "*", Location = OutputCacheLocation.Any)]
        public ActionResult Details(int id)
        {
            Response.Cache.SetOmitVaryStar(true);

            var saDb = WebSaUtilities.Database;
            if (saDb == null) return HttpNotFound();

            IMetaEntity m = saDb.MetaModel.GetEntityById(id);
            if (m != null && m.Image16 != null)
                return File(m.Image16, "image/png");

            return File(imgpath, "image/png");
        }

        [OutputCache(Duration = 86400, VaryByParam = "*", Location = OutputCacheLocation.Any)]
        public async Task<FileResult> DetailsByQ(int qid, int id)
        {
            Response.Cache.SetOmitVaryStar(true);

            QueryDTO qDTO = await WallBL.WidgetQueryDataAsync(qid);
            var saDB = WebSaUtilities.ConnectorInstance.GetDataBase(qDTO.DatabaseID, 0, qDTO.DatabaseName);
            IMetaEntity m = saDB.MetaModel.GetEntityById(id);
            if (m != null && m.Image16 != null)
                return File(m.Image16, "image/png");

            return File(imgpath, "image/png");
        }

        // get original doc
        [HttpGet]
        public FileResult OriginalDoc(int id)
        {
            var m = WebSaUtilities.Database.ObjectModel.GetObjectInfo(id);

            var prop = m.Object.Properties["Файл_оригинала"];
            if (prop != null)
            {
                var v = (IFilePropertyValue)prop.Value;
                if (!string.IsNullOrWhiteSpace(v.FileName))
                {
                    var mimetype = v.FileName.Substring(v.FileName.LastIndexOf(".", StringComparison.Ordinal));
                    return File(v.Download(), HelperCommon.GetMimeType(mimetype), v.FileName);
                }
                throw new Exception("Название файла пустое!");
            }
            return null;
        }

        [HttpGet]
        public FileResult ObjImage(int id)
        {
            var saDb = WebSaUtilities.Database;
            var imageArray = saDb._PropertyFastGet<byte[]>(id, "Image");
            string mimetype;
            HelperImage.GetMimeType(imageArray, out mimetype);

            return File(imageArray, mimetype);
        }

        [HttpPost]
        public string NewDoc()
        {
            var output = "";

            JObject value = new JObject();
            value["typeid"] = Request.Form["typeid"];
            value["smi"] = Request.Form["smi"];
            value["author"] = Request.Form["author"];
            value["pdate"] = Request.Form["pdate"];
            value["rubricid"] = Request.Form["rubricid"];
            value["title"] = Request.Form["title"];


            var httpPostedFileBase = Request.Files[0];
            if (httpPostedFileBase != null && (Request.Files.Count > 0 && httpPostedFileBase.ContentLength > 0))
            {

                // сохраняем файл после создания документа? данные для создания документа, если документ уже создан то будет предаваться еще один параметр - objID, 
                //если пользователь грузит файл не создав объект то этого параметра нет или он равен null

                if (!string.IsNullOrWhiteSpace(Request.Form["title"]))
                {
                    var f = Request.Files[0];

                    var jObject = value as JObject;
                    var typeid = jObject.Property("typeid").Value.ToObject<Int32>();
                    if (jObject.Property("objID") != null)
                    {
                        int idObj = jObject.Property("objID").Value.ToObject<Int32>();
                        if (idObj != 0)
                            return idObj.ToString();
                    }

                    IDataBase saDb = WebSaUtilities.Database;
                    IMetaType mt = saDb.MetaModel.MetaTypes.GetByID(typeid);
                    ISource source = saDb.ObjectModel.CreateSource(mt);

                    byte[] buff = new byte[httpPostedFileBase.ContentLength];
                    httpPostedFileBase.InputStream.Read(buff, 0, httpPostedFileBase.ContentLength);

                    string fn = System.IO.Path.GetFileName(Request.Files[0].FileName);
                    var saObj = source as ISaObject;

                    var projectID = Scope.GetInternalPrjIDi();
                    SDKHelper.SaveObject(saDb, projectID, null, ref saObj, jObject);
                    source = saObj as ISource;

                    using (System.IO.Stream stream = new MemoryStream(buff))
                        source.SaveOriginalFile(stream, fn);


                    var url = Scope.GetCurrentUrl();
                    string linktoid = Root.GetIdFromKey(url);
                    if (!String.IsNullOrWhiteSpace(linktoid))
                    {
                        saDb.ObjectModel.LinkObjectInSource(source.Id, Convert.ToInt32(linktoid));
                    }


                    output = source.Id.ToString();
                }
                else output = "Ошибка: Нет названия.";
            }
            else
                output = "Ошибка: Нет файла или он пустой.";

            if (!string.IsNullOrWhiteSpace(Request.Form["content"]))
            {
                // создаем объект
                // сохраняем текстовое содержимое
                output = "123";// сдесь должен быть id нового объекта!
            }


            return output;
        }


        /// <summary>
        /// Используется на вкладке содержимое, при просмотре оригинала документа (кнопка загрузить)
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpPost]
        public string Upload(int id)
        {
            var output = "";
            if (Request.Files.Count > 0)
            {
                var httpPostedFileBase = Request.Files[0];
                if (httpPostedFileBase != null && (Request.Files.Count > 0 && httpPostedFileBase.ContentLength > 0))
                {
                    var s = WebSaUtilities.Database.ObjectModel.GetObjectInfo(id);
                    var prop = s.Object.Properties["Файл_оригинала"];
                    if (prop != null)
                    {
                        var v = (IFilePropertyValue)prop.Value;
                        var f = Request.Files[0];
                        if (f != null)
                        {
                            v.FileName = f.FileName.Substring(f.FileName.LastIndexOf("\\", StringComparison.Ordinal) + 1);
                            //v.Delete(true);
                            v.Upload(f.InputStream);
                        }
                        s.Object.Save();
                        output = v.FileName;
                    }
                    else output = "Ошибка: Объект не содержит свойство для загрузки.";
                    //}
                    //else output = "Ошибка: Не задан объект.";
                }
                else output = "Ошибка: Выберите файл.";
            }
            else output = "Ошибка: Выберите файл.";
            return output;
        }
    }
}
