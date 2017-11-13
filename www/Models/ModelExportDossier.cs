using System;

namespace www.Models
{
    /// <summary>
    /// Модель получаемая сервером на задачу экспорта html, в файл заданного формата
    /// </summary>
    public class ModelExportDossier
    {
        /// <summary>
        /// Возможные форматы
        /// </summary>
        public enum ExportKind: int
        {
            /// <summary>
            /// Значение по умолчанию = 0
            /// </summary>
            PDF
        }

        /// <summary>
        /// HTML-который будет представлен в целевом формате
        /// </summary>
        public string html { get; set; }

        /// <summary>
        /// Целевой формат
        /// </summary>
        public ExportKind kind { get; set; }

        /// <summary>
        /// Ссылка на сгенерированный файл
        /// </summary>
        public Uri url { get; set; }
    }
}