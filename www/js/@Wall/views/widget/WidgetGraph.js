define('@widget.WidgetGraph', ['i18n!nls/resources.min', 'ejChartView', 'd3:histogram', 'chartsRepository'],

    function (Resources, chartView, d3Histogram, repository) {


        return Mn.View.extend({

            template: _.template('<div class="graph"></div>'),
            templateContext: { Resources: Resources },

            regions: {
                graph: { el: '.graph', replaceElement: true }
            },

            onAttach: function () {

                var visualization = this.model.get("Visualization") || "bar",
                    name = visualization.split('_');

                var p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: "WidgetGraph.GhaphSubSettings" });

                if (p) {
                	p = p.WidgetParamValue;

                	if (p.enableRTL)
                		this.$el.closest('.anbr_list').removeAttr('dir');
                	else
                		this.$el.closest('.anbr_list').attr('dir', 'auto');
                }

                if (name.length && name[1] === 'd3')
                    this.showChildView('graph', new d3Histogram({ items: this.model.get('feed'), model: this.model, chart: name[0] }));

                else if (name[0] !== 'tagCloud') {

                    var s = _.findWhere(repository, { type: visualization }) || { type: visualization },
                        o = this.model.get('feed').variations[0],
                        m = new Backbone.Model(_.extend(s, o));

                    m.set({
                        height: this.$el.parent().height().toString(),
                        width: this.$el.parent().width().toString()
                    });

                    this.showChildView('graph', new chartView({ model: m, subset: p, palette: _.findWhere(this.model.get('Characteristics'), { WidgetParamName: 'PaletteByChart' }) }));

                }

            },

            modelEvents: {

                'change:width': function () {
                    this._fitSize();
                },

                'change:height': function () {
                    this._fitSize();
                }

            },

            childViewEvents: {

                'chart:selected': function (v) {

                }

            },

            _fitSize: function () {

                var visualization = this.model.get("Visualization") || "bar",
                    name = visualization.split('_');

                if (name.length && name[1] === 'd3') {

                }
                else if (name[0] !== 'tagCloud') {

                    var m = this.getChildView('graph').model;

                    var p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: "WidgetGraph.GhaphSubSettings" });

                    if (p) p = p.WidgetParamValue;

                    m.set({
                        height: this.$el.parent().height().toString(),
                        width: this.$el.parent().width().toString()
                    });


                    this.showChildView('graph', new chartView({ model: m, subset: p, palette: _.findWhere(this.model.get('Characteristics'), { WidgetParamName: 'PaletteByChart' }) }));
                }
            }


        });

    });