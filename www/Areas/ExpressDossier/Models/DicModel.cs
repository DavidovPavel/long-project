namespace www.Areas.ExpressDossier.Models
{
    /// <summary>
    /// Справочник, который используется для описания источников
    /// </summary>
    public class DicModel
    {
        public int ID { get; set; }
        public string DicCode { get; set; }
        public int DicType { get; set; }
        public string Title { get; set; }
        public int? Importance { get; set; }

        public DicItemModel[] DicItems { get; set; }
    }
}