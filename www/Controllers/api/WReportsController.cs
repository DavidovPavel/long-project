using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Formatting;
using System.Net.Http.Headers;
using System.Web.Http;
using ABS.WReportsProcessing.Contracts;
using www.Helpers;
using www.Models;
using Westwind.Web.Mvc;

namespace www.Controllers.api
{
    public class WReportsController : ApiController
    {
        [ActionName("DefaultAction")]
        public string Get(int id)
        {
            try
            {
                ModelReportABSGeneral model = HelperReports.WReportModelGet(id, null);
                var html = ViewRenderer.RenderView("~/views/reports/index.cshtml", model);

                return html;

            }
            catch (Exception e)
            {
                return e.ToString();
            }
        }

        [HttpGet]
        public HttpResponseMessage DataAsString(int id)
        {
            try
            {
                ModelReportABSGeneral model = HelperReports.WReportModelGet(id, null);

                return new HttpResponseMessage()
                {
                    Content = new ObjectContent<ModelReportABSGeneral>(model, new XmlMediaTypeFormatter { UseXmlSerializer = true })
                };

            }
            catch (Exception e)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, e.ToString());
            }
        }

        [HttpGet]
        public HttpResponseMessage DataAsFile(int id)
        {
            try
            {
                ModelReportABSGeneral model = HelperReports.WReportModelGet(id, null);

                var result = DataAsString(id);
                result.Content.Headers.ContentDisposition =
                    new ContentDispositionHeaderValue("attachment")
                    {
                        FileName = $"entity_{id}.xml"
                    };
                result.Content.Headers.ContentType = new MediaTypeHeaderValue(System.Net.Mime.MediaTypeNames.Text.Xml);

                return result;

            }
            catch (Exception e)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, e.ToString());
            }
        }


        [HttpPost]
        [Route("api/WReports/Export/{id:int}")]
        public ModelExportDossier Export(int id, ModelExportDossier model)
        {
            if (model.kind == ModelExportDossier.ExportKind.PDF)
            {

                ModelReportABSGeneral m = new ModelReportABSGeneral() { Header = model.html };
                var html = ViewRenderer.RenderView("~/views/reports/IndexPrintVersion.cshtml", m);

                model.url = HelperReports.WReportGetPDF(id, html);
                return model;

            }

            throw new InvalidOperationException("Invalid data");
        }
    }
}
