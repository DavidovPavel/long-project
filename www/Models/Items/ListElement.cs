using System.Collections.Generic;

namespace www.Models.Items
{
    public class ListElement<T>: ListElement
    {
        public ListElement()
        {
            collection = new List<T>();
        }

        public List<T> collection { get; set; }
    }

    /// <summary>
    /// Базовый класс для всех списков
    /// </summary>
    public class ListElement
    {
        public int originoid;
        public int id { get; set; }
        public string uid { get; set; }
        /// <summary>
        /// Общее количество элементов
        /// </summary>
        public int num { get; set; }
        public string title { get; set; }
        public string description { get; set; }
        public string type { get; set; }
        public int typeid { get; set; }
        public string date { get; set; }
        public int? linkToSourceID { get; set; }
        /// <summary>
        /// Количество элементов на странице
        /// </summary>
        public int pageSize { get; set; }

        /// <summary>
        /// Номер страницы
        /// </summary>
        public int? page { get; set; }
        public string data { get; set; }

        public List<ListElement<NoteFragment>> Childs { get; set; }
    }
}