using www.Models.Data.Out.Base;

namespace www.Models.ExtSrv
{
    public class DataPack<T>: DataPackBase where T: RuleSetTransformationResultBase
    {
        public T data { get; set; }
    }
}