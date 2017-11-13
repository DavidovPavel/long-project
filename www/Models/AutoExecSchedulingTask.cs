using System;

namespace www.Models
{
    public class AutoExecSchedulingTask
    {
        public enum PeriodicityKind : int
        {
            Unknown = 0,
            EveryHour = 1,
            EveryDay = 2,
            EveryWeek = 3
        }

        public enum StateKind : int
        {
            NonActive = 0,
            Active = 1
        }

        public enum TaskKind : int
        {
            Unknown = 0,
            DigestDocuments = 1,
            DigestFact = 2
        }

        /// <summary>
        /// Уникальный идентификатор (присваивается на сервере)
        /// </summary>
        public Guid? UID { get; set; }

        /// <summary>
        /// Наименование задачи
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Время запуска задачи и часовой пояс (дата не имеет значение)
        /// </summary>
        public DateTimeOffset TimeStartExecution { get; set; }
        /// <summary>
        /// Переодичность
        /// </summary>
        public PeriodicityKind Periodicity { get; set; }

        /// <summary>
        /// Дни недели (актуально для Periodicity = EveryWeek, Воскресенье = Sunday = 0)
        /// </summary>
        public DayOfWeek[] WhichDaysOfWeek { get; set; }

        /// <summary>
        /// Получатели (список e-mail адресов через запятую)
        /// </summary>
        public string Subscribers { get; set; }

        /// <summary>
        /// Состояние отключения/включения задачи
        /// </summary>
        public StateKind State { get; set; }

        /// <summary>
        /// Дата следующего запуска
        /// </summary>
        public DateTimeOffset? NextStartDateTime { get; set; }

        /// <summary>
        /// Дата последнего запуска
        /// </summary>
        public DateTimeOffset? LastStartDateTime { get; set; }

        /// <summary>
        /// Разновидность задачи
        /// </summary>
        public TaskKind SchedulingTaskType { get; set; }

        /// <summary>
        /// Тема письма
        /// </summary>
        public string EmailTopic { get; set; }

        /// <summary>
        /// Содержимое письма
        /// </summary>
        public string EmailBody { get; set; }

        /// <summary>
        /// Данные по задаче
        /// </summary>
        public string Data { get; set; }
    }
}