define('ejCharts', ['i18n!nls/resources.min', 'global.charts.settingsmodel', 'RU'], function (Resources, subSettings) {

    return Mn.View.extend({

        template: _.template('<div id="chart_<%- id %>"></div>'),

        getColor: function (id) {

            var p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: 'PaletteByChart' });
            var colorsValue = p ? p.WidgetParamValue : undefined;

            if (colorsValue) {
                var color = _.findWhere(colorsValue, { 'object_id': id });
                return color ? color.color !== 'none' ? color.color : undefined : undefined;
            }
        },

        parseType: function (s) {
            var output;
            switch (parseInt(s.propType)) {
                case 0: //целочисленный
                    output = parseInt(s.value);
                    break;
                case 2: // date-time
                    output = $.parseDate(s.value);// + '\u0080';
                    break;
                case 4: // вещественный
                    output = parseFloat(s.value);
                    break;
                case 7: // image
                    if (s.href)
                        output = '<div style="text-align:center;"><a style="float:none;" href=' + s.href + ' target="_blank">' + s.value + '</a></div>';
                    else
                        output = '<div style="text-align:center;">' + s.value + '</div>';

                    break;
                case 1: // string
                case 3: // dictionary
                case 5: // file name
                case 6: // text              
                case 8: // html
                case 9: // giperlink
                case 10: // data
                case 11: // OLE document
                case 12: // uid
                case 13: // VarBinary
                case 14: // двоичный файл
                case 15: // денежный
                case 16: // bool
                case 17: // geo coordinates
                    output = s.value; //+ '\u0080';
            }

            return output;
        },

        checkValue: function (v, t) {
            return this.parseType({ value: v, propType: t });
        },

        enable3D: function () {
            this.options.chart = this.options.chart.replace("3D", "");
            _.extend(this.coptions, {
                enable3D: true,
                enableRotation: true,
                depth: 100,
                wallSize: 2,
                tilt: 0,
                rotation: 34,
                perspectiveAngle: 90,
                sideBySideSeriesPlacement: true
            });
        },

        isPieType:function(type) {

            var arr = ['pie', 'doughnut', 'pyramid', 'funnel'];

            return arr.indexOf(type) !== -1;
        },

        getSeries: function () {

            var seriesName = 'No name',
                series = [];

            if (this.isPie) {

                series = [

                    {
                        border: { width: 2, color: 'white' },
                        //name: 'Expenses',
                        type: this.options.chart,
                        enableAnimation: true,
                        labelPosition: 'outside',
                        startAngle: 145,
                        //explodeIndex: 0,
                        doughnutSize: 0.9,

                        points: _.chain(this.options.items)
                            .groupBy(function (o) { return o.object_id; })                            
                            .map(function (a, key) {

                                var el = a[0],
                                    x = this.checkValue(el.display_name, el.propType['display_name']),
                                    y = this.checkValue(el.yval, el.propType['yval']);

                                return {
                                    x: x,
                                    y: y,
                                    text: x + ' : ' + y,
                                    fill: this.getColor(el.object_id)
                                };

                            }, this).sortBy(function (a) { return a.y; }).value()
                    }
                ];
            }
            else {

                series = _.chain(this.options.items)
                    .groupBy(function (o) { return o.object_id; })
                    .map(function (a, key) {

                        /*
                        
                        name - наименование серии точек (линии графика)
                        если есть GroupName то име дублируется в каждом item в свойсве Display_Name
                        если нет - нет имени для графика если нет SeriesName
    
                        */
                        var one = a[0];
                        if (a.length === 1) {

                            // одна точка - серия совпадает с x

                            seriesName = one.display_name;


                        }
                        else
                            //if (seriesName === 'No name')
                        {

                            if (one.hasOwnProperty('groupname'))
                                seriesName = one.display_name;
                            else if (one.seriesname)
                                seriesName = one.seriesname;
                            else {

                                // скрываем легенду
                                var legend = this.model.get('Legend');

                                seriesName = a.display_name;  //'id: ' + key;
                                objectID = a.object_id;
                            }
                        }

                        if (this.options.chart === 'bar') {

                            //console.log('bar');

                        }

                        return {
                            name: seriesName,
                            fill: this.getColor(a[0].object_id),
                            points: _.map(a, function (p) {
                                return {
                                    x: this.checkValue(p.groupname || p.display_name, p.propType['display_name']),
                                    y: parseInt(p.yval)
                                }
                            }, this)
                        };

                    }, this).value();
            }
            return series;
        },

        getRange: function () {

            var Ymax = parseFloat(_.max(this.options.items, function (a) { return parseFloat(a.yval); }).yval),
               dY = Ymax % 10,
               YMax = Ymax - dY + 10,
               n = Math.ceil(Math.log10(YMax + 0.5)),
               si = "1";

            for (var i = 1; i < n; i++) { si += "0"; }

            return { min: 0, max: YMax, interval: parseInt(si) };
        },

        initialize: function (o) {

            this.isPie = this.isPieType(this.options.chart);

            var p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: this.model.get('typeName') + ".GhaphSubSettings" });

            this.subSettings = new subSettings;
            if (p)
                this.subSettings.set(p.WidgetParamValue);

            this.coptions = {
                series: this.getSeries(),
                locale: Resources.Lang,
                isResponsive: true,
                load: "loadTheme",
                title: { text: this.subSettings.get('chartTitle') },
                legend: {
                    visible: true
                },
                pointRegionClick: function ( args ) {
                    //Do something
                    var i = args.data.region.SeriesIndex;

                    var m = args.model.series[i].name;

                    var o = _.find( this.options.items, function ( a ) { return a.display_name === m; } );

                    this.model.trigger( 'click:item', new Backbone.Model( o ) );

                }.bind(this)
            };

            if (this.options.chart.indexOf("3D") !== -1)
                this.enable3D();

            if (!this.isPie) {

                this.coptions.primaryXAxis =
                     {
                         visible: this.subSettings.get('primaryXAxisVisible'),
                         title: { text: this.subSettings.get('primaryXAxisTitle') },
                         majorGridLines: { visible: true, color: "#a9a9a9", opacity: 0.12 },
                         labelIntersectAction: this.subSettings.get('primaryXAxislabelIntrsectAction')
                     };

                this.coptions.primaryYAxis =
                {
                    visible: this.subSettings.get('primaryYAxisVisible'),
                    title: { text: this.subSettings.get('primaryYAxisTitle') },
                    range: this.getRange(),
                    majorGridLines: { visible: true, color: "#a9a9a9", opacity: 0.12 }
                };

                this.coptions.commonSeriesOptions =
                {
                    type: this.options.chart,
                    enableAnimation: true,
                    tooltip: {
                        visible: this.subSettings.get('tooltipVisible'),
                        format: this.subSettings.get('tooltipFormat')
                    },
                    marker:
                    {
                        shape: 'circle',
                        size:
                        {
                            height: 10,
                            width: 10
                        },
                        visible: this.subSettings.get('dataLabelVisible')
                    },
                    border: {
                        width: 2
                    },
                    columnWidth: parseFloat(this.subSettings.get('columnWidth'))
                };

            }
            else {

                this.coptions.commonSeriesOptions =
               {
                   labelPosition: 'outside',
                   enableAnimation: true,
                   tooltip: {
                       visible: this.subSettings.get('tooltipVisible'),
                       format: this.subSettings.get('tooltipFormat')
                   },
                   marker:
                       {
                           dataLabel:
                               {
                                   visible: this.subSettings.get('dataLabelVisible'),
                                   shape: 'none',
                                   textPosition: 'top',
                                   border: {
                                       width: 1
                                   },
                                   connectorLine: {
                                       height: 70,
                                       stroke: "black"
                                   }
                               }
                       }
               };

            }
        },

        onRender: function () {
            this.$el.css({ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 });
        },

        onAttach: function () {

            this.coptions.size = {
                height: this.$el.height().toString(),
                width: this.$el.width().toString()
            };

            this.$('#chart_' + this.model.id).ejChart(this.coptions).data("ejChart");
        }
    });


});