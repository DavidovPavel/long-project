define(function (require) {
    var SelectedItemView = Backbone.View.extend({
        tagName: "tr",
        render: function () {
            this.$el.html(_.template("<td style='width: 100%'><%= title %></td><td><span class='ui-icon ui-icon-circle-close Clear' style='cursor: pointer;'></span></td>")
                (this.model.toJSON()));
            return this;
        },
        events: {
            "click .Clear": "remove"
        },
        remove: function () {
            this.collection.remove(this.model);
        }
    });;
    return Backbone.View.extend({
        render: function () {
            SelectedWin.$("#SelectedParameters").empty();
            this.collection.each(function (m) {
                var p = new SelectedItemView({ model: m });
                SelectedWin.$("#SelectedParameters").append(p.render().el);
            });
        }
    });
});