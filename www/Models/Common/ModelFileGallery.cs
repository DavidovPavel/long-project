using System;

namespace www.Models.Common
{
    public abstract class ModelFile
    {
        /// <summary>
        /// Относительная ссылка на файл
        /// </summary>
        public string FileUrl { get; set; }
        /// <summary>
        /// Оригинальное имя файла
        /// </summary>
        public string OriginalFileName { get; set; }
    }

    /// <summary>
    /// Модель файла для галлереи
    /// </summary>
    public class ModelFileGallery : ModelFile
    {
        public Guid FileUID { get; set; }

        /// <summary>
        /// Дата добавления файла
        /// </summary>
        public DateTime CDate { get; set; }
    }

    public class ModelFileConverted : ModelFile
    {
        /// <summary>
        /// Ссылка, по которой можно проверить результаты конверации
        /// </summary>
        public string ConvertedCheckLink { get; set; }
        
        /// <summary>
        /// 0 - Необходима конверация
        /// 1 - В работе
        /// 404 - модуль конвертации не обнаружен
        /// 500 - в процессе конверации возникла ошибка
        /// 200 - конвертация прошла успешно
        /// -1 - Данные отсутствуют
        /// </summary>
        public int Status { get; set; }
        
        /// <summary>
        /// Ссылка на файл оригинала
        /// </summary>
        public string FileOriginalUrl { get; set; }
    }
}