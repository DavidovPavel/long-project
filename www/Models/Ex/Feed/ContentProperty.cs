namespace www.Models.Ex.Feed
{
    public class ContentProperty : BaseProperty
    {
        public bool readonlymode { get; set; }
        public string displayName { get; set; }

        public string value { get; set; }
        public string prompt { get; set; }
        public bool isVisible { get; set; }
        public int? propType { get; set; }
        public int? dicID { get; set; }
        public bool? isMultival { get; set; }
        /// <summary>
        /// Признак того что нет метаданных
        /// </summary>
        public bool isCalc { get; set; }
        public string href { get; set; }

        /// <summary>
        /// Порядок следования
        /// </summary>
        public int num { get; set; }
    }
}