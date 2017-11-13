define('dossier', ['i18n!nls/resources.min', 'bdid'], function (Resources, db) {

    var articlesView = Mn.CollectionView.extend({

        className: 'articles',

        childView: Mn.View.extend( {

            tagName: 'article',
            template: _.template( '<div class="dosier--article-title"><%- Title %></div><div class="dosier--article-content"><%= Content %></div>' )            

        })
    });

    var sectionView = Mn.View.extend({

        tagName: 'section',
        template: _.template( '<div class="section-title hide-expand" id="<%- level %>_<%- num %>"><%- Title %> <% if(level>1){ %>(<span class="count-articles"><%- countArticles %></span>)<% } %></div><div id="articles"></div><div id="sections"></div>'),

        ui: {
            arr: 'div.section-title',
            ca: '.count-articles'
        },

        triggers: {
            'click @ui.arr': 'click:item:main'
        },

        regions: {
            articles: { el: '#articles', replaceElement: true },
            sections: { el: '#sections', replaceElement: true }
        },

        onBeforeRender: function () {
            this.model.set('countArticles', this.model.get('Articles').length);
        },

        onRender: function () {

            var articles = this.model.get('Articles');

            this.showChildView('articles', new articlesView({ collection: new Backbone.Collection(articles) }));
            this.showChildView('sections', new sectionsView({ collection: new Backbone.Collection(this.model.get('Sections')), level: this.model.get('level') + 1 }));

            if ( articles.length ) {
                this.triggerMethod( 'update:count:article', articles.length );
                this.$( '.section-title' ).removeClass( 'hide-expand' );
            }

        },

        childViewTriggers: {
            'click:item:main': 'click:item:main'
        },

        onChildviewUpdateCountArticle: function ( count ) {

            this.model.set( 'countArticles', this.model.get( 'countArticles' ) + count );

        },

        modelEvents: {

            'change:countArticles': function ( m, c ) {

                if ( this.isRendered() ) {
                    this.ui.ca.text( c );

                    if ( c )
                        this.$( '.section-title' ).removeClass( 'hide-expand' );

                }

            }

        }

    });

    var num = 0;
    var sectionsView = Mn.CollectionView.extend({

        className: 'sections',

        childView: sectionView,

        childViewOptions: function(m) {
            m.set({ 'level': this.options.level, num: num++ });
        },

        onRender: function () {
            this.$el.addClass('level_' + this.options.level);
        },

        childViewTriggers: {
            'click:item:main': 'click:item:main',
            'update:count:article': 'update:count:article'
        }

    });

    var num2 = 0;
    var itemSideView = Mn.View.extend({

        tagName: 'li',
        template: _.template('<span><%- Title %></span><input type="checkbox" id="nav-<%- level %>-<%- num %>"><label for="nav-<%- level %>-<%- num %>"></label><ul></ul>'),

        ui:{
            arr: 'input'
        },

        regions: {
            ul: { replaceElement: true, el: 'ul' }
        },

        triggers: {
            'click': 'click:item:side'
        },

        onRender: function () {
            this.showChildView('ul', new sideView({ collection: new Backbone.Collection(this.model.get('Sections')), level: this.model.get('level') + 1 }));
        },

        childViewTriggers: {
            'click:item:side': 'click:item:side'
        }

    });

    var sideView = Mn.CollectionView.extend({

        tagName: 'ul',

        childView: itemSideView,

        childViewOptions: function (m) {
            m.set({ 'level': this.options.level, num: num2++ });
        },

        onRender: function () {
            this.$el.addClass('nav-level-' + this.options.level);
        },

        childViewTriggers: {
            'click:item:side': 'click:item:side'
        }

    });

    return Mn.View.extend({

        className: 'g-dosier hls',
        template: _.template('<div id="style"></div><aside class="g-dosier--sidebar"></aside><div class="g-dosier-wrapper"><div class="g-dosier--header"></div><main></main><div class="g-dosier--footer"></div><div id="script"></div></div>'),

        regions: {
            main: { el: 'main', replaceElement: true },
            side: 'aside'
        },

        onRender: function () {

            const tools = [
                { id: '_toggle', className: 'legend', title: '' },
                { id: '_xml_exp', className: 'export', title: Resources.export + ' XML', disabled: true }
            ];

            this.triggerMethod('render:tools', tools);

            Backbone.trigger("message:modal", { title: Resources.wait2, message:'' });

            $.get(`/api/WReports/${this.model.id}`).done(function (data) {

                Backbone.trigger("message:hide");

                var js = $(data).filter('script').html();

                var $el = $(data);
                //this.$('#style').html($el.filter('style'));
                this.$('#script').html($el.filter('script'));

                this.$('.g-dosier--header').html($(wreportData.Header));

                var c = new Backbone.Collection(wreportData.Sections);

                this.showChildView('side', new sideView({ collection: c, level: 1 }));                
                this.showChildView('main', new sectionsView({ collection: c, level: 1 }));                

                this.$('.g-dosier--footer').html($(wreportData.Footer));

                var b = Backbone.Radio.channel('tools').request('get:tools').collection.get('_xml_exp');
                b.set('disabled', false);

                setTimeout( this._pdf_exp_url.bind( this ), 1000 );

            }.bind(this));

        },

        childViewEvents: {

            'click:item:main': function (v) {

                if ( v.model.get('countArticles') ) {

                    v.ui.arr.parent( 'section' ).toggleClass( 'expanded' );

                    this.getChildView( 'side' ).$( '#nav-' + v.model.get( 'level' ) + '-' + v.model.get( 'num' ) ).prop( 'checked', v.ui.arr.parent( 'section' ).hasClass( 'expanded' ) );
                }
            },

            'click:item:side': function ( v ) {

                var $i = this.getChildView( 'main' ).$( '#' + v.model.get( 'level' ) + '_' + v.model.get( 'num' ) );

                if ( !$i.hasClass( 'hide-expand' ) ) {

                    v.ui.arr.prop( 'checked', !v.ui.arr.prop( 'checked' ) );

                    $i.parent( 'section' ).toggleClass( 'expanded' );

                    var scrollTop = this.getChildView( 'main' ).$el.parent().scrollTop();

                    this.getChildView( 'main' ).$el.parent().stop().animate( { scrollTop: $i.parent().position().top + scrollTop }, 500 );
                }
            }
        },

        _toggle: function () {

            this.$el.toggleClass('hls');

        },

        _xml_exp: function () {

            var url = location.href;
            location.replace('/lang-' + Resources.Lang + '/db' + db + '/Reports/DataAsFile/' + this.model.id);
            location.replace(url);
        },

        _pdf_exp_url: function () {

            var html = this.getChildView('main').$el.parent().html(),
                m = new Backbone.Model;

            m.url = '/api/WReports/Export/' + this.model.id;

            m.save({ html: html, kind: 0 },
            {
                success: function (m) {

                    var pdf_btn = {
                        id: '_pdf_exp',
                        url: m.get('url'),
                        className: 'export',
                        title: Resources.export + ' PDF',
                        template: '<a toolbar-icon="export" href="<%= url %>" target="_blank"><i><%- title %></i></a>'
                    };

                    Backbone.Radio.channel('tools').request('get:tools').collection.add(pdf_btn);
                }                
            });
        }

    });


});