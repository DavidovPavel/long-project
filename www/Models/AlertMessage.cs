using System;
using System.Collections.Generic;
namespace www.Models
{
    public class AlertMessage
    {
        public string eqID { get; set; }
        public Guid id { get; set; }

        /// <summary>
        /// -1 - сообщение от системы (ожидайте... т.е без feedback-а)
        /// 1 - уточнение по задаче (присутствует выбор пользовательский ввод); 
        /// 2 - капча 
        /// 3 - особый тип уведомлнений для передачи сведений (к пр. egrul и т.д) 
        /// </summary>
        public int typeid { get; set; }

        /// <summary>
        /// Пока всегда message, остальные значения зарезервированны для будущего использования
        /// </summary>
        public AlertKind kind { get; set; }
        /// <summary>
        /// Пока всегда hot, остальные значения зарезервированны для будущего использования
        /// </summary>
        public string state { get; set; }  //StateAlert сериализованный

        public string title { get; set; }
        public string description { get; set; }
        public string html {get; set; }
        public string cdate { get; set; }

        /// <summary>
        /// На клиенте пока не используется, но он характеризует объект с которым связано сообщение
        /// </summary>
        public string mainObjectID { get; set; }
        
        /// <summary>
        /// Идентификатор задачи (в случае с алертом позволяет установить сессию между запуском и выбором компании)
        /// </summary>
        public Guid? taskUID { get; set; }
    }

    public enum AlertKind : int
    {
        message = 0,
        warning = 1,
        error = 2
    }

    public enum StateAlert
    {
        hot,
        cold,
        frozen
    }

    class AlertMessageComparer : IEqualityComparer<AlertMessage>
    {
        public bool Equals(AlertMessage left, AlertMessage right)
        {
            return String.CompareOrdinal(left.eqID, right.eqID) == 0;
        }

        public int GetHashCode(AlertMessage alert)
        {
            return alert.id.GetHashCode();
        }
    }

    class AlertMessageComparerByUID : IEqualityComparer<AlertMessage>
    {
        public bool Equals(AlertMessage left, AlertMessage right)
        {
            return left.id == right.id;
        }

        public int GetHashCode(AlertMessage alert)
        {
            return alert.id.GetHashCode();
        }
    }

}