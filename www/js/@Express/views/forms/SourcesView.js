define([
    'app',
    'i18n!nls/resources',
    '@/views/sources/FiltersView',
    '@/views/sources/ListSourcesView',
    '/js/libs/gtkMeter.js'
],
function (App, Resources, Filters, List) {
    "use strict";
    var template = '<fieldset><legend class="text-center"><%= Resources.selSourcesTitle %></legend><div class="row row-26 mrg-b-24"><div class="col-sm-3"><button class="btn btn-flagy-rev btn-blue fullsize toform"><%= Resources.toform %></button></div><div class="col-sm-6"><div class="text-center"><div id="source-select-meter" data-meter data-meter-min="0" data-meter-val="0"></div><div class="text-left"><%= Resources.selSources %>: <span id="selectedSources">0</span><br/><%= Resources.sum %>: <span id="SelectAmount">0.00</span>&nbsp;<span class="Currency"></span><br/><%= Resources.balance %>: <span class="text-info"><span id="Balance">0</span>&nbsp;<span class="Currency"></span></span></div></div></div><div class="col-sm-3"><button class="btn btn-flagy btn-blue fullsize Start"><%= Resources.saveCollRobots %></button></div></div><div class="row row-26"><div class="col-sm-3" id="Filters"></div><div class="col-sm-9" id="ListTemplate"></div></div></fieldset>';
       

    function GetCode(code) {
        var sat = { 10021: 1002, 10022: 1003, 10023: 1004 };
        return sat[parseInt(code)];
    }

    return Backbone.View.extend({
        el: $("#Sources"),
        events: {
            "click .toform:not(.disabled)": "toform",
            "click button.Start": "start",
        },
        toform: function () {
            if (!this.model.id)
                Backbone.trigger("to:form", { remove: this.model });
            else Backbone.trigger("to:form", { selected: this.list.basket, saType: this.list.saType });
        },
        initCounter: function (basket) {
            this.selected = 0;
            this.sum = 0;
            if (!basket.length)
                this.dats();
            basket.each(this.add, this);
        },
        add: function (m) {
            this.selected++;
            this.sum += m.get("price");
            this.dats();
        },
        remove:function (m) {
            if (this.selected > 0) {
                this.selected--;
                this.sum -= m.get("price");
                this.dats();
            }
        },
        dats:function () {
            this.$("#selectedSources").text(this.selected);
            this.$("#SelectAmount").text(this.sum.toFixed(2));
            if (this.balance > this.sum) {
                this.$("#source-select-meter").data('meter-val', this.sum).gtkMeter('update');
            } else 
                Backbone.trigger("message:warning", { title: "Warning!", message: "no money!" });
        },
        initialize: function () {
            this.selected = 0;
            this.sum = 0;
            this.balance = 0;            

            this.list = new List();
            this.list.basket.on("reset", this.initCounter, this);
            this.list.basket.on("add", this.add, this);
            this.list.basket.on("remove", this.remove, this);
            this.filters = new Filters();
            this.list.listenTo(this.filters, "listsources:send", this.list.byfilter);
            this.list.listenTo(this.filters, "listsources:changecollection", this.list.changecollection);
            this.listenTo(this.filters, "listsources:changecollection", function (model) {
                this.model = model;
                this.viewCRobots.current = model;
                this.viewCRobots.$el.closest("div.pull-right").find(".show-source-collection-manage").text(model.get("SearchPackName"));
            });
            this.listenTo(this.list, "change:selected", function () {
                if (this.list.basket.length) {
                    this.$(".Start").removeClass("disabled");                    
                }
                else
                    this.$(".Start").addClass("disabled");
            });
        },
        render: function () {
            this.$el.html(_.template(template)( { Resources: Resources }));
            this.list.setElement(this.$("#ListTemplate")).render();
            this.filters.setElement(this.$("#Filters")).render();            
            return this;
        },
        
        // point
        fill: function (model) {
            if (!model.id) {
                //this.$(".toform").addClass("disabled");
                //model.on("change:id", function () {
                //    this.$(".toform").removeClass("disabled");
                //}, this);
            }

            if (!this.viewCRobots)
                this.viewCRobots = model.view;

            this.viewCRobots.current = model;
            this.viewCRobots.$el.closest("div.pull-right").find(".show-source-collection-manage").text(model.get("SearchPackName"));

            this.model = model;
            this.list.model = model;
            this.filters.initCollection(model).initCountry(model.get("SelectedCountries")).send();
            this.fillBalance();
        },
        fillBalance: function (num) {
            $.get("/api/search/balance").done(num=> {
                this.balance = parseFloat(num);
                this.$("#Balance").text(num.toFixed(2));
                this.$("#source-select-meter").attr("data-meter-max", num);
                this.$("#source-select-meter").gtkMeter();
            }).fail(() => clearInterval(this.tickBalance));
        },
        start: function () {
            let r = this.list.basket.pluck("id"),
                 par = {
                     method: "POST", url: "/api/sources/persisted", data: { Sources: r, BySATypeSelectedValue: this.model.get("BySaType"), SearchPackUID: this.model.id, SearchPackName: this.model.get("SearchPackName") }
                 };

            if (!r.length) {
                Backbone.trigger("message:warning", { title: Resources.alert, message: Resources.errorsavecoll });
                return null;
            }

            $.ajax(par).done(uid => {
                if (!this.model.id) this.model.set("id", uid);
                this.toform();
            });
        }       
    });
});