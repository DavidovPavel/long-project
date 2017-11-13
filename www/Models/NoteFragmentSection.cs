namespace www.Models
{
    /// <summary>
    /// Секция пояснительной записки
    /// </summary>
    public class NoteFragmentSection
    {
        public int id { get; set; }
        public int pid { get; set; }
        public string title { get; set; }
        public string parentTitle { get; set; }
    }
}