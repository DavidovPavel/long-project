define(function (require) {

    var App = require("app");

    return Backbone.Model.extend({
        url: function () {
            return "/api/object/";
        },
        defaults: function () {
            return {
                id: null,
                branch: null,
                title: "",
                typeid: 10001,
                linkid: 0,
                linktoid: null,
                rubricid: (App.Select.get("query") === "Rubrics" ? App.Select.get("list") : 0)
            };
        },
        validate: function (attr, o) {
            var output = [], dp = '^[\\d]+$';
            if (!$.trim(attr.title))
                output.push({ name: "title" });

            if (output.length)
                return output;
        },
        test: function (s, p) {
            return s == "" || new RegExp(p).test(s);
        }
    });
});