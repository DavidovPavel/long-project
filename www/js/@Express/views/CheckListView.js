define([
    'app',
    '@/views/SearchView',
    '@/views/ListView',
    'storage'
],
function (App, SearchView, ListView, Storage) {
    "use strict";

    var $progress = $("<span class='icon-progress'><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span>");

    return Backbone.View.extend({
        el: $("#CheckList"),
        events: {
            "click .nav a": "jump"
        },

        jump: function (e) {
            e.preventDefault();
            App.Select.set("page", 1);
            App.navigate(App.Select.fullpath());
            var $a = $(e.target).closest("a");
            this.tab($a).trans($a.attr("href"));
        },
        tab: function ($a) {
            this.$("ul.nav li.active").removeClass("active");
            this.$(".tab-content>div").hide();
            $a.parent().addClass("active");
            return this;
        },
        trans: function (name) {
            this.$(name).show();
            switch (name) {
                case "#my-checks": this.mycheck(); break;
                case "#all-checks": this.search(); break;
                case "#search-checks":
                    if (!this.searchInit) {
                        this.searchInit = true;
                        new SearchView().render().fill();
                    }
                    break;
            }
            App.Select.set("list", name.substr(1));
            App.navigate(App.Select.fullpath());
            return this;
        },
        initialize: function () {
            this.timers = {};
            this.totalCheck();

            let list = App.Select.get("list"),
                $a = $.trim(list) ? this.$(`a[aria-controls='${list}']`) : this.$("a").eq(0);

            this.tab($a);
            this.trans($a.attr("href"));

            Backbone.on("storage:check-add", this.showChecking, this);

            require(['signalR'], () => {
                require(['/signalr/hubs'], () => {
                    require(['/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'],
                        () => {
                            var hub = SJ.iwc.SignalR.getHubProxy('Ticker', {
                                client: {
                                    infoActiveChecks:  (objectsIds)=> {
                                        console.log("Инфо об активных проверках", { ids: objectsIds });
                                        this.infoActiveChecks(objectsIds);
                                    }
                                }
                            });
                        });
                });
            });
        },
        infoActiveChecks: function (a) {
            if (!a.length) {              

                if (Storage.checkCollection)
                    Storage.checkCollection.reset();

                this.stopMonitoring();
            }
            this.$("table.List>tbody tr").each((i, e) => {
                var $i = $(e).find(".icon-progress");
                if ($i.get(0)) {
                    $i.remove();
                    $(e).find("td:nth-last-child(2)").append($("<svg class='icon icon-check'><use xlink:href='#icon-check'></use></svg>"));
                }
            });
            Array.from(a, this.checkIcon, this);
        },
        checkIcon:function(id){
            let $td = this.$(`tr[data-id='${id}']`).find("td:nth-last-child(2)");
            $td.find("svg").remove();
            $td.html($progress.clone());
            return this;
        },
        showChecking: function () {
            let link = "#my-checks";
            this.tab(this.$(`a[href='${link}']`)).trans(link).totalCheck();
        },
        totalCheck: function () {
            $.get("/api/totalcheck").done((a)=> {
                this.$('ul a[href="#my-checks"] span').text(`(${a[0]})`);
                this.$('ul a[href="#all-checks"] span').text(`(${a[1]})`);
            });
            return this;
        },
        mycheck: function () {
            if (!this.mycheckInit) {
                this.mycheckInit = true;
                this.mylist = new ListView({ el: this.$("#my-checks") });
                this.mylist.collection.url = "/api/mycheck?page=1";
                this.listenTo(this.mylist, "to:page", function (page) {
                    this.mylist.newPage = page;
                    this.mylist.fetch()
                });
            }

            this.mylist.newPage = App.Select.get("page");
            this.mylist.fetch().done(function (result) {
                this.$('ul a[href="#my-checks"] span').text(`(${result.collection.models[0].get("pagination").totalItems})`);
                this.chooseStatus();
                if (this.callback)
                    this.callback.call(this.context);
            }, this);
            return this;
        },

        search: function () {
            if (!this.allcheckInit) {
                this.allcheckInit = true;
                this.alllist = new ListView({ el: this.$("#all-checks") });
                this.alllist.collection.url = "/api/interestObjects?onlyMeta=&profileID=&paramID=&typeID=&inputText=&page=1";
                this.listenTo(this.alllist, "to:page", function (page) {
                    this.alllist.newPage = page;
                    this.alllist.fetch()
                });
            }

            this.alllist.newPage = App.Select.get("page");
            this.alllist.fetch().done(function (result) {
                this.$('ul a[href="#all-checks"] span').text(`(${result.collection.models[0].get("pagination").totalItems})`);
                this.chooseStatus();
                if (this.callback)
                    this.callback.call(this.context);
            }, this);
            return this;
        },
        chooseStatus: function () {
            var collection = Storage.checkCollection;
            if (collection) {
                collection.each(m=> {
                    this.checkIcon(m.id);
                    this.checkProcess(m.id);
                });
            }
        },
        checkProcess: function (id) {
            var appHold = app;
            require(["signalR"], function () {
                require(['/signalr/hubs'], function () {
                    require(['/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'], function () {
                        var ctx = appHold.getContext();
                        var hub = SJ.iwc.SignalR.getHubProxy('Ticker', { client: {} });
                        hub.server.startMonitoringTasks(ctx.key, id);
                    });
                });
            });
        },
        stopMonitoring: function () {},
        done: function (fx, ctx) {
            this.callback = fx;
            this.context = ctx;
            return this;
        }
    });
});