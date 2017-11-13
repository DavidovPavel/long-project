define('@widget.WidgetRunning', [], function () {

    return Mn.CollectionView.extend({

        className: 'RunningText',

        childView: Mn.View.extend({

            tagName: 'span',

            getTemplate: function () {
                return _.template(this.options.templ);
            },

            triggers: {
                'click': 'table:row:handler'
            }
        }),

        childViewOptions: function () {
            return {
                templ: this.templ
            };
        },

        initialize: function () {

            this.templ = '';

            var columns = this.model.get('ColumnCustomizations');
            if (columns)
            	_.chain(columns)
					.filter(function (e) { return e.ColumnIsVisible; })
					.sortBy(function (e) { return e.SerialNum })
					.map(function (e) {

						this.templ += (`&nbsp;<%= ${e.ColumnSystemName.toLowerCase()} %>&nbsp;`);

					}, this);

            else
            	_.chain(this.model.get('feed').head)
					.filter(function (o) { return o.isVisible; })
					.map(function (e) {

						this.templ += `&nbsp;<%= ${e.systemName} %>&nbsp;`;

					}, this);

            this.templ += '&nbsp;&nbsp;***&nbsp;&nbsp;';
        },

        onAttach: function () {

        	let p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: "WidgetRunDirection" }),
				direction = p ? p.WidgetParamValue.Right ? 'right' : 'left' : 'left';

        	this.$el.liMarquee({
        		direction: direction
        	});

        },

        childViewEvents: {

            'table:row:handler': function ( v ) {

                this.model.trigger( 'click:item', v.model );

            }
        }

    })

})