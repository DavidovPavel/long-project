define(function(require) {
    var Backbone = require("backbone");
    return Backbone.Model.extend({
        idAttribute: "Object_ID",
        defaults: {
            "Object_ID": null,
            "Display_Name": "",
            "Content": ""
        },
        url:function () {
            return "/api/wiki/points/" + this.id;
        }
    });
});