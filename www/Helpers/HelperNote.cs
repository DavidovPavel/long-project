using System.Collections.Generic;
using System.Linq;
using www.Models;
using www.Models.Items;

namespace www.Helpers
{
    /// <summary>
    /// Фасад работы с пояснительной запиской
    /// </summary>
    public static class HelperNote
    {
        /// <summary>
        /// Собрать список фрагментов, принадлежащих заданному источнику
        /// </summary>
        /// <param name="list">Пояснительная записка</param>
        /// <param name="sourceId">Заданный идентификатор источника</param>
        /// <param name="found">Список фрагментов</param>
        public static void GetNotesBySourceID(List<ListElement<NoteFragment>> list, int sourceId, ref List<NoteFragment> found)
        {
            if (found == null) found = new List<NoteFragment>();

            foreach (var sec in list)
            {
                if (sec.collection == null) continue;

                foreach (var note in sec.collection)
                    if (note.SourceObject_ID == sourceId) found.Add(note);

                if (sec.Childs != null && sec.Childs.Any())
                    GetNotesBySourceID(sec.Childs, sourceId, ref found);
            }
        }

        /// <summary>
        /// Собрать список идентификаторов источников, которые были использованы при выделении фрагментов
        /// </summary>
        /// <param name="list">Пояснительная записка</param>
        /// <param name="found">Идентификаторов источников</param>
        public static void AggregateAllSourceIDInNote(List<ListElement<NoteFragment>> list, ref HashSet<int> found)
        {
            if (found == null) found = new HashSet<int>();

            foreach (var sec in list)
            {
                if (sec.collection == null) continue;

                foreach (var note in sec.collection)
                    found.Add(note.SourceObject_ID);

                if (sec.Childs != null && sec.Childs.Any())
                    AggregateAllSourceIDInNote(sec.Childs, ref found);
            }
        }
    }
}
