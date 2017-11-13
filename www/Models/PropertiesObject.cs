namespace www.Models
{
    public class PropertiesObject
    {
        public bool issource { get; set; }
        public int id { get; set; }
        public string uid { get; set; }
        public string html { get; set; }
        public string title { get; set; }
        public System.DateTime date { get; set; }
        public string type { get; set; }
        public int? projectId { get; set; }
        public int? projectRoleId;
        public int typeid;
    }
}