using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace www.Models.ExpressDossier
{
    public class ModelStartedCheckData
    {
        public int? checkId { get; set; }
        public List<Tuple<Guid, string>> typesOfSearchTasks { get; set; }
        public int id { get; set; }
        public Guid? checkUid { get; set; }
    }
}