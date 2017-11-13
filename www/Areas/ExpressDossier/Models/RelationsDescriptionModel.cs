using System.Collections.Generic;

namespace www.Areas.ExpressDossier.Models
{
    public class RelationsDescriptionModel
    {
        /// <summary>
        /// 0 - Roles представлено строкой, где множество ролей отделяются друг от друга запятой
        /// </summary>
        public int Kind { get; set; }

        /// <summary>
        /// Данные по ролям (способ представления зависит от Kind)
        /// </summary>
        public Dictionary<string, int> Roles { get; set; }
    }
}