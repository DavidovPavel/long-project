define('DecorationView', ['i18n!nls/resources.min', 'g/ImageGalleryView', 'spectrumColorView'], function (Resources, Gallery, SpectrumColor) {

    return Mn.View.extend({

        className: "VitrinDecoration",

        template: '#decoration-board',

        templateContext: {
            Resources: Resources
        },

        ui: {
            bgColor: 'input[name=BackgroundColor]',
            position: 'input[name="BackgroundPosition"]',
            link: 'input[name="BackgroundImageLink"]'
        },

        events: {

            "click @ui.position": function () {
                this.model.set('BackgroundPosition', parseInt(this.$('input[name=BackgroundPosition]:checked').val()));
            },

            "click .icon-clear": function () {
                this.ui.link.val("");
            }
        },

        regions: {
            gallery: { el: '.image-gallery', replaceElement: true }
        },

        onRender: function () {

            this.showChildView('gallery', new Gallery({ selectedImgPath: this.model.get('BackgroundImageLink') }));

            this.color = new SpectrumColor({ el: this.$('input.Decoration') });

            this.listenTo(this.color, "change:color", function ($elm, vrgba, a) {
                this.model.set('BackgroundColor', vrgba);
            });

        },

        onChildviewChangeItem: function (model) {
            this.model.set({
                BackgroundImageLink: model.get('FileUrl'),
                BackgroundPosition: this.model.get('BackgroundPosition') === 3 ? 1 : this.model.get('BackgroundPosition')
            });
        },


        modelEvents: {

            'change:BackgroundPosition': function (m, v) {

                this.ui.position.find("[value='" + v + "']").prop("checked", true);

                if (v === 3) {
                    this.model.set('BackgroundImageLink', 'none');
                    var m = this.getChildView('gallery').collection.findWhere({ select: true });
                    if (m)
                        m.set('select', false);
                }

            },

            'change:BackgroundColor': function (m, v) {
                this.color.$el.spectrum("set", v);
            }
        }
    });

});