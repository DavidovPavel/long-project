define('c/forms/countriesView', ['i18n!nls/resources.min'], function (Resources) {

    var dictionaries = Backbone.Collection.extend({

        model: Backbone.Model.extend({
            idAttribute: "ID",
            defaults: {
                DicCode: "",
                DicType: 0,
                ID: null,
                Importance: null,
                Title: ""
            }
        }),

        url: "/api/sources/types"

    });

    var selectView = Mn.CollectionView.extend({

        tagName: 'select',

        initialize: function () {

            this.collection = new dictionaries;

        },

        childView: Mn.View.extend({

            tagName: 'option',

            template: _.template('<%- Title %>'),

            onRender: function () {
                this.$el.attr('value', this.model.get('DicCodeItem'));
            }
        }),

        triggers: {
            'change': 'select:country'
        }
    });

    return Mn.View.extend({

        template: templates['countries-select'],
        templateContext: { Resources: Resources },

        regions: {
            select: { el: 'select', replaceElement: true }
        },

        initialize: function () {

            this.collection = new dictionaries;
        },

        onRender: function () {

            this.showChildView('select', new selectView);

            Backbone.Radio.channel('loader').trigger('show', this.$el, { size: 'l' });

            this.collection.fetch({ reset: true });

        },


        collectionEvents: {

            reset: function () {

                Backbone.Radio.channel('loader').trigger('hide');

                let data = this.collection.findWhere({ DicCode: "ByCountry" }),
                    sc = this.model.get('selectedCountries');

                this.getChildView('select').collection.set(data.get('DicItems'));
                this.getChildView('select').collection.add({ DicCodeItem: '', Title: '...' }, { at: 0 });

                if (sc && sc.length)
                    this.getChildView('select').$el.val(sc[0]);
                else
                    this.getChildView('select').$el.val([Resources.Lang]);                    
               
                this._showField(this.getChildView('select'));
            }

        },

        childViewEvents: {

            'select:country': '_showField'

        },

        _showField: function (s) {

            this.$(".countries>div").hide();

            var val = s.$el.val();

            if ($.trim(val)) {

                this.$(`#${val}`).show();
                this.model.set('selectedCountries', [val]);

            }
            else
                this.model.set('selectedCountries', []);
        }

    });


});