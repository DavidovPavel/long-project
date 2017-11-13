
define('c/ChoiceView',
    ['app', 'i18n!nls/resources.min', 'storage', 'c/DialogView', 'c/SimpleTableView'], function (App, Resources, Storage, dialog, tableSearch) {

    var treeView = Mn.View.extend({
        template: false,
        treeOper: function (model) {
            this.triggerMethod('container:select:item', model);     
        },
        onRender: function () {
            
            Storage.getTree(
                this.model.get("ParametrType"),
                this.model.get("NoCash"),
                this.model.get("StickUrl"),
                this.model.get("Params"))
                .then(function (tree) {
                    this.tree = tree;
                    tree.setElement(this.$el).render().operation = this.treeOper.bind(this);                    
                }.bind(this));
        }        
    });

    var listSelectedView = Mn.CollectionView.extend({
        childView: Mn.View.extend({
            className:'item',
            template: _.template('<%- title %><span data-icon="icon-trash"></span>'),
            triggers: {
                'click span[data-icon="icon-trash"]':'remove:selected'
            }
        })
    });

    var searchObj = Mn.View.extend({
        className: 'choise-panel',
        template: '#choise-panel-list-template',
        templateContext: {
            Resources: Resources
        },

        ui:{
            tt: '#types-tree'
        },

        regions:{
            result: '.result-list',
            select: '.select-list'
        },

        onRender: function () {

            this.typeid = 10001;
            this.searchVal = '';

            var c = new Backbone.Collection();
            c.url = "/api/List/?page=1&text=&typeid=10001";

            var rowTemplate = "<td><%= num %>. <input type='checkbox' id='ch_<%- id %>' class='g-form--checkbox'><label for='ch_<%- id %>'><%- title %></label></td><td><%- type %></td>";

            var head = new Backbone.Collection([
                { id: 0, title: Resources.title, width: '70%' },
                { id: 1, title: Resources.type, width: '30%' }
            ]);

            this.showChildView('result', new tableSearch({ collection: c, rowTemplate: rowTemplate, head: head }));
            this.showChildView('select', new listSelectedView({ collection: this.collection }));

            require(['g/tree/TreeView'], function (TreeView) {

                new TreeView({
                    api: this.options.treeOptions? (this.options.treeOptions.id || '/api/Type') : '/api/Type',
                    markCurrent: true,
                    openLevel: 3
                }).setElement(this.ui.tt)
                    .render()
                    .operation = function (m) {
                        this.typeid = m.id;
                        this.search();
                    }.bind(this);

            }.bind(this));

        },

        clear:function(){
            this.searchVal = '';
            this.typeid = 10001;
            var c = this.getChildView('result').collection;
            c.url = $.mergeUrlParam(c.url, { text: this.searchVal, page: 1, typeid: this.typeid });
            c.reset();
        },

        search: function (m) {

            var r = this.getChildView('result'),
                c = r.collection;

            c.url = $.mergeUrlParam(c.url, { typeid: this.typeid, text: this.searchVal });
            c.fetch({ reset: true });
        },

        onChildviewPageSelect: function (n) {
            
            var r = this.getChildView('result'),
                c = this.getChildView('result').collection;

            r.currentPage = n;
            c.url = $.mergeUrlParam(c.url, { page: n });

            r.$el.showIndicator();
            c.fetch({ reset: true });
        },

        onChildviewClickRowTable: function (v) {
            var $i = v.$('input');
            $i.prop('checked', !$i.prop('checked'));
            this.ui.tt.hide();
            if ($i.prop('checked'))
                this.collection.add(v.model);
            else
                this.collection.remove(v.model);
        },

        onChildviewRemoveSelected: function (r) {
            this.getChildView('result').getChildView('body').children.findByModel(r.model).$('input').prop('checked', false);
            this.collection.remove(r.model);            
        }
    });

    var toolsCollection = new Backbone.Collection([
                { id: 'add', className: 'add', tooltip: Resources.add },
                { id: 'rename', className: 'rename', tooltip: Resources.editItem },
                { id: 'remove', className: 'trash', tooltip: Resources.deleteItem },
                //{ id: 'sorting', child: [{ id: 'up' }, { id: 'down' }, { id: 'first' }, { id: 'last' }] },
                { id: 'search', className: 'search', template: '<span class="g-form--input input-data"><input type="text" name="search-name" value="" class="g-form--input" placeholder="Enter keyword"/><i class="search rtl-1" name="search"></i></span>' }
    ]);

    var toolsCollection2 = new Backbone.Collection([
        { id: 'search-obj', className: 'search', template: '<span class="g-form--input input-data"><input type="text" name="search-name" value="" class="g-form--input" placeholder="Enter keyword"/><i class="search rtl-1" name="search"></i></span>' },
        { id: 'filter-by-type', className: 'filter' }
    ]);

    return Mn.View.extend({

        template: false,

        initialize: function () {

            this.model = new Backbone.Model();
            this.collection = new Backbone.Collection();

            Backbone.on("choice:view", function (model, treeOptions) {

                this.collection.reset();
                
                var tv = new treeView,
                    so = new searchObj({ treeOptions: treeOptions });

                so.collection = this.collection;
                // выбранные запросы для витрины

                var winType = {
                    RequestSelected: { title: Resources.selectRequest, content: tv, className: 'medium success' },
                    Request: { title: Resources.selectRequest, content: tv, className: 'medium success' },
                    Rubric: { title: Resources.selectRubric, content: tv, className: 'medium success' },
                    Type: { title: Resources.selectTree, content: tv, className: 'medium success' },
                    Object: { title: Resources.selectingObj, content: so, IsMultiValues: true },
                    IdList: { title: Resources.selectingObj, content: so, IsMultiValues: true }
                };

                var p = model.get('ParametrType'),
                    o = winType[p];

                this.model = model;
                o.content.model = model;
                o.controls = [{ id: 'ok', title: 'Ok', className: 'right' }];
                o.collection = this.collection;

                switch (p) {
                    case "Rubric": o.tools = toolsCollection; break;
                    case "Object": case "IdList": o.tools = toolsCollection2; break;
                    default: o.tools = [];
                }

                var dialog = Backbone.Radio.channel('Notify').request('once:dialog', o);

            }, this);
        },

        onChildviewToolbarItemClick: function (r) {
            var c = r.options.view;
            switch (r.model.id) {
                case 'filter-by-type': c.getUI('tt').toggle(); break;
                case 'search-obj':
                    c.searchVal = r.$("input[name='search-name']").val();
                    c.search(); break;
                case 'search':
                    if ($.trim(r.$("input[name='search-name']").val()))
                        c.tree.editPanelAction(r.$("i[name=search]"));
                    break;
                default:
                    c.tree.editPanelAction(r.$el);
            }                
        },

        onChildviewToolbarInputKeyup: function (r) {

            if (event.keyCode === 13 && $.trim(r.$("input[name='search-name']").val())) {

                var c = this.getChildView('dialog').getChildView('container');

                if (r.model.id === 'search') {
                    c.tree.editPanelAction(r.$("i[name=search]"));
                }
                else if (r.model.id === 'search-obj') {
                    c.searchVal = r.$("input[name='search-name']").val();
                    c.search();
                }

            }
        },

        onChildviewContainerSelectItem: function (model) {
            if (!this.model.get('IsMultiValues'))
                this.collection.reset();

            this.collection.add(model);
        },

        onChildviewControlsButtonClick: function () {
            //this.getChildView('dialog').model.get('view').model.trigger('choice:close', this.collection);
            //this.getChildView('dialog').remove();
        }
    });

});