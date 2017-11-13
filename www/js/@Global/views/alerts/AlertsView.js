define('c/AlertsView',

['app', 'i18n!nls/resources.min', 'Feedback', 'dist/jquery.mCustomScrollbar.concat.min' ], function (App, Resources, feedbackView) {

    var messageTemplate = '<span><%- title %></span><span class="cmd"><% if(Status==="red"){ %><% }else if(Status==="blue") { %><span role="button"><svg class="icon icon-arrow-more"><use xlink:href="#icon-arrow-more"/></svg></span><% } %><span role="button"><span class="icon icon-trash"></span></span></span>';

    var MessageView = Mn.View.extend({
        tagName: "li",
        template: _.template(messageTemplate),

        triggers: {
            'click':'click:message'
        },

        events: {

            "click .icon-trash": function (e) {
                e.stopPropagation();
                var id = this.model.id;
                this.model.collection.remove(this.model);
                require(["signalR"], function () {
                    require(['/signalr/hubs'], function () {
                        require(['/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'], function () {
                            var hub = SJ.iwc.SignalR.getHubProxy('Ticker', { client: {} });
                            hub.server.sendMessage({ result: null }, id, 1);
                            console.log("SR> clear:task > done", { result: null, id: id, param: 1 });
                        });
                    });
                });                
            }
        },

        onRender: function () {
            if (this.model.get('Status') === 'red')
                this.$el.addClass("alert-red");
            if (this.model.get('Status') === 'blue')
                this.$el.addClass("alert-blue");

            // пропускаем этот шаг и открываем сразу федбек
            if (this.model.get("taskUID") === window.sessionStorage["TaskUID"]) {
                this.triggerMethod('click:message', this);
                this.model.collection.remove(this.model);                
            }
        }
    });

    var messagesList = Mn.CollectionView.extend({
        tagName: 'ul',
        childView: MessageView,
        childViewOptions: function (m) {

            var kind = m.has('kind') ? m.get("kind") : 0, // 0- message, 1-warning, 2-error
                state = m.has('state') ? m.get("state") : 'hot'; // hot, cold, frozen

            switch (m.get("typeid")) {
                case -1: // сообщение от ситемы без кнопок
                    m.set({ "Status": "none" });
                    break;
                case 1: // уточнение по задаче, выбор пользователя
                    //break;
                case 2: // capture
                    m.set({ "Status": "red" });
                    break;
                case 3: // запрос по ЕГРЮЛ
                    m.set({ "Status": "blue" });
                    break;
                default: m.set({ "Status": "none" }); break;
            }
        }
       
    });

    return Mn.View.extend({
        className: 'alert-btn',
        template: '#alert-list-template',
        templateContext: {
            Resources: Resources
        },

        events: {

            "click .close": function () {
                this.$(".dropdown-menu").slideUp();
                if (!this.collection.length) {
                    this.$("button").removeClass('animation-on');
                    this.$el.hide();
                }
                else
                    this.$("button").addClass('animation-on');
            },

            "click button": function () {
                this.$("button").removeClass('animation-on');
                this.$(".dropdown-menu").slideDown();
            }
        },

        regions: {
            'messages': { el: '.menu-alert-list>ul', replaceElement: true },
            'feedback': '.feedback-panel'
        },

        initialize: function () {
            this.collection = new Backbone.Collection();
        },

        status: function () {
            if (this.collection.length) {
                this.$("button.btn-link").addClass('animation-on');
                this.$el.show();

                this.collection.each(function (m) {
                    if (parseInt(m.get('typeid')) > 0)
                        this.$(".dropdown-menu").slideDown();
                }, this);

            } else {
                this.$("button.btn-link").removeClass('animation-on');
                this.$el.hide();
            }
        },

        collectionEvents: {

            reset: function (c) {
                this.status();
            },

            update: function (c, o) {

                this.status();
                this.sharedCollection.change(function () {
                    return this.collection.models;
                }.bind(this));

            }
        },

        returnMessage: function () {
            var collection = this.collection;
            require(["signalR"], function () {
                require(['/signalr/hubs'], function () {
                    require(['/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'], function () {

                        var hub = SJ.iwc.SignalR.getHubProxy('Ticker', { client: {} });

                        collection.each(function (m) {
                            hub.server.returnValueSet('alertDelivery', m.get('eqID'), '1');
                            console.log('SR > уведомление о добавлении алерта', m.attributes);
                        });

                    });
                });
            });

        },

        onChildviewClickMessage:function(r){
            if (r.model.get("html")) {
                if (!this.feedback)
                    this.feedback = new feedbackView({ model: r.model });
                else
                    this.feedback.model = r.model;

                this.feedback.render();
            } else
                r.model.collection.remove(r.model);
        },

        onRender: function () {

            //this.showChildView('feedback', new feedbackView({ model: new Backbone.Model({html: '<p>это текст!</p>'}) }));

            this.$el.hide();
            this.showChildView('messages', new messagesList({ collection: this.collection }));
            this.$('.menu-alert-list').mCustomScrollbar();            
            this.monitoring();
        },

        monitoring: function () {
            require(['signalR'], function () {
                require(['/signalr/hubs'], function () {
                    require([
                        '/scripts/IWC-SignalR-master/signalr-patch.js',
                        '/scripts/IWC-SignalR-master/iwc-signalr.js'
                    ],
                    function () {

                        var Check = new SJ.iwc.SharedData("Check");
                        Check.onChanged(function (o) {
                            //var p = SJ.iwc.WindowMonitor.getThisWindowId();
                            if (o.kind !== -1)
                                Backbone.trigger("transferdata:kind", o.data);
                        });

                        var hub = SJ.iwc.SignalR.getHubProxy('Ticker', {
                            client: {

                                showAlerts: function (messages) {
                                    if (messages.length) {
                                        this.collection.add(messages);
                                        this.returnMessage();
                                        Backbone.trigger("showalert:newmessage");
                                    }
                                }.bind(this),

                                acitiveAlerts:function(guids){

                                    this.collection.each(function (m) {
                                        if (guids.indexOf(m.id) === -1 && m.get("typeid") !== -1)
                                            this.collection.remove(m);
                                    }, this);

                                }.bind(this),

                                hideAlerts: function (id) {
                                    var m = this.collection.get(id);
                                    this.collection.remove(m);
                                }.bind(this),

                                transferData: function (data, kind, wnd) {
                                    var p = { data: data, kind: kind, wnd: wnd };
                                    Check.set(p);
                                    Check.change(function (p) { return p; });
                                    console.log("SR > transfer data", { data: data, kind: kind });
                                    if (kind === -1)
                                        Backbone.trigger('no:transfer:data');
                                }
                            }
                        });

                        console.log("SR > Monitoring Alerts Init", { hub: hub });

                        this.sharedCollection = new SJ.iwc.SharedData("AlertMessages");

                        this.sharedCollection.onChanged(function (a) {
                            this.collection.set(a);
                        }, this);

                        var sc = this.sharedCollection.get();
                        if (sc === null || !sc.length) {
                            this.sharedCollection.set(this.collection.models);
                        }
                        else if (sc.length) {
                            this.collection.set(sc);
                        }

                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }
    });
});