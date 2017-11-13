namespace www.Areas.wall.Models
{
    public class DecorationInfo
    {
        public string CaptionBackground { get; set; } = "rgba(200, 188, 162, 1)";
        public string CaptionForeground { get; set; } = "rgba(51, 51, 51, 1)";

        public string ContainerBackground { get; set; } = "rgba(255, 255, 255, 1)";
        public string ContainerForeground { get; set; } = "rgba(51, 51, 51, 1)";
        public string ContainerBackgroundHover { get; set; } = "rgba(195, 195, 195, 1)";
        public string ContainerForegroundHover { get; set; } = "rgba(60, 60, 60, 1)";
        public string ContainerBackgroundVisited { get; set; } = "rgba(255, 255, 255, 1)";
        public string ContainerForegroundVisited { get; set; } = "rgba(0, 0, 0, 0.53)";
        public string ContainerBackgroundActive { get; set; } = "rgba(215, 215, 215, 1)";
        public string ContainerForegroundActive { get; set; } = "rgba(43, 43, 43, 1)";

        public string LinkForeground { get; set; } = "rgba(70, 127, 212, 1)";
        public string LinkBackground { get; set; } = "rgba(0, 0, 0, 0)";

        public bool CaptionIsVisible { get; set; } = true;
        public bool ContainerIsTransparent { get; set; } = false;
        public bool BorderIsVisible { get; set; } = true;
    }
}