namespace www.Models.Items
{
    public class TreeElement
    {
        public string id { get; set; }
        public string parentid { get; set; }
        public string title { get; set; }
        public string sysName { get; set; }
        public int? children { get; set; }
        public bool iconexist { get; set; }
        public string iconurl { get; set; }
        public bool isdoc { get; set; }
        public QueryParameter[] parameters { get; set; }
        public int[] parents { get; set; }

        /// <summary>
        ///  0  - нормальный запрос (по умолчанию)
        /// -1  - запрос неккоректный возникли проблемы на момент инициализации внутренних структур (не подлежит исполнению)
        ///        такой запрос выделятся от остальных
        /// </summary>
        public int status { get; set; }

        /// <summary>
        /// Описание к статусу. Выводим, если присутствует (как правило это текст ошибки к статусу -1)
        /// </summary>
        public string msg { get; set; }
        public int? linkedObjectCount { get; set; }
        /// <summary>
        /// Дата создания (DateTime Ticks), используется для сортировки
        /// </summary>
        public long? cdate { get; set; }
    }
}