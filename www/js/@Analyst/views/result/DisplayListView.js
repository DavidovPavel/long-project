define([
    "i18n!nls/resources.min"
],
function (Resources) {

        var select = Backbone.View.extend({
            el: $("#DisplayList"),
            events: {
              "change":"change"  
            },
            change: function () {
                var id = this.$el.val();
                var tmplName = "text!@/templates/list/display/" + id + ".html";
                var s = this;
                require([tmplName], function (tmpl) {
                    if ($.trim(tmpl)) {
                        s.template = tmpl;
                        s.list.headerTemplate = id;
                        s.list.templateItem = tmpl;
                        s.list.refresh();
                    } else {
                        $.Error(Resources.templNotFound);
                    }
                });
            },
            initialize: function() {
                var data = [
                    { id: 'listItem1', title: Resources.default },
                    { id: 'listItem2', title: Resources.titleOnly },
                    { id: 'listItem3', title: Resources.block },
                    { id: 'listItem4', title: Resources.doubleView },
                    { id: 'listItem5', title: Resources.doubleView2 },
                    { id: 'listItem6', title: Resources.doubleView3 }
                ];
                this.collection = new Backbone.Collection(data);
                this.render();
            },
            render: function () {
                this.$el.empty();
                _.each(this.collection.models, function(model) {
                    this.$el.append("<option value='" + model.id + "'>" + model.get("title") + "</option>");
                }, this);
                return this;
            },
            set:function() {
                this.list = arguments[0].list;
                if (!this.list)
                    $.Error(Resources.empty);
                return this;
            },
            get: function () {
                return this.template;
            }
        });
        var dl = new select();
        return dl;
    });