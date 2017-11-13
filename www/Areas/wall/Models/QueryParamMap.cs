namespace www.Areas.wall.Models
{
    /// <summary>
    /// Описывает связь между заданным параметром и носителем значения, 
    /// которым параметр должен быть заполнен
    /// </summary>
    public class QueryParamMap
    {
        /// <summary>
        /// Идентификатор цепочки
        /// </summary>
        public int? QueryParamsMapID { get; set; }
        /// <summary>
        /// Идентификатор параметра
        /// </summary>
        public int QueryParamID { get; set; }
        /// <summary>
        /// Идентификатор запроса, который несет поле со значением
        /// </summary>
        public int QueryID { get; set; }
        /// <summary>
        /// Системное имя поля, носителя значения
        /// </summary>
        public string ColumnSystemName { get; set; }
    }
}