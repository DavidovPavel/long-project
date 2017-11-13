using System;

namespace www.Areas.wall.Models
{
    /// <summary>
    /// Модель клиента с данными по клонированию виджетов
    /// </summary>
    public class ClonningData
    {
        /// <summary>
        /// заданный набор виджетов
        /// </summary>
        public Guid[] widgets { get; set; }
        
        /// <summary>
        /// заданный набор витрин
        /// </summary>
        public Guid[] vitrins { get; set; }
    }
}