define( 'global.charts.settingsmodel', [], function () {

    return Backbone.Model.extend( {

        defaults: function () {

            return {

                /* Базовая настройка */

                //Наименование графика
                chartTitle: '',


            	/* Настройка подсказки */

				// свойство для снятия атрибута dir=auto у .anbr_list т.к. диаграммы поддерживают направление автоматически
                enableRTL: false, // dir=auto

                // Показать всплывающую подсказку
                tooltipVisible: true,

                //Формат всплывающей подсказки
                tooltipFormat: '#series.name# : #point.y#',

                // Маркер данных
                markerVisible: true,
                markerShape: 'circle',
                markerHeight: 10,
                markerWidth: 10,

                // Метка данных
                dataLabelVisible: false,
                dataLabelPosition: 'top',
                dataLabelOpacity: 0.5,

                /* Настройка легенды */

                // Показывать легенду
                legendVisible: false,

                // Заголовок легенды
                legendTitle: '',

                // Расположение легенды
                legendPosition: 'Bottom',       // Left, Right, Top, Bottom (default)

                // Количество рядов в легенде
                legendRowCount: null,           // Number of rows to arrange the legend items.

                // Толщина границы легенды
                legendBorderSize: 0,

                //  Цвет границы легенды
                legendBorderColor: 'transparent',



                /* Настройка осей */

                // exclude pie

                // Показывать ось X
                primaryXAxisVisible: true,

                //  Наименование оси X
                primaryXAxisTitle: '',

                // Расположение меток на оси X
                primaryXAxislabelIntrsectAction: 'Trim',

                // Показывать ось Y
                primaryYAxisVisible: true,

                //  Наименование оси Y
                primaryYAxisTitle: '',

                // Расположение меток на оси Y
                primaryYAxislabelIntrsectAction: 'Trim',

                /*
                
                None	string	no action will be perform in axis labels 
                Rotate90	string	Displays axis labels with 90 degree
                Rotate45	string	Displays axis labels with 45 degree
                Wrap	string	Axis labels will be Wrap
                WrapByword	string	Axis labels will be Wrap by word
                Trim	string	Axis labels will be trimmed
                Hide	string	Axis labels will be hide when overlap to others
                MultipleRows	string	Axis labels will display the next line when overlap to others
                
                */


                /* Настройка колонок */

                // column, bar, stackingColumn100, stackingColumn, bar


                //Ширина колонки
                columnWidth: 0.7, //Было 1

                // Рассотяние между колонками
                columnSpacing: 0,


                /* График */

                // line

                // Ширина линии
                lineWidth: 2,

                
                /* Настройка секций (круговая диаграмма) */

                // pie

                // series.pieCoefficient - Диаметр круга 0-1
                pieSize: 0.8,

                // Индекс отделенного сегмента
                //explodedIndex: null,

                // Отделять все сегменты
                explodeAllSegments: false,

                // series.explode отделять сегмент при наведении
                explodeOnMouseOver: false,



                /* Настройки цветов */


                colorSettings: false
            };

        }
    });
});