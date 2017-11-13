define(function(require) {
    var Backbone = require("backbone"),
        model = require("@Wiki/models/PointModel");
    
    return Backbone.View.extend({
        el: $("#Main"),
        events: {
            "click .List div": "getMain"
        },
        callback:function () {
            
        },
        getMain: function (e) {
            var id = parseInt($(e.target).attr("data-id")),
                m = this.collection.get(id);
            this.setMain(m);
        },
        setMain:function (m) {
            Backbone.trigger("set:main", m);
            this.mark(m.id);
            this.hide();
        },
        mark: function (id) {
            this.$(".List div").removeClass("Red");
            this.$(".List div[data-id='" + id + "']").addClass("Red");
        },
        initialize: function() {
            this.collection = new Backbone.Collection();
            this.collection.model = model;
            this.collection.url = "/api/wiki/points";
            this.collection.on("reset", this.render, this);
            this.collection.fetch({ reset: true });
            $("#PL").show();
        },
        render: function () {
            $("#PL").hide();
            this.collection.each(function(m) {
                this.$(".List").append(_.template("<div data-id='<%= Object_ID %>'><%= Display_Name %><br/><i><%= Description %></i></div>")( m.toJSON()));
            });
            this.callback.call(this);
            return this;
        },
        show:function () {
            $(".MainMenu .Item .Home").parent("div.Item").addClass("S");
            $(".MainMenu .Item .Document").parent("div.Item").removeClass("S");
            this.$el.show("slide");
        },
        hide: function () {
            $(".MainMenu .Item .Home").parent("div.Item").removeClass("S");
            $(".MainMenu .Item .Document").parent("div.Item").addClass("S");
            this.$el.hide("slide");
        }
    });
});