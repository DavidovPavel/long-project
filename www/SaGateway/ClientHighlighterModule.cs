using System.Collections.Generic;
using ANBR.Highlight.Contracts;
using ANBR.SemanticArchive.DataContracts.Sources;
using ANBR.SemanticArchive.SDK;
using Document = ANBR.SemanticArchive.DataContracts.Sources.Document;

namespace www.SaGateway
{
    public class ClientHighlighterModule
    {
        private readonly IDataBase _saDb;
        private Dictionary<int, MentionObject> _mentionDic = new Dictionary<int, MentionObject>();
        private List<HighLightBase> _highlightList = new List<HighLightBase>();
        private Dictionary<int, HighLightFragment> _highlightFragments = new Dictionary<int, HighLightFragment>();
        private Dictionary<int, HighLightBase> _highlightObjects = new Dictionary<int, HighLightBase>();
        private static DummyFont _defFont;
        private Dictionary<int, System.Drawing.Color> _objectColorCollection = new Dictionary<int, System.Drawing.Color>();
        private Document _document;
        private List<DocumentFragment> _fragmentList;
        private List<MentionObject> _objectList;

        static ClientHighlighterModule()
        {
            _defFont = new DummyFont
            {
                Name = "Verdana",
                Color = System.Drawing.Color.White,
                Size = 10,
                BackColor = System.Drawing.Color.Blue
            };
        }

        public ClientHighlighterModule(IDataBase saDB, int sourceID)
        {
            _saDb = saDB;
            _document = saDB.SourceService.GetDocumentById(sourceID);
            _fragmentList = saDB.SourceService.GetFragmentsBySourceId(sourceID);
            _objectList = saDB.SourceService.GetMentionObject(sourceID);
            _mentionDic.Clear();

            LoadSource();
        }

        void LoadSource()
        {
            foreach (DocumentFragment documentFragment in _fragmentList)
            {
                HighLightFragment highLightFragment = HighLight_CreateFragment(documentFragment);
                _highlightList.Add(highLightFragment);
            }

            foreach (MentionObject mentionObject in _objectList)
            {
                _mentionDic.Add(mentionObject.DataObjectInfo.Object_ID, mentionObject);
                if (_saDb.MetaModel.IsFact(mentionObject.DataObjectInfo.Type_ID))
                {
                    HighLightFragment hightlightFragment = HighLight_CreateFragment(mentionObject);
                    _highlightList.Add(hightlightFragment);
                }
                else
                {
                    HighLightObject highlightObject = HighLight_CreateObject(mentionObject);
                    _highlightList.Add(highlightObject);

                }
            }
        }

        public string DoHighlight()
        {
            return _saDb.ServiceTools.HighlightText(_document.Text, _highlightList, TextFormat.Text, TextFormat.Html2);
        }

        private HighLightFragment HighLight_CreateFragment(DocumentFragment documentFragment)
        {
            var highLightFragment = new HighLightFragment();

            highLightFragment.ID = documentFragment.GetHashCode();
            highLightFragment.Font = _defFont;
            highLightFragment.StartPos = documentFragment.StartPosition;
            highLightFragment.Length = documentFragment.Length;

            _highlightFragments.Add(documentFragment.Fragment_ID, highLightFragment);

            return highLightFragment;
        }

        private HighLightFragment HighLight_CreateFragment(MentionObject mentionObject)
        {
            var highLightFragment = new HighLightFragment();

            highLightFragment.ID = mentionObject.DataObjectInfo.Object_ID;
            highLightFragment.StartPos = mentionObject.MentionPosition.StartPosition ?? 0;
            highLightFragment.Length = (mentionObject.MentionPosition.EndPosition ?? 0) - highLightFragment.StartPos + 1;
            highLightFragment.Font = _defFont;

            _highlightObjects.Add(mentionObject.ID, highLightFragment);
            _objectColorCollection.Add(mentionObject.ID, System.Drawing.Color.Blue);

            return highLightFragment;
        }

        private HighLightObject HighLight_CreateObject(MentionObject mentionObject)
        {
            var highLightObject = new HighLightObject();

            highLightObject.ID = mentionObject.DataObjectInfo.Object_ID;
            highLightObject.Name = mentionObject.DataObjectInfo.DisplayName;
            highLightObject.Synonyms = mentionObject.Synonyms;

            if (mentionObject.IsMonitoring)
            {
                highLightObject.Font = _defFont;
                highLightObject.Font.Color = System.Drawing.Color.Blue;
                _objectColorCollection.Add(mentionObject.ID, highLightObject.Font.Color);
            }
            else
            {
                highLightObject.Font = _defFont;
                _objectColorCollection.Remove(mentionObject.ID);
                _objectColorCollection.Add(mentionObject.ID, System.Drawing.Color.Transparent);
            }

            _highlightObjects.Add(mentionObject.ID, highLightObject);

            return highLightObject;
        }
    }
}