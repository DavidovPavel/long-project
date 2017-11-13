using System;

namespace www.Models.Items
{
    /// <summary>
    /// Список источников
    /// </summary>
    public class ListSources : ListElement
    {
        public string sel { get; set; }

        /// <summary>
        /// Поисковая задача (наименование)
        /// </summary>
        public string source { get; set; }

        /// <summary>
        /// Вес документа в КБ
        /// </summary>
        public long size { get; set; }

        /// <summary>
        /// Тип поисковой задачи (ID)
        /// </summary>
        public Guid? searchSATaskUID { get; set; }
    }
}