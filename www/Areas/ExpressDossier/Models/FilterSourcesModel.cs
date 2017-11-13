using System.Collections.Generic;

namespace www.Areas.ExpressDossier.Models
{
    public class FilterSourcesModel
    {
        /// <summary>
        /// Это справочные значения, с которыми связан источник
        /// </summary>
        public List<int> DicItems { get; set; }
        /// <summary>
        /// Это фраза, которая может встретиться в заголовке, описании, тексте источника
        /// </summary>
        public string SearchText { get; set; }
    }
}