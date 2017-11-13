using System;
using System.Collections.Generic;

namespace www.Models.ExtSrv
{
    /// <summary>
    /// Описывает исходные данные, необходимые для выполнения запроса формата SA
    /// </summary>
    public class DataRequestDescriptor
    {
        /// <summary>
        /// Идентификатор запроса
        /// </summary>
        public int id { get; set; }

        /// <summary>
        /// Номер текущей страницы
        /// </summary>
        public int page { get; set; }
        public int pagesize { get; set; }

        /// <summary>
        /// Флаг использования параметров по-умолчанию
        /// Заполняется только при работе с цепочками (данный флаг переопределят настройки запроса)
        /// </summary>
        public bool? useDefParams { get; set; }

        /// <summary>
        /// Параметры
        /// </summary>
        public List<QueryParameter> pars { get; set; }

        /// <summary>
        /// Метка пакета данных, полученных до этого (на основе этого же запроса)
        /// </summary>
        public string ts { get; set; }

        /// <summary>
        /// Использовать заданное правило для трансформации полученных данных
        /// </summary>
        public string ruleCode { get; set; }

        public WidgetDescriptor widget { get; set; }
    }

    /// <summary>
    /// Описывает виджет, в минимальном объеме
    /// </summary>
    public class WidgetDescriptor
    {
        public string name { get; set; }
        public string type { get; set; }
        public Guid uid { get; set; }
        public string Visualization { get; set; }
    }
}