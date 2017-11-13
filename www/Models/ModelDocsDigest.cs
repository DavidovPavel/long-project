using System.Collections.Generic;

namespace www.Models
{
    public class ModelDocsDigest
    {
        /// <summary>
        /// Заголовок титульного листа (верх)
        /// </summary>
        public string TitleTop { get; set; }
        /// <summary>
        /// Заголовок титульного листа (середина)
        /// </summary>
        public string TitleMiddle { get; set; }
        /// <summary>
        /// Заголовок титульного листа (низ)
        /// </summary>
        public string TitleBottom { get; set; }

        /// <summary>
        /// Список выбранных источников
        /// </summary>
        public List<int> Sources { get; set; }

        /// <summary>
        /// Список выбранных объектов для подстветки ключевых фраз
        /// </summary>
        public List<int> SelectedObjectsForKeyPhrases { get; set; }

        /// <summary>
        /// Информация о расписании автоматического запуска
        /// </summary>
        public AutoExecSchedulingTask SchedulingTaskData { get; set; }

        /// <summary>
        /// Источник входных данных (a - списко объектов из корзины, b - идентификатор запроса)
        /// </summary>
        public string ObjectByRequest { get; set; }
    }
}