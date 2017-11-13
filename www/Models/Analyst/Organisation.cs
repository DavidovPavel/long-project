using www.Models.Items;

namespace www.Models.Analyst
{
    /// <summary>
    /// Организация для поиска при добавлении
    /// </summary>
    public class Organisation : ListElement
    {
        public string inn { get; set; }
        public string ogrn { get; set; }
        public string ogrnip { get; set; }
        public string okpo { get; set; }
    }
}