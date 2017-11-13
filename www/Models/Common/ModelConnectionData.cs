using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace www.Models.Common
{
    public class ModelConnectionData
    {
        public Tuple<int, string> WorkgroupData { get; set; }
        public Tuple<int, string> ProjectData { get; set; }
        public Tuple<int, string> DatabaseData { get; set; }
    }
}
