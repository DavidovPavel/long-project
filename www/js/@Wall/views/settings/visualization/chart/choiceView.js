define('settings.visualisation.chart.choice',
	[
		'i18n!nls/resources.min',
		'sendModel',
		'ejChartView',
		'chartsRepository'
	],
function (Resources, sendModel, ejChartView, repository) {

	var listView = Mn.CollectionView.extend({

		className: 'graph-panel-grid',

		childView: ejChartView,

		childViewOptions: function (m) {
			m.set({ width: '300', height: '300' });
		},

		childViewEvents: {

			'chart:selected': function (v) {

				this.children.each(function (c) {
					c.$el.removeClass('selected');
				});

				v.$el.addClass('selected');

				this.trigger('chart:selected', v);
			}
		}

	});


	return Mn.View.extend({

		className: 'graph-panel show',

		template: '#choice-chart-template',

		templateContext: {
			Resources: Resources
		},

		regions: {
			wrap: { el: 'div.graph-panel-grid', replaceElement: true }
		},

		onRender: function () {

			var pa = this.model.get('requestParameters');

			this.sendModel = new sendModel({
				id: pa.rid,
				pars: pa.parameters,
				useDefParams: pa.useDefParams,
				widget: {
					uid: this.model.id,
					name: this.model.get('title'),
					type: this.model.get('typeName'),
					Visualization: this.model.get('Visualization')
				},
			});

			if (this.options.ruleCode)
				this.sendModel.set('ruleCode', this.options.ruleCode);

			Backbone.Radio.channel('loader').trigger('show', this.$el);

			this.sendModel.fetch({
				success: this._successLoad.bind(this)
			});

		},

		_successLoad: function (m) {

			var data = m.get('data').variations,
                charts = new Backbone.Collection;

			_.each(data, function (o) {

				var family = o.family;

				_.chain(repository)
                    .filter(function (a) { return a.family === family; })
                    .each(function (b) {

                    	charts.add(new Backbone.Model(_.extend(b, o)));

                    });

			}, this);

			this.showChildView('wrap', new listView({ collection: charts }));

			Backbone.Radio.channel('loader').trigger('hide');
		},

		childViewEvents: {

			'chart:selected': function (v) {

				var rp = this.model.get('requestParameters');
				rp.ruleCode = v.model.get('ruleCode');

				this.model.set({ Visualization: v.model.get('type') });

				this.trigger('chart:selected', v);

			}
		}

	});

});