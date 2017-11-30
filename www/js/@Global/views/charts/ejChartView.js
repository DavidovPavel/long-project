define('ejChartView', ['i18n!nls/resources.min', 'global.charts.settingsmodel', 'RU'], function (Resources, subsetModel) {

    return Mn.View.extend({

        className: 'g--chart',

        template: _.template(''),

        initialize:function(){

            this.subModel = new subsetModel;

            if (this.options.subset)
                this.subModel.set(this.options.subset);

        },

        onBeforeRender: function () {

            this.$el.attr('id', (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase());

        },

        onRender: function () {

            var sModel = this.subModel;

            this.$el.css('display', 'inline-block');

            this._getColor();

            this.ejOptions = {

                //Initializing Series
                series: this.model.get('flow'),

                load: "loadTheme",

                //isResponsive: true, Controls whether Chart has to be responsive while resizing. - для нас не подходит
                locale: Resources.Lang,

				// 
                enableRTL: true,

                title: {
                    text:  sModel.get('chartTitle') || this.model.get('name') || "",
                    enableTrim: true
                },

                size: {
                    width: this.model.get('width'),
                    height: this.model.get('height')
                },

                //Initializing Zooming
                zooming:
                {
                    enable: true,
                    type: 'x,y',
                    enableMouseWheel: true,
                    enableScrollbar: true,
                    enableDeferredZoom: true
                },

                legend: {
                    visible: sModel.get('legendVisible'),
                    title: {
                        text: sModel.get('legendTitle')
                    },
                    enableScrollbar: false,                 
                    position: sModel.get('legendPosition'),
                    rowCount: isNaN(parseInt(sModel.get('legendRowCount'))) ? null : parseInt(sModel.get('legendRowCount')),
                    border: {
                        color: sModel.get('legendBorderColor'),
                        width: isNaN(parseInt(sModel.get('legendBorderSize'))) ? 1 : parseInt(sModel.get('legendBorderSize'))
                    }
                },

                chartClick: function (args) {

                    this.triggerMethod('chart:selected', this);

                }.bind(this)
            };

            if (this.model.get('type') === 'pie')
            {

                this.ejOptions.commonSeriesOptions =
                {
                    type: this.model.get('type'),
                    enableAnimation: true,

                    tooltip: {
                        visible: sModel.get('tooltipVisible'),
                        format: sModel.get('tooltipFormat')
                    },

                    border: {
                        width: 1,
                        color: 'white'
                    },

                    marker:
                      {
                          dataLabel:
                              {
                                  visible: sModel.get('dataLabelVisible'),
                                  shape: 'none',
                                  connectorLine: { type: 'bezier', color: 'black' },
                                  font: { size: '14px' },
                                  enableContrastColor: true
                              }
                      },

                    labelPosition: 'outsideExtended',
                    enableSmartLabels: true,
                    startAngle: 145,

                    pieCoefficient: parseFloat(sModel.get('pieSize')),
                    //explodeIndex: isNaN(parseInt(sModel.get('explodedIndex'))) ? null : parseInt(sModel.get('explodedIndex')),
                    explodeAll: sModel.get('explodeAllSegments'),
                    explode: sModel.get('explodeOnMouseOver')

                };

            }
            else
            {
                this.ejOptions.primaryXAxis = 
                {
                    visible: sModel.get('primaryXAxisVisible'),
                    title: { text: sModel.get('primaryXAxisTitle') },
                    majorGridLines: { visible: true, color: "#a9a9a9", opacity: 0.12 },
                    labelIntersectAction: sModel.get('primaryXAxislabelIntrsectAction'),
                    valueType: this.model.get('xAxisType').toLowerCase()
                };

                //Initializing Primary Y Axis	
                this.ejOptions.primaryYAxis =
                {
                    //range: { min: 0, max: 80, interval: 20 },
                    visible: sModel.get('primaryYAxisVisible'),
                    title: { text: sModel.get('primaryYAxisTitle') },
                    //range: this.getRange(),
                    majorGridLines: { visible: true, color: "#a9a9a9", opacity: 0.12 },
                    labelIntersectAction: sModel.get('primaryYAxislabelIntrsectAction'),
                    valueType: this.model.get('yAxisType').toLowerCase()
                };

                //Initializing Common Properties for all the series
                this.ejOptions.commonSeriesOptions =
                {
                    type: this.model.get('type'),
                    enableAnimation: true,

                    tooltip: {
                        visible: sModel.get('tooltipVisible'),
                        format: sModel.get('tooltipFormat')
                    },

                    marker:
                    {
                        shape: sModel.get('markerShape'),
                        size:
                        {
                            height: sModel.get('markerHeight'), width: sModel.get('markerWidth')
                        },
                        visible: sModel.get('markerVisible'),
                        dataLabel:
                        {
                            opacity: sModel.get('dataLabelOpacity'),
                            textPosition:sModel.get('dataLabelPosition'),
                            visible: sModel.get('dataLabelVisible')
                        }
                    },

                    columnWidth: parseFloat(sModel.get('columnWidth')),

                    width: parseInt(sModel.get('lineWidth')),
                };
            }

            //#4268 volkov для графиков, которые закрашивают области, области сделать полупрозрачными
            if (this.model.get('type').indexOf('area') >= 0)
                this.ejOptions.commonSeriesOptions.opacity = 0.5;
            
        },

        onAttach: function () {

            try {

                this.$el.ejChart(this.ejOptions);

            } catch (e) {

                console.error(e.message, 'chart name - ' + this.model.get('type'));

            }
        },

        _getColor: function () {

            var p = this.options.palette;
            var colorsValue = p ? p.WidgetParamValue : undefined;

            if (colorsValue) {

                var series = this.model.get('flow').map(function (el) {

                    if (el.fnId && el.fnId !== -1) {

                        var o = _.findWhere(colorsValue, { 'object_id': el.elId });

                        if (o && o.color !== 'none') {
                            el.fill = o.color;

                            el.points.map(function (a) {
                                a.fill = o.color;
                            });

                        }

                    } else {

                        var points = el.points;
                        _.map(points, function (el) {

                            var o = _.findWhere(colorsValue, { 'object_id': el.elId });

                            if (o && o.color !== 'none')
                                el.fill = o.color;

                        });

                    }

                });

            }
        }

    });

});