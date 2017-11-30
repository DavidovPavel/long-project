//define('c/AlertsView', ['i18n!nls/resources.min', 'Feedback'], function (Resources, feedbackView) {

import Resources from 'i18n!nls/resources.min';
import feedbackView from './Feedback';
import './alert.less';

    var AlertChannel = Mn.Object.extend({
        channelName: 'Ale'
    });

    new AlertChannel;

    var MessageView = Mn.View.extend({

        tagName: "li",

        template: _.template('<span><%- title %></span><i class="erase"></i>'),

        triggers: {
            'click span': 'click:message'
        },

        events: {

            "click .erase": function ( e ) {

                e.stopPropagation();

                this.model.collection.remove( this.model );

                SJ.iwc.SignalR.getHubProxy( 'Ticker', { client: {} })
                    .server
                    .sendMessage( { result: null }, this.model.id, 1 );

            }
        },

        onRender: function () {

            if (this.model.get('Status') === 'red')
                this.$el.addClass("alert-red");

            if (this.model.get('Status') === 'blue')
                this.$el.addClass("alert-blue");

            // открываем сразу федбек
            var app = Backbone.Radio.channel( 'oM' ).request( 'get:app' );
            if (app && app.Tasks.indexOf(this.model.get("taskUID")) !== -1)
                this.triggerMethod('click:message', this);

        }
    });

    var messagesList = Mn.CollectionView.extend({

        tagName: 'ul',

        childView: MessageView,

        emptyView: Mn.View.extend({

            tagName: 'li',

            template: _.template('<span><%- Resources.N %></span>'),

            templateContext: {
                Resources:Resources
            }
        }),

        childViewOptions: function (m) {

            var kind = m.has('kind') ? m.get("kind") : 0, // 0- message, 1-warning, 2-error
                state = m.has('state') ? m.get("state") : 'hot'; // hot, cold, frozen

            switch ( m.get( "typeid" ) ) {

                case -1:                            // сообщение от ситемы без кнопок
                    m.set({ "Status": "none" });
                    break;

                case 1:                             // уточнение по задаче, выбор пользователя
                case 2:                             // capture
                    m.set({ "Status": "red" });
                    break;

                case 3:                             // запрос по ЕГРЮЛ
                    m.set({ "Status": "blue" });
                    break;

                default: m.set({ "Status": "none" }); break;
            }
        },

        childViewTriggers: {
            'click:message': 'click:message'
        }

    });

    export default Mn.View.extend({

        tagName: 'li',
        className: 'tray--item alert-block',

        template: _.template('<span class="alert"></span><div class="alert--container"><div class="alert--header"><i class="close"></i><div><%= Resources.serverMessage %></div></div><div class="alert--list"></div></div>'),
        templateContext: {
            Resources: Resources
        },

        ui: {
            btn: '.alert',
            header: '.alert--header>div',
            container: '.alert--container'
        },

        regions: {
            list: '.alert--list'
        },

        events: {

            'click i.close': function () {
                this.ui.container.removeClass('active');
            },

            'click @ui.btn': function () {
                this.ui.container.toggleClass('active');
            }

        },

        initialize: function () {
            this.collection = new Backbone.Collection;
        },

        onRender: function () {
            this.showChildView('list', new messagesList({ collection: this.collection }));
            
        },

        onAttach: function () {
            this.monitoring();
        },

        onChildviewClickMessage: function (r) {

            if (r.model.get("html")) {

                if (!this.feedback)
                    this.feedback = new feedbackView({ model: r.model });
                else
                    this.feedback.model = r.model;

                this.feedback.render();

            } else
                r.model.collection.remove(r.model);
        },

        collectionEvents: {

            reset: function (c) {
                this.status();
            },

            update: function (c, o) {

                this.status();

                if ( o.add ) {
                    console.log( 'Ticker :: new message' );
                    this.returnMessage();
                }

                this.sharedCollection.change( function () {

                    return this.collection.models;

                }.bind(this));

            }
        },

        status: function () {

            if (this.collection.length) {

                this.ui.btn.addClass('active');
                this.ui.container.addClass('active');
                this.ui.header.html(Resources.alertMessage);

            } else {

                this.ui.btn.removeClass('active');
                this.ui.container.removeClass('active');
                this.ui.header.html(Resources.serverMessage);

            }
        },

        returnMessage: function () {

            var hub = SJ.iwc.SignalR.getHubProxy( 'Ticker', { client: {} });

            this.collection.each( function ( m ) {

                hub.server.returnValueSet( 'alertDelivery', m.get( 'eqID' ), '1' );

            });
        },

        monitoring: function () {

            var hub = SJ.iwc.SignalR.getHubProxy( 'Ticker', {

                client: {

                    showAlerts: function ( messages ) {

                        if ( messages.length )
                            this.collection.add( messages );

                    }.bind( this ),


                    acitiveAlerts: function ( guids ) {

                        this.collection.each( function ( m ) {

                            if ( m && guids.indexOf( m.id ) === -1 && m.get( "typeid" ) !== -1 )
                                this.collection.remove( m );

                        }, this );

                    }.bind( this ),


                    hideAlerts: function ( id ) {

                        var m = this.collection.get( id );
                        this.collection.remove( m );

                    }.bind( this ),


                    transferData: function ( data, kind, wnd ) {

                        Backbone.Radio.channel( 'Ale' ).request( 'get:transfer:data', { data: data, kind: kind });
                        //console.log("SR > transfer data", { data: data, kind: kind });

                    },

                    ping: function ( msg ) {
                        console.log( 'Ticker :: ping >> ', msg );
                    }
                }
            });


            // entry
            //SJ.iwc.SignalR.start().done( function () {});

            this.sharedCollection = new SJ.iwc.SharedData( "AlertMessages" );

            this.sharedCollection.onChanged( function ( a ) {
                this.collection.set( a );
            }, this );

            var sc = this.sharedCollection.get();

            if ( sc === null || !sc.length )
                this.sharedCollection.set( this.collection.models );

            else if ( sc.length )
                this.collection.set( sc );
            
        }

    });