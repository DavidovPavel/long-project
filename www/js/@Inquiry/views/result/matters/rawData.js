define('menu', ['i18n!nls/resources.min', 'baseurl', 'global.view.dropDown'], function (Resources, baseurl) {

    return new Backbone.Collection([

     { title: Resources.information, icon: 'info', status: "disabled" },

     {
         title: Resources.addbasket, icon: 'case', 'data-id': "B7787886-AF0E-4B5A-9061-49B182200B8C",
         cmd: function (models, m) {
             Backbone.trigger("basket:add", _.pluck(models, 'id'));
         }
     },

     {
         title: Resources.fbys, icon: 'filter', 'data-id': "C9AB5E2B-2C29-4E22-82CA-CE3FCBE6F8FC",
         cmd: function (models, m) {

         }
     },

     {
         title: Resources.addf, icon: 'selection', 'data-id': "C9AB5E2B-2C29-4E22-82CA-CE3FCBE6F8FC",
         cmd: function ( models, m ) {

             var raw = models[0];

             Backbone.Radio.channel( 'fM' ).trigger( 'show', new Backbone.Model( {
                 id: raw.id,
                 checkID: raw.get( 'originoid' ),
                 title: raw.get( 'title' ),
                 Html: raw.get( 'title' )
             } ) );
         }
     },

     {
         title: Resources.deleteItem, icon: 'trash', 'data-id': "86056534-0DCB-48CF-B06D-3E8D23FD5001",
         cmd: function ( models, m ) {

             Backbone.trigger('message:confirm', {
                 title: Resources.alert,
                 message: Resources.askyousure + '<br/>' + Resources.warndeleteobj,
                 fx: function () {
                     _.each(models, function (model) {
                         model.url = "/api/object/" + model.id;
                         model.destroy();
                     }, this);
                 },
                 ctx: this
             });
         }
     },

     {
         title: Resources.toanal, icon: 'analyst', classButton: "external",
         cmd: function (models) {
             var link = baseurl + "#3|Tree/0/1/" + models[0].id + "/0/0";
             window.open(link);
         }
     }
    ]);
});

define('rowView', ['i18n!nls/resources.min', 'c/SimpleTableView', 'result/fragmentsView', 'source:content', 'menu'], function (Resources, tableView, fragmentsView, contentView, menuCollection) {

    return Mn.View.extend({

        isProof: true,

        template: _.template('<div></div>'),

        regions: {
            table: { el: 'div', replaceElement: true }
        },

        toolsInit: function () {

            this.menuCollection = menuCollection;

            //Backbone.Radio.channel('tools').reply('tools:click:item', function (o) {
            //    if (typeof this[o.name] === 'function')
            //        this[o.name](o);
            //}.bind(this));

            //this.listenTo(Backbone.Radio.channel('fM'), 'add:new:fragment', function (m) {

            //    if (this.model.get('hasFragments').indexOf(m.get("SourceObject_ID")) === -1)
            //        this.model.get('hasFragments').push(m.get("SourceObject_ID"));

            //    m = this.getChildView('table').collection.get(m.get("SourceObject_ID"));
            //    m.set('description', true);

            //});

            //this.listenTo(Backbone.Radio.channel('fM'), 'remove:item', function (id) {

            //    this.model.set('hasFragments', []);
            //    var m = this.getChildView('table').collection.get(id);
            //    m.set('description', false);

            //});

        },

        onRender: function () {

            this.showChildView('table', new tableView({
                collection: this.collection,
                rowTemplate: this.rowTemplate,
                head: this.head,
                menuCollection: menuCollection
            }));

        },

        onAttach: function () {

            this.collection.fetch({ reset: true });

        },

        collectionEvents: {

            request: function(){
                Backbone.Radio.channel('loader').trigger('show', this.$el);
            },

            reset: function () {

                _.each(this.model.get("hasFragments"), function (id) {
                    var m = this.collection.get(id);
                    if (m)
                        m.set('description', true);
                }, this);

                Backbone.Radio.channel('loader').trigger('hide');
            }
        },

        onChildviewPageSelect: function (page) {

            this.collection.url = $.mergeUrlParam(this.collection.url, { page: page });
            this.collection.fetch({ reset: true });

        },

        onChildviewClickRowTable: function (vw) {

            var tools = Backbone.Radio.channel('tools').request('get:tools');

            var mf = tools.collection.get('fragments');

            if (mf)
                tools.children.findByModel( mf ).getChildView( 'vv' ).model.set( { id: vw.model.id, checkID: this.model.id, title: vw.model.get('title') });
            else
                tools.collection.add([
                    {
                        id: 'fragments',
                        className: 'select-text',
                        title: Resources.ms2,
                        view: fragmentsView,
                        options: {
                            model: new Backbone.Model({
                                id: vw.model.id,
                                checkID: this.model.id,
                                title: vw.model.get('title')
                            })
                        }
                    }
                ]);
        },

        onChildviewTableRowCmd: function (v) {

            var content = new contentView( {
                hideToolbar: true,
                model: v.model,
                collection : new Backbone.Collection([], { model: Backbone.Model.extend({ idAttribute: 'uid' }) })
            } );

            var sender = new Backbone.Collection;
            sender.url = `/api/details/ContentV2/${v.model.id}?originoid=${v.model.get('originoid')}`;

            Backbone.Radio.channel('Notify').request('once:dialog', {
                icon: 'icon-folder',
                color: 'blue',
                title: v.model.get('title'),
                content: content,
                toolbar: [],
                footer: []
            });

            Backbone.Radio.channel('loader').trigger('show', content.$el);

            sender.fetch({

                success: function (collection) {

                    var m = collection.at(0),
                        items = m.get('items');

                    collection.set([]);

                    _.each(items, function (item, i) {

                        var attr = _.chain(item.data).map(function (m) {


                            return [m.systemName, m.value];
                        }).object().value();

                        attr.links = item.links;

                        content.collection.add(attr);

                    });

                    Backbone.Radio.channel('loader').trigger('hide');
                }
            });

        }


    });

});

