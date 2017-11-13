using System;

namespace www.Areas.ExpressDossier.Models
{
    public class SearchPackModel
    {
        public Guid SearchPackUID { get; set; }
        public string SearchPackName { get; set; }
        public bool IsSystem { get; set; }
        public int SourcesCount { get; set; }
        public decimal Sum { get; set; }
    }
}