using System.Collections.Generic;
using System.Web.Http;
using www.Models;
using www.Models.Items;
using www.SaGateway;

namespace www.Controllers.api
{
    public class DictionaryController : ApiController
    {
        
        public class Autocomplete
        {
            public IEnumerable<AutocompleteItem> data { get; set; } 
        }

        [HttpGet]
        [ActionName("DefaultAction")]
        public Autocomplete ByName(string name)
        {
            var r = SDKHelper.GetDictionaryItems(name);
            var o = new Autocomplete
                        {
                            data = r
                        };
            return o;
        }
    }
}
