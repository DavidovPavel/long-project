define(function() {
    'use strict';

    return Backbone.View.extend({
        events: {
            "change": "change"
        },
        change: function(e) {
            var v = $(e.target).val();
            if (v != 0)
                this.action(v);
        },
        initialize: function() {
            if (this.options) {
                this.done = this.options.done || this.done;
                this.action = this.options.action || this.action;
                this.collection = new Backbone.Collection();
                this.url = this.options.url;
                this.collection.on("reset", this.render, this);
            }
        },
        fetch: function () {
            if (!this.isFetch) {
                this.isFetch = true;
                var $el = this.$el;
                this.collection.url = this.url;
                this.collection.fetch({
                    reset: true,
                    error: function() {
                        $el.hideIndicator();
                        $.Error(arguments[1]);
                    }
                });
            }
            return this;
        },
        render: function() {
            this.$el.empty();
            var items = this.collection.models[0].get("items");
            this.$el.append("<option value=''>...</value>");
            _.each(items, function(el) {
                this.props = el.data;
                this.$el.append("<option value='" + this.value("ID") + "'>" + this.value("Title") + "</option>");
            }, this);
            //this.$el.find("option:not([value=0])").eq(0).attr("selected", true);
            this.done();
            return this;
        },
        props: null,
        get: function(prop) {
            if (!this.props) {
                $.Error("На задана коллекция для обработки ajax-данных");
                return null;
            }
            for (var i = 0; i < this.props.length; i++) {
                var p = this.props[i];
                if (p.systemName === prop) {
                    return p;
                }
            }
        },
        value: function(prop) {
            var o = this.get(prop);
            if (o) return o.value;
        },
        done: function() {},
        action: function() {}
    });
});