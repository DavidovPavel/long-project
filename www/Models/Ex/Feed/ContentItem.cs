using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Runtime.Remoting.Messaging;
using System.Web;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.SemanticArchive.SDK.ObjectModel;
using Newtonsoft.Json;

namespace www.Models.Ex.Feed
{
    /// <summary>
    /// Ёлемент в своем составе, как правило, содержит ContentProperty "Display_Name"
    /// —войство "Display_Name" будет ссылкой, если href элемента задан
    /// </summary>
    public class ContentItem
    {
        private ContentProperty _lastAddedProperty;
        private ContentCollection items { get; set; }

        public ContentItem()
        {
            links = new List<LinkExt>();
            data = new List<ContentProperty>();
        }

        public ContentItem(ISaObject obj)
            : this()
        {
            foreach (IObjectProperty item in obj.Properties)
                AddProperty(item);
        }

        public bool readonlymode { get; set; }
        public string href { get; set; }
        public string render { get; set; }
        public string caption { get; set; }
        public int? num { get; set; }
        public List<ContentProperty> data { get; set; }
        public List<LinkExt> links { get; set; }

        public ContentItem AddProperty(string systemName, string displayName, object value,
            ANBR.Common.Contarcts.PropertyType propType, int? dicID, bool? isMultival, bool isVisible, bool isCalc,
            string prompt = "", bool htmlEncoded = true)
        {
            string valStr = GetStringRepresentation(value, htmlEncoded);

            LastAddedProperty = new ContentProperty
            {
                displayName = displayName,
                value = valStr,
                prompt = prompt,
                isVisible = isVisible,
                systemName = systemName,
                propType = (int)propType,
                dicID = dicID,
                isMultival = isMultival,
                isCalc = isCalc
            };
            data.Add(LastAddedProperty);

            return this;
        }

        public ContentItem LinkAdd(string rel, string id, string value)
        {
            links.Add(new LinkExt { rel = rel, id = id, value = value });

            return this;
        }

        public ContentItem LinkAdd(LinkExt link)
        {
            links.Add(link);

            return this;
        }

        public ContentItem AddProperty(IObjectProperty mprop, string prompt = "")
        {
            string valStr = null;
            if (mprop.Value != null)
                valStr = GetStringRepresentation(mprop.Value.ToString());

            LastAddedProperty = new ContentProperty
            {
                displayName = mprop.MetaProperty.DisplayName,
                value = valStr,
                prompt = prompt,
                isVisible = mprop.MetaProperty.IsVisible,
                systemName = mprop.MetaProperty.SystemName,
                propType = (int)mprop.MetaProperty.PropType,
                dicID = mprop.MetaProperty.Dictionary?.ID ?? -1,
                isMultival = mprop.MetaProperty.IsMultiVal
            };
            data.Add(LastAddedProperty);

            return this;
        }


        public ContentItem AddProperty(IMetaProperty mprop, object value, bool htmlEncoded = true, string prompt = "")
        {
            string valStr = GetStringRepresentation(value, htmlEncoded);

            LastAddedProperty = new ContentProperty
            {
                displayName = mprop.DisplayName,
                value = valStr,
                prompt = prompt,
                isVisible = mprop.IsVisible,
                systemName = mprop.SystemName,
                propType = (int)mprop.PropType,
                dicID = mprop.Dictionary?.ID ?? -1,
                isMultival = mprop.IsMultiVal
            };
            data.Add(LastAddedProperty);

            return this;
        }

        public ContentProperty NewProperty()
        {
            return new ContentProperty();
        }

        public ContentItem AddProperty(ContentProperty item)
        {
            LastAddedProperty = item;
            data.Add(LastAddedProperty);

            return this;
        }

        public object GetValueBySystemName(string systemName)
        {
            if (String.IsNullOrWhiteSpace(systemName)) return null;

            var searchedVal = systemName.ToLower();
            return
                data.Where(item => item.systemName == searchedVal)
                    .Select(item => item.value)
                    .FirstOrDefault();
        }

        [JsonIgnore]
        public ContentProperty GetLastAddedProperty => LastAddedProperty;

        [JsonIgnore]
        public ContentProperty LastAddedProperty
        {
            get { return _lastAddedProperty; }

            set
            {
                value.num = _lastAddedProperty?.num + 1 ?? 1;
                _lastAddedProperty = value;
            }
        }

        public ContentProperty GetPropertyBySystemName(string systemName)
        {
            if (String.IsNullOrWhiteSpace(systemName)) return null;

            var searchedVal = systemName.ToLower();
            return data.FirstOrDefault(item => item.systemName == searchedVal);
        }

        public ContentItem AddProperty(string systemName, string displayName, object value,
            ANBR.Common.Contarcts.PropertyType propType, bool isVisible, bool isCalc, string prompt = "")
        {
            return AddProperty(systemName, displayName, value, propType, null, null, isVisible, isCalc, prompt);
        }

        public ContentItem AddProperty(string systemName, string displayName, object value,
            ANBR.Common.Contarcts.PropertyType propType, bool isVisible, bool isCalc, bool htmlEncoded,
            string prompt = "")
        {
            return AddProperty(systemName, displayName, value, propType, null, null, isVisible, isCalc, prompt, htmlEncoded);
        }

        private string GetStringRepresentation(object value, bool htmlEncoded = true)
        {
            if (value is DateTime)
                return ((DateTime)value).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffK");
            if (value is byte[])
            {
                var visualization = CallContext.LogicalGetData("Visualization")?.ToString();
                if (visualization == "card")
                {
                    using (Bitmap bmp = HelperImage.LimitWidthEx(420, (byte[])value, 210))
                        return HelperImage.GetHtmlFromImg(bmp);
                }
                if (visualization == "card2")
                {
                    using (Bitmap bmp = HelperImage.LimitWidthEx(315, (byte[])value, 210))
                        return HelperImage.GetHtmlFromImg(bmp);
                }

                using (var bmp = HelperImage.LimitHeight(64, (byte[])value))
                    return HelperImage.GetHtmlFromImg(bmp);
            }

            return value != null
                ? (htmlEncoded ? HttpUtility.HtmlEncode(value.ToString()) : value.ToString())
                : "";
        }

        public ContentItem AddItems(ContentCollection children)
        {
            items = children;
            return this;
        }
    }
}