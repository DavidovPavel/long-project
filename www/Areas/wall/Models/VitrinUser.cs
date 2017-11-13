namespace www.Areas.wall.Models
{
    public class VitrinUser
    {
        /// <summary>
        /// Уровень доступа к витрине
        /// </summary>
        public enum AccessType
        {
            Readonly = 0,
            ReadAndWrite = 1
        }

        public int UserID { get; set; }
        /// <summary>
        /// Идентификатор пользователя (для STS - UID, для доменной учетки - Domain\UserName)
        /// </summary>
        public string UserUID { get; set; }
        /// <summary>
        /// Имя пользователя
        /// </summary>
        public string UserTitle { get; set; }
        /// <summary>
        /// Уровень доступа к витрине
        /// </summary>
        public AccessType Access { get; set; }
    }
}