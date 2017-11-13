define('source:links', ['i18n!nls/resources.min', 'c/SimpleTableView'], function (Resources, TableView) {

    return Mn.View.extend({

        template: _.template('<div></div>'),

        regions: {
            table: { el: 'div', replaceElement: true }
        },

        initialize: function () {

            this.collection = new Backbone.Collection;
            this.collection.url = `/api/Docs/LinkedFactsAndObjects/${this.model.id}`;
        },

        onRender: function () {

            Backbone.Radio.channel('tools').request('get:tools').collection.reset();

            this.showChildView('table', new TableView({
                collection: this.collection,
                rowTemplate: "<td><%- title %></td><td><%- type %></td>",
                head: new Backbone.Collection([
                    { id: 0, title: Resources.title },
                    { id: 1, title: Resources.type }
                ])
            }));

            this.collection.fetch({ reset: true });
        }

    });

});