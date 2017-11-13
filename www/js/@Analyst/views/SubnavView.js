define([
'app',
'text!@/templates/submenu/template.html'
],
function (App,        template) {

    var p = Backbone.View.extend({
        current: 0,
        events: {
            "click .link": "tolink"
        },
        tolink: function() {
            var $a = $(arguments[0].target);
            this.current = $a.attr("id");
            App.Select.set("sub", this.current);
            App.navigate(App.Select.fullpath());
            this.load(this.current);
            require("@/views/details/furniture/ConditionsView").close();
        },
        load: function(_id) {
            this.$("span").removeClass("A");
            this.$("span").eq(_id).addClass("A");
            if (parseInt(_id) >= this.collection.models.length) {
                this.current = 0;
                _id = 0;
            } 
            this.model = this.collection.get(_id);
            this.$title.html(this.model.get("title"));
            Backbone.trigger(this.model.get("name"), this.model.get("render"));
            Backbone.trigger("submenu:action", _id);
        },
        render: function () {
            var data = {
                models: this.collection.models,
                current: this.current,
                _: _
            }
            this.$el.html(_.template(template)( data));
            this.load(App.Select.get("sub"));
            return this;
        }
    });

    var o = new p;
    return {
        get: function(data) {
            o.collection = new Backbone.Collection(data.models);
            if (data) {
                o.$load = data.load;
                o.$title = data.title;
            }
            return o;
        }
    }

});