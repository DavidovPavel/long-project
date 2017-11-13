define([
    'app',
    "storage"
],
function (App,        Storage) {

    var buttonModel = Backbone.Model.extend({
        defaults: function () {
            return {
                id: "",
                parent: "",
                title: "",
                isActive: false,
                bottomWin: undefined,
                addButtons: [],         // дополнительные кнопки
                present: {}            // представление (дерево, вкладки) parameters -показать окно для ввода параметров
            };
        }
    });
    var buttonCollection = Backbone.Collection.extend({
        model: buttonModel
    });
    var buttonView = Backbone.View.extend({
        tagName: "button",
        events: {
            "click": "view"
        },
        view: function () {
            Backbone.trigger("panel:query", this.model);
        },
        render: function () {
            var buttonsTemplate = "<%= title %>";
            this.$el.html(_.template(buttonsTemplate)( this.model.toJSON()));
            this.$el.attr("id", this.model.id);
            this.$el.attr("title", this.model.get("title"));
            return this;
        }
    });

    var panelView = Backbone.View.extend({
        el: $("#Query_Buttons"),
        view: function (model) {
            var _id = model.id;
            if (_id === "All") {
                _id = "Rubric";
                model = this.collection.get(_id);
            }
            App.Select.set("query", _id);
            App.navigate(App.Select.fullpath());
            this.action(model);
        },
        action: function (model) {
            var pid = model.get("parent") || model.id;
            this.fillSub(pid);

            var $link = this.$("#" + pid);
            $link.button("option", "disabled", true);
            $link.siblings("button").button("option", "disabled", false);

            Backbone.trigger(":P", { cmd: "b", model: model });
            return this;
        },
        fillSub: function (pid) {
            var bs = this.collection.where({ parent: pid });
            if (bs) {
                this.$("#subButtons").empty();
                for (var i = 0; i < bs.length; i++) {
                    var m = bs[i];
                    if (App.check(m.get("data_id"))) {
                        var btn = new buttonView({ model: m, className: m.id });
                        this.$("#subButtons").append(btn.render().el);
                    }
                }
                this.$("#subButtons button").each(function () {
                    $(this).button({ icons: { primary: $(this).attr("id") } });
                    if (App.Select.get("query") === $(this).attr("id")) {
                        $(this).button("option", "disabled", true);
                    }
                });
                if (this.$("#subButtons button").size() === 1) {
                    this.$("#subButtons").show();
                    this.$("#" + pid).hide();
                }
            }
        },
        initialize: function () {
            this.collection = new buttonCollection;
            this.collection.on("add", this.addOne, this);
            Backbone.on("panel:query", this.view, this);
        },
        render: function () {
            this.collection.add(Storage.getButs());
            return this;
        },
        addOne: function (m) {
            if (!m.get("parent")) {
                //if (App.check(m.get("data_id"))) {
                    var btn = new buttonView({ model: m, className: m.id });
                    this.$("#mainButtons").append(btn.render().el);
                    btn.$el.button({ icons: { primary: m.id } });
                //}
            }
        }
    });

    var mb = new panelView;
    return {
        get: function () {
            //if (App.check(mb.$el))
                return mb.render();
            // else redirect to main page
        }
    }

});