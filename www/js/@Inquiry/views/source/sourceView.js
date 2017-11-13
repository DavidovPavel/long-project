define('source:result', ['i18n!nls/resources.min', 'source:content', 'source:links'], function (Resources, sourceContent, linksView) {

    return Mn.View.extend({

        className: 'workbench--content',
        template: _.template('<div id="content"></div>'),

        regions: {
            content: { el: '#content', replaceElement: true }
        },

        childViewTriggers: {
            'call:back:tools:button': 'call:back:tools:button'
        },

        initialize: function () {

            this.collection = new Backbone.Collection([], { model: Backbone.Model.extend({ idAttribute: 'uid' }) });

            switch (this.options.mode) {
                case 'facts':
                    this.collection.url = `/api/facts/InSources/${this.options.sourceId}?originoid=${this.model.id}`;
                    break;
                case 'docs':
                case 'infos':
                    this.collection.url = `/api/details/ContentV2/${this.options.sourceId}?originoid=${this.model.id}`;
                    break;
            }


            Backbone.Radio.channel('side').reply('sidebar:click:item', function (o) {

                this.options.model = this.model;

                if (o.get('name') === 'content' && o.get('children').length) {

                    Backbone.Radio.channel('side').request('get:sidebar').setCurrent(['content', o.get('children')[0].id]);
                    this.showChildView('content', new sourceContent({ model: this.model, collection: this.collection }));

                }

                if (o.get('name') === 'source:links') {

                    this.showChildView('content', new linksView({ model: this.model }));
                    Backbone.Radio.channel('side').request('get:sidebar').setCurrent(['links']);

                }

            }.bind(this));

        },

        onRender: function () {

            this.collection.fetch({ reset: true });
        },

        collectionEvents: {

            update: function (c, o) {

                var sideContentChildren = [];

                if (o.add) {

                    _.each(o.changes.added, function (m, i) {

                        sideContentChildren.push({
                            id: m.id,
                            title: Resources.source + ' - ' + (i + 1),
                            name: 'source:content'
                        });

                    });                    

                    if (sideContentChildren.length) {

                        // sidebar
                        var sideContentModel = Backbone.Radio.channel('side').request('get:sidebar').collection.get('content');
                        if (sideContentModel) {

                            sideContentModel.set({ expanded: true, children: sideContentChildren });

                            Backbone.Radio.channel('side').request('get:sidebar').setCurrent(['content', sideContentChildren[0].id]);

                            this.showChildView('content', new sourceContent({ model: this.model, collection: this.collection }));
                            
                        }
                    }

                }

            },

            reset: function () {

                var items = this.collection.at(0).get('items'),
                    sideContentChildren = [];

                this.collection.set([]);

                _.each(items, function (item, i) {

                    var attr = _.chain(item.data).map(function (m) { return [m.systemName, m.value]; }).object().value();

                    attr.links = item.links;

                    this.collection.add(attr);

                }, this);

                
            }
        }
    });

});