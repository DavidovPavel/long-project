using www.Models.Ex.Feed;

namespace www.Models.ExtSrv
{
    public class DataPackTable : DataPackBase
    {
        /// <summary>
        /// Данные
        /// </summary>
        public ContentCollection feed { get; set; }
    }
}