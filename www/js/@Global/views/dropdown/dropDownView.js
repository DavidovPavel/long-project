define('global.view.dropDown', ['i18n!nls/resources.min'], function (Resources) {

    /*
        this.options.placeholder - current always

    */

    var dropDownItemView = Mn.View.extend({

        className: 'item',

        template: _.template('<%- title %><div class="manage"></div>'),

        triggers: {
            'click': 'click:item',
            'click .manage span': 'click:cmd'
        },

        onRender: function () {

            if (this.model.has('icon'))
                this.$el.attr('data-icon', this.model.get('icon'));
            else
                this.$el.attr('data-icon', 'icon-blank');

            if (this.model.has('cmd')) {
                this.$el.attr('tools', this.model.get('cmd').length);
                _.each(this.model.get('cmd'), function (c) {
                    this.$('.manage').append('<span class="' + c + '"></span>');
                }, this);
            }
        }
    });

    var dropDownItemsView = Mn.CollectionView.extend({

        className: 'g-dropdown--container',

        childView: dropDownItemView,

        events: {

            "mouseenter": function () {
                this.$el.clearQueue();
            },

            "mouseleave": function () {

                this.$el.delay(1000).slideUp(150, function () {
                    this.triggerMethod('container:mouseleave');
                }.bind(this));
            }
        },

        childViewTriggers: {
            'click:cmd': 'click:cmd',
            'click:item': 'click:item'
        }
    });

    return Mn.View.extend({

        className: 'g-dropdown--menu',

        template: _.template('<div class="g-dropdown--placeholder"></div><div class="g-dropdown--container"></div>'),

        ui: {
            placeholder: '.g-dropdown--placeholder'
        },

        regions: {

            container: {
                el: '.g-dropdown--container', replaceElement: true
            },

            current: '@ui.placeholder'
        },

        initialize: function () {

            this.current = new Backbone.Model();

        },

        collectionEvents: {

            update: function () {

                if (!this.collection.length)
                    this.showChildView('current', new dropDownItemView({ model: new Backbone.Model({ title: '...', id: null }) }));
                else {
                    var v = new dropDownItemView({ model: this.collection.at(0) });
                    this.showChildView('current', v);
                    this.setCurrent(v);
                }
            }
        },

        onRender: function () {

            if (this.options.hasOwnProperty('addClass'))
                this.$el.addClass(this.options.addClass);

            this.showChildView('container', new dropDownItemsView({ collection: this.collection }));

            if (this.options.placeholder) {

                this.ui.placeholder.html(this.options.placeholder);

            } else {

                if (this.collection && this.collection.length) {

                    var v = new dropDownItemView({ model: this.collection.at(0) });
                    this.showChildView('current', v);
                    //this.setCurrent(v);

                } else
                    this.showChildView('current', new dropDownItemView({ model: new Backbone.Model({ title: '...', id: null }) }));

            }

        },

        onAttach: function () {

            if (this.collection && this.collection.length)
                this.setCurrent(this.options.current);

        },

        events: {
            "click .g-dropdown--placeholder": 'expand'
        },

        childViewTriggers: {
            'click:cmd': 'dropdown:click:cmd'
        },

        childViewEvents: {

            'container:mouseleave': function () {
                this.$('.g-dropdown--placeholder').removeClass('expanded');
            },

            'click:item': function (view) {

                if (view.model.id !== this.current.id) {

                    // функция в модели
                    if (view.model.has('fn'))
                        view.model.get('fn').call();

                    this.setCurrent(view);

                    if (this.getChildView('container'))
                        this.getChildView('container').$el.slideUp(150, function () {
                            this.$('.g-dropdown--placeholder').removeClass('expanded');
                        }.bind(this));

                } else
                    this.expand();

            }
        },

        expand: function () {

            if (this.collection.length && !this.$el.hasClass("disabled"))
                this.$('.g-dropdown--placeholder').toggleClass('expanded').next('.g-dropdown--container').clearQueue().slideToggle(150);

        },

        setCurrent: function (v) {

            if (v === undefined) return this;

            var container = this.getChildView('container'),
                cv = this.getChildView('current');

            if (container) {

                container.children.each(function (a) { a.$el.removeClass('selected'); });

                if (typeof v !== "object") {       // by id item
                    var m = container.collection.get(v);
                    if (m)
                        v = container.children.findByModel(m);
                    else
                        return this;
                }
            }

            if (!this.options.placeholder) {

                this.current = v.model;
                v.$el.addClass('selected');

                if (cv.model.id !== v.model.id) {
                    cv.model = v.model;
                    cv.render();
                }

            }

            this.triggerMethod("dropdown:select", v.model, this.options.name);

            //this.triggerMethod("dropdown:select", v);

            return this;
        }
    });
});
