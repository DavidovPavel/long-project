define('model:project', ['i18n!nls/resources.min'], function (Resources) {

    return Backbone.Model.extend({

        idAttribute: 'projectId',

        defaults: function () {
            return {
                projectId: null,
                projectName: "",
                projectCode: "",
                projectState: "",
                projectStatus: "",
                rubrics: null
            }
        },

        validate: function (attr, o) {

            var output = [],
                dp = '^[\\d]+$';

            if (!$.trim(attr.projectName))
                output.push({ name: "projectName" });

            if (output.length)
                return output;
        },

        test: function (s, p) {
            return s === "" || new RegExp(p).test(s);
        },

        url: function () {
            return `/api/inquiry/input/${this.id ? this.id : ''}`;
        }
    });


});