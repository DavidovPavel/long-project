define('global:collection:dictionary', [], function () {

    var dictionaries = Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: "ID",
            defaults: {
                DicCode: "",
                DicType: 0,
                ID: null,
                Importance: null,
                Title: ""
            }
        }),
        url: "/api/sources/types"
    });
    
    var c = new dictionaries;

    var init = {

        done: function (f, context) {

            this.callback = f;

            if (context)
                this.context = context;
            
            if(c.models.length) {
                this.callback.call(init.context, c);
            } else {

                c.fetch({
                    reset: true,
                    success: function (c) {
                        init.callback.call(init.context, c);
                    }
                });
            }
        }
    };

    
    return init;
});