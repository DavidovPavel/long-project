define(['i18n!nls/resources.min'],
    function (Resources) {

    var ListItemModel = Backbone.Model.extend({
        defaults: function() {
            return {
                id: -1,
                uid: "",
                num: "",
                title: Resources.notfound,
                description: "",
                type: "",
                typeid: 0,
                date: "",
                source: "",
                sel: "",
                bdate: "",
                inn: "",
                ogrn: "",
                ogrnip: "",
                okpo: "",
                pass: ""
            };
        }
    });
    return ListItemModel;
});