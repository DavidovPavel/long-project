define([
    'app',
    'i18n!nls/resources',
    '@Analyst/collections/DictionaryCollection',
    '@/views/ListView',
    'g/files/AttachFile',
    'libs/jquery/jquery.cookie',
    'jqueryui',
    '/Scripts/jquery.mCustomScrollbar.concat.min.js',
    '/js/libs/jquery/jquery.form.min.js'
],
function (App, Resources, Dic, ListView, Attach) {
        "use strict";
        var sintemplate = `<button type="button" class="dropdown-toggle btn-clear text-info synonimus-link" aria-haspopup="true" aria-expanded="false" ><span class="anbr-tooltip top"><%= Resources.tt1 %><span position="bottom"></span></span><svg class="icon icon-edit"><use xlink:href="#icon-edit"/></svg><%= Resources.tt2 %>: <span id="synNums">0</span></button>
                     <div class="dropdown-menu synonimus" style="margin-top:-254px;">
                         <span class="dropdown-menu_arrow"></span>
                         <span class="dropdown-menu_close hideSyn"><svg class="icon icon-close"><use xlink:href="#icon-close"/></svg></span>
                         <div class="menu-info-message">
                             <div class="form-group">
                                 <label for="add-syn"><%= Resources.addsyn %></label>
                                 <div class="input-group">
                                     <input type="text" class="form-control" id="add-syn" placeholder="">
                                     <div class="input-group-addon add-btn"><svg class="icon icon-plus"><use xlink:href="#icon-close"/></svg></div>
                                 </div></div></div>
                         <div class="menu-alert-list ListSynonims"><ul></ul></div></div>`,

        listItemTemplate = `<div data-uid='<%= SearchPackUID %>'><span><%= SearchPackName?SearchPackName:'...' %></span><span class='cmd'>
                        <% if(!IsSystem){ %><button type='button' class='edit'><svg class='icon icon-pencil'><use xlink:href='#icon-pencil'></use></svg></button><% } %>
                        <button type='button' class='view'><svg class='icon icon-eye'><use xlink:href='#icon-eye'></use></svg></button>
                        <% if(!IsSystem){ %><button type='button' class='clear'><svg class='icon icon-close'><use xlink:href='#icon-close'></use></svg></button><% } %>
                        </span></div>`;

    var sat = { 10021: 1002, 10022: 1003, 10023: 1004 };

    var SinView = Backbone.View.extend({
        events: {
            "click .synonimus-link": "showSyn",
            "click .hideSyn": "hideSyn",
            "click .add-btn": "add",
            "click .clearItem": "clear"
        },
        add:function() {
            var v = this.$("#add-syn").val();
            this.$("#add-syn").css({ "border-color": "" });
            if ($.trim(v) && !this.collection.findWhere({ Value: v })) {
                var m = new Backbone.Model({ Value: v });
                this.collection.add(m);
            } else
                this.$("#add-syn").css({ "border-color": "red" });
        },
        addItem: function (m) {            
            this.$("ul").prepend(
                _.template('<li><%= Value %><span role="button" class="clearItem"><svg class="icon icon-close"><use xlink:href="#icon-close"/></svg></span></li>')( m.toJSON()));
            this.$("#synNums").text(this.collection.length);
            this.$('.menu-alert-list').mCustomScrollbar("update");
        },
        clear:function(e) {
            var $l = $(e.target).closest("li"),
                v = $l.text(),
                m = this.collection.findWhere({ Value: v });

            this.collection.remove(m);
            $l.remove();
            this.$("#synNums").text(this.collection.length);
            this.$('.menu-alert-list').mCustomScrollbar("update");
        },
        hideSyn: function () {
            this.$("#add-syn").val("");
            this.$(".synonimus").slideUp();
        },
        showSyn: function (e) {
            this.$(".synonimus").slideDown(function () {
                $(this).find(".dropdown-menu_arrow").css("margin-top", 248);
            });
        },
        initialize: function () {
            this.collection = new Backbone.Collection();
            this.collection.on("reset", this.list, this);
            this.collection.on("add", this.addItem, this);
        },
        list: function () {
            this.$("ul").empty();
            this.$("#synNums").text(this.collection.length);
            this.collection.each(this.addItem, this);
        },
        render: function () {
            var data = this.model.toJSON();
            data.Resources = Resources;
            this.$el.html(_.template(sintemplate)( data));
            this.$('.menu-alert-list').mCustomScrollbar();
            return this;
        },
        fetch: function () {
            this.model.set("id", 0);
            $.ajax({
                method: "POST",
                contentType: 'application/json; charset=utf-8',
                url: "/api/synonyms",
                data: JSON.stringify(this.model.toJSON())
            }).done(data=> {
                let d = [];
                Array.from(data, a=> d.push({ Value: a }));
                this.collection.reset(d);
            });
        },
        show: function () {
            //this.fetch();
            this.$("button").show();
        },
        hide: function() {
            this.$("button").hide();
            this.hideSyn();
        }
    });
    
    // sources collection
    var Collection = Backbone.View.extend({
        events: {
            "click .add-btn": "add",
            "click .save": "save",
            "click .cancel": "cancel",
            "click .view": "view",
            "click .edit": "edit",
            "click .clear": "clear",
            "click .list-cmd-panel div": "setCurrent",
            "click input": "clickInput"
        },
        clickInput: function (e) {
            e.stopPropagation();
        },
        cancel: function (e) {
            e.stopPropagation();
            var $e = $(e.target).closest("div"),
                m = this.collection.get($e.attr("data-uid"));
            this.re(m);
        },
        save: function (e) {
            e.stopPropagation();
            var $e = $(e.target).closest("div"),
                $i = $e.find("input"),
                m = this.collection.get($e.attr("data-uid"));
            if ($.trim($i.val())) {
                m.save({ "SearchPackName": $i.val() });
                this.re(m);
            }
        },
        re: function (model) {
            var $e = this.$(`div[data-uid='${model.id}']`);
            $e.html(_.template(`<span><%= SearchPackName?SearchPackName:'...' %></span><span class='cmd'>
                        <% if(!IsSystem){ %><button type='button' class='edit'><svg class='icon icon-pencil'><use xlink:href='#icon-pencil'></use></svg></button><% } %>
                        <button type='button' class='view'><svg class='icon icon-eye'><use xlink:href='#icon-eye'></use></svg></button>
                        <% if(!IsSystem){ %><button type='button' class='clear'><svg class='icon icon-close'><use xlink:href='#icon-close'></use></svg></button><% } %>
                        </span>`)( model.toJSON()));
        },

        edit: function (e) {
            e.stopPropagation();
            var $e = $(e.target).closest("div"),
                m = this.collection.get($e.attr("data-uid"));
            $e.html(_.template(`<input type='text' value='<%= SearchPackName %>' /><span class='cmd edit-view' data-uid='<%= SearchPackUID %>'>
                <button type='button' class='cancel'><svg class='icon button-cancel'><use xlink:href='#button-cancel'></use></svg></button>
                <button type='button' class ='save'><svg class ='icon icon-check'><use xlink: href='#icon-check'></use></svg></button></span>`)
                (m.toJSON()));
        },
        setCurrent: function (e) {
            e.stopPropagation();
            var uid = $(e.target).closest("div").attr("data-uid"),
                name = Resources.choose;
            this.current = uid ? this.collection.get(uid) : this.collection.findWhere({ "SearchPackUID": null });
            if (this.current) {
                name = this.current.get("SearchPackName");
            }
            this.$el.closest("div.pull-right").find(".show-source-collection-manage").text(name);
            $.cookie(`anbr.check.${this.model.get("typeid")}.sourceid`, uid);
            this.$el.slideUp();
        },
        add: function (e) {
            e.stopPropagation();
            this.$("#add-collection").css({ "border-color": "" });
            var searchPackName = $.trim(this.$("#add-collection").val());
            if (searchPackName) {
                var m = new this.collection.model({
                    SearchPackName: searchPackName,
                    SearchPackUID: null,
                    BySaType: sat[this.model.get("typeid")],
                    SelectedCountries: this.model.get("selectedCountries"),
                    IsSystem: false
                });
                m.on("change:id", function (model, uid) {
                    model.set("SearchPackUID", uid);
                    this.current = model;
                    $.cookie(`anbr.check.${this.model.get("typeid")}.sourceid`, uid);
                    this.list();
                }, this);

                this.collection.add(m);

                m.view = this;
                Backbone.trigger("to:robots", m);
            }
            else
                this.$("#add-collection").css({ "border-color": "red" });
        },
        clear: function (e) {
            e.stopPropagation();
            var uid = $(e.target).closest("div").attr("data-uid"),
                model = this.collection.get(uid);
            model.destroy();
            this.collection.remove(model);            
        },
        view: function (e) {
            e.stopPropagation();
            var uid = $(e.target).closest("div").attr("data-uid"),
                model = this.collection.get(uid);
            model.set({ "BySaType": sat[this.model.get("typeid")], "SelectedCountries": this.model.get("selectedCountries") });
            model.view = this;
            Backbone.trigger("to:robots", model);
            this.$el.hide();
        },
        initialize: function (o) {
            this.collection = new Backbone.Collection();
            this.collection.model = Backbone.Model.extend({ idAttribute: "SearchPackUID" });         
            this.collection.on("reset", this.list, this);
            this.collection.on("remove", this.list, this);
            //this.collection.on("add", this.list, this);
            this.collection.url = "/api/sources/searchpacks/" + sat[this.model.get("typeid")];
            this.collection.fetch({ reset: true });

            Backbone.on("to:form", o=> {
                this.$("#add-collection").val("");
                let a = this.collection.where(m=>!m.id);
                this.collection.remove(a);
                if (o.remove) {
                    this.current = null;
                    this.$el.closest("div.pull-right").find(".show-source-collection-manage").text(Resources.choose);
                }
            }, this);
        },
        list: function () {
            this.$(".list-cmd-panel div[data-uid]").remove();
            var name = Resources.choose;
            if (this.collection.length) {
                this.collection.each(function (m) {
                    if (!this.scrollInit)
                        this.$(".list-cmd-panel").prepend(_.template(listItemTemplate)(m.toJSON()));
                    else
                        this.$(".list-cmd-panel .mCSB_container").prepend(_.template(listItemTemplate)(m.toJSON()));
                }, this);

                if (!this.scrollInit) {
                    this.scrollInit = true;
                    this.$(".list-cmd-panel").mCustomScrollbar();
                } else
                    this.$(".list-cmd-panel").mCustomScrollbar("update");

                var currentId = $.cookie(`anbr.check.${this.model.get("typeid")}.sourceid`);

                if (!this.current) {
                    this.current = currentId ? this.collection.get(currentId) ? this.collection.get(currentId) : this.collection.at(0) : this.collection.at(0);
                }

                name = this.current.get("SearchPackName");
            }
            this.$el.closest("div.pull-right").find(".show-source-collection-manage").text(name);            
        }
    });

    return Backbone.View.extend({
        originalEvents: {
            "click #clearForm": "clear",
            "click .checkMatches": "check",
            "change #Countries": "viewCountyFields",

            "mouseenter .dropdown-toggle:not(.synonimus-link)": "arise",
            "mouseleave .dropdown-toggle": "off",
            "mouseenter .dropdown-menu": "clearQueue",
            "mouseleave .dropdown-menu": "off",

            "click .font-icon-checkbox": "toggleSynMenage",
            "click label[for=searchSin_INTERN]": "toggleSynMenage",

            "mouseenter #synonims-button .icon-info": "showNote",
            "mouseleave #synonims-button .icon-info": "hideNote",
            "mouseenter .synonims-info": "clearQueue",
            "mouseleave .synonims-info": "hideNote",

            "click button[name=tolist]": "tolist",
            "click button[name=start]:not(.disabled)": "startCheck",

            "click .show-attach-manage": "showAttach",
            "click .hide-attach-manage": "hideAttach",

            "click .show-source-collection-manage": "showSourceCollection",
            "click .hide-source-collection-manage": "hideSourceCollection",

            "mouseenter .show-refer7": "showRefer",
            "mouseleave .show-refer7": "hideRefer",
            "mouseleave .refer7": "hideRefer",

            "mouseenter button": "showtooltip",
            "mouseleave button": "hidetooltip",
        },
        addEvents: { },
        events: function() {
            return _.extend({ }, this.originalEvents, this.addEvents);
        },
        showtooltip: function (e) {
            $(e.target).closest("button").find(".anbr-tooltip").show();
        },
        hidetooltip: function (e) {
            $(e.target).closest("button").find(".anbr-tooltip").fadeOut();
        },
        showRefer: function () {
            this.$(".refer7").clearQueue();
            this.$(".refer7").slideDown();
        },
        hideRefer: function () {
            this.$(".refer7").delay(100).slideUp();
        },
        startCheck: function (e) {

            if (!this.bots.current) {
                Backbone.trigger("message:warning", { message: Resources.errorselsources });
                this.$(".show-source-collection-manage").addClass("warning").fadeOut().fadeIn().fadeOut().fadeIn("slow", function() {
                    this.$(".show-source-collection-manage").removeClass("warning");
                }.bind(this));
                return;
            }

            $(e.target).addClass("disabled");
            this.model.set($.GetData(this.$el));
            this.model.set("synonyms_INTERN", this.SinPanel.collection.pluck("Value"));
            if (this.model.isValid()) {
                this.markError();                
                this.model.url = `/api/startTaskExpress/${this.model.get("typeid")}?sp=${this.bots.current.id}`;

                Backbone.trigger("message:modal", { title: Resources.wait2, message: Resources.message2 });

                // запуск роботов  
                this.model.save({}, {
                    wait: true,
                    success: function (m, data) {
                        var id = App.prepare([data])[0].Object_ID;
                        Backbone.trigger("storage:check-add", { id: id, data: data });
                        App.Select.set({ "query": "CheckList" });
                        App.navigate(App.Select.fullpath(), { trigger: true });
                        Backbone.trigger("message:hide");
                    }
                });

            }
        },

        initAttach:function(){
            var a = new Attach({ model: this.model, el: this.$(".attach-manage") }).render();
            this.listenTo(a, "change:collection", function () {
                this.$(".amount-files").text(a.collection.length);
            });
            var data = this.model.get("AttacheedFiles"),
                ar = [];
            _.each(data, function (value, key) {
                var item = { "FileName": key, "FilePath": value };
                ar.push(item);
            }, this);
            a.collection.reset(ar);
        },

        getCollectionSource: function () {            
            this.bots = new Collection({model:this.model}).setElement(this.$(".source-collection-manage"));
        },
        showSourceCollection:function(){
            this.$(".source-collection-manage").slideDown();
        },
        hideSourceCollection:function(){
            this.$(".source-collection-manage").slideUp();
        },

        hideAttach: function () {
            this.$(".attach-manage").slideUp();
        },
        showAttach: function () {
            this.$(".attach-manage").slideDown();
        },

        markError: function (model, error) {
            this.$("input").css("border-color", "");
            this.$("textarea").css("border-color", "");
            this.$("select").css("border-color", "");
            _.each(error, function (data) {
                this.$("[name='" + data.name + "']").css("border-color", "red");
            }, this);
        },
        tolist: function () {
            App.Select.set("query", "CheckList");
            App.navigate(App.Select.fullpath(), true);
        },

        arise: function (e) {
            var $p = $(e.target).closest("button").siblings(".dropdown-menu");
            $p.clearQueue();
            $p.show();
        },
        off: function (e) {
            var $p = $(e.target).closest(".dropup").find(".dropdown-menu");
            $p.delay(1000).hide(0);
        },
       
        addSyn:function() {
            this.SinPanel = new SinView({ model: this.model });
            return this.SinPanel;
        },
        toggleSynMenage: function (e) {
            var $e = $(e.target);
            if ($e.prop("tagName") === "LABEL") {
                $e.siblings(".font-icon-checkbox").toggleClass("checked");
            } else
                $e.toggleClass("checked");
            if (this.$(".font-icon-checkbox").hasClass("checked")) {
                this.$(".font-icon-checkbox input").get(0).checked = true;               
            }
            else {
                this.$(".font-icon-checkbox input").get(0).checked = false;
            }
            this.synBeh();
        },
        clearQueue: function (e) {
            $(e.target).closest("ul").clearQueue();
        },
        showNote: function (e) {
            this.$(".synonims-info").clearQueue();
            if (this.$(".synonims-info").is(":hidden"))
                this.$(".synonims-info").delay(100).slideDown(300);
        },
        hideNote: function (e) {
            this.$(".synonims-info").clearQueue();
            if (!this.$(".synonims-info").is(":hidden"))
                this.$(".synonims-info").delay(500).slideUp(300, function () {
                    $(this).css({ "padding": "20px 26px 24px", "height": "280px", "margin": "-275px 0 0 52px", "top": "-14px" });
                });
        },
        clear: function () {
            this.$("input").each(function () {
                $(this).css("border-color", "").val("");
            });
            this.$("textarea").each(function () {
                $(this).css("border-color", "").val("");
            });

            this.$(".matchesList").empty();
            
            this.SinPanel.collection.reset();
            this.SinPanel.hide();
            this.SinPanel.hideSyn();
            this.$("input[name='searchSin_INTERN']").get(0).checked = false;
            this.$("input[name='searchSin_INTERN']").closest("div.checkbox").removeClass('checked');

            this.isChecked = false;
            this.model.set($.GetData(this.$el));
        },

        check: function () {
            var $list = this.$(".matchesList"),
                typeid = this.model.get("typeid");
            this.model.set($.GetData(this.$el));
            if (this.model.isValid()) {
                this.markError();
                $list.showIndicator();
                var json = this.model.toJSON(),
                    params = { url: (`/api/interestObjects/${typeid}?page=1`), data: json, type: "POST" };
                
                $.ajax(params)
                    .done(data=> {
                        if (!this.isChecked) {
                            this.matchesList = new ListView({ el: $list, operation: { params: params } });
                            this.matchesList.newPage = App.Select.get("page");
                            this.matchesList.render(data);
                            this.listenTo(this.matchesList, "to:page", page=> {
                                this.matchesList.newPage = page;
                                this.matchesList.operation.params = { url: (`/api/interestObjects/${typeid}?page=${page}`), data: json, type: "POST" };
                                this.matchesList.fetch()
                            });
                            this.isChecked = true;
                        } else {
                            this.matchesList.operation.params = { url: (`/api/interestObjects/${typeid}?page=${s.matchesList.newPage}`), data: json, type: "POST" };
                            this.matchesList.render(data);
                        }
                        $list.hideIndicator();
                    });
            }
        },

        viewCountyFields: function () {
            var ctx = this.$("select#Countries").val();
            this.viewCountry(ctx);
        },
        viewCountry: function (ctx) {
            this.$(".Country").hide();
            if (ctx) {
                this.$("#" + ctx).show();
                this.model.set("selectedCountries", [ctx]);
            }
        },
        getCountry: function () {
            this.$("select#Countries").append("<option value=''>...</option>");
            var userLang = Resources.Lang;// navigator.language || navigator.userLanguage;
            Dic.done(function (c) {
                c.each(function (el) {
                    if (el.get("DicCode") === "ByCountry") {
                        _.each(el.get("DicItems"), function (m) {
                            var flag = m.DicCodeItem.indexOf(userLang) !== -1;
                            this.$("select#Countries").append("<option value='" + m.DicCodeItem + "' " + (flag ? "selected='selected'" : "") + ">" + m.Title + "</option>");
                            if (flag)
                                this.viewCountry(m.DicCodeItem);
                        }, this);
                    }
                }, this);

                
            }, this);
        }
    });
});
