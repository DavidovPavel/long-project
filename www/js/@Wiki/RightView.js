define(function (require) {
    
    var Backbone = require("backbone"),
        App = require("app"),
        jqui = require("jqueryui");
    
    return Backbone.View.extend({
        el:$("#Right"),
        initialize: function () {
            Backbone.on("choose:item", this.render, this);
        },
        render: function (objID) {
            App.navigate(objID.toString());
            this.$el.show();
            var tabs = this.$el.tabs({
                beforeActivate: function (event, ui) {
                    var ui = ui;
                },
                active: false,
                collapsible: true,
                activate: function (event, ui) {
                    var id = ui.newPanel.attr("id");
                    switch (id) {
                        case "SemNet":
                            self.activetab = 0;
                            require('g/semnet/SemNetView')
                                .get()
                                .setElement($("#SemNet"))
                                .render(objID);
                            break;
                        case "Report":
                            self.activetab = 1;
                            $("#SqlRepFrame").attr("src", (location.pathname.replace("wiki", "") + "sqlreporting.aspx?pid=" + objID));
                            break;
                    }
                }
            });
            tabs.tabs("option", "active", parseInt(0));
            return this;
        }
    })
});