define('sendModel', [], function () {

    return Backbone.Model.extend({

        defaults: {
            id: null,
            page: 1,
            pagesize: 30,
            pars: [],
            ts: '',
            useDefParams: true,
            action: 'send'
        },

        url: function () { return '/api/extsrv/' + this.get('action'); },

        sync: function (method, model, options) {

            //Backbone.Model.prototype.sync.apply(this, ['create', model, options]);

            $.ajax({ url: model.url(), method: 'POST', data: JSON.stringify(model.toJSON()), contentType: 'application/json; charset=utf-8' })
                .done(function () {

                    options.success.apply(this, arguments);

                })
                .fail(function () {

                    options.error.apply(this, arguments);

                });

        }
    });

});