define('result:infos', ['i18n!nls/resources.min', 'rowView'], function (Resources, rowView) {

    return rowView.extend({

        initialize: function () {

            this.collection = new Backbone.Collection();
            this.collection.url = `/api/Docs/InfoDB/${this.model.id}?page=1`;

            this.toolsInit();

            this.rowTemplate = `
                <td>
                    <% if(description){ %><span data-icon='icon-selection' class='right'></span><% } %>
                    <% if(size){ %><a href='#${Backbone.history.fragment}/<%- id %>' class='link'><%= title %></a>
                    <% } else { %><%= title %><% } %>
                </td>
                <td><%-source %></td>
                <td class ='controls'>
                    <button class ='g-form--context menu'><i></i></button>
                    <% if(size) { %><button type='button' class ='g-form--context viewer' data-cmd='viewer'><span data-icon='icon-eye'></span></button><% } %>
                </td>`;

            this.head = new Backbone.Collection([
               { id: 0, title: Resources.titlehead },
               { id: 1, title: Resources.source, width: '25%' },
               { id: 2, title: '', width: '65px' }
            ]);

        },

        onBeforeRender: function () {

            Backbone.Radio.channel('tools').request('get:tools').collection.reset();

        }

    });

});

define('result:facts', ['i18n!nls/resources.min', 'rowView', 'result.fact.model', 'result.fact.add'], function (Resources, rowView, factModel, formView) {

    return rowView.extend({

        initialize: function () {

            this.collection = new Backbone.Collection();
            this.collection.url = "/api/facts/" + this.model.id + "?page=1";

            this.toolsInit();

            this.head = new Backbone.Collection([
                { id: 0, title: Resources.title, width: '60%' },
                { id: 1, title: Resources.type },
                { id: 2, title: Resources.source },
                { id: 3, title: '', width: '65px' }
            ]);

            this.rowTemplate = `
                <td>
                    <% if(description){ %><span data-icon='icon-selection' class='right'></span><% } %>
                    <% if(linkToSourceID) { %>
                    <a href='#${Backbone.history.fragment}/<%- id %>' class='link'><%= title %></a>
                    <% } else { %>
                    <%= title %>
                    <% } %>
                </td>
                <td><%- type %></td>
                <td><%-source %></td>
                <td class ='controls'>
                    <button class ='g-form--context menu'><i></i></button>
                    <% if(linkToSourceID) { %><button type='button' class='g-form--context viewer' data-cmd='viewer'><span data-icon='icon-eye'></span></button><% } %>
                </td>`;
        },

        onBeforeRender: function () {

            //Backbone.Radio.channel('tools').request('get:tools').collection.reset([
            //    { id: 'add', className: 'new-inquiry', title: Resources.addFact }
            //]);

            
        },

        add: function () {

            var form = new formView({
                model: new factModel({
                    linktoid: this.model.id,
                    title: this.model.get('title')
                })
            });

            var dialog = Backbone.Radio.channel('Notify').request('once:dialog', {
                title: Resources.addFact,
                content: form,
                footer: [
                    { id: 'cancel', title: Resources.cancel },
                    { id: 'save', title: Resources.save, className: 'right blue nest-right' },
                    { id: 'search', title: Resources.search, className: 'right nest-right' },
                    { id: 'clear', title: Resources.clear, className: 'right' }
                ]
            });

            this.listenTo(form, 'fact:created', function () {
                dialog.$el.hide();
                this.collection.fetch({ reset: true });
            }, this);

            this.listenTo(dialog, 'controls:button:click', function (v) {

                switch (v.model.id) {
                    case 'cancel':
                        dialog.$el.hide();
                        break;
                }
            });
        }

    });
});

