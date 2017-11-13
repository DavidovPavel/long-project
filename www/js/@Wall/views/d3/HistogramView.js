define('d3:histogram', ['global.charts.settingsmodel'], function (subSettings) {

    return Mn.View.extend({

        template: _.template(''),

        initialize: function () {

            this.flag = false;
            this.isGrouped = false;
            this.Grops = {};
            var items = this.options.items.variations[1].flow[0].points;
            this.dx = [];
            this.collection = new Backbone.Collection();

            var name = this.model.get('typeName') + ".GhaphSubSettings";
            var p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: name });

            this.subSettings = new subSettings;

            if (p)
                this.subSettings.set(p.WidgetParamValue);

            _.each(items, function (m) {

                var z = {
                    id: m.elId,
                    x: m.x,
                    y: parseFloat(m.y),
                    title: m.text //_.findWhere(this.model.get('feed').head, { systemName: 'yval' }).displayName
                };

                var e = this.collection.get(z.id),
                    date = new Date(z.x),
                    xout = z.x;

                if (date.toString() !== "Invalid Date") {
                    xout = date;
                    this.flag = true;
                }

                if (this.dx.indexOf(xout) === -1)
                    this.dx.push(xout);

                if (e) {
                    var ys = e.get("y");
                    ys.push(z.y);
                    e.set("y", ys);
                } else {
                    z.y = [z.y];
                    this.collection.add(z);
                }

            }, this);
        },

        onBeforeRender: function () {

            this.$el.css({ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 });
        },

        onRender: function () {

            var columns = [];

            this.collection.each(function (m, i) {

                var ay = m.get("y"),
                    gid = m.get("GroupName");

                if (this.dx.indexOf("x") === -1)
                    this.dx.unshift("x");

                if (ay.length !== 1) {
                    columns.push(this.dx);
                    ay.unshift(m.get("title"));
                } else
                    ay.unshift(m.get("x"));

                columns.push(ay);

                if (gid) {
                    this.isGrouped = true;
                    if (!this.Grops[gid])
                        this.Grops[gid] = [m.get("x")];
                    else {
                        this.Grops[gid].push(m.get("x"));
                    }
                }

            }, this);

            var data = {
                columns: columns,
                type: this.options.chart || 'bar'
            },
                axis = {
                    y: {
                        label: this.subSettings.get('primaryYAxisTitle')
                    }
                },
                groups = [],
                category = [];

            if (this.flag) {
                data.x = "x";
                axis.x = {
                    type: 'timeseries',
                    tick: {
                        format: '%Y-%m-%d'
                    }
                };
            }

            if (this.isGrouped) {
                for (var a in this.Grops) {
                    groups.push(this.Grops[a]);
                    category.push(a);
                    if (category.length >= 2) {
                        _.each(columns, function (a) {
                            _.each(groups, function (g, i) {
                                if (_.contains(g, a[0]))
                                    a.splice(i + 1, 0, 0);
                            });
                        });
                    }
                }

                axis.x = {
                    type: 'category',
                    categories: category
                };
                data.groups = groups;
            }

            try {

                c3.generate({

                    bindto: this.el,
                    data: data,
                    tooltip: {
                        grouped: false,
                        format: {
                            title: function (d) {
                                return this.title;
                            }
                        }
                    },
                    axis: axis,
                    bar: {
                        width: {
                            ratio: 0.5
                        }
                    }
                });

            } catch (e) {

                console.error(e.message, data);
            }
        }
    });

});