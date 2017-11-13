define('@FirstView',['i18n!nls/resources.min', 'baseurl'], function (Resources, baseurl) {

    var listView = Mn.CollectionView.extend({

        className: 'list',

        emptyView: Mn.View.extend({

            className: 'create',

            getTemplate: function () {

                if ( this.options.flag === 'my' )
                    return _.template( '<section><span class="font-icon font-icon-add"></span><span><%- Resources.addVitrin %></span></section>' );
                else
                    return _.template( '' );
            },

            templateContext: {
                Resources: Resources
            },

            events: {

                'click': function () {
                    Backbone.history.navigate(v.model.id || 'new', { trigger: true });
                }

            }

        }),

        childView: Mn.View.extend({

            template: '#first-item-template',
            templateContext: {
                baseurl: baseurl
            },

            triggers: {
                //'touchend': 'click:item',
                'click': 'click:item'
            },

            events: {

                'click i.remove': function (e) {

                    e.stopPropagation();

                    Backbone.trigger("message:confirm", {
                        title: Resources.askyousure, message: $.Format(Resources.deltext, Resources.todashboard, this.model.get("title")),
                        fx: function () {
                            this.model.destroy();
                        },
                        ctx: this
                    });
                }

            },

            modelEvents: {

                'change:Screen': function (m, v) {
                    this.render();
                }
            }
        }),

        childViewTriggers: {
            'click:item': 'click:item'
        },

        childViewOptions: function () {
            return { flag: this.options.flag };
        },

        filter: function (m) {
            return this.options.flag === 'my' ? !m.get('IsShared') : m.get('IsShared');
        },

        onRenderChildren: function () {

            if ( this.options.flag === 'my' ) {

                var addView = Mn.View.extend( {
                    className: 'create',
                    template: _.template( '<section><span class="font-icon font-icon-add"></span><span><%- Resources.addVitrin %></span></section>' ),
                    templateContext: {
                        Resources: Resources
                    }
                } );

                this.addChildView( new addView( { model: new Backbone.Model( { id: 'create' } ) } ), 0 );

            } else
                this.$( 'i.remove' ).hide();
            
        },

        onRender: function () {

            this.$el.sortable({

                placeholder: "placeholder-class",
                items: "div:not(.create)",
                stop: function (e, ui) {

                    //console.log('sort:stop', args, this);

                }.bind(this)

            }).disableSelection();
        }

    });

    return Mn.View.extend({

        template: '#first-page-template',
        templateContext: {
            Resources: Resources
        },

        ui: {
            title: 'h1'
        },

        regions: {
            list: { el: '.list', replaceElement: true },
        },

        events: {

            'touchstart button': 'tabNav',
            'click button': 'tabNav',

            'click .create': function () {
                Backbone.history.navigate('new', { trigger: true });
            }

        },

        tabNav: function (e) {

            var link = $(e.target).closest('button').attr('data-link');
            Backbone.history.navigate(link === 'shared' ? 'demo' : '', { trigger: true });

        },

        onBeforeRender: function () {
            this.$el.attr('id', 'first-page');
        },

        onRender: function () {

            this.showChildView('list', new listView({ collection: this.collection, flag: this.options.filter }));

            var res = {
                my: Resources.myDashboard,
                shared: Resources.shareDashboard
            };

            this.$("button[data-link='"+ this.options.filter +"']").addClass("pressed");

            this.ui.title.text(res[this.options.filter]);

        },

        onChildviewClickItem: function (v) {
            
            Backbone.history.navigate(v.model.id || 'new', { trigger: true });
        }

    })

});