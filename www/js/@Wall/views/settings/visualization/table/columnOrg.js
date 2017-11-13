define('settings.visualisation.table.column', ['i18n!nls/resources.min'], function (Resources) {

    var columnsCollection = Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: "ColumnSystemName",
            defaults: {
                QueryCustomizationUID: null,
                QueryID: 0,
                ColumnSystemName: null,
                ColumnTitle: "",
                ColumnWidth: null,
                ColumnIsVisible: true,
                SerialNum: ''
            }
        })
    });

    return Mn.CollectionView.extend({

        className: 'list-area',

        events: {

            'click': function (e) {
                e.stopPropagation();
            }
        },

        childView: Mn.View.extend({

            className: 'row',
            template: '#column-settings-template',
            templateContext: {
                Resources: Resources
            },

            onRender: function () {
                this.$el.attr('id', this.model.id);
            }

        }),

        childViewOptions: function (m) {

            m.set({
                QueryID: this.model.get("requestParameters").rid,
                prefix: this.model.id
            });

        },

        initialize: function (o) {

            this.collection = new columnsCollection;
            this.collection.comparator = "SerialNum";

        },

        onBeforeRender: function () {

            var items = this.model.has('feed') ? this.model.get('feed').head : [],
                    rid = this.model.get("requestParameters") ? this.model.get("requestParameters").rid : null,
                    custom = this.model.get("ColumnCustomizations");

            var columns = _.map(items, function (e, i) {

                var ci = {};
                if (custom) {
                    ci = _.findWhere(custom, { ColumnSystemName: e.systemName }) || {};
                }

                return new this.collection.model({
                    QueryCustomizationUID: ci.QueryCustomizationUID || null,
                    QueryID: rid,
                    ColumnSystemName: e.systemName,
                    ColumnTitle: ci.ColumnTitle || e.displayName,
                    ColumnIsVisible: ci.ColumnIsVisible === undefined ? e.isVisible : ci.ColumnIsVisible,
                    SerialNum: ci.SerialNum || i,
                    ColumnWidth: ci.ColumnWidth || ''
                });

            }, this);

            this.collection.set(columns);

        },

        onAddChild: function () {

            this.$el.sortable({
                items: '.row',
                axis: "y",
                stop: function (e, ui) {

                    this.$(".row").each(function (i, e) {

                        var $e = $(e),
                            m = this.collection.get($e.attr('id'));

                        m.set("SerialNum", $e.index());
                        $e.find('input[name=SerialNum]').val($e.index());

                    }.bind(this));
                }.bind(this)

            });
        },

        onSave: function (callback) {

            var data = [];
            this.$('.row').each(function () {
                data.push($.GetData($(this)));
            });

            $.ajax({

                method: "POST",
                contentType: 'application/json; charset=utf-8',
                url: "/api/widget/" + this.model.get("requestParameters").rid + "/colscustomization",
                data: JSON.stringify(data)

            }).done(function (c) {

                callback.call(this, c);

            }.bind(this));

        },

        onReset: function (callback) {

            this.collection.reset();

            $.get("/api/widget/" + this.model.get("requestParameters").rid + "/colscustomization/flush")
                .done(function (c) {

                    callback.call(this);

                }.bind(this));
        }

    });
});