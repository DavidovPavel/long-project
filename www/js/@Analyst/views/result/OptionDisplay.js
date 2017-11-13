define([
        'jquery',
        'underscore',
        'backbone'
], function ($, _, Backbone) {
    var option = Backbone.View.extend({
        tagName: "option",
        render: function () {
            var template = "<%= title %>";
            this.$el.html(_.template(template)( this.model.toJSON()));
            return this;
        }
    });
    return option;
});