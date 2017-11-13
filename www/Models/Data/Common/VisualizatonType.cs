namespace www.Models.Data.Common
{
    /// <summary>
    /// ¬арианты визуализации данных в системе
    /// ƒанное перечисление кросс-модульное (должно использоватьс€ и дл€ Dashboards и др. модулей)
    /// </summary>
    public enum VisualizatonType
    {
        Unknown,
        WidgetTable,
        WidgetGraph,
        WidgetCloud
    }
}