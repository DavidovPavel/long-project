define('settings.subscribe', ['settings.subscribeList'], function (subscribeList) {

    return Mn.View.extend({

        template: _.template('<div></div>'),

        regions: {
            area: 'div'
        },

        onRender: function () {

            var list = new subscribeList({ collection: this.model.collection });

            this.showChildView('area', list);

            list.setFilter(function (child, index, collection) {
                return child.id !== this.model.id;
            }.bind(this));

            this._check();
        },

        onChildviewClickItemSubscribe: function (v) {

            if (!v.$('input').is(':checked')) {

                this.collection.create(new Backbone.Model({
                    id: v.model.id,
                    title: v.model.get('title'),
                    requestParameters: v.model.get('requestParameters')
                }));

            } else {

                this.collection.get(v.model.id).destroy();

            }
        },

        collectionEvents: {

            update: function () {

                this._check();

            },

            reset: function () {

                this._check();

            }
        },

        _check:function(){

            this.getChildView('area').children.each(function (v) {

                if (this.collection.findWhere({ id: v.model.id }))
                    v.$('input').prop('checked', true);
                else
                    v.$('input').prop('checked', false);

            }, this);

        },

        onShow: function () {

            if (!this.collection.length)
                this.collection.fetch({ reset: true });

        }

    });

});