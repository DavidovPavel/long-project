'use strict';
define(['app'],function (App) {
    
    var optionView = Mn.View.extend({
        tagName:'option',
        template: _.template('<%- Title %>'),
        onRender: function () {
            this.$el.attr("value", this.model.id);
        }
    });

    var optionsView = Mn.CollectionView.extend({
        childView: optionView,
    });

    return Mn.CollectionView.extend({
        tagName: 'select',
        className: 'form-control',
        childView: optionView,
        collectionEvents:{
            reset: function (c) {
                if (!this.flag) {
                    this.flag = true;
                    var data = App.prepare(c.at(0).get("items"), null, true);
                    data.unshift({ ID: '0', Title: '...' });
                    this.collection.reset(data);
                }
            }
        }
    });
});