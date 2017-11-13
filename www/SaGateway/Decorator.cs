using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using Anbr.Web.SA.CoreLogic;
using ANBR.Common.Contarcts;
using ANBR.Helpful.Misc.Html;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.ObjectModel;
using Ganss.XSS;
using www.Helpers;
using www.Models.Ex;
using www.Models.Ex.Feed;

namespace www.SaGateway
{
    internal enum TextMode
    {
        Short, Whole
    }

    internal enum TranslationMode
    {
        Orignal, Translation
    }


    public static class Decorator
    {
        const int _FULLTEXTLENGTH = 5000;

        /// <summary>
        /// Возвращает подготовленный элемент контента по экземпляру типа Источник
        /// </summary>
        /// <param name="saDB">БД СА</param>
        /// <param name="id">Идентификатор источника</param>
        /// <param name="kwArr">Масив ключевых слов, которые требуют подсветки</param>
        /// <param name="highlightPhrase">Фраза, которая требует подсветки</param>
        /// <param name="htmlEncodingNeeded">Необходимо кодировать исходные тексты</param>
        /// <param name="highlightFragments">Фрагменты требующие подсветки</param>
        /// <param name="contentPropName">Системное имя свойства, откуда берем содержимое</param>
        /// <param name="extractOnlyMedia"></param>
        /// <param name="textMode">Режим отображения весь текст/краткий вариант</param>
        /// <param name="transMode"></param>
        /// <param name="textLength">Возвращает размер оригинального текста</param>
        /// <param name="hasFile">Признак наличия файла оригинала</param>
        /// <returns>Подготовленный элемент контента по экземпляру типа Источник</returns>
        internal static ContentItem GetSourceSimpleEx(IDataBase saDB, int id, string[] kwArr, string highlightPhrase, bool htmlEncodingNeeded, Tuple<Guid, string>[] highlightFragments, string contentPropName, bool extractOnlyMedia, TextMode textMode, TranslationMode transMode, out int textLength, out bool hasFile)
        {
            if (String.IsNullOrWhiteSpace(contentPropName)) contentPropName = "TextSource";
            if (!htmlEncodingNeeded)
                textMode = TextMode.Whole;

            textLength = 0;
            ISaObject obj = saDB.ObjectModel.GetObject(id);
            var meta = saDB.MetaModel.MetaProperties;
            if (obj == null) throw new InvalidOperationException("Object is not found");
            if (!obj.MetaType.IsSource) throw new ArgumentException("Object is not Source type");

            var uid = obj.Uid.ToString();
            string sourceText = "";
            var mTextSource = meta.GetByName(contentPropName);
            if (obj.MetaType.IsSource && contentPropName == "TextSource")
            {
                var source = (ISource)obj;
                sourceText = source.Text;
                RawTextPrepare(htmlEncodingNeeded, out textLength, ref sourceText);
            }
            else
            {
                if (mTextSource.PropType == PropertyType.String || mTextSource.PropType == PropertyType.Text)
                {
                    sourceText = saDB._PropertyFastGet<string>(id, contentPropName);
                    RawTextPrepare(htmlEncodingNeeded, out textLength, ref sourceText);
                }

                if (mTextSource.PropType == PropertyType.HTML)
                {
                    sourceText = saDB._PropertyFastGet<string>(id, contentPropName);
                    sourceText = Helper.MhtToHtml(sourceText);
                    textMode = TextMode.Whole;

                    sourceText = HelperOther.ScriptsTrim(sourceText, extractOnlyMedia);
                }
            }

            var mObject_ID = meta.GetByName("Object_ID");
            var mDisplay_Name = meta.GetByName("Display_Name");
            var mAuthor = meta.GetByName("Author");
            var mUrl = meta.GetByName("URL_источника");
            var mMassMedia = meta.GetByName("MassMedia");
            var mOrigFileName = meta.GetByName("Файл_оригинала");
            var mType = obj.MetaType.SystemName;

            var prop = obj.Properties["Файл_оригинала"];
            string fileName = "";
            if (prop != null && prop.Value != null && prop.Value != DBNull.Value && !String.IsNullOrWhiteSpace(((IFilePropertyValue)prop.Value).FileName))
            {
                var v = (IFilePropertyValue)prop.Value;
                fileName = v.FileName;
            }
            hasFile = !String.IsNullOrWhiteSpace(fileName);

            if (!String.IsNullOrWhiteSpace(sourceText))
            {
                sourceText = saDB.DoHighlight(highlightPhrase, sourceText, 0);

                bool isLargeText = sourceText.Length > _FULLTEXTLENGTH;
                if (textMode == TextMode.Short && isLargeText)
                {
                    var regex = new Regex(@"(<span.*?</span>)", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    MatchCollection mcollection = regex.Matches(sourceText);

                    int textLen = sourceText.Length;
                    var vectors = new List<System.Windows.Vector>();
                    for (int i = 0; i < mcollection.Count; i++)
                    {
                        int startIndex = mcollection[i].Index - 200;
                        if (startIndex < 0) startIndex = 0;
                        int endIndex = mcollection[i].Index + mcollection[i].Length + 200;
                        if (endIndex > textLen) endIndex = textLen;

                        if (vectors.Count > 0)
                        {
                            System.Windows.Vector v = vectors[vectors.Count - 1];

                            if (startIndex >= v.X && v.Y >= startIndex)
                            {
                                v.Y = endIndex;
                                vectors[vectors.Count - 1] = v;

                                continue;
                            }
                        }

                        vectors.Add(new System.Windows.Vector { X = startIndex, Y = endIndex });
                    }

                    string mitem = "";
                    foreach (System.Windows.Vector v in vectors)
                        mitem += sourceText.Substring((int)v.X, (int)(v.Y - v.X)) + Environment.NewLine + Environment.NewLine +
                                 new String('*', 50) + Environment.NewLine;


                    if (mcollection.Count > 0)
                        sourceText = mitem;
                }
            }

            string mediaUrl = "";
            if (mType.ToLower() != "videosource" && mType.ToLower() != "audiosource")
            {
                string txt = SDKHelper.HighligtKeywords(saDB, highlightFragments, sourceText);
                txt = SDKHelper.HighligtKeywords(saDB, kwArr, txt);
                sourceText = txt;
            }
            else
                if (mType.ToLower() == "audiosource")
                mediaUrl = Root.GetVideoHost() + "/audio/" + uid + ".mp3";
            else
                mediaUrl = Root.GetVideoHost() + "/video/" + uid + ".mp4";


            if (transMode == TranslationMode.Translation)
                sourceText = saDB.ObjectService.TranslateText(sourceText, String.Empty);

            var href = $"/Object/{id}";
            var ci = new ContentItem { href = href }
            .AddProperty(mObject_ID, id)
            .AddProperty(mDisplay_Name, obj.DisplayName)
            .AddProperty(mTextSource, sourceText)
            .AddProperty(mAuthor, saDB._PropValue(obj.Properties[mAuthor.SystemName]))
            .AddProperty(mUrl, saDB._PropValue(obj.Properties[mUrl.SystemName]))
            .AddProperty(mMassMedia, saDB._PropValue(obj.Properties[mMassMedia.SystemName]))
            .AddProperty(mOrigFileName, fileName)
            .AddProperty("SystemTypeName", "", mType, PropertyType.String, false, true)
            .AddProperty("uid", "", uid, PropertyType.String, false, true)
            .AddProperty("ContentCollection_Rubrics", Root.GetResource("ContentCollection_Rubrics"), obj._Rubrics(), PropertyType.String, true, true)
            .AddProperty("MediaUrl", "", mediaUrl, PropertyType.Integer, false, true);

            var propDN = ci.GetPropertyBySystemName(mDisplay_Name.SystemName);
            propDN.href = href;

            return ci;
        }

        public static void RawTextPrepare(bool htmlEncodingNeeded, out int textLength, ref string sourceText)
        {
            sourceText = htmlEncodingNeeded ? WebUtility.HtmlEncode(sourceText) : HelperOther.ScriptsTrim(sourceText, false);
            if (htmlEncodingNeeded)
            {
                sourceText = sourceText.EncodedReplace("[\n\r]+", "<br />");
                sourceText = sourceText.EncodedReplace(@"\s+", " ");
            }
            textLength = sourceText.Length;
        }
    }
}