define(function(require) {

    var $ = require("jquery"),
        Backbone = require("backbone"),
        model = require("@Wiki/models/PointModel"),
        List = require("g/lists/ListContentItems");

    return Backbone.View.extend({
        el: $("#Left"),
        events: {
          "click .One":"turn"  
        },
        turn: function () {
            this.$(".MainTitle .Two").text("");
            this.render(this.model);
        },
        getItem: function (o) {
            if (o.oknd == 4) {
                this.$(".MainTitle .Two").text(" >> " + o.title);
                if (!this.isInitList) {
                    this.isInitList = true;
                    this.list = new List({
                        el: this.$(".Content"),
                        api: function() { return "/api/Request/Execute/" + o.id + "?page=1&id=" + o.id; },
                        operation: function(model) {
                            Backbone.trigger("choose:item", model.id);
                        }
                    });
                }else {
                    this.list.collection.url = function () { return "/api/Request/Execute/" + o.id + "?page=1&id=" + o.id; };
                    this.list.refresh();
                }
            } else
                this.toItem(o.id);
        },
        toItem: function (id) {
            var m = new model({ Object_ID: id });
            m.on("change", this.render, this);
            m.fetch();
        },
        setMain: function (m) {
            this.$(".MainTitle .One").text(m.get("Display_Name"));
            this.$(".MainTitle .Two").text("");
            this.model = m;
            this.model.on("change", this.render, this);
            this.model.fetch();
        },
        initialize: function () {
            Backbone.on("set:main", this.setMain, this);
            Backbone.on("to:object", this.getItem, this);
            Backbone.on("goto:object", this.toItem, this);
            this.model = new model;
        },
        render: function (m) {
            if (this.$(".MainTitle .One").text() != m.get("Display_Name"))
                this.$(".MainTitle .Two").text(" >> " + m.get("Display_Name"));
            
            this.$(".Content").html(m.get("Content"));
            
            this.$(".Content").find("span[data-oid]").each(function () {
                if (!$(this).hasClass("Mark")) {
                    $(this).addClass("Mark");
                }
                var id = $(this).data("oid"),
                    oknd = $(this).data("oknd"),
                    title = $(this).attr("title"),
                    $lupa =  $("<span class='ui-icon ui-icon-search'></span>");

                if (oknd == 3) {
                    $(this).append($lupa);
                    $lupa.click(function (e) {
                        e.stopPropagation();
                        Backbone.trigger("general:add", { id: id, title: title });
                    });
                }
                $(this).click(function (e) {
                    e.stopPropagation();
                    Backbone.trigger("to:object", { id: id, oknd: oknd, title: title });
                });
            });
            this.$(".Content a").each(function () {
                if ($(this).attr("object_id")) {
                    var id = $(this).attr("object_id");
                    $(this).click(function (e) {
                        Backbone.trigger("general:add", { id: id, title: $(this).text() });
                        e.preventDefault();
                    });
                }
            });
            Backbone.trigger("choose:item", m.id);
            return this;
        }
    });
});