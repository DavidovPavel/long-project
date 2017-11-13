using System;
using System.Collections.Generic;

namespace www.Models
{
    /// <summary>
    /// профиль пользователя для поисковых задач
    /// </summary>
    public class SearchProfile
    {
        public int ProfileID { get; set; }
        public bool IsDefault { get; set; }
        public List<Guid> MBFTaskTypes { get; set; }
        public string title { get; set; }
        public bool isCommon { get; set; }
    }
}