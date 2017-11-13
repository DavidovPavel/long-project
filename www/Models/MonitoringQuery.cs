using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace www.Models
{
    public class MonitoringQuery
    {
        public string[] TaskIds { get; set; }
        public int PageNum { get; set; }
    }

    public class MonitoringQueryInner
    {
        public string Name { get; set; }
        public List<int> TaskIds { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public string SearchStr { get; set; }
    }
}