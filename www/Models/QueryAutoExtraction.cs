using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace www.Models
{
    public class QueryAutoExtraction
    {
        public int MainObject { get; set; }
        public int[] Sources { get; set; }

        public bool? Marked_Persons { get; set; }
        public bool? Marked_Object { get; set; }
        public bool? Marked_Region { get; set; }
        public bool? Marked_Orgs { get; set; }

        public bool? AutoGetObjects { get; set; }
        public bool? AutoAllowDuplFacts { get; set; }
        public bool? AutoAllowDuplObjs { get; set; }

        public bool? Marked_Dates { get; set; }

        public bool? Marked_Money { get; set; }

        public bool? ShowTasksForDocs { get; set; }
    }
}