using System;
namespace www.Models
{
    public class SearchTask
    {
        public string title { get; set; }
        public Guid id { get; set; }
        public string state { get; set; }
        public string status { get; set; }
        public int severity { get; set; }
        public string details { get; set; }
        public int objID { get; set; }
        public int searchSATaskID { get; set; }
    }
}
