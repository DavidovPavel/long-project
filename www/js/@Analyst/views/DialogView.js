define([],
function () {

    return Backbone.View.extend({
        isrender: false,
        width: 720,

        initPatt: function(m) {
            var s = this;
            require(['@/views/toolbar/PatternView'], function(PatternView) {
                var p = new PatternView({ model: m, dialog: s.$el });
                s.$el.html(p.$el);
            });
        },

        initialize: function (o) {
            this.options = o;
            this.on("patt:init", this.initPatt, this);
            this.on("dialog:close", function() {
                this.$el.dialog("destroy");
            });
        },
        render: function() {
            var data = this.options;
            this.width = data.width || this.width;
            this.height = data.height || $(window).height() - 100;
            var modal = data.modal != undefined ? data.modal : true;
            this.$el.dialog({
                width: this.width,
                height: this.height,
                modal: modal,
                autoOpen: true,
                title: data.title,
                close: function() {
                    $(this).dialog("destroy");
                }
            });
            return this;
        },
        fill: function() {
            this.$el.html(arguments[0]);
        }
    });
});