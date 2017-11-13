using System;
using System.Collections.Concurrent;
using ANBR.Helpful.Misc.Text;
using Newtonsoft.Json;

namespace www.Models.Ex.Feed
{
    public abstract class BaseProperty
    {
        static readonly ConcurrentDictionary<string, string> _systemNameNormalizedDic = new ConcurrentDictionary<string, string>();

        private string _systemName;
        public string systemName
        {
            get { return _systemName; }
            set
            {
                if (String.IsNullOrWhiteSpace(value)) throw new ArgumentNullException();

                rawSystemName = value.ToLower();
                _systemName = _systemNameNormalizedDic.GetOrAdd(rawSystemName, sn =>
                {
                    if (System.CodeDom.Compiler.CodeGenerator.IsValidLanguageIndependentIdentifier(sn)) return sn;

                    return "var__" +  Helper.GetHashString(sn);
                });
            }
        }

        [JsonIgnore]
        public string rawSystemName { get; private set; }
    }
}