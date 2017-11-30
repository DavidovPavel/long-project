define('c/SimpleTableView', ['i18n!nls/resources.min', 'c/ContextMenuView'], function (Resources, contextMenu) {

    /*

     var headCollection = new Backbone.Collection([
                { id: 0, title: Resources.title, width: '65%' },
                { id: 1, title: Resources.status, width: '10%' },
                { id: 2, title: Resources.execution, width: '25%' }
            ]);
             
     var rowTemplate = '<td><input type="checkbox" id="ch-<%- id %>" class="g-form--checkbox"><label for="ch-<%- id %>"><%- title %></label></td><td><span class="font-icon font-icon-<%- status %>"></span></td><td><%- state %><span class="anbr-tooltip"><%- details %></span></td>';


     var menuCollection = new Backbone.Collection([
       {
           title: Resources.runagain, icon: 'next', 'data-id': "EA932373-3647-471A-87C1-DDB56657FEBC",
           cmd: function (models) {
               $.get('/api/interestObjects/input/id' + models[0].id).done(function (data) {
                   Backbone.Radio.channel('oM').request('load:form', data);
                   Backbone.Radio.channel('side').request('get:sidebar').toggleExpanded();
               });
           }
       },
       {
           title: Resources.addbasket, icon: 'case', 'data-id': "B7787886-AF0E-4B5A-9061-49B182200B8C",
           cmd: function (models, m) {
               Backbone.trigger("basket:add", _.pluck(models, 'id'));
           }
       },
       {
           title: Resources.chsta, icon: 'status', 'data-id': "7460E56F-62BD-4C9D-A8E5-5B64373C5131",
           child: [
               { id: 1, icon: 'inwork', title: Resources.working, cmd: changeStatus },
               { id: 2, icon: 'finished', title: Resources.ff, cmd: changeStatus },
               { id: 3, icon: 'clock', title: Resources.tm, cmd: changeStatus },
               { id: 4, icon: 'archive', title: Resources.ar, cmd: changeStatus }
           ]
       });


     this.showChildView('list', new tableView({ collection: this.collection, rowTemplate: rowTemplate, head: headCollection, menuCollection: menuCollection }));
    */

    var PAGE_SIZE = 30;

    var headView = Mn.CollectionView.extend({

        tagName: 'tr',

        childView: Mn.View.extend({

            tagName: 'th',

            getTemplate: function () {

                if (this.model.has('subTemplate'))
                    return _.template(this.model.get('subTemplate'));
                else
                    return _.template('<%- title %>');
            },

            onRender: function () {

                if (this.model.get('width'))
                    this.$el.width(this.model.get('width'));

                
            }            
        }),

        triggers: {
            'click input[type=checkbox] ~ label:not(.disabled)': 'click:head:input'
        }
    });

    var footView = Mn.View.extend({

        tagName:'tr',
        template: _.template('<td colspan="<%- colspan %>"><div class="paging-box"><div class="paginator"></div><div class="paginator_pages"><%- titlePages %>: <span><%- totalPages %></span></div></div><div class="context-menu" style="position:absolute;display:none;z-index:100;"></div></td>'),

        templateContext: {
            titlePages: Resources.Pages2
        },

        ui: {
            menu: '.context-menu',
            box: '.paging-box'
        },

        regions: {
            menu: '@ui.menu'
        },

        events: {

            "mouseenter @ui.menu": function (e) {
                this.ui.menu.clearQueue();
            },

            "mouseleave @ui.menu": function (e) {
                this.ui.menu.delay(300).hide(100);
            },

            "click @ui.box a": function (e) {
                e.preventDefault();
                this.triggerMethod("page:select", $(e.target).text());
            }
        },

        childViewTriggers: {
            'menu:click:item':'menu:click:item'
        },

        modelEvents: {

            'change:currentPage': function (m, v) {

                //this.render();

            },

            'change:totalPages': function (m, v) {

                if (parseInt(v) <= 1)
                    this.ui.box.hide();
                else
                    this.ui.box.show();
                
            }
        },

        onRender: function () {

            this.ui.box.hide();
            this.showChildView('menu', new contextMenu({ collection: this.collection }));

            var m = this.model;

            if (parseInt(m.get('totalPages')) > 1) {

                this.ui.box.show();
                this.$('.paginator_pages>span').text(m.get('totalPages'));

                var name = 'paginator_' + this.cid;
                this.$('.paginator').attr('id', name);
                new Paginator(name, m.get('totalPages'), m.get('pageSize'), m.get('currentPage'));

            }
            else
                this.ui.box.hide();

        }
    });

    var rowsView = Mn.CollectionView.extend( {

        tagName: 'tbody',

        emptyView: Mn.View.extend({
            tagName: 'tr',
            template: _.template('<td colspan="<%- colspan %>"><%- title %></td>')
        }),

        childView: Mn.View.extend({

            tagName: 'tr',

            getTemplate:function(){
                return _.template(this.options.rowTemplate);
            },

            templateContext: function () {
                var output = {
                    Resources: Resources
                };
                Object.assign(output, this.options.rowOptions);
                return output;
            },

            events: {

                //'click input[type=checkbox] ~ label:not(.disabled)': function (e) {
                //    //this.model.set('checked', !this.$('input[type=checkbox]').prop('checked'));
                //    this.triggerMethod('check:rows:for:head');
                //},

                "mouseleave": function () {
                    this.triggerMethod("hide:menu");
                },

                "click button.menu": function (e) {
                    this.$el.addClass("ui-selected");
                    this.triggerMethod('menu:show', this.model, $(e.target).closest("button"));
                },

                'click a': function (e) {
                    e.stopPropagation();
                }

            },

            triggers: {
                //'click': 'click:row:table',
                'change input': 'change:input:row',
                'click *[data-cmd]': 'click:row:cmd:item'
            },

            modelEvents: {

                change: function (m) {
                    this.render();
                    this.triggerMethod('model:changed', m);
                }

            },

            onRender: function () {
                if (this.model.has('checked'))
                    this.$('input[type=checkbox]').prop('checked', this.model.get('checked'));
            }

        }),

        emptyViewOptions: function (m) {            
            m.set({ 'colspan': this.options.colspan, title: Resources.N });
        },

        childViewOptions: function () {
            return {
                rowTemplate: this.options.rowTemplate,
                rowOptions: this.options.rowOptions,
                colspan: this.options.colspan
            };
        },

        childViewTriggers: {
            //'click:row:table': 'click:row:table',
            'change:input:row':'change:input:row',
            'click:row:cmd:item': 'click:row:cmd:item',
            'model:changed': 'model:changed',
            'menu:show': 'menu:show',
            'hide:menu': 'hide:menu',
            'check:rows:for:head': 'check:rows:for:head'
        }
    });

    return Mn.View.extend({

        tagName: 'table',
        className: 'table table-hover',
        template: _.template('<thead><tr></tr></thead><tbody></tbody><tfoot></tfoot>'),

        regions: {
            head: { el: 'thead tr', replaceElement: true },
            body: { el: 'tbody', replaceElement: true },
            foot: 'tfoot'
        },

        initialize: function () {

            this.currentPage = 1;
        },

        onRender: function () {

            if (this.options.head)
                this.showChildView('head', new headView({ collection: this.options.head }));

            var colspan = $(this.options.rowTemplate).size();

            this.showChildView('body', new rowsView({ collection: this.collection, rowTemplate: this.options.rowTemplate, rowOptions: this.options.rowOptions, colspan:colspan }));

            this.showChildView('foot', new footView({
                collection: this.options.menuCollection || new Backbone.Collection,
                model: new Backbone.Model({
                    currentPage: 0,
                    pageSize: PAGE_SIZE,
                    totalPages: 0,
                    colspan: colspan,
                    collection: this.collection
                })
            }));
            
        },

        collectionEvents: {

            update: function (c, o) {
                this.triggerMethod('table:collection:update', c, o);
            },

            reset: function () {

                this.triggerMethod('table:collection:reset', this.collection);

                if (this.getRegion('head').hasView()) {

                    var flag = this.getChildView('head').$('input[type="checkbox"]').prop('checked');

                    if (flag)
                        this.collection.each(function (m) { m.set('checked', flag); });

                }

                var pg = this.collection.get(0);

                if (pg) {

                    this.collection.remove(pg);

                    var pageSize = pg.get('pageSize') || PAGE_SIZE,
                        page = pg.get('page') || parseInt(this.currentPage),
                        totalPages = Math.ceil(pg.get('num') / pageSize);

                } else
                    totalPages = 0;

                this.getChildView('foot').model.set({
                    currentPage: page,
                    pageSize: pageSize,
                    totalPages: totalPages
                });

                this.getChildView('foot').render();
            },

            error: function () {

            }
        },

        childViewTriggers: {
            'change:input:row': 'change:input:row',
            //'click:row:table': 'click:row:table',
            'click:row:cmd:item': 'table:row:cmd',
            'model:changed': 'table:row:model:changed'
        },


        onChildviewPageSelect: function (page) {
            this.triggerMethod('page:select', page, this.collection);
        },

        childViewEvents: {           

            'click:head:input': function (v) {
                var $i = v.$('input[type=checkbox]');
                $i.prop('checked', !$i.prop('checked'));
                this.collection.each(function (m) {
                    m.set('checked', $i.prop('checked'));
                });
            },

            'check:rows:for:head': function () {
                if (this.getRegion('head').hasView())
                    if (this.collection.where({ checked: true }).length === this.collection.length)
                        this.getChildView('head').$('input[type="checkbox"]').prop('checked', true);
                    else
                        this.getChildView('head').$('input[type="checkbox"]').prop('checked', false);
            },

            'menu:click:item': function (v) {
                this.getChildView('foot').getChildView('menu').$el.parent("div").hide();
                if (v.cmd)
                    v.cmd.call(this, this.modelsSelected, v.model);
            },

            'hide:menu': function () {
                var $m = this.getChildView('foot').getChildView('menu').$el.parent('div');
                if ($m.is(":visible"))
                    $m.delay(300).hide(100);
            },

            'menu:show': function (m, $b) {

                var menu = this.getChildView('foot').getChildView('menu'),
                    c = this.modelsSelected || [];

                if (!_.findWhere(c, { id: m.id })) {
                    this.modelsSelected = [m];
                    this.$("tr.ui-selected").removeClass("ui-selected");
                }

                if (!menu.collection || !menu.collection.length)
                    return;

                var $m = menu.$el.parent("div"),
                    pos = $b.position(),
                    top = pos.top,
                    left = pos.left,
                    dw = $(window).width() - $m.width();

                $m.clearQueue();

                if (pos.left + $m.width() > dw) left = dw - $m.width() - ($('body').hasClass('ls-on') ? 120 : 5);

                $m.css({ 'top': top, 'left': left }).slideDown();
            }
        }
    });

});