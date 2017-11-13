using System;
using System.Collections.Generic;

namespace www.Models
{

    /// <summary>
    /// Фрагмент пояснительной записки
    /// </summary>
    public class NoteFragment
    {
        public NoteFragment()
        {
            Sections = new List<NoteFragmentSection>();
            cdate = DateTime.Now.Ticks;
        }

        /// <summary>
        /// Идентификатор фрагмента
        /// </summary>
        public Guid? id { get; set; }

        /// <summary>
        /// Заголовок
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Список разделов, которым принадлежит фрагмент
        /// </summary>
        public List<NoteFragmentSection> Sections { get; set; }

        /// <summary>
        /// Содержимое фрагмента (исправлено пользователем)
        /// </summary>
        public string Html { get; set; }

        /// <summary>
        /// Содержимое фрагмента (оригинал)
        /// </summary>
        public string HtmlOrig { get; set; }

        /// <summary>
        /// Содержимое фрагмента (только текст)
        /// </summary>
        public string PlainTextOrig { get; set; }

        /// <summary>
        /// Ссылка на источник, из которого он был выделен (пр. http://localhost/lang-ru-RU/db7104/inquiry?prjid=14#doc!sid=886036?originoid=885935)
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// Идентификатор объекта источника фрагмента выписки
        /// </summary>
        public int SourceObject_ID { get; set; }

        /// <summary>
        /// Дата создания (DateTime Ticks), используется для сортировки
        /// </summary>
        public long? cdate { get; set; }

        /// <summary>
        /// Регулярное выражение для поиска
        /// </summary>
        public string SearchExpr { get; set; }

    }
}