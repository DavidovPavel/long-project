define('create.check.checkView', ['i18n!nls/resources.min', 'global.grid.dataItemsView', 'ContextMenuCollection'], function (Resources, ListView, menuCollection) {

    return Mn.View.extend({

        className: 'main-container',

        template: templates['check-page-c'],
        templateContext: {
            Resources: Resources
        },

        regions: {
            match: '.matchesList'
        },

        events: {

            'click input': function (e) {
                let $i = $(e.target);
                this.model.set($i.attr('name'), $i.prop('checked'));
            }

        },

        onRender: function () {

            if (this.model.isValid()) {

                var json = this.model,
                    csync = Backbone.Collection.extend({
                        url: '/api/interestObjects/' + this.model.get("typeid") + '?page=1',
                        sync: function (method, model, options) {
                            json.url = this.url;
                            Backbone.Collection.prototype.sync.apply(this, ['create', json, options]);
                        }
                    });

                var re = [0, 3];
                menuCollection.each(function (m) {
                    if (re.indexOf(m && m.id) !== -1)
                        menuCollection.remove(m);
                });

                var collection = new csync;
                this.showChildView('match', new ListView({ collection: collection, menuCollection: menuCollection }));

                Backbone.Radio.channel('loader').trigger('show', this.getChildView('match').$el);
                collection.fetch({
                    reset: true, success: function () {
                        Backbone.Radio.channel('loader').trigger('hide');
                    },
                    error: function () {
                        Backbone.Radio.channel('loader').trigger('hide');
                    }
                });

            }

        },

        childViewEvents: {

            'click:link': function (v,e) {

                e.preventDefault();

                window.open(`#${v.model.get('project_id')}/${v.model.id}/`);

            },

            'row:col:trigger': function (m, e) {

                var $e = $(e.target).closest("td");

                if ($e.attr("data-name") === "status" && m.get("dossier"))
                    Backbone.Radio.channel('Notify').request('once:dialog', { title: Resources.info, content: m.get("dossier") });
            }

        }

    });
});