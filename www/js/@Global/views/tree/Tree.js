define('g/tree', ['i18n!nls/resources.min'], function (Resources) {

    // this.options.selected  -  массив выбраных моделей
    // this.options.node = {checkbox: true, icon: [folder, file], levelOpen: N} -  объект опций для отображения узла
    // this.options.branch = {pid: 0} показываемая ветка

    var nodeCollection = Backbone.Collection.extend({
        model: Backbone.Model.extend({
            defaults: {
                id: null,
                parentid: '',
                title: '',
                parents: [],
                children: 0,
                cdate: 0
            }
        })
    });

    var TreeNode = Mn.View.extend({

        tagName: 'li',
        template:  _.template('<div><i class="expander" <%- nodes?"":"disabled" %>></i><input type="checkbox" id="node_<%- id %>"><label for="node_<%- id %>"></label>' +
            '<span tree-icon="<%- nodes?(id==="-1"?"root":"folder"):"file" %>"><% if(iconurl){ %><img src="<%- iconurl %>" alt="" />&nbsp;<% } %><%- title %></span>' +
            '<button data-value="ok"></button><button data-value="cancel"></button>' +
            '</div><ul></ul>'),

        ui: {
            span: 'span',
            cancel: 'button[data-value="cancel"]',
            save: 'button[data-value="ok"]',
            expander: 'i.expander',
            chbox: 'input[type=checkbox]',
            label: 'input[type=checkbox]+label'
        },

        regions: {
            tree: { el: 'ul', replaceElement: true }
        },

        triggers: {
            'click @ui.span': 'container:select:item'
        },

        events: {

            'click @ui.chbox': function (e) {
                e.stopPropagation();
                this.model.set('selected', this.ui.chbox.prop('checked'));
                this.triggerMethod('click:select:input', this);
            },

            'click @ui.cancel': function () {

                this.model.set('isEdit', false);

                if (!this.model.id)
                    this.model.collection.remove(this.model);
            },

            'click @ui.save': function (e) {

                e.stopPropagation();

                if ($.trim(this.ui.span.text())) 
                    this.model.save({ title: this.ui.span.text() });

                this.model.set('isEdit', false);
            },

            'click .expander': function (e) {
                e.stopPropagation();
                $(e.target).closest('div').toggleClass('expanded');
            }
        },

        modelEvents: {

            'change:nodes': function (m, nodes) {

                if (nodes && nodes.length) {
                    this.ui.expander.attr('disabled', false);
                    this.ui.span.attr('tree-icon', 'folder');
                } else {
                    this.ui.expander.attr('disabled', true);
                    this.ui.span.attr('tree-icon', 'file');
                }
            },

            'change:isEdit': function (m, v) {

                if (v)
                    this.ui.span.attr('contenteditable', true);
                else 
                    this.ui.span.removeAttr('contenteditable');

            }

        },

        onBeforeRender: function () {

            if (this.options.parent && this.options.parent.id === this.model.get('parentid')) {

                var p = this.options.parent.get('parents') || [];

                p.push(parseInt(this.options.parent.id));

                this.model.set('parents', _.uniq(p));
            }

        },

        onRender: function () {

            if (!this.options.node)
                this.options.node = {
                    checkbox: true
                };


            if (this.model.has('selected'))
                this.$('input[type=checkbox]').prop('checked', this.model.get('selected'));

            if (this.model.has('nodes')) {

                // open nodes
                if (!this.options.node.levelOpen)
                    this.$('div').addClass('expanded');
                else if (this.model.get('level') < this.options.node.levelOpen)
                    this.$('div').addClass('expanded');

                var treeView = new TreeView({ parent: this.model, collection: this.model.get('nodes'), url: this.options.url, node: this.options.node });
                this.showChildView('tree', treeView);
            }

            if (!this.options.node.checkbox)
                this.$('input[type=checkbox] ~ label').hide();

            if (!this.model.has('isEdit'))
                this.model.set('isEdit', false);
        },

        showAddTemplate: function () {

            this.model.set('isEdit', false);

            var m = new Backbone.Model({ id: null, title: Resources.title, parentid: this.model.id, cdate: 0, nodes: null, iconurl: null });

            if (this.model.has('nodes')) {

                this.model.get('nodes').add(m);                

            } else {

                var co = new Backbone.Collection([m]);
                co.url = this.model.collection.url;
                this.model.set({ nodes: co, children: 1 });

            }

            this.model.trigger('change:nodes');
            this.render();

            m.set('isEdit', true);

        },

        childViewTriggers: {
            'click:select:input': 'click:select:input',
            'container:select:item': 'container:select:item'
        }

    });

    var TreeView = Mn.CollectionView.extend({

        tagName: 'ul',
        className: 'g-tree',
        childView: TreeNode,

        childViewOptions: function () {

            return {
                parent: this.options.parent,
                url: this.options.url,
                node: this.options.node
            };

        },

        initialize: function () {

            this.collection.comparator = 'cdate';

            this.branch = this.options.branch || { pid: 0 };

        },

        collectionEvents: {

            update: function () {

                if (this.options.parent) {

                    this.options.parent.set({ children: this.collection.length });

                    if (!this.collection.length)
                        this.options.parent.set({ nodes: null });
                }
            },

            reset: function () {

                this.$el.hideIndicator();

                var will = new Backbone.Collection;

                this.collection.each(function (m) {

                    if (parseInt(m.get('parentid')) === 0)
                        m.set('level', 1);

                    if (this.options.selected)
                        m.set('selected', this.options.selected.indexOf(parseInt(m.id)) !== -1);

                    var nodes = this.collection.where({ parentid: m.id }),
                        co = new Backbone.Collection;

                    co.url = this.collection.url;

                    co.add(_.map(nodes, function (c) {
                        c.set('level', m.get('level') + 1);
                        c.collection = co;
                        return c;
                    }));                    

                    m.set('nodes', co.length ? co : m.has('isdoc') ? null : []);
                    will.add(nodes);

                }, this);

                this.collection.remove(will.models);
            }
        },

        onChildviewContainerSelectItem: function (v) {

            this.$('div.active').removeClass('active');
            v.$('div:first').addClass('active');

        },

        childViewTriggers: {
            'click:select:input': 'click:select:input',
            'container:select:item':'container:select:item'
        }

    });

    return TreeView;
});