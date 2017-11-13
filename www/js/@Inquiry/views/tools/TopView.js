define('tools:top', ['i18n!nls/resources.min'], function (Resources) {

    var toolsChannel = Mn.Object.extend({
        channelName: 'tools'
    });

    new toolsChannel;

    var channel = Backbone.Radio.channel('tools');

    return Mn.CollectionView.extend({

        tagName: 'ul',

        initialize: function () {

            this.collection = new Backbone.Collection();

            channel.reply('get:tools', function () {
                return this;
            }.bind(this));

        },

        childView: Mn.View.extend({

            tagName: 'li',

            getTemplate: function () {

                if (this.model.has('isView'))
                    return _.template('<span></span>');
                else if(this.model.has('template'))
                    return _.template(this.model.get('template'));
                else
                    return _.template('<span toolbar-icon="<%- className %>"><i><%- title %></i></span>');

            },

            templateContext: {
                Resources:Resources
            },

            triggers:{
                'click span:not(.disabled)':'tools:click:item'
            },

            modelEvents: {

                change: function () {
                    this.render();
                }
            },

            onToolsClickItem: function(o) {

                Backbone.Radio.channel('tools').request('tools:click:item', o);

            },

            onRender: function () {

                if (this.model.has('disabled') && this.model.get('disabled')) {

                    this.$el.attr('disabled', true);
                    this.$el.addClass('disabled');

                } else {

                    this.$el.attr('disabled', false);
                    this.$el.removeClass('disabled');

                }

                if (this.model.get('side') === "right")
                    this.$el.addClass('right');

                if (this.model.has('tooltip')) {

                    this.$('i').attr('tooltip', this.model.get('tooltip').title);
                    this.$('i').attr('flow', this.model.get('tooltip').flow);

                }

                if (this.model.get('view')) {

                    let v = this.model.get('view');

                    this.addRegion('vv', { el: 'span', replaceElement: true })
                        .show(new v(this.model.get('options')));

                }

            },

            childViewEvents: {

                'dropdown:select': function (m, name) {

                    this.triggerMethod('tools:click:item', this);

                }           

            }
        }),

        childViewTriggers: {
            'tools:click:item': 'tools:click:item'
        }
    });

});