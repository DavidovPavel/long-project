using System;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Principal;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using ANBR.SDKHelper;
using www.Helpers;
using www.Models.Common;
using www.SaGateway;

namespace www.Controllers.api.Common
{
    public class UploadController : ApiController
    {
        enum StorageType
        {
            Wall,
            Check_AttachedFiles
        }

        /// <summary>
        /// Позволяет добавить в заданный тип хранилища. Тип задается через параметр ?st=0
        /// (0 - это стена, 1 - вложения проверяемого объекта
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        [Route("api/common/upload")]
        public async Task<object> PostFormData()
        {
            if (!Request.Content.IsMimeMultipartContent())
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);

            WindowsImpersonationContext context = null;
            try
            {
                if (!WindowsIdentity.GetCurrent().IsSystem)
                    context = WindowsIdentity.Impersonate(IntPtr.Zero);
            }
            // ReSharper disable once EmptyGeneralCatchClause
            catch
            {
            }

            try
            {
                var qnv = Request.GetQueryNameValuePairs();
                var qp = qnv.FirstOrDefault(item => item.Key == "st");
                StorageType storageType;
                Enum.TryParse(qp.Value, out storageType);

                string storagePath = GetStoragePathByType(storageType);


                string userUID = WebSaUtilities.GetCurrentUserID();
                var user = await HelperAD.UserGetById(userUID, true);

                string root = HttpContext.Current.Server.MapPath(storagePath);
                string rootDTSegment = DateTime.Now.ToString("yyyy-MM-dd");
                root = Path.Combine(root, rootDTSegment);
                if (!Directory.Exists(root))
                    Directory.CreateDirectory(root);

                var transliteration = new Transliteration();

                var multipartMemoryStreamProvider = await Request.Content.ReadAsMultipartAsync();
                var urls = new string[multipartMemoryStreamProvider.Contents.Count];
                for (int i = 0; i < multipartMemoryStreamProvider.Contents.Count; i++)
                {
                    using (HttpContent file = multipartMemoryStreamProvider.Contents[i])
                    {
                        if (String.IsNullOrWhiteSpace(file.Headers.ContentDisposition.FileName))
                        {
                            urls[i] = "error:" + Root.GetResource("UploadedImageInvalidFileName");
                            continue;
                        }

                        string fileName = file.Headers.ContentDisposition.FileName;
                        if (string.IsNullOrEmpty(fileName))
                            fileName = Guid.NewGuid().ToString();
                        long fileSize = file.Headers.ContentLength ?? 0;

                        if (fileName.StartsWith("\"") && fileName.EndsWith("\"")) fileName = fileName.Trim('"');
                        if (fileName.Contains(@"/") || fileName.Contains(@"\"))
                            fileName = Path.GetFileName(fileName);

                        Guid fileUID = Guid.NewGuid();
                        fileName = fileUID + "_" + transliteration.Front(fileName.Replace(' ', '_'));
                        string fullDestPath = Path.Combine(root, fileName);

                        bool isImage = HelperImage.IsSupportedFileImage(fullDestPath);
                        if (isImage && fileSize > 52428800) //50 Мб
                        {
                            urls[i] = "error:" + Root.GetResource("UploadedImageSizeConstraint");
                            continue;
                        }
                        if (storageType == StorageType.Wall && !isImage)
                        {
                            urls[i] = "error:" + Root.GetResource("UploadedImageInvalidFormat");
                            continue;
                        }

                        using (var stream = await file.ReadAsStreamAsync())
                        using (var fs = new FileStream(fullDestPath, FileMode.Create))
                        {
                            await stream.CopyToAsync(fs);
                        }

                        if (isImage)
                        {
                            var fullPathDestOld = fullDestPath;
                            fullDestPath = Path.Combine(root,
                                Path.GetFileNameWithoutExtension(fullDestPath) + ".jpg");
                            using (var bmpOut = HelperImage.Resize(fullPathDestOld))
                            {
                                bmpOut.Save(fullDestPath, ImageFormat.Jpeg);
                                var fi = new FileInfo(fullDestPath);
                                fileSize = fi.Length;
                            }
                        }

                        string mimetype = MimeMapping.GetMimeMapping(fullDestPath);

                        var fDto = new FileDTO();
                        fDto.FileUID = fileUID;
                        fDto.FileUrl = GetStorageUrlByType(storageType) + rootDTSegment + "/" + fileName;
                        fDto.MIMEType = mimetype;
                        fDto.OriginalFileName = file.Headers.ContentDisposition.FileName;
                        fDto.StorageType = (int)storageType;
                        fDto.Size = fileSize;

                        await FilesBL.AddFileToStorage(user, fDto);

                        urls[i] = fDto.FileUrl;
                    }
                }

                return urls;
            }
            catch (Exception e)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, e.ToString());
            }
            finally
            {
                try
                {
                    if (context != null)
                        context.Undo();
                }
                // ReSharper disable once EmptyGeneralCatchClause
                catch
                {
                }
            }
        }

        private string GetStoragePathByType(StorageType storageType)
        {
            switch (storageType)
            {
                case StorageType.Wall:
                    return "~/Storage/Wall";
                case StorageType.Check_AttachedFiles:
                    return "~/Storage/Check_AttachedFiles";
                default:
                    throw new ArgumentOutOfRangeException(nameof(storageType));
            }
        }

        private string GetStorageUrlByType(StorageType storageType)
        {
            switch (storageType)
            {
                case StorageType.Wall:
                    return "/Storage/Wall/";
                case StorageType.Check_AttachedFiles:
                    return "/Storage/Check_AttachedFiles/";
                default:
                    throw new ArgumentOutOfRangeException("storageType");
            }
        }

        [HttpGet]
        [Route("api/common/files/my")]
        public async Task<ModelGallery> GetMyGallery()
        {
            string userUID = WebSaUtilities.GetCurrentUserID();

            FileDTO[] files = await FilesBL.GetFilesFromStorage(userUID, (int)StorageType.Wall);

            return new ModelGallery()
            {
                FilesGallery = files.ToLocalType()
            };
        }

        [HttpDelete]
        [Route("api/common/files/{uid:guid}")]
        public async Task RemoveFileFromGallery(Guid uid)
        {
            await FilesBL.RemoveFileFromStorage(HostingEnvironment.ApplicationPhysicalPath, uid);
        }

        [HttpGet]
        [Route("api/common/files/")]
        public async Task<ModelFileGallery[]> GetMyFiles()
        {
            string userUID = WebSaUtilities.GetCurrentUserID();

            FileDTO[] files = await FilesBL.GetFilesFromStorage(userUID, (int)StorageType.Wall);

            return files.ToLocalType();
        }
    }
}
