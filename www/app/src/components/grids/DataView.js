
define('global.grid.dataItemsView', ['app', 'i18n!nls/resources.min', 'c/ContextMenuView'], function (App, Resources, contextMenu) {

    var ItemModel = Backbone.Model.extend({
        idAttribute: "object_id"
    });

    var ItemsCollection = Backbone.Collection.extend({
        model: ItemModel
    });

    var pagingView = Mn.View.extend({

        className: 'paging-box',

        template: _.template('<div class="paginator"></div><div class="paginator_pages"><%- Resources.Pages2 %>: <span><%- totalPages %></span></div>'),
        templateContext:{
            Resources: Resources
        },

        events: {
            "click a": function (e) {
                e.preventDefault();
                this.triggerMethod("page:select", $(e.target).text());
            }
        },

        onAttach: function () {

            var name = 'paginator_' + this.cid;

            this.$('.paginator').attr('id', name);

            new Paginator(name,
                this.model.get('totalPages'), this.model.get('paging').pageSize, this.model.get('paging').currentPage);

        }
    });

    var colView = Mn.View.extend({
        tagName: 'th',
        template: _.template('<%- displayName %>')
    });

    var footerView = Mn.View.extend({

        tagName: 'tr',
        template: _.template('<td colspan="<%- numCols %>"><div class="context-menu" style="position:absolute;display:none;z-index:100;"></div></td>'),

        regions: {
            menu: '.context-menu'
        },

        ui:{
            menu: '.context-menu'
        },

        onRender: function () {

            this.showChildView('menu', new contextMenu({ collection: this.collection }));
        },

        events: {

            "mouseenter .context-menu": function (e) {
                this.ui.menu.clearQueue();
            },

            "mouseleave .context-menu": function (e) {
                this.ui.menu.delay(300).hide(100);
            }
        },

        childViewTriggers: {
            "hide:menu": 'hide:menu',
            'menu:click:item':'menu:click:item'
        }
    });

    var headView = Mn.CollectionView.extend({

        tagName: 'tr',

        childView: colView,

        onRender: function () {

            this.addChildView(new colView({ model: new Backbone.Model({ displayName: "№" }) }), 0);
            this.addChildView(new colView({ model: new Backbone.Model({ displayName: "" }) }));

        }
    });

    var rowView = Mn.View.extend({

        tagName: 'tr',

        getTemplate: function () {
            return _.template(this.options.bodyTemplate);
        },

        templateContext: {
            Resources: Resources
        },

        triggers: {
            'mouseleave': 'hide:menu',
            'contextmenu td': 'menu:show',
            'click button.btn-link': 'menu:show',
            'click td':'row:col:trigger',
            'click a': {
                event: 'click:link',
                preventDefault: false
            }
        },

        onRender: function () {
            this.$el.data("id", this.model.id);
        },

        modelEvents: {

            "change:State": function (m, v) {
                this.$("td[data-name='state']").text(v);
            }

        }
    });

    var bodyView = Mn.CollectionView.extend({

        tagName: 'tbody',

        childView: rowView,

        emptyView: Mn.View.extend({
            tagName: 'tr',
            className: 'info',
            template: _.template('<td colspan="120">' + Resources.nodata + '</td>')
        }),

        collectionEvents: {

            remove: function () {
                this.triggerMethod("change:collection", this.collection);
            }
        },

        childViewOptions: function (model, index) {

            if (!this.isEmpty()) {

                var statusset = ["", "green", "yellow", "red", "grey"],
                    stateset = ["", Resources.working, Resources.ff, Resources.tm, Resources.ar],
                    page = parseInt(this.options.pagination.currentPage) * this.options.pagination.pageSize - this.options.pagination.pageSize + 1;

                model.set({
                    "Num": index + page,
                    StatusIcon: statusset[model.get("status")],
                    state: stateset[model.get("state")]
                });
            }

            return { bodyTemplate: this.options.bodyTemplate };
        },

        onAttach: function () {

            this.$el.selectable({
                cancel: "a, button.btn-link, span",
                stop: function () {

                    var data = [];
                    this.$el.find("tr.ui-selected").each(function (i, e) {
                        data.push(this.collection.get($(e).data("id")));
                    }.bind(this));

                    this.triggerMethod("stop:selectable", data);

                }.bind(this)
            });

        },

        childViewTriggers: {
            'menu:show': 'menu:show',
            'row:col:trigger': 'row:col:trigger',
            'click:link': 'click:link'

        }
    });

    var tableView = Mn.View.extend({

        tagName: 'table',

        className: 'table inquiry table-hover list',

        template: _.template('<thead></thead><tbody></tbody><tfoot></tfoot>'),

        regions: {

            head: 'thead',

            body: {
                el: 'tbody',
                replaceElement: true
            },

            footer: 'tfoot'
        },

        collectionEvents: {

            reset: function (collection) {

                if (!collection.length) return;

                var bodyTemplate = "<td><%- Num %></td>";

                var r = collection.at(0);

                var model = r.has('feed')? new Backbone.Model(r.get('feed')): r,

                    pagination = model.get('pagination'),

                    head = _.filter(model.get("head"), function (e) {

                        if (e.isVisible) {

                            var systemName = e.systemName;

                            var path = this.options.path || Backbone.history.fragment || '';

                            if (systemName === "display_name" || systemName === "title")
                                bodyTemplate += "<td data-name='" + systemName + "'><% if(href){ %><a href='#" + path + "/<%- object_id %>'><%- " + systemName + " %></a><% }else{ %><%- " + systemName + " %><% } %></td>";
                            else
                                if (systemName === "status") {
                                    bodyTemplate += "<td data-name='" + systemName + "'><span class='status-icon <%- StatusIcon %>'></span><% if(dossier){ %><span data-icon='icon-note'></span><% } %></td>";
                                }
                                else if (systemName === 'createddate' || systemName === 'cdate' || systemName === 'jobcdate')
                                    bodyTemplate += "<td data-name='" + systemName + "'><%- Date.parse(" + systemName + ")? new Date(" + systemName + ").toLocaleString(Resources.Lang) : ''  %></td>";
                                else
                                    bodyTemplate += "<td data-name='" + systemName + "'><%- " + systemName + " %></td>";

                        }

                        return e.isVisible;

                    }, this);

                if (!this.options.hideButton)
                    bodyTemplate += "<td class='controls'><button type='button' class='btn-link g-form--context'><svg><use xlink:href='#icon-burger-menu'></use></svg></button></td>";
                else
                    bodyTemplate += "<td class='controls'></td>";

                this.showChildView('head', new headView({ collection: new Backbone.Collection(head) }));

                this.showChildView('body', new bodyView({ collection: new ItemsCollection($.prepare(model.get('items'))), pagination: pagination, bodyTemplate: bodyTemplate }));

                this.showChildView('footer', new footerView({ model: new Backbone.Model({ numCols: head.length + 2 }), collection: this.options.menuCollection }));

                this.triggerMethod("list:init", pagination);
            }
        },

        childViewTriggers: {
            'row:col:trigger': 'row:col:trigger',
            'change:collection': 'change:collection',
            'click:link': 'click:link'
        },

        childViewEvents: {

            'menu:click:item': function (v) {

                this.getChildView('footer').getChildView('menu').$el.parent("div").hide();

                if (v.cmd)
                    v.cmd.call(this, this.modelsSelected, v.model);
            },

            'hide:menu': function () {

                var $m = this.getChildView('footer').getChildView('menu').$el.parent('div');

                if ($m.is(":visible"))
                    $m.delay(300).hide(100);
            },

            'menu:show': function (v) {

                var m = v.model,
                    menu = this.getChildView('footer').getChildView('menu'),
                    c = this.modelsSelected || [];

                if (!_.findWhere(c, { id: m.id })) {
                    this.modelsSelected = [m];
                    this.$("tr.ui-selected").removeClass("ui-selected");
                }

                v.$el.addClass("ui-selected");

                if (!menu.collection || !menu.collection.length)
                    return;

                var $m = menu.$el.parent("div"),
                    pos = $(event.target).closest('td').position(),
                    top = pos.top + event.offsetY + $('.workbench--content').scrollTop(),
                    left = pos.left + event.offsetX,
                    dw = $(window).width() - $m.width();

                $m.clearQueue();

                if (pos.left + $m.width() > dw) left = dw - $m.width() - 60;

                $m.css({ 'top': top, 'left': left }).slideDown();
            },

            'stop:selectable': function (models) {
                var ms = _.compact(models);
                if (ms.length)
                    this.modelsSelected = ms;
            }
        }
    });

    return Mn.View.extend({

        template: _.template('<table></table><div class="paging-box"></div>'),

        regions: {
            table: {
                el: 'table',
                replaceElement: true
            },
            paging: {
                el: '.paging-box',
                replaceElement: true
            }
        },

        onRender: function () {

            this.showChildView('table', new tableView(this.options));
        },

        onChildviewListInit: function (paging) {

            var totalPages = Math.ceil(paging.totalItems / paging.pageSize);

            if (totalPages > 1)
                this.showChildView('paging',
                    new pagingView({ model: new Backbone.Model({ totalPages: totalPages, paging: paging }) }));
            else
                this.getRegion('paging').empty();

            this.triggerMethod("after:load", paging.totalItems);
        },

        onChildviewPageSelect: function (num) {
            this.collection.url = $.mergeUrlParam(this.collection.url, { page: num });
            this.collection.fetch({ reset: true });
        },

        childViewTriggers: {
            'row:col:trigger': 'row:col:trigger',
            'click:link':'click:link',
            'change:collection': 'change:collection',
            'action:from:menu': 'action:from:menu'
        }
    });
});