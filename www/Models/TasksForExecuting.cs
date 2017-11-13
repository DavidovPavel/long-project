using System;

namespace www.Models
{
    public class TasksForExecuting
    {
        public int MainObject { get; set; }
        public Guid[] TaskTypeIDs { get; set; }

        /// <summary>
        /// Автоматический запуск извлечения фактов из собрынных источников
        /// </summary>
        public bool AutoSelect { get; set; }
    }
}