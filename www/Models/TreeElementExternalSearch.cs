using System;

namespace www.Models
{
    public class TaskTypeByCategoriesInfo
    {
        public int id { get; set; }
        public int? parentid { get; set; }
        public string title { get; set; }

        public TaskTypeInfo[] TaskTypes { get; set; }
    }

    public class GoodsInfo
    {
        public Guid id { get; set; }
        public string title { get; set; }
        public decimal? price { get; set; }
    }

    public class TaskTypeInfo
    {
        public Guid id { get; set; }
        public string title { get; set; }
        public decimal? price { get; set; }
        public int Kind { get; set; }

        public GoodsInfo[] goods { get; set; }
    }

    public class TaskTypeInfoSimple
    {
        public Guid id { get; set; }
        public string title { get; set; }
    }

}