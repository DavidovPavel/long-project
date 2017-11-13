define('radio.characteristic', [], function () {

    var paramModel = Backbone.Model.extend({
        idAttribute: 'WidgetParamUID',
        defaults: {
            WidgetParamUID: null,
            WidgetParamName: '',
            WidgetParamValue: null
        }
    });

    var collectionsParams = Backbone.Collection.extend({

        model: paramModel,

        sync: function (method, model, options) {

            Backbone.Model.prototype.sync.apply(this, ['create', model, options]);

        }
    });

    var chW = Mn.Object.extend({

        channelName: 'chW',

        radioRequests: {

            'get:param:model': function (a, n) {

                var p = _.findWhere(a, { WidgetParamName: n });

                var m = new paramModel({ WidgetParamName: n });

                if (p)
                    m.set(p);

                return m;
            },

            'get:params:collection': function (uid) {

                var c = new collectionsParams;
                c.url = '/api/widget/' + uid + '/params';

                return c;

            }

        }

    });

    return new chW;
});