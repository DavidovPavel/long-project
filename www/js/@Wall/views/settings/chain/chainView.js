define('settings.chain', ['i18n!nls/resources.min'], function (Resources) {

    var collectionParams = Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: 'QueryParamsMapID',
            defaults: {
                QueryParamsMapID: null,
                QueryParamID: 0,
                QueryID: 0,
                ColumnSystemName: ''
            }
        })
    });

    var listView = Mn.CollectionView.extend({

        tagName: 'ul',

        childView: Mn.View.extend({

            tagName: 'li',

            template: _.template('<input type="radio" id="id<%- id %>" class="g-form--radio" name="widgets" value="<%- id %>"><label for="id<%- id %>"><%- title %></label>'),

            triggers: {

                'click input': {
                    event: 'widget:select',
                    stopPropagation: false,
                    preventDefault: false
                }
            }
        }),

        childViewTriggers: {
            'widget:select': 'widget:select'
        }
    });

    var selectView = Mn.CollectionView.extend({

        tagName: 'select',

        childView: Mn.View.extend({

            tagName: 'option',

            getTemplate: function () {

                if (this.model.has('displayName'))
                    return _.template('<%- displayName %> (<%- systemName %>)');
                else
                    return _.template('<%- Caption %> (<%- Name %>)');
            },

            onRender: function () {

                if (this.model.has('systemName'))
                    this.$el.attr('value', this.model.get('systemName'));
                else
                    this.$el.attr('value', this.model.id);

            }
        })
    });

    var resultView = Mn.CollectionView.extend({

        tagName: 'ul',
        className: 'list-area',

        childView: Mn.View.extend({

            tagName: 'li',
            className: 'item',

            template: _.template('<%- Title %>&nbsp;<span data-icon="icon-trash"></span>'),

            triggers: {
                'click span[data-icon="icon-trash"]': 'rel:remove'
            }
        }),

        childViewTriggers: {
            'rel:remove': 'rel:remove'
        }
    });

    return Mn.View.extend({

        template: '#relations-settings-template',
        templateContext: {
            Resources: Resources
        },

        events: {

            'click span[data-icon="icon-anchor"]': function () {

                var titleWidget = this.selectWidget.get('title'),
                    paramsThisWidget = this.getChildView('params'),
                    columnsSelectWidget = this.getChildView('select');

                var m = new this.collection.model({
                    Title: titleWidget + " : " + columnsSelectWidget.$(':checked').text() + " - " + paramsThisWidget.$(':checked').text(),
                    wID: this.selectWidget.id,
                    QueryParamID: paramsThisWidget.$(':checked').val(),
                    QueryID: this.selectWidget.get('requestParameters').rid,
                    ColumnSystemName: columnsSelectWidget.$(':checked').val()
                });

                m.collection = this.collection;
                m.save({}, {

                    success: function (model) {

                        this.collection.add(model);

                        let s = this.model.get('publishersSubscriberMap') || {};

                        if (!s[model.get('wID')])
                            s[model.get('wID')] = [];

                        s[model.get('wID')].push(model.toJSON());

                        this.model.set('publishersSubscriberMap', s);

                    }.bind(this),

                    error: function () {
                        this.triggerMethod('show:message', Resources.error);
                    }.bind(this)

                });
            }
        },

        regions: {
            list: { el: '#widgets', replaceElement: true },
            params: { el: '#params', replaceElement: true },
            select: { el: '#select-param', replaceElement: true },
            result: { el: '#result', replaceElement: true }
        },

        initialize: function () {

            this.collection = new collectionParams;

        },

        onRender: function () {
           
            this.showChildView('list', new listView({ collection: new Backbone.Collection() }));
            this.showChildView('select', new selectView({ collection: new Backbone.Collection() }));
            this.showChildView('result', new resultView({ collection: this.collection }));

            this.showChildView('params', new selectView({
                collection: this.model.get('requestParameters') && this.model.get('requestParameters').parameters ?
                    new Backbone.Collection(this.model.get('requestParameters').parameters) : new Backbone.Collection()
            }));

        },

        onBeforeShow: function () {

            if (this.model.get('requestParameters') && this.model.get('requestParameters').rid) {

                if (this.hasRegion('notify')) {

                    var rs = this.getRegions();

                    _.each(rs, function (v, k) {
                        v.$el.show();
                    });

                    this.$('table').show();
                    this.removeRegion('notify');
                }

                if (!this.getChildView('params').collection.length)
                    this.getChildView('params').collection.reset(this.model.get('requestParameters').parameters);

                var mid = this.model.id,

                   models = this.model.collection ? this.model.collection.filter(function (a) {
                       if (a.get('feed') && mid !== a.id) return a;
                   }) : [];

                this.getChildView('list').collection.reset(models);

                var pm = this.model.get('publishersSubscriberMap'),
                   listWidgets = this.getChildView('list').collection,
                   paramsThisWidget = this.getChildView('params').collection,
                   columnsSelectWidget = this.getChildView('select').collection;

                _.each(pm, function (v, k) {

                    var w = this.model.collection.get(k);

                    if (!w) return;

                    var titleWidget = w.get('title'),
                        columnsWidget = w.has('feed') ?
                        w.get('feed').head ? w.get('feed').head : [{ systemName: 'argId', displayName: 'argId' }, { systemName: 'fnId', displayName: 'fnId' }] : [];

                    _.each(v, function (o) {

                        var parModel = paramsThisWidget.get(o.QueryParamID),
                            column = _.findWhere(columnsWidget, { systemName: o.ColumnSystemName }),
                            titleParam = `${parModel.get('Caption')} ( ${parModel.get('Name')} )`,
                            titleColumn = column ? `${column.displayName} ( ${column.systemName} )` : '';

                        o.Title = titleWidget + " : " + titleColumn + " - " + titleParam;
                        o.wID = k;

                        var model = new this.collection.model(o);
                        model.url = `/api/widget/${this.model.id}/qparammaps/${k}/${o.QueryParamsMapID}`;

                        this.collection.add(model);

                    }, this);

                }, this);

            } else {

                rs = this.getRegions();

                _.each(rs, function (v, k) {
                    v.$el.hide();
                });

                this.$('table').hide();

                this.addRegion('notify', '.notify');

                var notify = Mn.View.extend({
                    template: _.template(Resources.rsw3)
                });

                this.showChildView('notify', new notify);
            }
        },

        collectionEvents: {

            update: function (c, o) {

                if (o.changes.removed.length) {

                    const d = o.changes.removed[0];

                    let data = this.model.get('publishersSubscriberMap');

                    const p = data[d.get('wID')].filter(function (a) { return a.QueryParamsMapID !== d.get('QueryParamsMapID') });

                    data[d.get('wID')] = p;

                    this.model.set('publishersSubscriberMap', data);
                }
                
            },

            request: function () {

            },

            reset: function () {

                this.getChildView('result').collection.reset(this.collection.models);
            }
        },

        childViewEvents: {

            'rel:remove': function (v) {

                this.triggerMethod('show:message:confirm', {
                    text: Resources.sure,
                    fx: function () {
                        v.model.destroy();
                    }
                });

            },

            'widget:select': function (v) {

                this.selectWidget = v.model;

                var o = this.selectWidget.get('feed').head || [{ systemName: 'argId', displayName: 'argId' }, { systemName: 'fnId', displayName: 'fnId' }];

                if (o) {

                    this.getChildView('select').collection.reset(o);

                    this.collection.url = `/api/widget/${this.model.id}/qparammaps/${this.selectWidget.id}`;
                    //this.collection.fetch({ reset: true });
                } else
                    this.getChildView('select').collection.reset();

            }
        }
    });

});