define([
    'app',
    'i18n!nls/resources.min',
    'global.request.param'
],
function (App, Resources, ParameterView) {
    "use strict";    

    return Backbone.View.extend({
        el: $("#ViewParameters"),
        collection: [],
        events: {},
        setParams: function () {
            var data = $.GetData(this.$el),
                list = ["idlist", "type", "rubric", "object"];
            
            var output = {};
            this.collection.each(function (m) {
                var name = m.get("Name");
                if (!list.find(function (a) { return a === m.get("ParametrType").toLowerCase() })) {
                    m.set("Value", [data[name]]);
                }
                output[name] = m.get("Value");
            }, this);
            output.id = this.model.id;
            return { save: this.collection.toJSON(), run: output };
        },
        getScript:function () {
            var o = this.setParams(),
                key = window.location.pathname;
            var requestParameters = {
                domain: window.location.host,
                dbase: key,
                requestid: this.model.id,
                param: o.save
            };
            $.ajax({ url: "/api/interactive/paramsforwall", data: $.param(requestParameters), type: "POST" })
                .done(function() {
                    alert(Resources.success);
                });
        },
        sendQuery: function() {
            var op = this.setParams(),
                qstr = "&" + $.param(op.run, true) || "param=null";
            App.Select.set("list", qstr);
            App.navigate(App.Select.fullpath());
            Backbone.trigger(":P", { cmd: "c" });
        },
        initialize: function() {
            var data = this.model.get("parameters");
            if (data !== null) {
                this.collection = new Backbone.Collection(data);
            }
        },
        render: function () {
            this.$("#Query_Parameters table").empty();
            var data = { Resources: Resources }, s = this;
            this.$el.html(_.template('<section id="Query_Parameters"><table></table></section><section id="Query_Parameters_Description"><%= Resources.Descriptionofparameters %></section>')
                (data)).dialog({
                    width: 600,
                    height: 400,
                    title: Resources.paramquest,
                    buttons: [{
                            icons: { primary: "runRequestIcon" },
                            text: Resources.runquest,
                            "class": "runRequestBtn",
                            click: function() {
                                s.sendQuery();
                                $(this).dialog('close');
                            }
                        },
                        {
                            icons: { primary: "ui-icon-wrench" },
                            text: Resources.onVitrin,
                            click: this.getScript.bind(this)
                        }]
                });
           

            if (this.collection.length) {
                this.collection.each(function (m) {
                    this.$("#Query_Parameters table").append(new ParameterView({ model: m }).render().$el)
                }, this);
            } else {
                this.$("#Query_Parameters_Description").text(Resources.notparameters);
            }

            return this;
        }
    });
});