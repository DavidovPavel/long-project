define('settings.colorRow', ['i18n!nls/resources.min', 'RU'], function (Resources) {

    var listCollection = Mn.CollectionView.extend({

        childView: Mn.View.extend({

            template: _.template('<span style="cursor:pointer;line-height:28px;padding-left:6px;"><%- display_name %></span><span class="reload" style="float:right;display:block;margin-top:9px;" data-icon="icon-reload"></span><span class="picker" style="display:inline-block;width:40px;height:16px;margin-top:6px;float:right;cursor:pointer;background-color:<%- color %>;border:solid 1px gray;"></span>'),

            ui: {
                picker: '.picker'
            },

            triggers: {
                'click @ui.picker': 'click:item'
            },

            events: {

                'click .reload': function (e) {
                    e.stopPropagation();
                    this.model.set('color', 'none');
                }
            },

            modelEvents: {

                'change:color': function (m, c) {
                    this.ui.picker.css('background', c);
                }

            }

        }),

        childViewOptions: function (m) {
            if (!m.has('color'))
                m.set('color', 'none');
        },

        childViewTriggers: {
            'click:item': 'click:item'
        }


    });

    return Mn.View.extend({

        template: _.template('<div class="right" style="height:0px;overflow:hidden;"><input type="text" class="color-items-diagram" /></div><div class="list" style="clear:both;"></div>'),

        templateContext: {
            Resources: Resources
        },

        regions: {
            list: '.list'
        },

        onRender: function () {

            this.$('.color-items-diagram').ejColorPicker({
                enableOpacity: false,
                locale: Resources.Lang
            });

            this._prepareCollection();

        },

        collectionEvents:{

            reset: function () {

                this._prepareCollection();

            }

        },

        _prepareCollection: function () {

            var ms = this.collection,
                cc = new Backbone.Collection;

            var c = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: 'PaletteByChart' });

            var colorsValue = c ? c.WidgetParamValue : undefined;

            if (ms.length === 1) {       // 

                var one = ms.at(0);

                one.set({ object_id: null, display_name: '' });

                one.get('points').map(function (m) {

                    var color = 'none';

                    if (colorsValue) {
                        var o = _.findWhere(colorsValue, { 'object_id': m.elId });
                        if (o)
                            color = o.color;
                    }

                    cc.add(new Backbone.Model({
                        object_id: m.elId,
                        display_name: m.x,
                        color: color
                    }));

                });

            } else
                ms.map(function (m) {

                    var n = new Backbone.Model({
                        object_id: m.get('elId'),
                        display_name: m.get('name') || _.pluck(m.get('points'), 'x').join(',')
                    });


                    if (colorsValue) {
                        var o = _.findWhere(colorsValue, { 'object_id': m.get('elId') });
                        if (o)
                            n.set('color', o.color);
                    }

                    cc.add(n);
                });

            this.showChildView('list', new listCollection({ collection: cc }));

        },

        onChildviewClickItem: function (v) {

            this.$('.color-items-diagram').ejColorPicker('hide');

            this.$('.color-items-diagram').ejColorPicker({

                open: function (args) {
                    this.option('value', v.model.get('color'));
                },

                select: function (args) {
                    v.model.set('color', args.value);
                }
            });

            this.$('.color-items-diagram').ejColorPicker('show');
        }
    });
});