define('services.sources.mainView', ['i18n!nls/resources.min', 'filtersSourcesView', 'listSourcesView'], function (Resources, Filters, List) {

    return Mn.View.extend({

        template: templates['search-sources'],
        templateContext: {
            Resources: Resources
        },

        events: {
            "click .toform:not(.disabled)": "toform",
            "click @ui.start:not(.disabled)": "start",
        },

        ui: {
            snum: '#selected-num',
            samount: '#select-amount',
            balance: '#balance',
            start: '.start',
            meter: '#source-select-meter'
        },

        initialize: function () {

            this.collection = new Backbone.Collection;
            this.collection.url = '/api/sources/persisted/' + this.model.id;

            this.paramCollection = new Backbone.Collection();

        },

        regions: {
            filters: '#Filters',
            list: '#ListTemplate'
        },

        onBeforeRender: function () {

        	$.get("/api/search/balance").done(function (num) {

                this.ui.balance.text(num.toFixed(2));
                this.ui.meter.attr("data-meter-max", num).gtkMeter();

            }.bind(this));

        },

        onRender: function () {

        	/***
				до новой верстки в коментариях 23.11.2017
			*/

            this.showChildView('list', new List);
            this.showChildView('filters', new Filters({ model: this.model }));

            if (this.model.id) {
                Backbone.Radio.channel('loader').trigger('show', this.$el);
                this.collection.fetch({ reset: true });
            }

        },

        collectionEvents: {

            reset: function () {

                Backbone.Radio.channel('loader').trigger('hide');

                this.getChildView('list').collection.each(function (m) {
                    m.set('checked', !!this.collection.get(m));
                }, this);

                this.getChildView('list').getChildView('selected').collection.reset(this.collection.models);
            }
        },

        childViewEvents: {

            'filter:send': function ( v ) {

                var m = v.model;

                if (m) {
                    if (m.get('on'))
                        this.paramCollection.add(m);
                    else
                        this.paramCollection.remove(m);
                } else
                    this.paramCollection.reset();

                var param = {
                    DicItems: this.paramCollection.pluck('ID'),
                    SearchText: this.getChildView('list').ui.searchText.val()
                }

                param.DicItems.push(this.options.DicID);

                Backbone.Radio.channel('loader').trigger('show', this.$el);

                $.post("/api/sources/filterby", param).done(function (data) {

                    Backbone.Radio.channel('loader').trigger('hide');

                    this.getChildView('list').collection.reset(data);

                    this.getChildView('list').collection.each(function (m) {
                        m.set('checked', !!this.collection.get(m));
                    }, this);

                }.bind(this));
            },

            'filter:change:set': function (v) {

                var id = v.model.id;

                if (id) {
                    Backbone.Radio.channel('loader').trigger('show', this.$el);
                    this.collection.url = '/api/sources/persisted/' + id;
                    this.collection.fetch({ reset: true });
                } else
                    this.collection.reset();
            },

            'filter:destroy:set': function () {
                this.collection.reset();
            }

        },

        onChildviewShowSelectedRobots: function () {
            this.getChildView('list').getChildView('selected').collection.reset(this.collection.models);
        },

        onChildviewListChanged: function (m) {

            if (m.get('checked'))
                this.collection.add(m);
            else
                this.collection.remove(m);

            var sum = 0,
                num = this.collection.length;

            this.collection.each(function (m) { sum += m.get('price'); });

            this.getChildView('list').ui.amountSel.text(num);

            if (num) this.ui.start.removeClass('disabled');
            else this.ui.start.addClass('disabled');

            this.ui.snum.text(num);
            this.ui.samount.text(sum.toFixed(2));

            if (parseFloat(this.ui.balance.text()) > 0)
                this.ui.meter.data('meter-val', sum).gtkMeter('update');

        }
    });


});