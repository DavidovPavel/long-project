using System;
using System.Collections.Generic;
using System.Web.Http;
using ANBR.Common.Contarcts;
using ANBR.SemanticArchive.DataContracts.Sources;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.ObjectModel;
using www.Models;
using www.Models.Ex;
using www.Models.Ex.Feed;
using www.SaGateway;

namespace www.Controllers.api.Common
{
    /// <summary>
    /// Работа с корзиной
    /// </summary>
    public class CartController : ApiController
    {
        /// <summary>
        /// Добавить объект в корзину
        /// </summary>
        /// <param name="id"></param>
        [HttpGet]
        public ContentItem Add(int id)
        {
            int cartID = WebSaUtilities.GetDefaultCartID(WebSaUtilities.Database);
            WebSaUtilities.Database.CartService.AddObject(cartID, id);

            return GetContentItemByObjectID(WebSaUtilities.Database, id);
        }

        /// <summary>
        /// Добавить объект в корзину
        /// </summary>
        /// <param name="id"></param>
        /// <param name="did"></param>
        [HttpGet]
        public ContentItem AddEx(int id, int did)
        {
            IDataBase saDB = WebSaUtilities.ConnectorInstance.GetDataBase(did, 0);
            if (saDB == null)
                    throw new InvalidOperationException("There is problem to database access");

            int cartID = WebSaUtilities.GetDefaultCartID(saDB);
            saDB.CartService.AddObject(cartID, id);

            return GetContentItemByObjectID(saDB, id);
        }

        static ContentItem GetContentItemByObjectID(IDataBase saDB, int objectID)
        {
            var meta = saDB.MetaModel.MetaProperties;
            var mObject_ID = meta.GetByName("Object_ID");
            var mDisplay_Name = meta.GetByName("Display_Name");

            ISaObject addObj = saDB.ObjectModel.GetObject(objectID);
            var ci = new ContentItem()
                .AddProperty(mObject_ID, addObj.ObjectId)
                .AddProperty(mDisplay_Name, addObj.DisplayName)
                .AddProperty("TypeName", "TypeName", addObj.TypeName, PropertyType.String, true, true)
                .AddProperty("Type_ID", "Type_ID", addObj.MetaType.ID, PropertyType.Integer, false, true);

            return ci;
        }


        /// <summary>
        /// Удалить выбранные объекты из корзины
        /// </summary>
        /// <param name="value">Объект который содержит свойство List<int> IDs</param>
        [ActionName("DefaultAction")]
        [HttpDelete]
        public void Delete(ListIDs value)
        {
            int cartID = WebSaUtilities.GetDefaultCartID(WebSaUtilities.Database);
            WebSaUtilities.Database.CartService.RemoveObjects(cartID, value.IDs);
        }

        /// <summary>
        /// Добавить выбранные объекты в корзину
        /// </summary>
        /// <param name="value">Объект который содержит свойство List<int> IDs</param>
        [ActionName("DefaultAction")]
        [HttpPost]
        public List<ContentItem> Post(ListIDs value)
        {
            var addItems = new List<ContentItem>();

            int cartID = WebSaUtilities.GetDefaultCartID(WebSaUtilities.Database);
            foreach (int oid in value.IDs)
            {
                WebSaUtilities.Database.CartService.AddObject(cartID, oid);
                addItems.Add(GetContentItemByObjectID(WebSaUtilities.Database, oid));
            }

            return addItems;
        }

        /// <summary>
        /// Очистить корзину
        /// </summary>
        /// <param name="id">Константа 0</param>
        [HttpGet]
        public void Clear(int id)
        {
            int cartID = WebSaUtilities.GetDefaultCartID(WebSaUtilities.Database);
            WebSaUtilities.Database.CartService.Clear(cartID);
        }

        /// <summary>
        /// Получить список объектов в корзине
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [ActionName("DefaultAction")]
        public ContentCollection Get()
        {
            if (WebSaUtilities.Database == null) return null;

            int cartID = WebSaUtilities.GetDefaultCartID(WebSaUtilities.Database);
            List<DataObjectInfo> list = WebSaUtilities.Database.CartService.GetObjects(cartID);

            var meta = WebSaUtilities.Database.MetaModel.MetaProperties;
            var collection = new ContentCollection();
            collection
                .AddPageInfo(1, list.Count, list.Count)
                .AddHead("TypeName", "", true)
                .AddHead("Type_ID", "", false)
                .AddHead("Display_Name", meta.GetByName("Display_Name").DisplayName, true)
                .AddHead("Object_ID", "", false);


            var mObject_ID = meta.GetByName("Object_ID");
            var mDisplay_Name = meta.GetByName("Display_Name");


            foreach (var cartItem in list)
            {
                var ci = new ContentItem()
                    .AddProperty(mObject_ID, cartItem.Object_ID)
                    .AddProperty(mDisplay_Name, cartItem.DisplayName)
                    .AddProperty("TypeName", "TypeName", cartItem.TypeName, PropertyType.String, true, true)
                    .AddProperty("Type_ID", "Type_ID", cartItem.Type_ID, PropertyType.Integer, false, true);
                collection.items.Add(ci);
            }

            return collection;
        }
    }
}
