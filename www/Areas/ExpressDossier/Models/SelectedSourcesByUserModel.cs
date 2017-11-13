using System;
using System.Collections.Generic;

namespace www.Areas.ExpressDossier.Models
{
    public class SelectedSourcesByUserModel
    {
        /// <summary>
        /// Перечень идентификаторов источников
        /// </summary>
        public List<Guid> Sources { get; set; }
        /// <summary>
        /// Справочное значение справочника BySAType т.е. персона, организация и т.п.
        /// </summary>
        public int BySATypeSelectedValue { get; set; }

        /// <summary>
        /// Идентификатор коллекции (если коллекция только создается то null)
        /// </summary>
        public Guid? SearchPackUID { get; set; }

        /// <summary>
        /// Наименование коллекции
        /// </summary>
        public string SearchPackName { get; set; }
    }
}