using System;
using System.Collections.Generic;

namespace www.Areas.ExpressDossier.Models
{
    public class SourceModel
    {
        public Guid id { get; set; }
        public string title { get; set; }
        public Dictionary<int, string> property { get; set; }
        public decimal price { get; set; }
        public string currency { get; set; }
        public string description { get; set; }
        public string logoUrl { get; set; }
        public string text { get; set; }
    }
}