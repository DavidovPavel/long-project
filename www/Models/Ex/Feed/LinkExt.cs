namespace www.Models.Ex.Feed
{
    public class LinkExt
    {
        /// <summary>
        /// Определяет разновидность взаимодействия
        /// </summary>
        public string rel { get; set; }
        /// <summary>
        /// Ссылка на ресурс
        /// </summary>
        public string href { get; set; }
        /// <summary>
        /// Текстовая метка
        /// </summary>
        public string prompt { get; set; }
        /// <summary>
        /// Задает механику обработки
        /// </summary>
        public string render { get; set; }
        /// <summary>
        /// Определяет способ доступа к ресурсу
        /// </summary>
        public string verb { get; set; }
        /// <summary>
        /// Идентификатор
        /// </summary>
        public string id { get; set; }
        /// <summary>
        /// Значение
        /// </summary>
        public string value { get; set; }
    }
}