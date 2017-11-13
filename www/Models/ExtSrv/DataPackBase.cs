namespace www.Models.ExtSrv
{
    public class DataPackBase
    {
        /// <summary>
        /// Сообщение об ошибке. Если ошибки нет - не задано
        /// </summary>
        public string msg { get; set; }

        /// <summary>
        /// Метка актуальности набора
        /// </summary>
        public string ts { get; set; }
    }
}