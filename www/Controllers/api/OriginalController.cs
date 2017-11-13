using System.Web.Hosting;
using System.Web.Http;
using ANBR.SemanticArchive.SDK.ObjectModel;
using System.IO;
using System.Web;
using System;
using System.Drawing;
using System.Drawing.Imaging;
using www.Models;
using Anbr.Web.SA.CoreLogic;
using ANBR.Common.Contarcts;
using ANBR.Helpful.Misc.Html;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.Web.ExternalCore.Contract;
using www.Helpers;
using www.Models.Analyst;
using www.Models.Common;
using www.SaGateway;

namespace www.Controllers.api
{

    /// Root.GetFolder_OriginalSource() содержит путь к папке, куда кэшируются 
    /// результаты конвертации
    /// формат ссылки доступа к ресурсу  /Root.GetFolder_OriginalSource(){obj UID[3перв.симв]}/{obj UID}/{obj UID}.html
    public class OriginalController : ApiController
    {
        /// <summary>
        /// Проверка статуса подготовки к показу "приложенного" документа
        /// </summary>
        /// <param name="uid">uid - объекта</param>
        /// <param name="pid">по умолчанию св-во [Файл_оригинала]</param>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        [Route("api/original/checkconvert")]
        public int GetCheckConvert(string uid, int? pid = null)
        {
            string subTemp = uid.Substring(0, 3);
            string path = HttpContext.Current.Server.MapPath(Root.GetFolder_OriginalSource() + $"{subTemp}\\{uid}");

            if (pid.HasValue)
                path = path + "_" + pid;

            if (File.Exists(Path.Combine(path, "200.tmp")))
                return 200;

            if (File.Exists(Path.Combine(path, "1.tmp")))
                return 0;
            if (File.Exists(Path.Combine(path, "0.tmp")))
                return 0;
            if (File.Exists(Path.Combine(path, "404.tmp")))
                return 404;
            if (File.Exists(Path.Combine(path, "500.tmp")))
                return 500;

            return 404;
        }


        private static int CheckConvert(string uid, int? pid = null)
        {
            string subTemp = uid.Substring(0, 3);
            string path = HttpContext.Current.Server.MapPath(Root.GetFolder_OriginalSource() + $"{subTemp}\\{uid}");

            if (pid.HasValue)
                path = path + "_" + pid;

            if (File.Exists(Path.Combine(path, "200.tmp")))
                return 200;

            //важен порядок проверки!
            string fn;
            int res;

            fn = Path.Combine(path, "0.tmp");
            res = ValidateFileFlag(fn, 0);
            if (res == -1) return res;

            fn = Path.Combine(path, "1.tmp");
            res = ValidateFileFlag(fn, 1);
            if (res == -1) return res;

            fn = Path.Combine(path, "500.tmp");
            res = ValidateFileFlag(fn, 500);
            if (res == -1) return res;

            fn = Path.Combine(path, "404.tmp");
            res = ValidateFileFlag(fn, 404);
            if (res == -1) return res;

            if (res == -1)
                RemoveFlagFilesResult(path);

            return res;
        }

        private static int ValidateFileFlag(string fn, int successResult)
        {
            var fi = new FileInfo(fn);
            if (!fi.Exists) return -1;

            var ts = DateTime.UtcNow - fi.CreationTimeUtc;
            if (ts.TotalMinutes > 5)
                return -1;

            return successResult;
        }

        private static void RemoveFlagFilesResult(string path)
        {
            try
            {
                var fn = Path.Combine(path, "404.tmp");
                if (File.Exists(fn)) File.Delete(fn);
                fn = Path.Combine(path, "500.tmp");
                if (File.Exists(fn)) File.Delete(fn);
            }
            catch
            {
            }
        }


