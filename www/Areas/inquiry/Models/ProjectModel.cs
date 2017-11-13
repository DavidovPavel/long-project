using www.Areas.ExpressDossier.Models;

namespace www.Areas.inquiry.Models
{
    public enum ProjectState
    {
        None,
        InWork,
        Finished,
        Suspended,
        Archived
    }

    public enum ProjectStatus
    {
        None,
        Positive,
        Questionable,
        Negative,
        NotEnoughData
    }

    public class ProjectModel
    {
        public int projectId { get; set; }
        public string projectName { get; set; }

        /// <summary>
        /// Код проекта - максимальная длина 50 символов
        /// </summary>
        public string projectCode { get; set; }

        /// <summary>
        /// Перечень привязанных рубрик
        /// </summary>
        public RubricsDescriptionModel[] Rubrics { get; set; }

        /// <summary>
        /// Реузльтат (положительный, выявлен негатив и т.д) <see cref="ProjectStatus"/>
        /// </summary>
        public int? projectStatus { get; set; }

        /// <summary>
        /// Состояние - идентификатор (в работе, завершено и т.д.) <see cref="ProjectState"/>
        /// </summary>
        public int? projectState { get; set; }

        /// <summary>
        /// Текстовое представление для ProjectState
        /// </summary>
        public string state { get; set; }
    }

    public class ProjectRoleModel
    {
        public int ID { get; set; }
        public string ProjectRoleName { get; set; }
    }

}