define('result:docs', ['i18n!nls/resources.min', 'rowView', 'result.docs.add', 'result.docs.model'], function (Resources, rowView, formView, docModel) {

    return rowView.extend({

        initialize: function () {

            this.collection = new Backbone.Collection();
            this.collection.url = `/api/Docs/${this.model.id}?page=1`;

            this.toolsInit();

            this.head = new Backbone.Collection([
                { id: 0, title: Resources.titlehead, width: '60%', subTemplate: '<input type="checkbox" class="g-form--checkbox" id="docs-inp-head"><label for="docs-inp-head" style="color:#fff;"><%- title %></label>' },
                { id: 2, title: Resources.source },
                { id: 1, title: Resources.size + ' (Kb)' },
                { id: 3, title: '', width: '65px' }
            ]);

            this.rowTemplate = `
                <td>
                    <% if(description) { %>
                    <span data-icon='icon-selection' class ='right'></span>
                    <% } %>
                    <input type='checkbox' class='g-form--checkbox' id='cbx-<%= id %>' /><label for='cbx-<%= id %>'>
                     <% if(size) { %>
                     <a href='#${Backbone.history.fragment}/<%- id %>' class='link'><%= title %></a>
                     <% } else { %>
                     <%= title %>
                     <% } %>
                     </label>
                 </td>
                 <td><%-source %></td>
                 <td><%-size %></td>
                 <td class ='controls'>
                    <button class ='g-form--context menu'><i></i></button>
                    <% if(size) { %>
                    <button type='button' class ='g-form--context viewer' data-cmd='viewer'><span data-icon='icon-eye'></span></button>
                    <% } %>
                 </td>`;

        },

        onBeforeRender: function () {

            //Backbone.Radio.channel('tools').request('get:tools').collection.reset([
            //   { id: 'run', className: 'gear', title: Resources.runAutoSelect },
            //   { id: 'add', className: 'new-inquiry', title: Resources.addDoc }
            //]);

        },

        run: function () {

            var data = {
                MainObject: this.model.id,
                Sources: function () {
                    return _.chain(this.collection.where({ checked: true })).pluck('id').value();
                }.bind(this)()
            };

            if (!data.Sources.length) {
                Backbone.trigger("message:warning", { message: Resources.ma });
                return;
            }

            Backbone.trigger("message:confirm", {
                title: Resources.confirm,
                message: `${Resources.runAutoSelect}?`,
                titleExec: Resources.run,
                fx: function () {
                    $.ajax({
                        type: "POST",
                        url: "/api/docs/StartAutoExtracting",
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify(data)
                    }).always(function () {
                        Backbone.trigger("message:success", {
                            title: Resources.alert,
                            message: `${Resources.autoselect} ${Resources.ff}`
                        });
                    });
                },
                ctx: this
            });

        },

        add: function () {

            var form = new formView({
                model: new docModel({
                    linktoid: this.model.id,
                    title: this.model.get('title'),
                    linktoupload: `${location.pathname}/files/newdoc/`
                })
            });

            var dialog = Backbone.Radio.channel('Notify').request('once:dialog', {
                color: 'blue',
                title: Resources.addDoc,
                content: form,
                controls: [
                    { id: 'cancel', title: Resources.cancel },
                    { id: 'save', title: Resources.save, className: 'right blue nest-right' },
                    { id: 'clear', title: Resources.clear, className: 'right' }
                ],
                toolbar: []
            });

            this.listenTo(form, 'document:created', function () {
                dialog.$el.hide();
                this.collection.fetch({ reset: true });
            });

            this.listenTo(dialog, 'controls:button:click', function (v) {

                switch (v.model.id) {
                    case 'cancel':
                        dialog.$el.hide();
                        break;
                }


            });

        }
    
    });
});

define('result:reqs', ['i18n!nls/resources.min', 'rowView'], function (Resources, rowView) {

    return rowView.extend({

        initialize: function () {

            this.collection = new Backbone.Collection();
            this.collection.url = "/api/requisit/" + this.model.id + "?page=1";

            this.toolsInit();

            this.head = new Backbone.Collection([
               { id: 0, title: Resources.title, width: '60%' },
               { id: 1, title: Resources.type },
               { id: 2, title: Resources.source },
               { id: 3, title: '', width: '65px' }
            ]);

            this.rowTemplate = `
                <td>
                    <% if(description){ %>
                    <span data-icon='icon-selection' class='right'></span>
                    <% } %>
                    <%= title %>
                </td>
                <td><%- type %></td>
                <td><%- source %></td>
                <td class='controls'>
                    <button class='g-form--context menu'><i></i></button>
                </td>`;
        },

        onBeforeRender: function () {
            Backbone.Radio.channel('tools').request('get:tools').collection.reset();
        }

    });

});