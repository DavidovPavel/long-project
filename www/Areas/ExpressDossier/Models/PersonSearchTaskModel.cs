using System;
using System.Collections.Generic;

namespace www.Areas.ExpressDossier.Models
{
    /// <summary>
    /// Описывает исходные данные вводимые пользователям для поиска Персоны
    /// </summary>
    public class PersonSearchTaskModel
    {
        public enum BirthDateUsingKindEnum : int
        {
            None = 0,
            Exact = 1,
            Range = 2,
            Age = 3
        }

        public int id { get; set; }
        public int typeid { get; set; }
        public string typeSystemName { get; set; }
        public string[] selectedCountries;

        #region Общая часть - транснациональная
        /// <summary>
        /// Фамилия (складывается в Display_Name: Фамилия + Имя + Отчество)
        /// </summary>
        public string lname_INTERN { get; set; }
        
        /// <summary>
        /// Имя (складывается в Display_Name: Фамилия + Имя + Отчество)
        /// </summary>
        public string fname_INTERN { get; set; }
        
        /// <summary>
        /// Отчество (складывается в Display_Name: Фамилия + Имя + Отчество)
        /// </summary>
        public string mname_INTERN { get; set; }

        /// <summary>
        /// Универсальное имя (заполняется в случае невозможности выделить фамилию имя и отчество)
        /// </summary>
        public string universalname_INTERN { get; set; }

        /// <summary>
        /// Предыдущая фамилия
        /// </summary>
        public string pname_INTERN { get; set; }

        /// <summary>
        /// Искать с учетом синонимов
        /// </summary>
        public bool searchSin_INTERN { get; set; }

        /// <summary>
        /// Искать с учетом инициалов
        /// </summary>
        public bool searchByInitials_INTERN { get; set; }

        /// <summary>
        /// Как используем дату рождения в процессе поиска
        /// </summary>
        public BirthDateUsingKindEnum birthDateUsingKind_INTERN { get; set; }

        /// <summary>
        /// Дата рождения точно (Дата_рождения)
        /// </summary>
        public DateTime? birthDateExact_INTERN { get; set; }

        /// <summary>
        /// Дата рождения с (Дата_рождения_не_раньше)
        /// </summary>
        public DateTime? birthDateFrom_INTERN { get; set; }

        /// <summary>
        /// Дата рождения по (Дата_рождения_не_позднее)
        /// </summary>
        public DateTime? birthDateTo_INTERN { get; set; }

        /// <summary>
        /// Возраст (примерно) - Используется для вычеслений Дата_рождения_не_раньше и Дата_рождения_не_позднее
        /// </summary>
        public int? age_INTERN { get; set; }

        /// <summary>
        /// Дельта к возрасту (+ и -) - Используется для вычеслений Дата_рождения_не_раньше и Дата_рождения_не_позднее
        /// </summary>
        public int? ageFromTo_INTERN { get; set; }

        /// <summary>
        /// Синонимы
        /// </summary>
        public string[] synonyms_INTERN { get; set; }

        #endregion

        #region РФ. Добавочная часть.
        /// <summary>
        /// Паспорт - серия (Паспортные_данные)
        /// </summary>
        public string pasSerial__ru_RU { get; set; }

        /// <summary>
        /// Паспорт - номер (Паспортные_данные)
        /// </summary>
        public string pasNumber__ru_RU { get; set; }
        
        /// <summary>
        /// Паспорт - дата выдачи
        /// </summary>
        public DateTime? pasDate__ru_RU { get; set; }

        /// <summary>
        /// ИНН (INN_Person)
        /// </summary>
        public string inn__ru_RU { get; set; }
        
        /// <summary>
        /// ОГРНИП (OGRN_Person)
        /// </summary>
        public string ogrnip__ru_RU { get; set; }
        #endregion

        #region Украина. Добавочная часть.
        /// <summary>
        /// Паспорт - серия
        /// </summary>
        public string pasSerial__uk_UA { get; set; }

        /// <summary>
        /// Паспорт - номер
        /// </summary>
        public string pasNumber__uk_UA { get; set; }

        /// <summary>
        /// Паспорт - дата выдачи
        /// </summary>
        public DateTime? pasDate__uk_UA { get; set; }

        /// <summary>
        /// ИНН
        /// </summary>
        public string inn__uk_UA { get; set; }
        #endregion

        #region Казахстан. Добавочная часть.
        /// <summary>
        /// Паспорт - серия
        /// </summary>
        public string pasSerial__kk_KZ { get; set; }

        /// <summary>
        /// Паспорт - номер
        /// </summary>
        public string pasNumber__kk_KZ { get; set; }

        /// <summary>
        /// Паспорт - дата выдачи
        /// </summary>
        public DateTime? pasDate__kk_KZ { get; set; }

        /// <summary>
        /// Индивидуальный Идентификационный Номер
        /// </summary>
        public string inn__kk_KZ { get; set; }
        #endregion

        #region Вьетнам. Добавочная часть.

        /// <summary>
        /// Идентификационный номер (ID Number)
        /// </summary>
        public string inn__vi_VN { get; set; }
        #endregion

        #region Малайзия. Добавочная часть.
        /// <summary>
        /// Identity Card (назначение не ясно. Что-то типа нашего пенсионного или страхового свидетельства?)
        /// </summary>
        public string IdentityCard__ms_MY { get; set; }
        
        /// <summary>
        /// Police (наверное, удостоверение полицейского)
        /// </summary>
        public string Police__ms_MY { get; set; }
        
        /// <summary>
        /// Army (типа нашей «Военной книжки»?)
        /// </summary>
        public string Army__ms_MY { get; set; }

        /// <summary>
        /// Passport No.
        /// </summary>
        public string PassportNo__ms_MY { get; set; }
        #endregion

        #region Тайвань. Добавочная часть.
        /// <summary>
        /// ИНН
        /// </summary>
        public string TaxNumber__zh_TW { get; set; }
        #endregion

        #region Китай. Добавочная часть.
        /// <summary>
        /// ИНН
        /// </summary>
        public string TaxNumber__zh_CN { get; set; }
        #endregion

        #region Гонконг. Добавочная часть.
        /// <summary>
        /// ИНН
        /// </summary>
        public string TaxNumber__zh_HK { get; set; }
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