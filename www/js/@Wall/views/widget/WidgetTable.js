define('@widget.WidgetTable', ['i18n!nls/resources.min', 'widgetTableCard', 'widgetTableGrid'], function (Resources, cardView, gridView) {

    return Mn.View.extend({

        template: _.template('<div></div>'),

        regions: {
            wrap: { el: 'div', replaceElement: true }
        },

        onRender: function () {

            var v = this.model.get('Visualization') || 'table';

            switch (v) {

                case 'table':
                    this.showChildView('wrap', new gridView({
                        model: this.model,
                        collection: this.collection
                    }));
                    break;

                case 'card':
                case 'card2':
                    this.showChildView('wrap', new cardView({
                        model: this.model,
                        collection: this.collection
                    }));
                    break;
            }

        },

        modelEvents: {

            'change:Visualization': function () {

                this.render();
            }

        },

        childViewTriggers: {
        	'table:add:rubrics:filter': 'table:add:rubrics:filter',
			'scroll:grid':'scroll:grid'
        }

    });

});