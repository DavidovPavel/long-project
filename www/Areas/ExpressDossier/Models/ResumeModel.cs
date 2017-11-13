namespace www.Areas.ExpressDossier.Models
{
    public class ResumeModel
    {
        public int id { get; set; }
        /// <summary>
        /// 0 - Не задан
        /// 1 - Положительный
        /// 2 - Есть сомнения
        /// 3 - Выявлен негатив
        /// </summary>
        public int State { get; set; }
        /// <summary>
        /// Текстовое значение State 
        /// </summary>
        public string StateTitle { get; set; }
        /// <summary>
        /// Аналитическая записка
        /// </summary>
        public string NoteHtml { get; set; }
    }
}
