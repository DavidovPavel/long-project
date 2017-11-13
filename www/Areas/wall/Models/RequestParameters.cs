using System.Collections.Generic;
using www.Models;

namespace www.Areas.wall.Models
{
    public class RequestParameters
    {
        public int rid { get; set; }
        public string title { get; set; }
        public string domain { get; set; }
        public int dbase { get; set; }
        public int requestid { get; set; }
        public List<QueryParameter> parameters { get; set; }
        public int pagesize { get; set; }
        public string viewType { get; set; }
        public bool? useDefParams { get; set; }
        public bool IsInvalid { get; set; }
        public string requestTitle { get; set; }
        public string dbTitle { get; set; }

        /// <summary>
        /// Использовать заданное правило для трансформации полученных данных
        /// </summary>
        public string ruleCode { get; set; }
    }
}