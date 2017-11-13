using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace www.Models
{
    public class ModelOptionsForExportData
    {
        public int[] list { get; set; }
        public bool obj_doc { get; set; }
        public bool obj_fact { get; set; }
        public bool obj_fact_doc { get; set; }
        public bool obj_fact_obj { get; set; }
        public bool fact_doc { get; set; }
        public bool fact_obj { get; set; }
        public bool doc_fact { get; set; }
        public bool doc_obj { get; set; }
    }
}