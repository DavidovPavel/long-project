
define('c/ContextMenuView', [], function () {

    var itemsView = Mn.CollectionView.extend({

        childView: Mn.View.extend({

            template: _.template('<%- title %><div class="_container"></div>'),

            className: 'item',

            regions: {
                container: { el: '._container', replaceElement: true }
            },

            events: {

                'mouseover': function (e) {
                    if (this.model.get('child') && this.model.get('child').length) {
                        var $c = this.$('.g-context--container');
                        if ($(window).width() - $c.offset().left < $c.width())
                            this.$('.g-context--container').addClass('revert');
                    }
                }
            },

            triggers: {
                'click': 'click:item'
            },

            onRender: function () {

                if (this.model.get('icon'))
                    this.$el.attr('data-icon', 'icon-' + this.model.get('icon'));

                if (this.model.get('status'))
                    this.$el.addClass(this.model.get('status'));

                if (this.model.get('cmd')) {

                    if (typeof this.model.get('cmd') === 'string')
                        this.$el.attr('data-cmd', this.model.get('cmd'));

                    if (typeof this.model.get('cmd') === 'function')
                        this.cmd = this.model.get('cmd');
                }

                if (this.model.get('child')) {
                    this.$el.addClass('haskids');
                    this.showChildView('container', new itemsView({ collection: new Backbone.Collection(this.model.get('child')) }));
                } else
                    this.$('._container').remove();
            },

            childViewTriggers: {
                'click:item': 'click:item'
            }
        }),

        className: 'g-context--container',

        childViewTriggers: {
            'click:item': 'click:item'
        }
    });

    return Mn.View.extend({

        className: 'g-context--menu',
        template: _.template('<div class="g-context--container"></div>'),

        regions: {
            container: {
                el: '.g-context--container',
                replaceElement: true
            }
        },

        onRender: function () {
            this.showChildView('container', new itemsView({ collection: this.collection }));
        },

        childViewTriggers: {
            'click:item': 'menu:click:item'
        }
    });
});