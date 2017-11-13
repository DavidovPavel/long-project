define([
    'app',
    'i18n!nls/resources',
    '@/views/SelectView',
    '@/views/ListView',
    'RU',
    'syncfusion'
],
function (App, Resources, SelectView, ListView, ru, sy) {
    "use strict";
    var template = '<section><div class="form-group"><input type="text" id="inputFilter" class="form-control" /><span class="push"></span></div><div class="form-inline"><div class="form-group"><p class="help-block"><%= Resources.seek %></p><select id="typeFilter" class="form-control"></select></div><div class="form-group input-date"><p class="help-block"><%= Resources.period %></p><label for="datepickerFrom"><%= Resources.from %></label>&nbsp;<input style="width:120px;" type="text" id="datepickerFrom" class="form-control"><span class="sep">&nbsp;</span><label for="datepickerTo"><%= Resources.to %></label>&nbps;<input style="width:120px;" type="text" id="datepickerTo" class="form-control"></div><div class="pull-right"><button id="startFilter" class=""><%= Resources.search %></button></div></div></section><p class="result-info text-center"></p><div class="result"></div>';

    var m = Backbone.Model.extend({
        defaults: {
            onlyMeta: null,
            typeID: null,
            paramID: null,
            profileID: null,
            ds: null,
            de: null,
            inputText: "",
            top: null
        }
    });

    return Backbone.View.extend({
        el: $("#search-checks"),
        page: "1",
        currentid: "-1",
        events: {
            "click #startFilter": "start",
            "keyup #inputFilter": "contr",
            "click .push":"clearControl"
        },
        clearControl: function () {
            this.$("#inputFilter").val("");
            this.$(".push").fadeOut();
        },
        contr:function(e) {
            if ($(e.target).val())
                this.$(".push").fadeIn();
            else
                this.$(".push").fadeOut();
        },
        start: function () {
            this.setParams();
            this.run();
        },
        run: function () {
            App.Select.set("detail", $.param(this.filter.toJSON()));
            App.navigate(App.Select.fullpath());
            
            var list = new ListView({ el: this.$(".result") });
            list.collection.url = "/api/interestObjects?" + $.param(this.filter.toJSON());
            list.newPage = App.Select.get("page");
            list.fetch().done(function (result) {
                var t = result.collection.at(0).get("pagination").totalItems;
                if (t)
                    this.$('.result-info').text(Resources.searchresult + t);
                else
                    this.$('.result-info').text(Resources.noresult);
            }, this);
            
            this.listenTo(list, "to:page", function (page) {
                list.newPage = page;
                list.fetch()
            });
        },
        
        initialize: function () {           
            this.filter = new m;
        },
        render: function () {
            this.$el.html(_.template(template)( { Resources: Resources }));           
            this.$("#datepickerFrom").ejDatePicker({
                locale: Resources.Lang,
                buttonText: Resources.Today
            });
            this.$("#datepickerTo").ejDatePicker({
                locale: Resources.Lang,
                buttonText: Resources.Today
            });
            return this;
        },
        fill: function () {
            var p = App.Select.getObjectByParam(App.Select.get("detail")),
                typeId = p ? p.typeID : null;
            
            if (p) {
                this.filter.set(p, { silent: true });

                if (p.inputText) {
                    this.$("#inputFilter").val(decodeURIComponent(p.inputText).replace(/[\+]/g, " "));
                    this.$(".push").fadeIn();
                }

                if (p.ds) {
                    //var loc = new Date(p.ds).toLocaleString(Resources.Lang);
                    this.$("#datepickerFrom").ejDatePicker({ value: new Date(p.ds) });
                }
                
                if (p.de) {
                    //var loc = new Date(p.de).toLocaleString(Resources.Lang);
                    this.$("#datepickerTo").ejDatePicker({ value: new Date(p.de) });
                }
            } 

            this.t = new SelectView({
                el:this.$("#typeFilter"),
                url: function () { return '/api/searchTypes'; },
                done: function () {
                    if (typeId) 
                        this.$el.find("option[value=" + typeId + "]").attr("selected", true);
                }
            }).fetch();
            
            return this;
        },
        setParams: function () {            
            this.filter.set({
                onlyMeta: "",
                profileID: 0,
                typeID: this.t.$el.val(),
                paramID: null, 
                inputText: $.trim(this.$("#inputFilter").val()),
                ds: $.ToISO(this.$("#datepickerFrom").data("ejDatePicker").getValue()),
                de: $.ToISO(this.$("#datepickerTo").data("ejDatePicker").getValue()),
                top: null
            }, arguments[0] ? arguments[0] : { });
        },
       
        done:function (callback) {
            this.callback = callback;
        }
    });
});