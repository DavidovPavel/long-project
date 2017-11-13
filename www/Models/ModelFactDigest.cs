using System;

namespace www.Models
{
    public class ModelFactDigest
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
        /// Информация о расписании автоматического запуска
        /// </summary>
        public AutoExecSchedulingTask SchedulingTaskData { get; set; }

        /// <summary>
        /// Центральный объект
        /// </summary>
        public int MainObject { get; set; }

        /// <summary>
        /// Только те объекты будут включены в дайджест, дата создания которых не раньше указанной даты
        /// </summary>
        public DateTime? PointDateForSelection { get; set; }
    }
}