using www.Models.Items;

namespace www.Models.Analyst
{
    /// <summary>
    /// Персона для поиска при добавлении
    /// </summary>
    public class Person : ListElement
    {
        public string bdate { get; set; }
        public string inn { get; set; }
        public string ogrn { get; set; }
        public string ogrnip { get; set; }
        public string okpo { get; set; }
        /// <summary>
        /// паспортные данные
        /// </summary>
        public string pass { get; set; }
    }
}