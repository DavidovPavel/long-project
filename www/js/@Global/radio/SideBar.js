define('global.radio.sideBar', [], function () {

    var sideBarModel = Backbone.Model.extend({

        defaults: {
            view: null,
            nameView: '',
            title: ''
        }

    });

    var menuView = Mn.CollectionView.extend({

        tagName: 'ul',

        childView: Mn.View.extend({

            tagName:'li',
            template: _.template('<span class="<%- icon %>" title="<%- title %>"><%- title %></span>'),

            triggers: {
                'click':'menu:item'
            }
        }),

        childViewTriggers: {
            'menu:item': 'menu:item'
        }
    });

    var sidebarView = Mn.View.extend({

        el: '.sidebar',

        template: false,

        ui: {
            title: '.current-title',
            name: '.title'
        },

        regions: {
            list: { el: '.list', replaceElement: true }
        },

        events: {

            'click .control': function () {
                
                this.$el.toggleClass('expanded', function (e) {

                    this.isHide = !$(e).hasClass('expanded');

                }.bind(this));
            }
        },

        initialize: function () {

            this.model = new sideBarModel;
            this.collection = new Backbone.Collection;

        },

        modelEvents: {

            change: function (m) {

                //if (this.model.has('view')) {
                //    if (view.model.id !== this.view.model.id && !this.isHide)
                //        this.$el.addClass('expanded');
                //} else
                //    this.$el.addClass('expanded');


                this.ui.name.text(this.model.get('title'));

                this.ui.title.text(this.model.get('nameView'));

            }

        },

        childViewEvents: {

            'menu:item': function (v) {

                if (this.model.has('view')) 
                    this.model.get('view').sideBarTrigger(v.model);

            }
        },
        
        collectionEvents: {

            reset: function () {                

            }

        },

        onRender: function () {

            this.showChildView('list', new menuView({ collection: this.collection }));

        }

        //reset: function () {

        //    this.$el.removeClass('expanded');

        //    this.ui.title.text('');
        //    this.ui.name.text('');

        //    if (this.view) {
        //        if (this.view['hide'])
        //            this.view.hide();
        //        this.view = undefined;
        //    }

        //    if (this.getRegion('list').hasView())
        //        this.getChildView('list').collection.reset();

        //    return this;
        //}
    });

    var sideBar = undefined;

    var channel = Mn.Object.extend({
        channelName: 'sidebar',

        radioRequests: {

            open: function (o, items /*title, collection, view, name*/) {

                sideBar.model.set(o);
                sideBar.collection.reset(items);

                return sideBar;
            }
        },


        radioEvents: {

            show: function () {

                if (!sideBar)
                    sideBar = new sidebarView().render();

                //sideBar.$el.removeClass('expanded');
                sideBar.$el.show();

            },

            reset: function () {

                sideBar.model.set(sideBar.model.defaults);
                sideBar.collection.reset();
            },                       

            hide: function () {

                if (!sideBar)
                    sideBar = new sidebarView().render();

                sideBar.$el.hide();
            },

            close: function () {

                sideBar.$el.removeClass('expanded');
            }
        }

    });

    new channel;

});