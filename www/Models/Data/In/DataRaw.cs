using System;
using System.Data;
using www.Models.Data.Common;
using www.Models.Data.Logic;

namespace www.Models.Data.In
{
    /// <summary>
    /// Представляет результаты выполненого SA запроса
    /// </summary>
    public class DataRaw
    {
        /// <summary>
        /// Данные
        /// </summary>
        public DataTable data { get; set; }
        /// <summary>
        /// Общее количество записей
        /// </summary>
        public int TotalRecordCount { get; set; }
        /// <summary>
        /// Размер страницы
        /// </summary>
        public int PageSize { get; set; }
        /// <summary>
        /// Текущая страница
        /// </summary>
        public int Page { get; set; }

        /// <summary>
        /// Получает требуемый парсер для соответствующего вида визуализации
        /// </summary>
        /// <param name="vType"></param>
        /// <returns></returns>
        public ParserDataRaw ParserGet(VisualizatonType vType)
        {
            return ParserDataRaw.GetInstance(data.DataSet.Tables[0], vType);
        }
    }
}
