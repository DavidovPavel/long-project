define('settings.visualization.cloud', ['i18n!nls/resources.min', 'settings.colorRow', 'global.view.dropDown', 'global.behaviors.input'], function (Resources, colorRow, dropDown, inputBehavior) {

    var formView = Mn.View.extend({

        behaviors: {
            input: inputBehavior
        },

        template: '#cloud-form-template',
        templateContext: {
            Resources: Resources
        },

        regions: {
            shape: { el: '#cloud-shape', replaceElement: true },
        },

        onBeforeRender:function(){

            if (!this.model.has('shapeCloud'))
                this.model.set('shapeCloud', 'elliptic');
        },

        onRender: function () {

            this.showChildView('shape', new dropDown({
                collection: new Backbone.Collection([
                    { id: 'elliptic', title: Resources.cse },
                    { id: 'rectangular', title: Resources.csr },
                ])
            }));

            this.getChildView('shape').setCurrent(this.model.get('shapeCloud')).$el.css('display', 'block');

        }

    });

    return Mn.View.extend({

        template: '#cloud-settings-template',

        regions: {
            color: { el: '#color-rows', replaceElement: true },
            form: { el: '#form-settings', replaceElement: true }
        },

        onRender: function () {

            var p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: "WidgetCloud.SubSettings" }) || {},

                m = new Backbone.Model({
                    minFontSizeCloud: 10,
                    maxFontSizeCloud: null,
                    shapeCloud: 'elliptic'
                });

            if (p)
                m.set(p.WidgetParamValue);

            this.showChildView('form', new formView({ model: m }));

            this.showChildView('color', new colorRow({ model: this.model, collection: this.collection }));

        },

        collectionEvents: {

            reset: function () {
                this.onReset();
            }

        },

        onSave: function () {

            var ch = Backbone.Radio.channel('chW'),
                p1 = ch.request('get:param:model', this.model.get('Characteristics'), "WidgetCloud.SubSettings"),
                p2 = ch.request('get:param:model', this.model.get('Characteristics'), 'PaletteByChart');

            var formData = $.GetData(this.getChildView('form').$el);
            formData.shapeCloud = this.getChildView('form').getChildView('shape').current.id;

            p1.set('WidgetParamValue', formData);
            p2.set('WidgetParamValue', this.getChildView('color').getChildView('list').collection.toJSON());

            var saveCollection = Backbone.Radio.channel('chW').request('get:params:collection', this.model.id);
            saveCollection.add([p1, p2]);

            saveCollection.fetch({
                success: function (m) {
                    this.model.save({ Characteristics : m.toJSON()});
                }.bind(this)
            });

        },

        onReset: function () {

            var p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: 'PaletteByChart' });

            if (p)
                _.each(p.WidgetParamValue, function (o) {
                    var e = this.collection.findWhere({ object_id: o.object_id });
                    if (e)
                        e.set('color', o.color);
                }, this);


        }

    })


});