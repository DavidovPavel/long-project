define('c/searchPanel', ['i18n!nls/resources.min', 'c/SimpleTableView', 'g/tree'], function (Resources, tableSearch, treeView) {

    var listSelectedView = Mn.CollectionView.extend({

        childView: Mn.View.extend({

            className: 'item',

            template: _.template('<%- title %><span data-icon="icon-trash"></span>'),
            triggers: {
                'click span[data-icon="icon-trash"]': 'remove:selected'
            }
        }),

        childViewTriggers: {
            'remove:selected': 'remove:selected'
        }

    });

    return Mn.View.extend({

        className: 'choise-panel',

        template: '#choise-panel-list-template',
        templateContext: {
            Resources: Resources
        },

        ui: {
            tt: '#types-tree'
        },

        regions: {
            result: '.result-list',
            select: '.select-list',
            tree: '@ui.tt'
        },

        initialize: function () {

            if (this.options.rid)
                this.treeOptions = { path: '/api/Tree/ByWidgetQ/' + this.options.rid };

            this.typeid = 10001;
            this.searchVal = '';

        },

        onRender: function () {

            var c = new Backbone.Collection();
            c.url = "/api/List/?page=1&text=&typeid=10001";

            this.showChildView('result', new tableSearch({
                collection: c,
                rowTemplate: "<td><input type='checkbox' id='ch_<%- id %>' class='g-form--checkbox'><label for='ch_<%- id %>'><span><%= num %>.</span><span><%- title %></span></label></td><td><%- type %></td>",
                head: new Backbone.Collection([
                    { id: 0, title: Resources.title, width: '70%' },
                    { id: 1, title: Resources.type, width: '30%' }
                ])
            }));

            this.getChildView('result').collection.on('reset', function () {
                this.getChildView('result').$el.hideIndicator();
            }, this);

            this.getChildView('result').collection.on('error', function () {
                this.getChildView('result').$el.hideIndicator();
            }, this);

            this.collection.reset();

            this.showChildView('select', new listSelectedView({ collection: this.collection }));

            var tc = new Backbone.Collection;
            tc.url = this.treeOptions ? (this.treeOptions.path || '/api/Type') : '/api/Type';            

            this.showChildView('tree', new treeView({ collection: tc, node: { checkbox: false, levelOpen: 4 } }));

            tc.fetch({ reset: true });

        },

        onChildviewContainerSelectItem: function (v) {
            this.typeid = v.model.id;
            this.search();
        },

        clear: function () {

            this.searchVal = '';
            this.typeid = 10001;
            var c = this.getChildView('result').collection;
            c.url = $.mergeUrlParam(c.url, { text: this.searchVal, page: 1, typeid: this.typeid });
            c.reset();

        },

        search: function (m) {

            var c = this.getChildView('result').collection;

            this.getChildView('result').currentPage = 1;

            c.url = $.mergeUrlParam(c.url, { page: 1, typeid: this.typeid, text: this.searchVal });

            this.triggerMethod('notice:show:message');

            c.fetch({
                reset: true,
                success: function () {
                    this.triggerMethod('notice:click:button');
                }.bind(this),
                error: function () {
                    this.triggerMethod('notice:click:button');
                }
            });
        },

        filterByType: function (v) {
            this.ui.tt.toggle();
        },

        searchObj: function (r) {
            //
            var text = r.$( "input[name='search-name']" ).val(),
                flag = event.keyCode ? ( event.keyCode === 13 && $.trim( text ) ) : $( event.target ).hasClass( 'search' );

            if ( flag && text.length >= 1) {
                this.searchVal = text;
                this.search();
            }
        },

        childViewEvents: {

            'page:select': function (n) {

                var r = this.getChildView('result'),
                    c = this.getChildView('result').collection;

                r.currentPage = n;
                c.url = $.mergeUrlParam(c.url, { page: n });

                c.fetch({ reset: true });
            },

            'change:input:row': function (v) {

                var $i = v.$('input');

                this.ui.tt.hide();

                if ($i.prop('checked')) {

                    if (this.options.IsMultiValues)
                        this.collection.add(v.model);
                    else {

                        this.getChildView('result').getChildView('body').children.each(function (a) {
                            if (v.model.id !== a.model.id)
                                a.$('input').prop('checked', false);
                        });

                        this.collection.reset();
                        this.collection.add(v.model);
                    }
                }
                else
                    this.collection.remove(v.model);

            },

            'remove:selected': function (r) {

                this.getChildView('result').getChildView('body').children.findByModel(r.model).$('input').prop('checked', false);

                this.collection.remove(r.model);
            }
        }
    });

});