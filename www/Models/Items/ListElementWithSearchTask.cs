using System;

namespace www.Models.Items
{
    public class ListElementWithSearchTask : ListElement
    {
        /// <summary>
        /// Поисковая задача (наименование)
        /// </summary>
        public string source { get; set; }

        /// <summary>
        /// Тип поисковой задачи (SearchTaskUID)
        /// </summary>
        public Guid? searchSATaskUID { get; set; }
    }
}