define('listSourcesView', ['i18n!nls/resources.min', 'c/SimpleTableView', 'global.behaviors.input', 'global.view.dialog'], function (Resources, TableView, InputBehavior, dialog) {

    var collectionSources = Backbone.Collection.extend({
        model: Backbone.Model.extend({
            defaults: {
                id: null,
                title: "",
                property: [],
                description: "",
                price: 0,
                currency: ""
            }
        }),
        url: function() {
            return "/api/sources";
        }
    });

    var infoWin = Mn.View.extend({
        template: '#source-info-template',
        templateContext: {
            Resources: Resources
        }
    });

    return Mn.View.extend({

        template: templates['list-sources'],
        templateContext:{
            Resources:Resources
        },

        behaviors: {
            input: InputBehavior
        },

        ui: {
            searchText: '#search-text',
            amountAll: '.amount-all',
            amountSel: '.amount-selected'
        },

        regions: {
            all: '#all-list',
            selected: '#selected-list',
            win: '#info-window'
        },

        events: {

            "keypress @ui.searchText": function (e) {
                if (e.keyCode === 13 && $.trim(this.ui.searchText.val()))
                    this.triggerMethod('filter:send', this);
            },

            "click #input-search .search": function (e) {
                this.triggerMethod('filter:send', this);
            },

            "click .all": function (e) {

                $(e.target).addClass('active');
                this.$('.sel').removeClass('active');

                this.getChildView('all').$('input ~ label').removeClass('disabled');

                this.getRegion('all').$el.show();
                this.getRegion('selected').$el.hide();
            },

            "click .sel:not(.active)": function (e) {

                $(e.target).addClass('active');
                this.$('.all').removeClass('active');

                this.triggerMethod('show:selected:robots');

                this.getRegion('all').$el.hide();
                this.getRegion('selected').$el.show();
               
            }
        },

        initialize: function () {
            this.collection = new collectionSources;
        },

        onRender: function () {

            var headCollection = [
                    { id: 0, title: Resources.title, width: '80%', subTemplate: '<input type="checkbox" id="ch-all" class="g-form--checkbox"><label for="ch-all" style="color:#fff;"><%- title %></label>' },
                    { id: 1, title: Resources.price, width: '20%' }
            ],
            headCollection2 = [
                    { id: 0, title: Resources.title, width: '80%' },
                    { id: 1, title: Resources.price, width: '20%' }
            ],
                rowTemplate = '<td><input type="checkbox" id="ch-<%- id %>" class="g-form--checkbox"><label for="ch-<%- id %>"><%- title %>&nbsp;<span data-cmd="info" data-icon="icon-info"></span></label></td><td><%- price?price:Resources.freeTitle %></td>',
                rowTemplate2 = '<td><span data-icon="icon-trash" data-cmd="clear"></span>&nbsp;<%- title %>&nbsp;<span data-cmd="info" data-icon="icon-info"></span></td><td><%- price?price:Resources.freeTitle %></td>';

            this.showChildView('all', new TableView({ collection: this.collection, head: new Backbone.Collection(headCollection), rowTemplate: rowTemplate }));

            this.showChildView('selected', new TableView({ collection: new Backbone.Collection, head: new Backbone.Collection(headCollection2), rowTemplate: rowTemplate2 }));

        },


        childViewEvents:{

            'change:input:row': function (v) {

                v.model.set('checked', $(event.target).prop('checked'));
               
            },

            'table:row:cmd': function (v, e) {

                if ($(e.target).data('cmd') === 'clear') {

                    v.model.set('checked', false);

                    this.getChildView('selected').collection.remove(v.model);
                    this.ui.amountSel.text(this.getChildView('selected').collection.length);
                }


                if ($(e.target).data('cmd') === 'info')
                    this.showChildView('win', new dialog({
                        title: Resources.information,
                        content: new infoWin({ model: v.model })
                    }));
            }

        },

        collectionEvents: {

            reset: function () {
                this.ui.amountAll.text(this.collection.length);
            }

        },

        onChildviewTableRowModelChanged: function (m) {
            this.triggerMethod('list:changed', m);
        }


    });
});