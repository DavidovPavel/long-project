using System.Collections.Generic;
using www.Models.Ex;
using www.Models.Ex.Feed;

namespace www.Models.ExtSrv
{
    public class DataPackTableUpdate
    {
        public string msg { get; set; }
        public List<ContentItem> posts { get; set; }
        public string ts { get; set; }
    }
}