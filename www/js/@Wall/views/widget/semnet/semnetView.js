define('widget.semnet.semnetView', [], function () {

    var ZOOM_MIN = 0.125,
       ZOOM_MAX = 6;

    var semnetModel = Backbone.Model.extend({

        defaults: {
            astree: 0,
            eparam: [0, 0, 0],
            filter: null,
            filterName: null,
            filterValue: null,
            height: 0,
            html: '',
            level: 0,
            snid: -1,
            title: '',
            width: 0
        }

    });

    return Mn.View.extend({

        template: _.template('<svg><g class="wrap"></g></svg>'),

        events: {

            'mouseover g.node[data-objectid]': function (e) {

                var $e = $(e.currentTarget),
                   id = parseInt($e.attr('data-objectid'));

                if (!isNaN(id) && id)
                    $e.css('cursor', 'pointer');
            },

            'mouseout g.node[data-objectid]': function (e) {
                $(e.currentTarget).css('cursor', 'default');
            },

            'click g.node[data-objectid]': function (e) {

                var $e = $(e.currentTarget),
                    id = parseInt($e.attr('data-objectid'));

                if (!isNaN(id) && id)
                    this.trigger('subscribers:reflect', new Backbone.Model({ 'object_id': id, requestID: this.options.RID }));

            }
        },

        initialize: function () {

            this.model = new semnetModel;
            this.model.url = '/api/SemNet/' + this.options.objectID + '/?semnetid=-1&layout=' + this.options.widget.get('SNLayout') +
                '&level=' + this.options.widget.get('SNLevel') +
                '&astree=' + this.options.widget.get('SNStruct');

            this.listenTo(this.options.widget, 'change:width', function (m) { this._fitSize(m); });

            this.listenTo(this.options.widget, 'change:height', function (m) { this._fitSize(m); });

        },

        onRender: function () {            

            if (!this.options.RID)
                console.error('!Not requestID!');

            $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.headers.key, { RID: this.options.RID });

            this.model.fetch();
        },

        modelEvents: {

            'change:html': function (m, v) {

                var width = this.options.container.width(),
                    height = this.options.container.height();

                this.$('g.wrap').html($(v).html());

                var svg = d3.select(this.$('svg').get(0)),
                    g = svg.select('g.wrap'),

                    zoom = d3.zoom()
                        .scaleExtent([ZOOM_MIN, ZOOM_MAX])
                        .on("zoom", function () {
                            g.attr("transform", d3.event.transform);
                        })
                        .on("end", function () {
                            //this._setCenter(d3.event.transform);
                        }.bind(this)),

                 dx = this.model.get('width'),
                 dy = this.model.get('height'),
                 x = dx / 2,
                 y = dy / 2,
                 scale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, 0.9 / Math.max(dx / width, dy / height))),
                 translate = [width / 2 - scale * x, height / 2 - scale * y];

                svg
                    .attr('width', width)
                    .attr('height', height)
                    .call(zoom)
                    .transition()
                    .duration(750)
                    .call(zoom.transform, d3.zoomIdentity
                        .translate(translate[0], translate[1])
                        .scale(scale));

            },

            request: function () {
                Backbone.Radio.channel('loader').trigger('show', this.$el, { speed: 'fast' });
            },

            sync: function () {
                Backbone.Radio.channel('loader').trigger('hide');
            },

            error: function () {
                Backbone.Radio.channel('loader').trigger('hide');

            }
        },

        _fitSize: function (m) {

            //this.render();
        },
       
        _setCenter: function (x, y, d) {

            // для сохранения позиции и масштаба

            var model = {
                name: this.options.widget.get('title'),
                type: this.options.widget.get('typeName'),
                uid: this.options.widget.id,
                Visualization: this.options.widget.get('Visualization')
            }

            var m = new Backbone.Model({
                widget: model,
                objectID: this.model.id,
                SNX: x,
                SNY: y,
                SNZoom: d
            });

            m.url = "/api/widget/" + this.options.widget.id + "/setstate";
            m.save();

        }

    });

});