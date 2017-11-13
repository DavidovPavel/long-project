define(['i18n!nls/resources.min'], function (Resources) {

    var listItemView = Backbone.View.extend({
        tagName: "tr",
        events: {
            "click td": "itemSelect",
            "click .ViewProperties": "viewProperties"
        },
        viewProperties: function (e) {
            e.stopPropagation();
            Backbone.trigger("general:add", { id: this.model.id, title: this.model.get("title") });
            //GeneralView.render(this.model);
        },

        // множественный выбор в списке
        itemSelect: function(e) {
            if (this.model.id === -1) return;
            if (!e.ctrlKey)
                this.$el.siblings("tr").removeClass("ui-selected");
            
            this.$el.addClass("ui-selected");
            var list = this.options.list;

            if (list && list.RP)
                list.RP.trigger("select", this.model);

            if (this.model.collection) {
                var $cbx = this.$("input[type=checkbox]");
                //var $radio = this.$("input[type=radio]");
                if ($cbx.get(0)) {
                    if ($cbx.is(":checked")) {
                        list.check(this.model.id);
                    } else {
                        list.uncheck(this.model.id);
                    }
                    list.operation.call(list, this.model, $cbx.is(":checked"));
                } else if (list&&list.operation) {
                    list.operation.call(list, this.model);
                } else if (this.options && this.options.operation) {
                    this.options.operation.call(this, this.model);
                } else {
                    Backbone.trigger(":P", { cmd: "d", model: this.model.id });
                }
                //if ($radio.get(0)) {
                //    if ($radio.is(":checked"))
                //        list.operation.call(list, this.model);
                //}
            }
        },
        initialize: function (o) {
            this.options = o;
            if (this.options.templ) this.template = this.options.templ;
            this.model.view = this;
        },
        render: function() {
            var data = this.model.toJSON();
            if (data.id == -1) {
                this.$el.css("cursor", "default");
            } else {
                data.Resources = Resources;
                this.$el.html(_.template(this.template)( data));
            }
            this.$el.attr("title", this.model.get("title"));
            return this;
        }
    });
    return listItemView;
});