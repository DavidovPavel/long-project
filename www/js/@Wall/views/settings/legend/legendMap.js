
define('settings.legendMap', ['i18n!nls/resources.min', 'global.behaviors.input'], function (Resources, inputBehavior) {
    
    var legendItem = Backbone.Model.extend({
        idAttribute: "LegendItemUID",
        defaults: {
            LegendItemUID: null,
            MarkerColor: "",
            MarkerDescription: "",
            MarkerUrl: ""
        }
    });

    var legendModel = Backbone.Model.extend({
        defaults: {
            id: null,
            Title: '',
            LegendIsVisible: false,
            LegendPosition: '',
            WidgetsLegendItems: []
        }
    });

    var listView = Mn.CollectionView.extend({

        tagName: 'table',
        className: 'items-legend-settings',

        childView: Mn.View.extend({

            tagName: 'tr',
            template: '#legend-item-template',
            templateContext:{Resources:Resources},

            ui:{
                name: 'input[name=MarkerDescription]'
            },

            events: {

                'blur @ui.name': function () {

                    if ($.trim(this.ui.name.val()))
                        this.model.set('MarkerDescription', this.ui.name.val());
                },

                'click button[data-icon="icon-trash"]': function () {

                    Backbone.trigger('message:confirm', {
                        title: Resources.askyousure,
                        fx: function () {
                            this.model.destroy();
                        },
                        ctx: this
                    });
                }
            }
        }),

        collectionEvents: {

            update: function (c, o) {
                if (o.changes.removed.length)
                    this.triggerMethod('reset:default', o.changes.removed[0]);
            }
        }
    });

    var mainView = Mn.View.extend({

        behaviors: {
            input: inputBehavior
        },

        template: '#legend-settings-template',
        templateContext:{
            Resources:Resources
        },

        ui: {
            title: 'input[name=Title]',
            position: '.RbtnSet input',
            show: 'input[name=LegendIsVisible]'
        },

        events: {

            'blur @ui.title': function () {
                this.model.set('Title', this.ui.title.val());
            },

            'click @ui.position': function () {
                this.model.set('LegendPosition', this.ui.position.filter(':checked').val());
            },

            'click @ui.show': function () {
                this.model.set('LegendIsVisible', this.ui.show.prop('checked'));
            }

        },

        modelEvents: {

            invalid: function () {
                this.ui.title.addClass("Alarm");
            }
        },

        onRender: function () {

            this.ui.position.filter('[value="' + this.model.get('LegendPosition') + '"]').prop('checked', true);

        }
    });

    return Mn.View.extend({

        template: _.template('<div id="main"></div><div id="list"></div>'),

        regions:{
            main: { el: '#main', replaceElement: true },
            list: { el: '#list', replaceElement: true }
        },

        onRender: function () {

            var mainModel = new legendModel(this.model.get('Legend'));
            mainModel.set('id', this.model.id);
            mainModel.url = "/api/widget/" + this.model.id + "/legend";

            this.showChildView('main', new mainView({ model: mainModel }));

            var legendItemsCollection = new Backbone.Collection(this.model.get('WidgetsLegendItems'), { model: legendItem });
            legendItemsCollection.url = '/api/widget/' + this.model.id + '/legenditem';

            this.showChildView('list', new listView({ collection: legendItemsCollection }));

        },

        collectionEvents: {

            reset: function () {

                if (!this.model.get('Legend') || !this.model.get('Legend').WidgetsLegendItems.length)
                    this.setDefaultList();
                else
                    this.getChildView('list').collection.reset(this.model.get('Legend').WidgetsLegendItems);
            }

        },

        onChildviewResetDefault: function (m) {

            this.getChildView('list').collection.add(new legendItem({ MarkerUrl: m.get('MarkerUrl') }));

        },

        onSave: function () {

                $.ajax({
                    method: "POST",
                    contentType: 'application/json; charset=utf-8',
                    url: "/api/widget/" + this.model.id + "/legenditems",
                    data: JSON.stringify(this.getChildView('list').collection.toJSON())
                })
                .done(function (c) {

                    this.getChildView('main').model.save({ WidgetsLegendItems: this.getChildView('list').collection.toJSON() });

                    this.model.save({ 'Legend': this.getChildView('main').model.toJSON() });

                }.bind(this));
        },

        onReset: function () {

            this.getChildView('list').collection.reset();
            this.setDefaultList();

        },

        setDefaultList: function () {

            var group = this.collection.groupBy( 'markerurl' );

            _.each(group, function (o, k) {

                if (k !== 'undefined')
                    this.getChildView('list').collection.add(new legendItem({ MarkerUrl: k }));

            }, this);
        }

    });
});