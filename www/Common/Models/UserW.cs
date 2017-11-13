namespace www.Common.Models
{
    public class UserW
    {
        public int UserID { get; set; }
        /// <summary>
        /// Идентификатор пользователя (для STS - UID, для доменной учетки - Domain\UserName)
        /// </summary>
        public string UserUID { get; set; }
        /// <summary>
        /// Имя пользователя
        /// </summary>
        public string UserTitle { get; set; }
    }
}