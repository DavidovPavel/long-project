define([
    'app',
    'i18n!nls/resources',
    'g/lists/TableView',
    'g/semnet/SemNetView',
    'g/ContentView',
    'g/files/AttachFile',
    'g/TinyMCEView',
    'global.view.dropDown',
    'text!@/templates/checkProcessTemplate.html',
    'text!@/templates/reportsTemplate.html',
    '@/models/forms/PersonModel',
    '@/models/forms/CompanyModel',
    'text!@/templates/cards/Person.html',
    'text!@/templates/cards/Company.html',
    'report_url',
    'baseurl'
], function (App, Resources, TableView, SemNet, ContentView, Attach, HtmlEditor, DropDownView, checkProcessTemplate, reportsTemplate, PersonModel, CompanyModel, personTemplate, companyTemplate, reportUrl, baseurl) {
    "use strict";
    var bodySources = '<tr data-id="<%= id %>"><td><span class="font-icon font-icon-checkbox"><input type="checkbox" /></span><%= title %></td><td><span class="font-icon font-icon-<%= status %>"></span></td><td><%= state %></td><td></td></tr>',
        kitTemplate = `<ul class="dropdown-menu">
                            <li class="cmd_info" data-id=""><span role="button" class="disabled"><span class="button-icon"><svg class="svg-icon svg-icon-info"><use xlink:href="#icon-info" /></svg></span><span><%= Resources.information %></span></span></li>
                            <li class="cmd_case" data-id="B7787886-AF0E-4B5A-9061-49B182200B8C"><span role="button"><span class="button-icon"><svg class="svg-icon svg-icon-case-s"><use xlink:href="#icon-case-s" /></svg></span><span><%= Resources.addbasket %></span></span></li>
                            <li class="cmd_trash" data-id="86056534-0DCB-48CF-B06D-3E8D23FD5001"><span role="button"><span class="button-icon"><svg class="svg-icon svg-icon-trash-s"><use xlink:href="#icon-trash-s" /></svg></span><span><%= Resources.deleteItem %></span></span></li>
                            <li class="cmd_analyst"><a href="/" target="_blank" class="external link"><span class="button-icon"><svg class="svg-icon svg-icon-analyst"><use xlink:href="#icon-analyst" /></svg></span><span><%= Resources.toanal %></span></a></li>
                        </ul>`,

        resultTemplate = `<div class='presentPanel'><div class='pie disabled'><div class='right'><label><%= Resources.stateResult %>:</label>&nbsp;&nbsp;<div class='dropdown list-area disabled'></div></div>
                            <button class='btn edit'><svg class='svg-icon'><use xlink:href='#icon-edit' /></svg><span><%= Resources.edit %></span></button></div>
                            <div class='presentText'><%= text %></div></div><div class='editPanel'>
                            <div class='pie'><div class='right'><label><%= Resources.stateResult %>:</label>&nbsp;&nbsp;<div class='dropdown list-area'></div></div>
                            <button class='btn btn-blue save'><svg class='svg-icon'><use xlink:href='#icon-save' /></svg><span><%= Resources.save %></span></button>&nbsp;&nbsp;<button class='btn cancel'><svg class='svg-icon'><use xlink:href='#button-cancel' /></svg><span><%= Resources.cancel %></span></button></div><div class='htmlEditor'></div></div>`,


        dropDownTemplate =
        `<div class='item'><span class='font-icon font-icon-flag'></span><%= Resources.positive %></div>
        <div class='item'><span class='font-icon font-icon-help'></span><%= Resources.doubts %></div>
        <div class='item'><span class='font-icon font-icon-dislike'></span><%= Resources.negative %></div>`;


    var GlobalDataResult = {};

    var TabsView = Backbone.View.extend({
        originalEvents: {
            "click a:not('.link').jump": "jump",
            "mouseenter .anbr-toolbar button": "showtooltip",
            "mouseleave .anbr-toolbar button": "hidetooltip",
        },
        addEvents: {},
        events: function () {
            return _.extend({}, this.originalEvents, this.addEvents);
        },
        jump: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var $a = $(e.target).closest("a");
            this.tab($a).trans($a.attr("href"));
        },
        tab: function ($a) {
            this.$("ul.nav li.active").removeClass("active");
            this.$("div.tab-pane").hide();
            $a.parent().addClass("active");
            return this;
        },
        showtooltip: function (e) {
            $(e.target).closest("button").find(".anbr-tooltip").show();
        },
        hidetooltip: function (e) {
            $(e.target).closest("button").find(".anbr-tooltip").fadeOut();
        },
        trans: function (name) {
            this.ActiveTabName = name;
            this.$(name).show();
            this.$(".anbr-toolbar").hide();
            this.$(".anbr-toolbar button").hide();
            var method = name.replace("#", "").replace("-", "");
            //console.log("method:" + method + ", name:" + name);
            this[method](name);
            return this;
        },
        done: function (fx, ctx) {
            this.callback = fx;
            this.context = ctx;
            return this;
        },
        setCurrent: function (link) {
            link = link || this.$(".nav a:first-child").attr("href");
            this.tab(this.$("a[href='" + link + "']")).trans(link);
            return this;
        }
    });

    var ProcessView = TabsView.extend({
        el: $("#check-process"),
        addEvents: {
            "click .open-sources": "showSources",
            "click .tool-extra1": "showExtra",
            "change select.check-date": "getPart",
            "click .list-sources .dropdown-menu_close": "removeSource"
        },
        showSources: function () {
            this.winSources.show();
        },
        showExtra: function () {
            Backbone.trigger("message:warning", { title: "Alert!", message: "Opportunity is temporarily unavailable - is under development" });
        },
        trans: function (name) {
            this.ActiveTabName = name;
            this.$(name).show();
            var s = this.storage[name];

            if (s.buttons.length) {
                this.$(".anbr-toolbar").show();
                _.map(s.buttons, function (b) {
                    this.$("." + b).show();
                }, this);
            } else this.$(".anbr-toolbar").hide();

            if (!s.table) {
                var _kitTemplate = s.name === "extract" ? "" : kitTemplate;
                s.table = new TableView({ template: s.templ, head: s.head, foot: _kitTemplate }).setElement(name).render();

                this.listenTo(s.table, "to:page", function (p) {
                    this.currentPage = p;
                    this.get(s.url + this.objID + ("?page=" + p), s.table, name);
                }, this);

                this.$(name).append(s.table.$el);
                this.$(name).append("<p class='info'>" + Resources.nodata + "</p>");
            }
            this.get(s.url + this.objID + "?page=1", s.table, name);
        },
        get: function (url, list, name) {
            var $info = list.$el.next(".info"),
                title = this.$("a[href='" + name + "'] span.numchild");

            list.$el.showIndicator();
            $.get(url + this.filterParams).done(function (data) {

                list.collection.reset(data);
                var pm = list.collection.get(0);
                if (pm) {
                    title.text("(" + pm.get("num") + ")");
                    if (list.collection.length - 1) {
                        $info.hide();
                    } else {
                        $info.show();
                    }
                }
                else {
                    title.text("(" + list.collection.length + ")");
                    if (list.collection.length - 1) {
                        $info.hide();
                    } else {
                        $info.show();
                    }
                }

            }).always(function () { list.$el.hideIndicator(); });
        },
        initialize: function () {
            this.objID = this.model.id;
            this.currentPage = 1;
            this.filterParams = "";

            this.storage = {
                "#result-extract": {
                    name: "extract",
                    buttons: [],
                    url: "/api/Docs/InfoDB/",
                    templ: "<tr data-id='<%= id %>'><td><% if(size){ %><a href='#doc!sid=<%= id %><% if(originoid){ %>?originoid=<%= originoid %><% } %>' target='_blank' class='link'><%= title %></a><% } else { %><%= title %><% } %></td><td><%= source %></td><td class='controls'><button class='btn-link'><span></span></button></td></tr>",
                    head: '<tr><th><%= Resources.titlehead %></th><th class="spike"><%= Resources.source %></th><th></th></tr>'
                },
                "#result-facts": {
                    name: "fact",
                    buttons: [],
                    url: "/api/facts/",
                    head: '<tr><th><%= Resources.title %></th><th class="spike"><%= Resources.type %></th><th></th></tr>',
                    templ: "<tr data-id='<%= id %>'><td><% if(linkToSourceID){ %><a href='#fact!sid=<%= id %><% if(originoid){ %>?originoid=<%= originoid %><% } %>' target='_blank' class='link'><%= title %></a><% } else { %><%= title %><% } %></td><td><%= type %></td><td class='controls'><button class='btn-link'><span></span></button></td></tr>"
                },
                "#result-documents": {
                    name: "doc",
                    buttons: ["tool-extra1"],
                    url: "/api/Docs/",
                    head: '<tr><th><span class="font-icon font-icon-checkbox"><input type="checkbox" /></span><%= Resources.titlehead %></th><th class="spike"><%= Resources.source %></th><th><%= Resources.size %> (Kb)</th><th></th></tr>',
                    templ: "<tr data-id='<%= id %>'><td><span class='font-icon font-icon-checkbox'><input type='checkbox' /></span><% if(size){ %><a href='#doc!sid=<%= id %><% if(originoid){ %>?originoid=<%= originoid %><% } %>' target='_blank' class='link'><%= title %></a><% } else { %><%= title %><% } %></td><td><%= source %></td><td><%= size %></td><td class='controls'><button class='btn-link'><span></span></button></td></tr>"
                },
                "#result-requisites": {
                    name: "requisit",
                    buttons: [],
                    url: "/api/requisit/",
                    head: '<tr><th><%= Resources.title %></th><th class="spike"><%= Resources.type %></th><th></th></tr>',
                    templ: "<tr data-id='<%= id %>'><td><%= title %></td><td><%= type %></td><td class='controls'><button class='btn-link'><span></span></button></td></tr>"
                }
            };

            var url = `/api/checkready/${this.objID}?kind=0`;
            require(['signalR'], function () {
                require(['/signalr/hubs'], function () {
                    require(['/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'], function () {
                        var hub = SJ.iwc.SignalR.getHubProxy('Ticker', {
                            client: {
                                updateRobot: function (robot) {
                                    console.log("SignalR > Update robots", { robot: robot });
                                    this.update(robot);
                                },
                                infoActiveChecks: function (objectsIds) {
                                    console.log("SignalR > Info active checks", { ids: objectsIds });
                                    this.infoActiveChecks(objectsIds);
                                }
                            }
                        });
                    }.bind(this));
                }.bind(this));
            }.bind(this));

            this.chcInt = setInterval(function () {
                $.get(url).done(function (status) { this.result(status); }.bind(this))
                    .fail(function () { clearInterval(this.chcInt); }.bind(this));
            }.bind(this), 3000);
        },
        result: function (status) {
            if (status === 200) {
                if (!this.isRender)
                    this.render();
                clearInterval(this.chcInt);
            }
            if (!this.isMonitoring) {
                var ctx = App.getContext();
                this.isMonitoring = true;
                this.startMonitoring(ctx.key, this.objID);
            }
        },
        startMonitoring: function (key, objID) {
            var s = this;
            require(['signalR'], function () {
                require(['/signalr/hubs'], function () {
                    require(['/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'], function () {
                        var hub = SJ.iwc.SignalR.getHubProxy('Ticker', { client: {} });
                        console.log("SignalR > Statr monitoring tasks", { objectID: objID });
                        hub.server.startMonitoringTasks(key, objID);
                        console.log("SianalR Hub", { hub: hub });
                    });
                });
            });
        },
        infoActiveChecks: function (a) {
            if (!a.length) {
                $("#statistic-info").hide();
                this.stopMonitoring();
            } else {
                _.map(a, function (id) {
                    if (this.model.id === id) {
                        if (this.initStatistic())
                            $("#statistic-info").show();
                        else
                            $("#statistic-info").hide();
                    }
                }, this);
            }
        },
        stopMonitoring: function () {
            //    var objID = this.model.id;
            //    clearTimeout(this.smt);
            //    require(['signalR'], function () {
            //        require(['/signalr/hubs'], function () {                   
            //                var ticker = $.connection.Ticker;
            //                $.connection.hub.start()
            //                    .done(function () {
            //                        ticker.server.stopMonitoringTasks(objID);
            //                    });
            //        });
            //    });
        },
        update: function (robot) {
            if (this.model.id == robot.objID) {
                var $tr = this.winSources.$el.find("tr[data-id=" + robot.id + "]");
                if ($tr.get(0)) {
                    var $td = $tr.find("td");
                    $td.eq(1).html('<span class="font-icon font-icon-' + robot.status + '"></span>');
                    $td.eq(2).text(robot.state);
                } else
                    this.winSources.$el.find("table>tbody").append(_.template(bodySources)(robot));

                this.initStatistic();
            }
        },
        initStatistic: function () {
            var all = this.winSources.$el.find("table>tbody tr").size(),
                error = this.winSources.$el.find("table>tbody tr td span.font-icon-invalid").size(),
                final = this.winSources.$el.find("table>tbody tr td span.font-icon-complited").size(),
                working = all - (final + error);
            $("#statistic-info span:first").text(Resources.working + ": " + working);
            if (!working) {
                this.stopMonitoring();
                $("#statistic-info").hide();
            } else
                $("#statistic-info").show();
            return this;
        },

        initSources: function () {
            this.winSources = new Sources({ el: this.$("#sources-window"), model: this.model }).render();
            this.listenTo(this.winSources, "source:filter", this.sourceFilter);
            this.winSources.listenTo(this, "remove:selection", this.winSources.selection);
            this.selectedSourceCollection = new Backbone.Collection();
            this.selectedSourceCollection.on("add", this.listSources, this);
            this.selectedSourceCollection.on("remove", this.listSources, this);
            return this;
        },
        sourceFilter: function (o) {
            if (o.checked)
                this.selectedSourceCollection.add(o.model);
            else
                this.selectedSourceCollection.remove(o.model);
        },
        listSources: function () {
            this.$(".list-sources").empty();
            if (!this.selectedSourceCollection.length)
                this.$(".open-sources>.dropdown-menu_arrow").hide();
            else
                this.$(".open-sources>.dropdown-menu_arrow").css("display", "inline-block");

            var output = [];
            this.selectedSourceCollection.each(function (m) {
                this.$(".list-sources").append(
                    _.template("<span class='item' data-id='<%= id %>'><span class='dropdown-menu_close'><svg class='svg-icon icon-close'><use xlink:href='#icon-close' /></svg></span><%= title %></span>")
                    (m.toJSON()));
                output.push(m.get("searchSATaskID"));
            }, this);

            var m = _.findWhere(GlobalDataResult.Part, { "date": this.$("select.check-date").val() });

            this.filterParams = "&uid=" + m.uid + "&ids=" + output.join(",");
            // trigger
            this.trans(this.ActiveTabName);
        },

        removeSource: function (e) {
            e.stopPropagation();
            var uid = $(e.target).closest("span.item").attr("data-id"),
                m = this.selectedSourceCollection.get(uid);
            this.selectedSourceCollection.remove(m);
            this.trigger("remove:selection", uid);
        },
        render: function () {
            this.isRender = true;
            this.$el.html(_.template(checkProcessTemplate)({ Resources: Resources }));
            this.setCurrent().initSources().initStatistic();
            if (!GlobalDataResult.Part)
                $.get("/api/CheckRes/" + this.model.id).done(this.write.bind(this));
            else this.final();
            return this;
        },
        write: function (data) {
            GlobalDataResult.Part = data;
            this.getPart();
            this.final();
        },
        getPart: function (e) {
            var d = GlobalDataResult.Part[0].date,
                p = JSON.parse(GlobalDataResult.Part[0].data);
            if (e) {
                d = $(e.target).val();
                p = _.findWhere(GlobalDataResult.Part, { date: d });
                if (p)
                    p = JSON.parse(p.data);
                else
                    p = [];
            }
            this.winSources.table.collection.reset(p);
        },
        final: function () {
            this.$("select.check-date").empty();
            _.each(GlobalDataResult.Part, function (o) {
                this.$("select.check-date")
                           .append("<option value='" + o.date + "'>" + new Date(o.date).toLocaleString(Resources.Lang) + "</option>");
            }, this);

            if (this.callback)
                this.callback.call(this.context);
        }
    });

    var Sources = Backbone.View.extend({
        events: {
            "click .icon-close": "hide",
            "click .font-icon-checkbox": "filter"
        },
        cbx: function ($ico) {
            if ($ico.hasClass("checked"))
                $ico.removeClass("checked");
            else
                $ico.addClass("checked");

            var $cb = $ico.find("input");
            $cb.get(0).checked = !$cb.get(0).checked;
        },
        filter: function (e) {
            var $ico = $(e.target),
                $cb = $ico.find("input"),
                uid = $ico.closest("tr").attr("data-id"),
                m = this.table.collection.get(uid);

            if (m && m.get("status") === "complited" && m.get("severity") !== 404) {
                this.cbx($ico);
                this.trigger("source:filter", { model: m, checked: $ico.hasClass("checked") });
            } else
                Backbone.trigger("message:warning", { title: Resources.alert, message: m.get("state") });
        },
        selection: function (uid) {
            var $ico = this.$("tr[data-id='" + uid + "']").find(".font-icon-checkbox");
            this.cbx($ico);
        },
        hide: function () {
            this.$el.slideUp();
        },
        show: function () {
            this.$el.slideDown();
        },
        render: function () {
            var head = '<tr><th><span class="font-icon font-icon-checkbox"><input type="checkbox" /></span><%= Resources.title %></th><th><%= Resources.status %></th><th><%= Resources.execution %></th><th></th></tr>',
                body = '<tr data-id="<%= id %>"><td><span class="font-icon font-icon-checkbox"><input type="checkbox" /></span><%= title %></td><td><span class="font-icon font-icon-<%= status %>"></span></td><td><%= state %></td><td></td></tr>';
            this.table = new TableView({ template: body, head: head, isScroll: true, el: this.$(".content-table") }).render();
            return this;
        }
    });

    var InitDataView = Backbone.View.extend({
        el: $("#init-data"),
        events: {
            "click .show-attach-manage": "showAttachManage",
            "click .hide-attach-manage": "hideAttachManage",
            "click .clear": "clearItem"
        },
        clearItem: function (e) {
            var $span = $(e.target).closest("span"),
                name = $span.attr("data-name"),
                m = this.attach.collection.get(name);
            $span.remove();
            this.attach.collection.remove(m);
        },
        initialize: function () {
            var s = this;
            $.get("/api/interestObjects/input/id" + this.model.id).done(function (data) {
                s.render(data);
            });
        },
        render: function (data) {
            var tmpl = {
                10021: [personTemplate, PersonModel],
                10022: [companyTemplate, CompanyModel]
            };
            var m = new tmpl[data.typeid][1](data),
                d = m.toJSON();
            d.Resources = Resources;
            this.$el.html(_.template(tmpl[data.typeid][0])(d));
            this.$("#" + d.selectedCountries[0]).show();

            this.initAttachFile(data);
            return this;
        },
        hideAttachManage: function () {
            this.$(".attach-manage").slideUp();
        },
        showAttachManage: function () {
            this.$(".attach-manage").slideDown();
        },
        initAttachFile: function (all) {
            var data = all.AttacheedFiles;
            this.attach = new Attach({ el: this.$(".attach-manage") }).render();
            this.listenTo(this.attach, "change:collection", function () {
                this.fillList();
                this.attach.setModel();
                all.AttacheedFiles = this.attach.output;

                $.ajax({
                    type: "POST",
                    url: "/api/InterestObj/SaveObjectData",
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(all)
                });
            });
            var ar = [];
            _.each(data, function (value, key) {
                var item = { "FileName": key, "FilePath": value };
                ar.push(item);
            }, this);
            this.attach.collection.reset(ar);
            this.fillList();
        },
        fillList: function () {
            this.$(".amount-files").text(this.attach.collection.length);
            this.filesList(this.attach.collection);
        },
        filesList: function (collection) {
            this.$(".attached-files-list").empty();
            collection.each(function (m) {
                this.$(".attached-files-list").append(
                    _.template("<span data-name='<%= FileName %>'><a href='<%= FilePath %>' target='_blank' class='view link'><svg class='svg-icon icon-file'><use xlink:href='#icon-file'></use></svg><%= FileName %></a>" +
                    "<button type='button' class='clear'><svg class='svg-icon icon-close'><use xlink:href='#icon-close'></use></svg></button></span>")(m.toJSON()));
            }, this);
        }
    })

    var InitReports = TabsView.extend({
        el: $("#check-reports"),
        addEvents:{
            "click .font-icon-checkbox": "check",
            "click .tool-upload": "send",
            "click .icon-email": "sendemail"
        },
        comp:function(){
            var data = { Sec1Reports: {}, Sec2Reports: {}, Sec3Reports: {} }
            this.$(".font-icon-checkbox").each((i, e) => {
                if ($(e).hasClass("checked")) {
                    let id = parseInt($(e).closest("tr").attr("data-id")),
                        name = $(e).closest("table").attr("data-role");
                    if (data[name])
                        data[name][id] = $(e).next("a").text();
                }
            });
            return data;
        },
        sendemail:function(){            
            this.post.set({ "Action": 1, Email: this.$("input[name=sender]").val() });
            this.sendData();           
        },
        send: function () {            
            this.post.set({ "Action": 0, Email: "" });
            this.sendData();
        },
        sendData: function () {
            let data = this.comp();
            this.post.set({ ObjID: this.model.id, Sec1Reports: data.Sec1Reports, Sec2Reports: data.Sec2Reports, Sec3Reports: data.Sec3Reports });
            if (this.post.save({}, { success: m=> Backbone.trigger("message:success", { message: Object.keys(m.attributes)[0] }) })) {
                this.post.clear();
                this.$("input[name=sender]").val("");
            } else Backbone.trigger("message:warning", { message: this.post.validationError });
        },
        check:function(e){
            let $cb = $(e.target);
            if ($cb.hasClass("checked"))
                $cb.removeClass("checked");
            else
                $cb.addClass("checked");

            if ($cb.hasClass("head")) {
                if($cb.hasClass("checked"))
                    this.$("table tr>td .font-icon-checkbox").addClass("checked");
                else
                    this.$("table tr>td .font-icon-checkbox").removeClass("checked");
            }
        },
        initialize: function () {

            let post = Backbone.Model.extend({
                defaults: {
                    // ID текущего объекта
                    ObjID: this.model.id,
                    // Сводные отчеты
                    Sec1Reports: {},
                    // Отчеты SqlReporting
                    Sec2Reports: {},
                    // Выписки
                    Sec3Reports: {},
                    // 0 - Сформировать архив, 1 - сформировать архив и отправить на E-mail
                    Action: 0,
                    Email: ""
                },
                url: "/api/Report/UploadReportsArchived",
                validate: function (attr) {
                    var output = [], email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    if (!Object.keys(attr.Sec1Reports).length && !Object.keys(attr.Sec2Reports).length && !Object.keys(attr.Sec3Reports).length)
                        output.push(Resources.noselect);
                    if (attr.Action && (!$.trim(attr.Email) || !this.test(attr.Email, email)))
                        output.push(Resources.errorEmail);

                    if (output.length)
                        return output.join("<br/>"); 
                },
                test: function (s, p) {
                    return s == "" || new RegExp(p).test(s);
                }
            });
            this.post = new post;

            this.storage = {
                "#reports-all": {
                    name: "all",
                    buttons: ["tool-upload"],
                    url: [
                        {
                            name: "reports",
                            url: "/api/report/",
                            templ: `<tr data-id='<%= id %>'><td><div><span class='font-icon font-icon-checkbox'><input type='checkbox' /></span>
                                <a href='<%= baseurl %>/SqlRepPage.aspx?rid=<%= id %>&pid=<%= originoid %>' target='_blank' class='link'><%= title %></a></span></div></td></tr>`
                        },
                        {
                            name: "extracts",
                            url: "/api/Docs/InfoDB/",
                            par: "?page=1&od=1",
                            templ: "<tr data-id='<%= id %>'><td><div><span class='font-icon font-icon-checkbox'><input type='checkbox' /></span><% if(size){ %><a href='#doc!sid=<%= id %><% if(originoid){ %>?originoid=<%= originoid %><% } %>' target='_blank' class='link'><%= title %> (<%= source %>)</a><% }else{ %><span><%= title %> (<%= source %>)</span><% } %></div></td></tr>"
                        }
                    ]
                }
            };
            this.render();
        },
        bild: function (s, data) {
            if (!data.length) {
                this.$(`.${s.name}`).hide();
                return;
            }
            Array.from(data, m=>{
                if (m.id) {
                    m.baseurl = baseurl;
                    m.originoid = this.model.id;
                    this.$(`.${s.name}>tbody`).append(_.template(s.templ)(m));
                }
            }, this);
        },
        reportsall: function (name) {

            var s = this.storage[name];
            if (s.buttons.length) {
                this.$(".anbr-toolbar").show();
                _.map(s.buttons, b=> this.$(`.${b}`).show());
            }

            if (this.isInit) return this;
            this.isInit = true;
            Array.from(s.url, a=> $.get(`${a.url}${this.model.id}${a.par ? a.par : ""}`).done(this.bild.bind(this, a)));

        },
        reportsreports: function (name) {
            return this;
        },
        render: function () {
            var src = `${reportUrl}?pid=${this.model.id}`;
            this.$el.html(_.template(reportsTemplate)({ Resources: Resources, report_url: src }));
            if (!GlobalDataResult.Part)
                $.get(`/api/CheckRes/${this.model.id}`).done((data) => {
                    GlobalDataResult.Part = data;
                    this.final();
                });
            else this.final();
            return this;
        },
        final: function () {
            this.$("select.check-date").empty();
            Array.from(GlobalDataResult.Part,
                o => this.$("select.check-date").append(`<option value='${o.date}'>${new Date(o.date).toLocaleString(Resources.Lang)}</option>`));

            if (this.callback)
                this.callback.call(this.context);
        }
    });

    var InitResult = Backbone.View.extend({
        events: {
            "click .edit": "editResult",
            "click .cancel": "cancelResult",
            "click .save": "saveResult"
        },
        editResult: function () {
            this.$(".presentPanel").hide();
            this.$(".editPanel").show();
        },
        cancelResult: function () {
            this.$(".presentPanel").show();
            this.$(".editPanel").hide();
        },
        saveResult: function () {
            var text = this.htmlEditor.getContent()
            this.$(".presentText").html(text);
            // todo: save text
        },
        initialize: function () {
            // TODO: GET TEXT and ...
            this.render();
        },
        render: function () {
            var text = "";
            this.$el.html(_.template(resultTemplate)({ Resources: Resources, text: text }));
            this.dropdown = new DropDownView({ el: this.$(".dropdown"), template: dropDownTemplate }).render();
            this.listenTo(this.dropdown, "dropdown:select", function () {

            });
            this.htmlEditor = new HtmlEditor({ text: text }).setElement(this.$(".htmlEditor")).render();
            return this;
        }
    });

    return TabsView.extend({
        el: $("#ResultDetails"),
        checkprocess: function (name) {
            if (!this.isProcess) {
                this.isProcess = true;
                this.process = new ProcessView({ model: this.model }).done(function () {
                    if (this.callback)
                        this.callback.call(this.context);
                }, this);
            } else {
                var link = "#result-extract";
                this.process.tab(this.$("a[href='" + link + "']")).trans(link);
            }
            return this;
        },
        initdata: function (name) {
            if (!this.isInitData) {
                this.isInitData = true;
                this.initData = new InitDataView({ model: this.model });
            }
            return this;
        },
        checkreports: function (name) {
            if (!this.initReports)
                this.initReports = new InitReports({ model: this.model });
            this.initReports.setCurrent();
            return this;
        },
        smanticrel: function (name) {
            SemNet.get().setElement(this.$("#SemNet")).render(this.model.id);
            return this;
        },
        result: function (name) {
            if (!this.isResult) {
                this.isResult = true;
                new InitResult({ el: this.$("#result"), model: this.model });
            }
            return this;
        },
        initialize: function (o) {
            this.model = new Backbone.Model({ id: o.id });
            this.model.url = "/api/details/" + this.model.id + "?mode=1";
            this.model.on("sync", this.render, this);
            this.model.fetch();
        },
        render: function () {
            var link = "#check-process";
            this.$(".obj-title").text(this.model.get("title"));
            this.tab(this.$("a[href='" + link + "']"));
            this.trans(link);
            return this;
        }
    });
});