define('forms/sinonimView', ['i18n!nls/resources.min'], function (Resources) {

    var sendModel = Backbone.Model.extend({

        url: '/api/synonyms',
        sync: function (method, model, options) {
            Backbone.Model.prototype.sync.apply(this, ['create', model, options]);
        }

    });

    var listSynonims = Mn.CollectionView.extend({

        className: 'results readonly',

        childView: Mn.View.extend({

            tagName: 'span',
            className: 'g-form--input nested',

            template: _.template('<input type="text" value="" readonly="readonly" class="g-form--input filled" placeholder="<%- id %>"><i class="clear permanent rtl-1"></i>'),

            events: {
                'click .clear': function () {
                    this.model.collection.remove(this.model);
                }
            }
        })
    });

    return Mn.View.extend({

        tagName: 'fieldset',
        className: 'g-form--fieldset acc',

        template: templates['synonims-template'],

        templateContext: {
            Resources: Resources
        },

        ui: {
            data: '#synonim'
        },

        regions: {
            list: { el: '.results', replaceElement: true }
        },

        events: {

            "click .synonimus-link": function (e) {
                this.getRegion('list').$el.slideDown();
            },

            "click .hideSyn": function () {
                this.ui.data.val('');
                this.getRegion('list').$el.slideUp();
            },

            "click .add": function () {
                this.ui.data.removeClass("error");
                this.add(this.ui.data.val());
            },

            'keyup input#synonim': function (e) {
                if (e.keyCode === 13)
                    this.add(this.ui.data.val());
            }
        },

        add: function (v) {

            if ($.trim(v)) {
                this.collection.add(new Backbone.Model({ id: v }));
                this.ui.data.val('');
            }
            else this.ui.data.addClass("error");

        },

        initialize: function () {

            this.collection = new Backbone.Collection;
            
            this.sendModel = new sendModel;

            this.sendModel.on('sync', function (m, d) {

                this.collection.add(d.map((e) => { return { id: e }; }));

            }, this);

        },

        onRender: function () {

            this.showChildView('list', new listSynonims({ collection: this.collection }));

            if (this.model.get('synonyms_INTERN'))
                this.collection.set(_.map(this.model.get('synonyms_INTERN'), function (e) { return { id: e } }));

        },

        modelEvents: {

            'change:title_INTERN': function ( m, v ) {

                if ($.trim(v))
                    this.sendModel.save(m.toJSON());
                else
                    this.collection.reset();

            }

        },

        collectionEvents: {

            update: function () {

                this.model.set('synonyms_INTERN', this.collection.pluck('id'));

            }
        }

    });

});