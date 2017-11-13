define('settings.decorationWidget', ['i18n!nls/resources.min'], function (Resources) {

    function rgb2hex(rgb) {

        if (rgb)
            rgb = rgb.replace('rgba(', '').replace(')', '').split(',');

        return (rgb && rgb.length === 4) ?
                    {
                        hex: "#" +
                        ("0" + parseInt(rgb[0], 10).toString(16)).slice(-2) +
                        ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
                        ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2),
                        a: parseFloat(rgb[3]).toFixed(2) * 100
                    }
            :
                    { hex: '#ffffff', a: 100 };
    }

    var maketView = Mn.View.extend({

        className: 'pattern',
        template: '#maket-template',

        onRender: function () {

            if (this.model.get('BorderIsVisible'))
                this.$el.css('background-color', this.model.get('CaptionBackground'));
            else
                this.$el.css('background-color', 'transparent');

            if (this.model.get('ContainerIsTransparent'))
                this.$el.css('background-color', 'transparent');
        }

    });

    var patView = Mn.View.extend({

        className: 'decoration',
        template: '#decoration-settings-template',
        templateContext: {
            Resources: Resources
        },

        regions: {
            maket: { el: '#maket', replaceElement: true }
        },

        events:{

            'click input[type="checkbox"]': function (e) {

                var $e = $(e.target);
                this.model.set($e.attr('name'), $e.prop('checked'));

            }

        },

        onRender: function () {

            this.showChildView('maket', new maketView({ model: this.model }));

        },

        onAttach: function () {

            this.$('input.Decoration').each(function (i, e) {

                var v = rgb2hex(this.model.get(e.getAttribute('name')));

                $(e).ejColorPicker({

                    locale: Resources.Lang,
                    modelType: "palette",
                    presetType: "webcolors",

                    htmlAttributes: { style: "display:inline-block;" },

                    value: v.hex,
                    opacityValue: v.a,

                    close: function (args) {

                        var rgb = $(e).data('ejColorPicker').rgb;

                        this.model.set($(e).attr('name'), 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + rgb.a + ')');

                    }.bind(this)

                });

            }.bind(this));

        },

        modelEvents: {

            change: function (m) {

                this.getChildView('maket').render();

            }

        }

    });

    return Mn.View.extend({

        template: _.template('<div></div>'),

        regions: {
            c: { el: 'div', replaceElement: true }
        },

        onRender: function () {

            var o = this.model.get('Decoration');

            o.prefix = this.model.id || new Date().valueOf();

            var m = new Backbone.Model(o);

            this.showChildView('c', new patView({ model: m }));

            this.listenTo(m, 'change', function () {
                this.model.set('Decoration', m.toJSON());
            });

        },

        onSave: function () {

            this.model.save();

        },

    });

});