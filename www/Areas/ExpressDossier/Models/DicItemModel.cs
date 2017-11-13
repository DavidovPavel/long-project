namespace www.Areas.ExpressDossier.Models
{
    /// <summary>
    /// Элемент справочника, который описывает источник
    /// </summary>
    public class DicItemModel
    {
        public int ID { get; set; }
        public int DicID { get; set; }
        public string DicCode { get; set; }
        public string Title { get; set; }
        public int? Importance { get; set; }
        public string DicCodeItem { get; set; }
    }
}