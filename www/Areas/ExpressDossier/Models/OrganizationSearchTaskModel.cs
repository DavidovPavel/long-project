using System.Collections.Generic;

namespace www.Areas.ExpressDossier.Models
{
    /// <summary>
    /// Описывает исходные данные вводимые пользователям для поиска Организации
    /// </summary>
    public class OrganizationSearchTaskModel
    {
        public string[] synonyms_INTERN;
        public string[] selectedCountries;
        public int id { get; set; }
        public int typeid { get; set; }
        public string typeSystemName { get; set; }

        #region Общая часть - транснациональная

        /// <summary>
        /// Наименование компании
        /// </summary>
        public string title_INTERN { get; set; }

        /// <summary>
        /// Адрес компании
        /// </summary>
        public string address_INTERN { get; set; }

        /// <summary>
        /// Искать с учетом синонимов
        /// </summary>
        public bool searchSin_INTERN { get; set; }
        #endregion

        #region РФ. Добавочная часть.

        /// <summary>
        /// ИНН (INN_Org)
        /// </summary>
        public string inn__ru_RU { get; set; }

        /// <summary>
        /// ОГРН (OGRN)
        /// </summary>
        public string ogrn__ru_RU { get; set; }

        /// <summary>
        /// ОКПО (ОКПО)
        /// </summary>
        public string okpo__ru_RU { get; set; }
        #endregion

        #region Украина. Добавочная часть.
        /// <summary>
        /// ЕДРПОУ
        /// </summary>
        public string edrpou__uk_UA { get; set; }
        #endregion

        #region Казахстан. Добавочная часть.
        /// <summary>
        /// Индивидуальный Идентификационный Номер (ИИН) (для организации не используется)
        /// </summary>
        public string inn__kk_KZ { get; set; }

        /// <summary>
        /// Регистрационный Налоговый Номер. Аналог российского ИНН
        /// </summary>
        public string rnn__kk_KZ { get; set; }

        /// <summary>
        /// Бизнес-Идентификационный Номер (аналог российского ОГРН)
        /// </summary>
        public string bin__kk_KZ { get; set; }
        #endregion

        #region Вьетнам. Добавочная часть.

        /// <summary>
        /// TaxCode (аналогрос.«ИНН»)
        /// </summary>
        public string inn__vi_VN { get; set; }

        /// <summary>
        /// Business line code (аналогрос. «ОГРН»)
        /// </summary>
        public string ogrn__vi_VN { get; set; }
        #endregion

        #region Тайвань. Добавочная часть.
        /// <summary>
        /// ИНН
        /// </summary>
        public string TaxID__zh_TW { get; set; }
        /// <summary>
        /// ОГРН
        /// </summary>
        public string RegistrationNumber__zh_TW { get; set; }
        #endregion

        #region Китай. Добавочная часть.
        /// <summary>
        /// ИНН
        /// </summary>
        public string RegistrationNumber__zh_CN { get; set; }
        #endregion

        #region Гонконг. Добавочная часть.
        /// <summary>
        /// ИНН
        /// </summary>
        public string RegistrationNumber__zh_HK { get; set; }
        #endregion

        /// <summary>
        /// Прикрепеленные файлы к проверке
        /// </summary>
        public Dictionary<string, string> AttacheedFiles { get; set; }
        
        /// <summary>
        /// Это вычисляемое поле (собирается на основе значений связанных фактов)
        /// </summary>
        public RelationsDescriptionModel RelationsDescriptionData { get; set; }
        public int? MasterID { get; set; }
        public string MasterTitle { get; set; }
        public int? Project_ID { get; set; }
        public int? ProjectRole_ID { get; set; }
        /// <summary>
        /// Перечень привязанных рубрик
        /// </summary>
        public RubricsDescriptionModel[] Rubrics { get; set; }

        /// <summary>
        /// Запустить автоматическое извлечение фактов
        /// </summary>
        public bool AutoExtractionIsActive { get; set; }
    }
}