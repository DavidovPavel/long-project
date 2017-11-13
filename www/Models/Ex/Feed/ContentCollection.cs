using System;
using System.Collections.Generic;
using ANBR.SemanticArchive.SDK.MetaModel;

namespace www.Models.Ex.Feed
{
    public class ContentCollection
    {
        public ContentCollection()
        {
            links = new List<LinkExt>();
            items = new List<ContentItem>();
            head = new List<HeadProperty>();
        }

        public bool readonlymode { get; set; }
        public string version { get; set; }
        public string href { get; set; }
        public string render { get; set; }

        public Pagination pagination { get; set; }
        public List<LinkExt> links { get; set; }
        public List<ContentItem> items { get; set; }
        public List<HeadProperty> head { get; set; }

        public ContentItem AddNew()
        {
            ContentItem ci = new ContentItem();
            items.Add(ci);

            return ci;
        }

        public ContentCollection LinkAdd(string rel, string id, string value)
        {
            links.Add(new LinkExt { rel = rel, id = id, value = value });

            return this;
        }

        public ContentCollection AddHead(IMetaProperty mprop, bool isVisible)
        {
            return AddHead(mprop.SystemName, mprop.DisplayName, isVisible);
        }

        public ContentCollection AddHead(string systemName, string displayName, bool isVisible, bool isCalc = false, bool htmlEncoded = false)
        {
            var prop = new HeadProperty { displayName = displayName, systemName = systemName, isVisible = isVisible, isCalc = isCalc, htmlEncoded = htmlEncoded };
            head.Add(prop);

            return this;
        }

        public ContentCollection AddHead(HeadProperty item)
        {
            head.Add(item);

            return this;
        }

        public HeadProperty NewHeadItem() => new HeadProperty();

        public ContentCollection AddHead(IMetaType mtype, bool onlyVisible = true)
        {
            foreach (var item in mtype.AllProperties)
            {
                if (item.IsVisible) AddHead(item, true);
            }

            return this;
        }

        public ContentCollection AddHead(IMetaType mtype, Func<IMetaProperty, bool> filterDelegate)
        {
            foreach (var item in mtype.AllProperties)
            {
                if (filterDelegate(item))
                    AddHead(item, true);
            }

            return this;
        }

        internal ContentCollection AddPageInfo(int page, int pageSize, int totalItems)
        {
            pagination = new Pagination { currentPage = page, pageSize = pageSize, totalItems = totalItems };
            return this;
        }

        internal ContentCollection AddPageInfo(Pagination pageData)
        {
            pagination = pageData;
            return this;
        }
    }
}