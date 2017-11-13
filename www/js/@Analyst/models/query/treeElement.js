define(function(require) {
        return Backbone.Model.extend({
            defaults: function() {
                return {
                    title: "",
                    id: null,
                    parentid: 0,
                    isopen: false,
                    isset: false,
                    children: 0,
                    iconexist: false,
                    isdoc: false,
                    parameters: []
                };
            }
        });
    });