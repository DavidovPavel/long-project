namespace www.Models.Analyst
{
    public class Source
    {
        public int id { get; set; }
        public string uid { get; set; }

        public string Text { get; set; }

        /// <summary>
        /// Если Mode = 0 - показывае текст, если Mode - 9 - Показываем заглушку
        /// Mode = 1 - показываем видео
        /// Mode = 2 - показываем аудио
        /// </summary>
        public int Mode { get; set; }
        public bool IsLargeText { get; set; }
    }

    public class OrignalFileInfo
    {
        /// <summary>
        /// путь к файлу
        /// </summary>
        public string RelativePath { get; set; }
    
        public string FileName { get; set; }
        
        /// <summary>
        /// Если Mode = 0 - показывае текст, если Mode - 9 - Показываем заглушку
        /// </summary>
        public int Mode { get; set; }

        /// <summary>
        /// 0- обычная конвертация документа
        /// 1- показ pdf через pdfjs
        /// </summary>
        public int Visualization { get; set; }

        public int? Size { get; set; }
    }
}