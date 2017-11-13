define('model:object', [], function () {

    return Backbone.Model.extend({

        defautls: () => {

            id:null

        },

        url: function () {
            return `/api/details/${this.id}?mode=1`;
        }

    });

});