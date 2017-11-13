using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;
using System.Xml;

namespace www.Controllers
{

    public class CombineController : Controller
    {

        public ActionResult test()
        {
            return View();
        }

        public ActionResult New()
        {
            var dirs = new DirectoryInfo(Server.MapPath("/content/.barn")).GetDirectories().ToList();

            return View(dirs);
        }

        // GET: Combine
        public ActionResult Index()
        {

            var c = new DirectoryInfo(Server.MapPath("/content/._markup"))
                .GetDirectories().ToList().Where(e => { return e.Name != "!DEV"; });

            var output = new List<HtmlComponent>();

            foreach(var folder in c)
            {
                var xmlFile = folder.GetFiles("manifest.xml");
                var htmlComponent = new HtmlComponent() { Title = folder.Name, Options = new Dictionary<string, Option>() };
                if (xmlFile.Any())
                {
                    var xml = xmlFile.First();
                    var reader = XmlReader.Create(xml.FullName);

                    var data = new Dictionary<string, Option>();
                    while (reader.Read())
                    {
                        if (reader.NodeType == XmlNodeType.Element && reader.Name != "root")
                        {
                            var isHtml = reader.GetAttribute("view") == "html";
                            data.Add(reader.Name, new Option(){ isHtml = isHtml, Value = reader.ReadElementContentAsString() });
                        }
                    }
                    
                    htmlComponent.Options = data;
                    reader.Close();
                }
                    
                output.Add(htmlComponent);
            }

            return View(output);
        }
    }

    public class Option
    {
        public bool isHtml { get; set; }
        public string Value { get; set; }
    }

    public class HtmlComponent
    {
        public string Title { get; set; }
        public Dictionary<string, Option> Options { get; set; }
    }
}