define(["app"], function (App) {
    
    return Backbone.Model.extend({
        url:function() {
            return "/api/object/";
        },
        defaults:function() {
            return {
                id: null,
                branch: { parentid: '10016', id: '40732' },
                title: "",
                typeid: 40732,
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
            return s === "" || new RegExp(p).test(s);
        }
    });
});