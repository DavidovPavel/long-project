define([
'app',
'i18n!nls/resources.min',
'@/views/details/searchrobots/ProfileView',
'text!@/templates/details/searchtaskTemplate.html',
'text!@/templates/tree/searchtaskItemTemplate.html'
],
function ( App,        Resources,        ProfileView,        searchtaskTemplate,        searchtaskitemTemplate) {

    var searchTasks = Backbone.View.extend({
        el: $("#SearchBySource .Load"),
        selected: [],
        flagAutoSelect: false,
        events: {
            "click button.Run": "StartTask",
            "click #MenProf": "winProfiles",
            "change select.profile": "selectProfile",
            "click .showTasks": "showTasksByProfile",
            "click .autoSelect": "autoSelect",
            "click p.sst span": "check"
        },
        check: function(e) {
            var v = parseInt($(e.target).attr("data-value"));
            switch (v) {
            case 1:
                this.tree.$el.find(".Chbx").addClass("Sel");
                this.tree.selected = this.tree.collection.pluck("id");
                break;
            case 2:
                this.tree.$el.find(".Chbx").removeClass("Sel");
                this.tree.selected = [];
                break;
            case 3:
                var all = this.tree.collection.pluck("id");
                var sd = this.tree.selected;
                _.each(all, function(id) {
                    var p = sd.indexOf(id);
                    if (p != -1) {
                        sd.splice(p, 1);
                        this.tree.$el.find("span[data-taskid=" + id + "]").next("span.Chbx").removeClass("Sel");
                    } else {
                        sd.push(id);
                        this.tree.$el.find("span[data-taskid=" + id + "]").next("span.Chbx").addClass("Sel");
                    }
                }, this);
                break;
            }
            this.selectTasks(this.tree.selected);
        },
        autoSelect: function() {
            this.flagAutoSelect = $(arguments[0].target).is(":checked");
        },
        winProfiles: function() {
            new ProfileView({ profileid: this.profileid });
        },
        selectTasks: function(arr) {
            this.$("button.Run").button({ disabled: !arr.length });
            this.$("#robotsInProfile span").hide();
            this.$("#Balance .List div").hide();
            this.$("#Balance .TotalVal").text("0");
            _.each(arr, function(id) {
                this.$("#robotsInProfile").find("span[data-id=" + id + "]").show();
                this.$("#Balance .List").find("div[data-id=" + id + "]").show();
                this.$("#Balance>section").show();
            });
            var intotal = 0;
            this.$("#Balance .List div b").each(function() {
                if ($(this).is(":visible"))
                    intotal += parseFloat($(this).text());
            });
            this.$("#Balance .TotalVal").text(intotal.toFixed(2));
            if (intotal == 0) this.$("#Balance>section").hide();
            else this.$("#Balance>section").show();
        },
        showTasksByProfile: function() {
            if (!this.tti) {
                var mainObjectID = App.Select.get("detail");

                //$.get(("/api/search/TacksByProfile/?" + $.param({ "mainObjectID": mainObjectID, "profileID": this.profileid }))).done(function(tasks) {
                //    Backbone.trigger("task:obtained", tasks);
                //});

                require(["@/views/Tree/TreeView"], function (Tree) {

                    this.tree = new Tree({
                        branch: { parentid: null },
                        el: this.$("div.inLoad"),
                        api: (("/api/search/TacksByProfile/?" + $.param({ "mainObjectID": mainObjectID, "profileID": this.profileid }))),
                        itemtemplate: searchtaskitemTemplate
                    }).done(function (tree) {
                        this.fillTasks(tree);
                        tree.selected = this.selected;
                        this.$("button.Run").button({ disabled: !tree.selected.length });
                        this.$("div.inLoad").prepend("<p class='sst'><span class='link' data-value='1'>" +
                            Resources.selectall + "</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class='link' data-value='2'>" +
                            Resources.clearselect + "</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class='link' data-value='3'>" +
                            Resources.inversion + "</span></p>");
                    }.bind(this));

                    this.tree.select = function (selected) {
                        this.selectTasks(selected);
                    }.bind(this);

                    this.tree.operation = function () {
                        if ($.type(this.model.id) === "string") {
                            $.ajax(("/api/Search/TaskOptions/?tasktypeid=" + this.model.id + "&id=" + App.Select.get("detail")))
                                .done(function (uri) {
                                    $("<iframe src='" + uri + "' id='configFrame'></iframe>").dialog({
                                        title: Resources.configSearch + " [" + uri + "]",
                                        width: 600,
                                        height: 550,
                                        open: function () {
                                            $(this).css("width", "95%");
                                        }
                                    });
                                });
                        }
                    };
                    this.tti = true;
                    this.$(".showTasks").button({ label: Resources.close }).data("open", "1");
                    this.$("div.inLoad").show();
                }.bind(this));
            } else {
                if (this.$(".showTasks").data("open")) {
                    this.$(".showTasks").button({ label: Resources.preview }).removeData("open");
                    this.$("div.inLoad").hide();
                } else {
                    this.$(".showTasks").button({ label: Resources.close }).data("open", "1");
                    this.$("div.inLoad").show();

                }
            }
            this.$("button.Run").button({ disabled: !this.tree.selected.length });
        },

        taskObtained: function() {
            // bild list search tasks
        },

        fillTasks: function(tree) {
            var mdls = tree.models;
            _.each(mdls, function(m) {
                var tasks = m.get("TaskTypes");
                _.each(tasks, function(a) {
                    a.isdoc = true;
                    a.parentid = m.id;
                });
                m.collection.add(tasks);
            });
            this.$el.find(".Chbx").addClass("Sel");
        },
        selectProfile: function() {
            this.tree = { };
            this.selected = [];
            this.$("div.inLoad").empty();
            this.$("#Balance>section").hide();
            this.$("#Balance .List").empty();
            this.$("#robotsInProfile").empty();
            var profileid = this.$("select.profile").val();
            if (this.profileid != profileid) this.tti = false;
            this.profileid = profileid;
            var mainObjectID = App.Select.get("detail");
            this.$("#robotsInProfile").showIndicator();
            $.get("/api/search/TasksByProfileSimple/", $.param({ "mainObjectID": mainObjectID, "profileID": this.profileid }))
                .done(function(list) {
                    Backbone.trigger("get:profiles", list);
                });

            if (this.profileid != -1) {
                this.$(".showTasks").button({ label: Resources.preview }).removeData("open");
            } else {
                this.$(".showTasks").button({ disabled: true });
                this.$("div.inLoad").empty();
            }
        },

        // список названий задач
        fillProfiles: function(list) {
            this.$("#robotsInProfile").hideIndicator();
            if (!list.length) {
                this.$("#robotsInProfile").text(Resources.Nbot);
            }
            this.$("#Balance .TotalVal").text("0");
            for (var i = 0; i < list.length; i++) {
                var el = list[i];
                this.$("#robotsInProfile").append("<span data-id='" + el.id + "'><b>" + (i + 1) + "</b>." + el.title + "</span>&nbsp;");
                this.selected.push(el.id);
                if (el.goods && el.goods.length) {
                    _.each(el.goods, function(o) { this.addPriceList(o, el.id) }, this);
                }
            }
            this.$("#robotsInProfile").show();
            this.$("button.showTasks").button({ disabled: !this.selected.length });
            this.$("button.Run").button({ disabled: !this.selected.length });
            this.tree.selected = this.selected;
        },
        addPriceList: function(o, _id) {
            var ou = o;
            ou._id = _id;
            var template = "<div data-id='<%= _id %>'><%= title %><b><%= price.toFixed(2) %></b></div>";
            this.$("#Balance .List").append(_.template(template)( ou));
            this.$("#Balance>section").show();
            var intotal = o.price + parseFloat(this.$("#Balance .TotalVal").text());
            this.$("#Balance .TotalVal").text(intotal.toFixed(2));
        },
        StartTask: function() {
            if (!this.tree.selected.length) {
                this.$("button.Run").button({ disabled: true });
                return;
            }
            var r = $.grep(this.tree.selected, function(val) { return $.type(val) === "string"; });
            this.$el.showIndicator();
            var data = { MainObject: parseInt(App.Select.get("detail")), TaskTypeIDs: r, AutoSelect: this.flagAutoSelect };
            var s = this;
            $.ajax({
                type: "POST",
                url: "/api/search/StartTaskPack",
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(data)
            }).done(function() {
                s.$el.hideIndicator();
                if (s.tti) {
                    s.$(".Container span[data-taskid]").each(function() {
                        var id = $(this).attr("data-taskid");
                        if (r.indexOf(id) != -1)
                            $.addIcon($(this), { status: "processing", state: Resources.processing });
                    });
                }
            }).fail(function() {
                $.Error(arguments);
            });
        },

        // accidend
        stateEnabled: function() {
            //clearTimeout(this.tickBalance);
            //this.getBalance();
            // task with kind=1 - show!
        },
        stateDisabled: function() {
            clearTimeout(this.tickBalance);
            this.$("#Balance .BalanceVal").text(Resources.serviceNotAvaiable);
            // task with kind=1 - hide!
        },
        standDisabled: function() {
            clearTimeout(this.tickBalance);
            this.$("#Balance").hide();
            // task with kind=1 - hide!
        },
        standEnabled: function() {
            clearTimeout(this.tickBalance);
            //this.getBalance();
            this.$("#Balance").show();
            // task with kind=1 - show!
        },

        findTasks: function() {
            this.$("#robotsInProfile").find("span[data-id=" + guid + "]");
        },

        initialize: function() {

            Backbone.on("mmcsstate:disabled", this.stateDisabled, this);
            Backbone.on("mmcsstate:enabled", this.stateEnabled, this);
            Backbone.on("mbfstand:disabled", this.standDisabled, this);
            Backbone.on("mbfstand:enabled", this.standEnabled, this);

            Backbone.on("task:obtained", this.taskObtained, this);

            Backbone.on("submenu:action", function(_i) {
                if (_i && this.tickBalance)
                    clearTimeout(this.tickBalance);
            }, this);
            Backbone.on("smt:tasks", this.render, this);
            //Backbone.on("url:change", function() {
            //    if (App.Select.get("tab") != 4)
            //        clearInterval(this.tickBalance);
            //}, this);
            Backbone.on("get:balance", this.fillBalance, this);
            Backbone.on("get:profiles", this.fillProfiles, this);
            var s = this;
            require(['signalR'], function () {
                require(['/signalr/hubs'], function() {
                    var ticker = $.connection.Ticker;
                    $.extend(ticker.client, {
                        updateRobot: function(robot) {
                            if (s.tti) {
                                var _id = robot.id;
                                var $e = s.$("span[data-taskid='" + _id + "']");
                                if ($e.get(0)) {
                                    $.addIcon($e, robot);
                                }
                            }
                        }
                    });
                });
            });
        },
        render: function () {
            clearInterval(this.tickBalance);
            this.getBalance();
            this.tti = false;
            if (arguments[0]) this.profileid = arguments[0];
            if (this.tree) this.tree.selected = [];
            this.$el.html(_.template(searchtaskTemplate)( { Resources: Resources, WorkGroupID: App.workGroupID }));

            this.$("select.profile").empty();
            this.$("div.inLoad").empty();
            this.$(".showTasks").button({ disabled: true });

            this.profiles = new Backbone.Collection();
            this.profiles.url = function() { return "/api/search/SimpleProfiles"; }

            this.$("select.profile").append("<option value=''>...</option>");
            //this.$("select.profile").showIndicator();
            var s = this;
            this.profiles.fetch({
                success: function(model, resp) {
                    _.each(resp, function(m) {
                        s.$("select.profile").append("<option value='" + m.ProfileID + "' " +
                            (m.IsDefault ? "selected='selected'" : "") + ">" + m.title + "</option>");
                    })
                    //s.$("select.profile").hideIndicator();
                    if (!s.$("select.profile").val()) {
                        if (s.profileid) {
                            s.$("select.profile option[value='" + s.profileid + "']").eq(0).attr("selected", true);
                        } else if (s.$("select.profile option").get(1))
                            s.$("select.profile option").eq(1).attr("selected", true);
                    }
                    s.selectProfile();
                },
                error: function() {
                    $.Error(arguments);
                }
            });

            this.$("button").button();
            return this;
        },
        getBalance: function () {
            var s = this;
            $.get("/api/search/balance").done(function(num) {
                Backbone.trigger("get:balance", num.toFixed(2));
            }).fail(function() {
                clearTimeout(s.tickBalance);
            });
        },
        fillBalance: function(num) {
            this.$("#Balance .BalanceVal").text(num);
            this.tickBalance = setTimeout(this.getBalance, 10000);
            Backbone.trigger("balance:start", this.tickBalance);
        }
    });

    var task = new searchTasks();
    return {
        get: function() {
            return task;
        }
    }
});