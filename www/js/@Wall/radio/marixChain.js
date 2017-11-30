define('radio.matrixChain', [], function () {

	const o = Mn.Object.extend({

		channelName: 'matrixChain',

		initialize: function () {

			this.collection = new Backbone.Collection;

		},

		radioRequests: {

			'check:chain': function (m) {

				return !this.collection.get(m.id);

			}

		},

		radioEvents: {

			'start:chain': function (m) {

				this.collection.reset(m);
			},

			'add:chain': function (m) {

				this.collection.add(m);
			}

		}

	});

	return new o;

});