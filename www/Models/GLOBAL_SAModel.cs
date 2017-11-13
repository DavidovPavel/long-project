using System;
using System.Collections.Generic;
using System.Runtime.Serialization;
using Newtonsoft.Json;

namespace www.Models
{
    public class GLOBAL_SAModel
    {
        public GLOBAL_SAModel()
        {
            Meta = new Global_MetaData();
            Points = new string[0];
        }
        public GLOBAL_SAModel(string[] points)
        {
            Points = points;
            Meta = new Global_MetaData();
        }

        public string[] Points { get; set; }
        public string StartPoint { get; set; }
        public string Kind { get; set; }
        public int WGID { get; set; }
        public string NetVersion { get; set; }
        public bool Shared { get; set; }
        public string Database { get; set; }
        public string Project { get; set; }
        /// <summary>
        ///         0 - Global (т.е обычная БД), 1 - Request (режим проектов)
        /// </summary>
        public int Mode { get; set; }
        public EdgeGroup[] Edges { get; set; }
        public string Workgroup { get; set; }
        public Global_MetaData Meta { get; set; }
        public bool IsDev { get; set; }
        public bool Check(string code)
        {
            return Array.IndexOf(Points, code) != -1;
        }
    }

    public class Global_MetaData
    {
        public Dictionary<string, int> SaTypes { get; set; }
    }
}