define(function(require) {
    var Backbone = require("backbone");
    var p = Backbone.View.extend({
           initialize:function () {
               Backbone.on("smd:props", this.render, this);
           },
           render:function () {
               this.$el.empty();
               this.$el.html("under construction");
           }
    });

    var f = new p;
    return {
        get: function () {
            return f;
        }
    }

});