        /// <summary>
        /// Начало работы с файлом оригинала
        /// </summary>
        /// <param name="id">Идентификатор объекта</param>
        /// <param name="pid">по умолчанию св-во [Файл_оригинала]</param>
        [ActionName("DefaultAction")]
        [Route("api/original/startconvert")]
        public ModelFileConverted GetStartConvert(int id, int? pid = null)
        {
            IDataBase saDb = WebSaUtilities.Database;

            var m = saDb.ObjectModel.GetObjectInfo(id);
            IMetaProperty mprop;
            saDb.MetaModel.MetaProperties.TryGetByName("Файл_оригинала", out mprop);
            if (pid.HasValue && pid > 0)
                saDb.MetaModel.MetaProperties.TryGetByID(pid.Value, out mprop);

            if (mprop == null) return null;

            IObjectProperty prop = m.Object.Properties[mprop.SystemName];

            string objUID = m.Object.Uid.ToString();

            string convertedCheckLink = $"/api/original/checkconvert?uid={objUID}";
            if (pid.HasValue && pid > 0)
                convertedCheckLink += "&pid=" + prop.MetaProperty.ID;
            string fileTag = objUID;
            if (pid.HasValue && pid > 0)
            {
                fileTag = objUID + "_" + prop.MetaProperty.ID;
            }
            string subTemp = fileTag.Substring(0, 3);

            ModelFileConverted res = null;

            switch (prop.MetaProperty.PropType)
            {
                case PropertyType.Hyperlink:
                    {
                        res = new ModelFileConverted
                        {
                            ConvertedCheckLink = null,
                            FileUrl = null,
                            FileOriginalUrl = prop.Value.ToString(),
                            Status = 200,
                            OriginalFileName = null
                        };
                        break;
                    }
                case PropertyType.Picture:
                case PropertyType.Text:
                case PropertyType.HTML:
                case PropertyType.BinaryFile:
                    {
                        string fnExt = CalcFileExt(prop);
                        string destFileUrl = $@"{Root.GetFolder_OriginalSource()}{subTemp}/{fileTag}/{fileTag}.html";
                        string destFileOrigUrl = $@"{Root.GetFolder_OriginalSource()}{subTemp}/{fileTag}{fnExt}";

                        string destFilePathWithoutFN = HttpContext.Current.Server.MapPath(Root.GetFolder_OriginalSource() + $"{subTemp}");
                        string destFilePath = Path.Combine(destFilePathWithoutFN, fileTag + fnExt);

                        Directory.CreateDirectory(destFilePathWithoutFN);
                        var originalFileName = SaveFile(saDb, id, prop, destFilePath);

                        if (String.IsNullOrWhiteSpace(originalFileName))
                        {
                            res = null;
                            break;
                        }

                        int status = CheckConvert(objUID, pid);
                        if (status != -1)
                        {
                            res = new ModelFileConverted
                            {
                                ConvertedCheckLink = convertedCheckLink,
                                FileUrl = destFileUrl,
                                FileOriginalUrl = destFileOrigUrl,
                                Status = status,
                                OriginalFileName = originalFileName
                            };
                            break;
                        }

                        destFilePathWithoutFN = Path.Combine(destFilePathWithoutFN, fileTag);
                        if (fnExt == ".pdf" || HelperImage.IsSupportedFileImage(fnExt))
                        {
                            //в этом случае FileUrl = FileOriginalUrl
                            res = new ModelFileConverted
                            {
                                ConvertedCheckLink = convertedCheckLink,
                                FileUrl = destFileOrigUrl,
                                FileOriginalUrl = destFileOrigUrl,
                                Status = 200,
                                OriginalFileName = originalFileName
                            };
                            break;
                        }

                        destFilePathWithoutFN = Path.Combine(destFilePathWithoutFN, fileTag);
                        Directory.CreateDirectory(destFilePathWithoutFN);

                        //создаем в папке флаговый файл, означаюий факт необходимости конвертации
                        string fn = Path.Combine(destFilePathWithoutFN, "0.tmp");
                        try
                        {
                            if (File.Exists(fn)) File.Delete(fn);
                            using (var f = File.Create(fn)) { f.Close(); }
                        }
                        catch
                        {
                        }

                        HostingEnvironment.QueueBackgroundWorkItem(ct =>
                        {
                            Root.ProxyGetWorker()
                                .ConvertFileToHtml(new ConvertedItem { FilePath = destFilePath });
                        });

                        res = new ModelFileConverted
                        {
                            ConvertedCheckLink = convertedCheckLink,
                            FileUrl = destFileUrl,
                            FileOriginalUrl = destFileOrigUrl,
                            Status = 0,
                            OriginalFileName = originalFileName
                        };

                        break;
                    }
                default:
                    {
                        res = new ModelFileConverted
                        {
                            ConvertedCheckLink = null,
                            FileUrl = null,
                            FileOriginalUrl = null,
                            Status = 501,
                            OriginalFileName = null
                        };
                        break;
                    }
            }

            return res;
        }

