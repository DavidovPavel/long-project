using System;

namespace www.Areas.wall.Models
{
    public class Vitrin
    {
        public Guid id { get; set; }
        public string title { get; set; }
        public bool current { get; set; }
        public bool IsShared { get; set; }
        public string Screen { get; set; }
        public VitrinaDecorationInfo Decoration { get; set; }
        public System.DateTime? CDate { get; set; }
    }
}