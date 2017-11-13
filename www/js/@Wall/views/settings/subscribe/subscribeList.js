
define('settings.subscribeList', ['i18n!nls/resources.min'], function (Resources) {   

    // см. также widget.widgetView include
    var include = ["WidgetTable", "WidgetMap", "WidgetGraph", "WidgetRunning", "WidgetHtml", 'WidgetCloud', 'WidgetSemNet'];

    return Mn.CollectionView.extend({

        className: "list-area",

        emptyView: Mn.View.extend({

            template: _.template('<i style="color:red;font-style:italic;"><%- Resources.subsnotfound %></i>'),
            templateContext: { Resources: Resources }

        }),

        childView: Mn.View.extend({

            className: 'item',

            template: _.template("<input type='checkbox' class='g-form--checkbox' id='<%- id %>' name='<%- id %>' /><label for='<%- id %>'><%= title %>&nbsp;(<%= typeName %>)</label>"),

            triggers: {
                "click": 'click:item'
            },

            onBeforeRender: function () {

                if (include.indexOf(this.model.get("typeName")) === -1)
                    this.$el.hide();
            }

        }),

        isEmpty: function () {

            if (this.collection)
                return !this.collection.filter(function (m) {

                    return include.indexOf(m.get("typeName")) !== -1;

                }).length;

            else
                return true;
        },

        childViewTriggers: {
            'click:item': 'click:item:subscribe'
        }

    });
});