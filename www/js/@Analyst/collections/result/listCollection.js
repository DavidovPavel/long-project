define([
        'app',
        '@/models/listItemModel'
    ], function(App, ListItemModel) {
        var listItemCollection = Backbone.Collection.extend({
            model: ListItemModel
        });
        return listItemCollection;
    });