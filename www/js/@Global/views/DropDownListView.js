
define('c/DropDownListView', [], function () {

    /*
        Выпадающий список,
        содержит заголовок и меню,
        отсутствует возможность выбора элемента,
        клик по пункту меню приводит к выполнению заложенного функционала,
        TODO: слить в DropDownView
    */

    var dropDownListTemplate = '<svg class="svg-icon"><use xlink:href="#<%- icon %>" /></svg><span><%- title %></span>&nbsp;&nbsp;<span class="dropmenu-arrow"></span><div class="drop-down-list"></div>';

    var dropDownListItem = Mn.View.extend({
        className: 'item',
        template: _.template('<svg class="svg-icon"><use xlink:href="#<%- icon %>" /></svg><%- title %>'),
        triggers: {
            'click': 'click:item'
        }
    });

    var dropDownListContainer = Mn.CollectionView.extend({
        className: 'dropdown-menu list-area',
        childView: dropDownListItem
    });

    return Mn.View.extend({

        template: _.template(dropDownListTemplate),

        events: {

            "mouseenter": function (e) {
                this.getChildView('list').$el.clearQueue().slideDown();
            },

            "mouseleave": function () { this.getChildView('list').$el.delay(500).slideUp(); }
        },

        onChildviewClickItem: function (v) {
            v.model.get('cmd').call();
            this.getChildView('list').$el.delay(500).slideUp();
        },

        regions: {
            list: '.drop-down-list'
        },

        onRender: function () {
            this.showChildView('list', new dropDownListContainer({ collection: this.collection }));
        }

    });
});
