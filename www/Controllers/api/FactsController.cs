using ANBR.Common.Contarcts;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.ObjectModel;
using System.Collections.Generic;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using www.Models.Ex;
using www.SaGateway;
using System.Linq;
using System;
using System.Text;
using www.Helpers;
using www.Models.Ex.Feed;
using www.Models.Items;

namespace www.Controllers.api
{
    public class FactsController : ApiController
    {
        [ActionName("DefaultAction")]
        public IEnumerable<ListElement> Get(int id, int page = 1)
        {
            var saDB = WebSaUtilities.Database;

            int[] idsArr = HelperInquiry.ContextGetSATaskIds(saDB);
            var result = HelperFacts.GetFactsFor(saDB, id, idsArr, page);

            result.ForEach(item => item.originoid = id);

            return result;
        }

        [HttpGet]
        public ContentCollection InSources(int id, int originoid = 0)
        {
            var saDB = WebSaUtilities.Database;

            string[] kw = null;
            if (originoid != default(int))
            {
                var oid = saDB.ObjectModel.GetObject(originoid);

                var ioData = oid.Properties["InterestObjectINPUTDATA"];
                if (ioData != null)
                {
                    var data = (string)ioData.Value;
                    if (!String.IsNullOrWhiteSpace(data))
                    {
                        JObject jo = JObject.Parse(data);
                        kw = jo.GetValue("synonyms_INTERN").Select(item => item.Value<string>()).ToArray();
                    }
                }
                if (kw == null || kw.Length == 0)
                    kw = new[] { oid.DisplayName };
            }

            return GetSourceForFact(WebSaUtilities.Database, id, kw, null).AddContextData(saDB);
        }

        internal static ContentCollection GetSourceForFact(IDataBase saDB, int id, string[] kwArr,
            string contentPropName)
        {
            var sourceCollection = new ContentCollection();

            ISaObject obj = saDB.ObjectModel.GetObject(id);

            for (int i = 0; i < obj.Object.MentionedIn.Count; i++)
            {
                IMentioning mention = obj.Object.MentionedIn[i];
                var original = (ISource)mention.Source.Object;
                var mType = mention.Source.MetaType.SystemName.ToLower();

                ContentItem ci = DetailsController.GetContentV2(saDB, original.Id, kwArr, null, true, null,
                    contentPropName, false, TextMode.Short, TranslationMode.Orignal);

                if (mType == "videosource" || mType == "audiosource")
                {
                    ci.AddProperty("PlayingAt", "", mention.Position.StartPosition.ToString(), PropertyType.Integer,
                            false, true)
                        .AddProperty("PlayingUntil", "", mention.Position.EndPosition.ToString(), PropertyType.Integer,
                            false, true);
                }
                else
                {
                    ContentProperty cp = ci.GetPropertyBySystemName("TextSource");
                    if (cp != null)
                    {
                        cp.value = HigligteText(new List<IMentioning> { mention }, cp.value, obj.ObjectId);
                    }
                }

                sourceCollection.items.Add(ci);


#warning Необходимо обеспечить постраничный режим отображания
                if (i > 5) break;
            }

            return sourceCollection;
        }

        [NonAction]
        internal static string HigligteText(List<IMentioning> mentions, string sourceText, int objID)
        {
            foreach (IMentioning mention in mentions)
            {
                if (mention.Position.EndPosition <= mention.Position.StartPosition) continue;
                ISource source = (ISource)mention.Source.Object;
                int start = mention.Position.StartPosition;
                int end = mention.Position.EndPosition;
                string fragment = source?.Text.Substring(start, end - start);
                int len;
                Decorator.RawTextPrepare(true,out len, ref fragment);
                if (String.IsNullOrWhiteSpace(fragment)) continue;

                //span data-oknd =\"2\"
                sourceText = DocumentHighlighting.GetFormattedText(fragment , sourceText, objID.ToString(), DocumentHighlighting.FormattinKind.EntitiesInText, DocumentHighlighting.Mode.OriginalFragment);
            }

            return sourceText;
        }
    }
}
