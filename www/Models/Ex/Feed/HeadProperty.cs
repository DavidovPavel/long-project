namespace www.Models.Ex.Feed
{
    public class HeadProperty : BaseProperty
    {
        public string displayName { get; set; }
        public bool isVisible { get; set; }

        /// <summary>
        /// Признак того что нет метаданных
        /// </summary>
        public bool isCalc { get; set; }

        /// <summary>
        /// Обозначает необходимость инкодить значение свойства
        /// </summary>
        public bool htmlEncoded { get; set; }

        /// <summary>
        /// Шаблон формирование значения href для cвойства
        /// </summary>
        public string template { get; set; }
    }
}