        private static string SaveFile(IDataBase saDb, int objectId, IObjectProperty prop, string destFilePath)
        {
            if (prop.MetaProperty.PropType == PropertyType.BinaryFile && prop.Value is IFilePropertyValue)
            {
                if (!File.Exists(destFilePath))
                    ((IFilePropertyValue)prop.Value).DownloadToFile(destFilePath);
                return ((IFilePropertyValue)prop.Value).FileName;
            }
            if (prop.MetaProperty.PropType == PropertyType.HTML)
            {
                if (!File.Exists(destFilePath))
                {
                    var sourceText = saDb._PropertyFastGet<string>(objectId, prop.MetaProperty.SystemName);
                    File.WriteAllText(destFilePath, sourceText);
                }

                return "file.mht";
            }
            if (prop.MetaProperty.PropType == PropertyType.Text)
            {
                if (!File.Exists(destFilePath))
                {
                    var sourceText = saDb._PropertyFastGet<string>(objectId, prop.MetaProperty.SystemName);
                    File.WriteAllText(destFilePath, sourceText);
                }
                return "file.txt";
            }

            if (prop.MetaProperty.PropType == PropertyType.Picture)
            {
                if (prop.MetaProperty.SystemName == "Image" && prop.Value != null)
                {
                    if (!File.Exists(destFilePath))
                        ((Image)prop.Value).Save(destFilePath, ImageFormat.Jpeg);
                }
                return "file.jpeg";
            }

            return "";
        }

        private static string CalcFileExt(IObjectProperty prop)
        {
            if (prop.MetaProperty.PropType == PropertyType.BinaryFile && prop.Value is IFilePropertyValue)
                return Path.GetExtension(((IFilePropertyValue)prop.Value).FileName);
            if (prop.MetaProperty.PropType == PropertyType.HTML) return ".mht";
            if (prop.MetaProperty.PropType == PropertyType.Text) return ".txt";
            if (prop.MetaProperty.PropType == PropertyType.Picture) return ".jpeg";

            return "";
        }

        // GET api/original/5
        [ActionName("DefaultAction")]
        public OrignalFileInfo Get(int id)
        {
            string fileName = "";
            var m = WebSaUtilities.Database.ObjectModel.GetObjectInfo(id);
            var prop = m.Object.Properties["Файл_оригинала"];

            int? size = null;
            if (prop != null && prop.Value != null && prop.Value != DBNull.Value && !String.IsNullOrWhiteSpace(((IFilePropertyValue)prop.Value).FileName))
            {
                var v = (IFilePropertyValue)prop.Value;
                fileName = v.FileName;
                size = 0;
            }

            string userDescriptor = WebSaUtilities.GetCurrentUserID();
            const string resource = "Rule_OriginalDoc";
            const string kind = "GET";

            bool hasViolated = StatisticsBL.OperationRulesViolated(userDescriptor, kind, resource);
            int mode = 0;
            if (hasViolated) mode = 9;

            int visualization = 0;
            if (fileName.ToLower().EndsWith(".pdf")) visualization = 1;

            string fn = m.Object.Uid + ".pdf";
            return new OrignalFileInfo
            {
                FileName = fileName,
                Visualization = visualization,
                Mode = mode,
                RelativePath = visualization == 1 ? (Root.GetFolder_Temp() + m.Object.Uid + "/" + fn) : "",
                Size = size
            };
        }
    }
}
