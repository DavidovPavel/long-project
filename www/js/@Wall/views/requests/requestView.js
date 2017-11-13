define('requestView', ['bdid', 'i18n!nls/resources.min', 'services.library.libraryView', 'global.view.dialog', 'global.view.connect'],

function (bdid, Resources, requestLibrary, dialogView, connectView) {
 
    var collectionRequests = Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: "rid",
            defaults: {
                rid: 0,
                domain: "",
                dbase: parseInt(bdid),
                requestid: null,
                param: [],
                page: 1,
                pagesize: 10
            }
        }),
        url: function () {
            return '/api/interactive/getparamsforwall/';
        }
    });

    var requestView = Mn.View.extend({

        className: 'item',

        template: _.template('<input type="radio" id="<%- rid %>_<%- prefix %>" class="g-form--radio" name="radio_MasterCreate"><label for="<%- rid %>_<%- prefix %>"><%- title %></label><svg class="svg-icon icon-close"><use xlink:href="#icon-close" /></svg>'),

        triggers: {

            "click input": {
                event: 'click:item',
                stopPropagation: false,
                preventDefault: false
            },

            "click .icon-close": 'close'
        },

        onClose: function () {

            Backbone.trigger("message:confirm", {
                title: Resources.askyousure, message: Resources.crn,
                fx: function () {
                    this.model.destroy({ wait: true });
                },
                ctx: this
            });
        }
    });

    var listRequests = Mn.CollectionView.extend({

        className: 'list-area',

        childView: requestView,

        emptyView: Mn.View.extend({ template: _.template('<div class="item">' + Resources.N + '</div>') }),

        onRenderChildren: function () {

            if ( this.requestAddedID ) {

                var model = this.collection.findWhere({ requestid: parseInt(this.requestAddedID) });
                if (model) {
                    this.children.findByModel(model).$('input').prop('checked', true);
                    this.requestAddedID = null;
                }
            }

            if (this.model.get('requestParameters') && this.model.get('requestParameters').rid) {

                model = this.collection.get(this.model.get('requestParameters').rid);
                this.children.findByModel(model).$('input').prop('checked', true);
            }
        },

        childViewOptions: function ( m ) {
            m.set('prefix', this.model.get('widgetID'));
        },

        childViewTriggers: {
            'click:item': 'child:click:item'
        }
    });

    return Mn.View.extend({

        template: templates['requests-template'],
        templateContext:{
            Resources:Resources
        },

        ui:{
            description: '.description',
            t: '.title2'
        },

        regions: {
            list: { el: '.list-area', replaceElement: true }
        },

        events: {

            "click .refresh": function () {

                this.collection.fetch({ reset: true });
                this.model.set({ "requestParameters": {} });

            },

            "click .library": function (e) {

                var connect = new connectView;

                var d = new dialogView({
                    color: 'blue',
                    icon: 'gear',
                    modal: true,
                    size: 'full',
                    title: Resources.titleReqLib,
                    footer: new Backbone.Collection([
                        { id: 'cancel', title: Resources.cancel },
                        { id: 'connect', title: Resources.Connect, className: 'right blue disabled' }
                    ]),
                    content: connect
                });

                this.listenTo(d, 'footer:button:click', function (v) {

                    var dbase = '';

                    switch (v.model.id) {

                        case 'cancel': d.close(); break;

                        case 'connect':

                            dbase = connect.collection.at(0).id;

                            $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { db: 'db' + dbase });

                            d.model.get('footer').set([
                                { id: 'cancel', title: Resources.cancel },
                                { id: 'add', title: Resources.add, className: 'right blue' }]);

                            d.model.set('content', new requestLibrary({ widgetType: this.model.get("typeName"), dbase: dbase }));


                            break;

                        case 'add':

                            var library = d.model.get('content');

                            if (!library.requestID)
                                library.triggerMethod('show:message', Resources.noselect);

                            else {

                                var data = library.getChildView('params').collection.toJSON(),

                                    requestParameters = {
                                        domain: window.location.host,
                                        dbase: dbase,
                                        requestid: library.requestID,
                                        parameters: data
                                    };

                                $.ajax({ url: "/api/interactive/paramsforwall", data: $.param(requestParameters), type: "POST" })
                                    .done(function (m, n) {

                                        this.getChildView('list').requestAddedID = library.requestID;

                                        this.collection.fetch({
                                            reset: true,
                                            success: function (c) {

                                                var data = this.collection.findWhere({ requestid: parseInt(library.requestID) });

                                                if (data) {
                                                    this.model.set({ "requestParameters": data.toJSON() });
                                                    d.close();
                                                }
                                                else
                                                    Backbone.trigger('message:warning', { message: Resources.error + ' ' + Resources.N });

                                            }.bind(this)
                                        });

                                    }.bind(this));

                            }

                            break;
                    }

                });

                this.listenTo(connect, 'connect:made', function () {
                    d.getChildView('footer').children.findByIndex(1).$('button').removeClass('disabled');
                });

                Backbone.Radio.channel('Notify').request('add:dialog', d);

            }
        },

        initialize: function () {

            this.collection = new collectionRequests;            
        },

        onAttach: function () {

            if (["WidgetSource", "WidgetReporting", "WidgetHtml", "WidgetSemNet"].indexOf(this.model.get("typeName")) === -1) {

                this.showChildView( 'list', new listRequests( { collection: this.collection, model: this.model }) );

                this.collection.url = `/api/interactive/getparamsforwall/${this.model.get("typeName")}`;

                this.collection.fetch({ reset: true });

            } else
                this.$el.hide();

        },

        collectionEvents: {

            request: function () {

                Backbone.Radio.channel('loader').trigger('show', this.ui.t, { size: '', speed: 'fast' });

            },

            sync: function () {

                Backbone.Radio.channel('loader').trigger('hide');

            },

            update: function ( c, o ) {

                if (o.changes.removed.length && this.model.get('requestParameters') && this.model.get('requestParameters').rid === o.changes.removed[0].id)
                    this.model.set({ "requestParameters": {} });

                Backbone.Radio.channel('loader').trigger('hide');
            }

        },

        onChildviewChildClickItem: function (v) {
            this.model.set({ "requestParameters": v.model.toJSON() });
        }

    });
    
});