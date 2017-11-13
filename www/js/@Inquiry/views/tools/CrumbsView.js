define('tools:crumbs', ['baseurl', 'i18n!nls/resources.min'], function (baseurl, Resources) {

    var crumbsChannel = Mn.Object.extend({
        channelName: 'crumbs'
    });

    new crumbsChannel;

    var channel = Backbone.Radio.channel('crumbs');

    var crumbModel = Backbone.Model.extend({

        idAttribute: 'path',

        defaults: {
            title: '',
            path: null
        }

    });

    return Mn.CollectionView.extend({

        tagName: 'ul',

        childView: Mn.View.extend( {

            tagName: 'li',
            template: _.template( '<span><%- title %></span>' ),

            triggers: {
                'click': 'click:item'
            },

            modelEvents: {

                'change': function () {
                    this.render();
                }

            }

        }),

        initialize: function () {

            this.collection = new Backbone.Collection([], { model: crumbModel });
            //this.collection.comparator = function (m) { return m.id; };

            channel.reply('add:new:crumb', function (a, o) {
                this.collection.set(a, o);
            }.bind(this));

            channel.reply('add:crumb', function (a) {
                this.collection.add(a);
            }.bind(this));

            channel.reply('reset:crumb', function (a) {
                this.collection.reset(a);
            }.bind(this));


        },

        onChildviewClickItem: function (v) {

            //this.collection.remove(this.collection.filter(function (m) { return m.id > v.model.id; }));

            //var path = _.compact(this.collection.map(function (m) { return m.has('path') ? m.get('path') : ''; })).join('/') + '/';

            Backbone.history.navigate(v.model.get('path'), { trigger: true });

        }
       
    });

});