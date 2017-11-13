using System.Collections.Generic;

namespace www.Areas.wall.Models
{
    public class Param
    {
        public int id { get; set; }
        public string ParamName { get; set; }
        public string ParamTitle { get; set; }
        public Dictionary<string, string> ParamValues { get; set; }
    }
}