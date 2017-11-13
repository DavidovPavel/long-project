using System;
using System.Collections.Generic;
using System.Linq;
using Anbr.Web.SA.CoreLogic.Model;

namespace www.Models
{

    public class EdgeGroup
    {
        public string GroupTitle { get; set; }
        public Edge[] Edges { get; set; }
        public string ClassName { get; internal set; }
    }


    /// <summary>
    /// Модель для грани
    /// </summary>
    public class Edge
    {
        public int[] XY { get; set; }
        public int[] WH { get; set; }
        public int ID { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Url { get; set; }
        public Theme Theme { get; set; }
        public bool Enabled { get; set; }
        public bool Visible { get; set; }
        public string Code { get; set; }
        public bool UrlAbsolute { get; set; }
        public string Area { get; internal set; }

        public static EdgeDTO ToEdgeDTO(Edge edge)
        {
            return new EdgeDTO()
            {
                Description = edge.Description,
                EdgeID = edge.ID,
                EdgeUrl = edge.Url,
                Title = edge.Title,
                WH = string.Join(",", edge.WH),
                XY = string.Join(",", edge.XY),
                UrlAbsolute = edge.UrlAbsolute,
                Enabled = edge.Enabled,
                Visible = edge.Visible,
                Code = edge.Code
            };
        }

        public static Edge ToEdge(EdgeDTO input)
        {
            return new Edge()
            {
                ID = input.EdgeID,
                Title = input.Title,
                Description = input.Description,
                Url = input.EdgeUrl,
                WH = input.WH.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(item => Convert.ToInt32(item)).ToArray(),
                XY = input.XY.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(item => Convert.ToInt32(item)).ToArray(),
                Enabled = input.Enabled ?? false,
                UrlAbsolute = input.UrlAbsolute ?? false,
                Visible = input.Visible ?? false,
                Code = input.Code,
            };
        }


    }
    public abstract class Theme
    {
        public string BackgroundImageUrl { get; set; }
        public string BackgroundColor { get; set; }
        public string FontColor { get; set; }
        public string BorderColor { get; set; }
    }
}