define('g/ImageGalleryView', ['i18n!nls/resources.min', 'g/files/UploadFileView' ], function (Resources, uploadView) {

    var fileModel = Backbone.Model.extend({ idAttribute: "FileUID" });

    var listFiles = Mn.CollectionView.extend({

        className: 'image-gallery',

        childView: Mn.View.extend({

            tagName: 'span',          

            template: _.template('<i data-icon="icon-trash"></i><img src="<%- FileUrl %>" alt="" title="<%- OriginalFileName %>"  />'),

            events: {

                'click i[data-icon="icon-trash"]': function () {

                    Backbone.trigger("message:confirm", {
                        title: Resources.askyousure, message: Resources.confirmDeleteImg,
                        fx: function () {
                            this.model.destroy();
                        },
                        ctx:this
                    });
                },

                'click img': function () {

                    var m = this.model.collection.findWhere({ select: true });
                    if (m)
                        m.set('select', false);

                    this.model.set('select', true);
                    this.triggerMethod('change:item', this.model);
                }

            },

            modelEvents: {

                'change:select': function (m, v) {

                    if(v)
                        this.$el.addClass('selected');
                    else
                        this.$el.removeClass('selected');
                }

            },

            onRender: function () {
                if (this.model.get('select'))
                    this.$el.addClass('selected');
            }
        }),

        childViewOptions: function (m) {
            m.set('select', m.get('FileUrl') === this.options.select);
        },

        childViewTriggers: {
            'change:item': 'change:item'
        }

    });

    return Mn.View.extend({

        className: 'image-gallery-wrapper',

        template: _.template('<div class="image-path"></div><div class="image-gallery"></div>'),

        regions: {
            list: { el: '.image-gallery', replaceElement: true },
            path: { el: '.image-path', replaceElement: true }
        },

        initialize: function () {

            this.collection = new Backbone.Collection([], {
                model: fileModel,
                comparator: function (m) { return -new Date(m.get('CDate')); }
            });

            this.collection.url = "/api/common/files/";
        },

        onBeforeRender: function () {
            this.collection.fetch({ reset: true });
        },

        onRender: function () {
            this.showChildView('path', new uploadView({ collection: this.collection }));
            this.showChildView('list', new listFiles({ collection: this.collection, select: this.options.selectedImgPath }));
        },

        childViewTriggers: {
            'change:item': 'change:item'
        }

    });

});