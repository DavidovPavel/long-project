using System;
using System.Collections.Generic;
using System.Linq;
using Anbr.Web.SA.CoreLogic;
using ANBR.Common.Contarcts;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using www.Models;
using www.Models.Ex;
using www.Models.Ex.Feed;
using www.Models.Items;

namespace www.SaGateway.Factories
{
    /// <summary>
    /// Разновидности карточек объектов
    /// </summary>
    public enum ModuleEntitiesKind
    {
        /// <summary>
        /// Организация
        /// </summary>
        Organization,
        /// <summary>
        /// Персона
        /// </summary>
        Person
    }

    public static class FactoryModuleEntities
    {
        public static ModuleEntitiesBase GetModule(ModuleEntitiesKind kind, IDataBase saDB, Dictionary<string, object> qparams)
        {
            switch (kind)
            {
                case ModuleEntitiesKind.Organization:
                    return new ModuleEntitiesOrganization(saDB, kind, qparams);
                case ModuleEntitiesKind.Person:
                    return new ModuleEntitiesPerson(saDB, kind, qparams);
            }

            throw new ArgumentException();
        }

        public enum SectionsTemplate
        {
            /// <summary>
            /// Не задан
            /// </summary>
            None,
            /// <summary>
            /// Вид деятельности
            /// </summary>
            Organization_Activities,
            /// <summary>
            /// Адрес
            /// </summary>
            Organization_Addresses,
            /// <summary>
            /// Телефоны
            /// </summary>
            Organization_Phones,
            /// <summary>
            /// Сайты компании
            /// </summary>
            Organization_Sites,
            /// <summary>
            /// Руководители
            /// </summary>
            Organization_Management
        }
    }

    class ModuleEntitiesOrganization : ModuleEntitiesBase
    {
        public ModuleEntitiesOrganization(IDataBase saDb, ModuleEntitiesKind kind, Dictionary<string, object> qparams) : base(saDb, kind, qparams)
        {
        }

