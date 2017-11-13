define('result.docs.model', [], function (App) {

    return Backbone.Model.extend({

        url: function () {
            return "/api/object/";
        },

        defaults: function () {
            return {
                id: null,
                branch: { parentid: "10002", id: "10006" },
                typeid: 10006,
                linkid: 0,
                linktoid: null,
                rubricid: null,

                Display_Name: "",
                TextSource: "",
                MassMedia: "",
                Author: "",
                Дата_публикации: ""
            };
        },

        validate: function (attr, o) {
            var output = [], dp = '^[\\d]+$';
            if (!$.trim(attr.Display_Name))
                output.push({ name: "Display_Name" });

            //if (!this.test(attr.smi, dp))
            //    output.push({ name: "smi" });

            if (output.length)
                return output;
        },
        test: function (s, p) {
            return s == "" || new RegExp(p).test(s);
        }
    });
});