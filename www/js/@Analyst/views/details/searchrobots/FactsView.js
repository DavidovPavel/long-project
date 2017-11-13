define([
'app',
'i18n!nls/resources.min',
'g/ContentView',
'@/views/details/furniture/ConditionsView',
            'jqueryui'
],

    function (App,            Resources,            ContentView,            ConditionsView) {

        var factsTemplate = '<div id="FactList"><table class="List"><tr><th><%= Resources.title %></th><th><%= Resources.type %></th></tr></table></div>',
            listFactsTemplate = '<td data-id="<%= id %>"><%= title %></td><td><%= type %></td>';
    
        var factsView = Backbone.View.extend({
            el: $("#SearchBySource .Load"),
            initialize: function() {
                Backbone.on("smt:facts", this.render, this);
            },
            render:function() {
                this.$el.empty();
                this.$el.append(_.template(factsTemplate)( { Resources: Resources }));
                var s = this;
                if (!this.isInitList) {
                    this.isInitList = true;
                    require(["@/views/ListView"], function (List) {
                        this.list = new List({
                            el: this.$("#FactList"),
                            headerTemplate: "headFactTemplate",
                            api: ("/api/facts/" + App.Select.get("detail")),
                            templ: listFactsTemplate,
                            operation: function (model) { s.selectFact(model); },
                            done: function () {
                            }
                        });
                    }.bind(this));
                } else {
                    this.list.setElement(this.$("#FactList"));
                    this.list.collection.url = ("/api/facts/" + App.Select.get("detail"));
                    this.list.collection.fetch({ reset: true });
                }
                return this;
            },
            selectFact: function (model) {
                ConditionsView.get().show({ code: this.forOne, cid: model.id });
            },
            forOne: function (id) {
                new ContentView({ url: ("/api/facts/InSources/" + id), objID: id })
                    .setElement(this.$("#Load"))
                    .render();
            }
        });
        var f = new factsView;
        return {
            get:function() {
                return f;
            }
        }
    });