        public override ContentCollection Get(int id)
        {
            ContentCollection card = SDKHelper.GetDataByTypeName(_saDB, id, 
                new[] { _SAConst.Наименование, _SAConst.Фото, _SAConst.Дата_основания, _SAConst.OGRN, _SAConst.Country, _SAConst.INN_Org, _SAConst.ОКПО }, null, _page);
            card.render = _kind.ToString();
            var content = card.items.FirstOrDefault();
            card.items = new List<ContentItem>(); // чистим коллекция, общие данные требуют разбивки на секции

            int num = 0;
            #region Шапка карточки
            var header = card.AddNew();
            header.render = "header";
            header.num = num++;

            var metaImage = _saDB.MetaModel.MetaProperties.GetByName(_SAConst.Фото);
            header.AddProperty(metaImage, content?.GetValueBySystemName(_SAConst.Фото));

            var metaDisplayName = _saDB.MetaModel.MetaProperties.GetByName(_SAConst.Наименование);
            header.AddProperty(metaDisplayName, content?.GetValueBySystemName(_SAConst.Наименование));
            #endregion

            #region Основные сведения
            var mainInformation = card.AddNew();
            mainInformation.caption = "Основные сведения";
            mainInformation.num = num++;
            mainInformation.render = "commonInfo";

            var metaCountry = _saDB.MetaModel.MetaProperties.GetByName(_SAConst.Country);
            mainInformation.AddProperty(metaCountry, content?.GetValueBySystemName(_SAConst.Country));
            mainInformation.LastAddedProperty.displayName = "Страна";

            var metaTypeDispName = _saDB.MetaModel.MetaProperties.GetByName(_SAConst.Тип);
            mainInformation.AddProperty(metaTypeDispName, content?.GetValueBySystemName(_SAConst.Тип_EXTERNAL));
            mainInformation.LastAddedProperty.displayName = "Тип объекта";

            mainInformation.AddProperty("status", "Статус", "неопределенно", PropertyType.String, true, true);

            var metaДата_основания = _saDB.MetaModel.MetaProperties.GetByName(_SAConst.Дата_основания);
            mainInformation.AddProperty(metaДата_основания, content?.GetValueBySystemName(_SAConst.Дата_основания));
            mainInformation.LastAddedProperty.displayName = "Дата создания";

            mainInformation.AddProperty("companySize", "Размер компании", "неопределенно", PropertyType.String, true, true);
            mainInformation.AddProperty("capital", "Размер уставного капитала", "неопределенно", PropertyType.String, true, true);
            mainInformation.AddProperty("activityKind", "Вид деятельности", "неопределенно", PropertyType.String, true, true);
            #endregion

            #region Коды
            var codes = card.AddNew();
            codes.caption = "Коды";
            codes.num = num++;
            codes.render = "grid--1-3";

            var metaOgrn = _saDB.MetaModel.MetaProperties.GetByName(_SAConst.OGRN);
            codes.AddProperty(metaOgrn, content?.GetValueBySystemName(_SAConst.OGRN));
            var metaINN = _saDB.MetaModel.MetaProperties.GetByName(_SAConst.INN_Org);
            codes.AddProperty(metaINN, content?.GetValueBySystemName(_SAConst.INN_Org));
            var metaOKPO = _saDB.MetaModel.MetaProperties.GetByName(_SAConst.ОКПО);
            codes.AddProperty(metaOKPO, content?.GetValueBySystemName(_SAConst.ОКПО));
            #endregion

            var activities = card.AddNew();
            activities.caption = "Вид деятельности";
            activities.num = num++;
            activities.render = "table";
            activities.href = $"/api/object/card/{id}/tpl_{(int)FactoryModuleEntities.SectionsTemplate.Organization_Activities}";

            var addresses = card.AddNew();
            addresses.caption = "Адрес";
            addresses.num = num++;
            addresses.render = "table";
            addresses.href = $"/api/object/card/{id}/tpl_{(int)FactoryModuleEntities.SectionsTemplate.Organization_Addresses}";

            var phones = card.AddNew();
            phones.caption = "Телефоны";
            phones.num = num++;
            phones.render = "table";
            phones.href = $"/api/object/card/{id}/tpl_{(int)FactoryModuleEntities.SectionsTemplate.Organization_Phones}";

            var sites = card.AddNew();
            sites.caption = "Сайты компании";
            sites.num = num++;
            sites.render = "table";
            sites.href = $"/api/object/card/{id}/tpl_{(int)FactoryModuleEntities.SectionsTemplate.Organization_Sites}";

            var management = card.AddNew();
            management.caption = "Руководители";
            management.num = num++;
            management.render = "table";
            management.href = $"/api/object/card/{id}/tpl_{(int)FactoryModuleEntities.SectionsTemplate.Organization_Management}";

            return card;
        }

        public override TreeElement Post(ContentItem model)
        {
            throw new NotImplementedException();
        }

        public override TreeElement Put(ContentItem model)
        {
            throw new NotImplementedException();
        }

        public override void Delete(int id)
        {
            throw new NotImplementedException();
        }
    }

    class ModuleEntitiesPerson : ModuleEntitiesBase
    {
        public ModuleEntitiesPerson(IDataBase saDb, ModuleEntitiesKind kind, Dictionary<string, object> qparams) : base(saDb, kind, qparams)
        {
        }

        public override ContentCollection Get(int id)
        {
            throw new NotImplementedException();
        }

        public override TreeElement Post(ContentItem model)
        {
            throw new NotImplementedException();
        }

        public override TreeElement Put(ContentItem model)
        {
            throw new NotImplementedException();
        }

        public override void Delete(int id)
        {
            throw new NotImplementedException();
        }
    }

    public abstract class ModuleEntitiesBase
    {
        protected readonly IDataBase _saDB;
        protected Dictionary<string, object> _qparams;
        protected int _page = 1;
        public ModuleEntitiesKind _kind { get; set; }

        protected ModuleEntitiesBase(IDataBase saDb, ModuleEntitiesKind kind, Dictionary<string, object> qparams)
        {
            _saDB = saDb;
            _kind = kind;
            _qparams = qparams;

            object page;
            if (qparams.TryGetValue("page", out page)) _page = (int) page;
        }

        public abstract ContentCollection Get(int id);
        public abstract TreeElement Post(ContentItem model);
        public abstract TreeElement Put(ContentItem model);
        public abstract void Delete(int id);
    }
}
