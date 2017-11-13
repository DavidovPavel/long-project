define('c/EdgeView', ['includeModules', 'i18n!nls/resources.min'],

function (include, Resources) {

    var EXPAND_WIDTH = 570, EXPAND_HEIGHT = 376, TAB_STEP = 492;  

    function meta( p ) {

        var res = location.pathname.split( "/" ).filter( function ( a ) { return a.indexOf( p ) !== -1 });

        if ( res.length ) return res[0];

        var url = location.search.substring( 1 ).replace( /%2f/g, '/' );

        if ( url.indexOf( 'returnUrl' ) !== -1 )
            res = url.split( '/' ).filter( function ( a ) { return a.indexOf( p ) !== -1 });

        if ( res.length ) return res[0];

        res = url.split( "&" ).filter( function ( a ) { return a.indexOf( p ) !== -1 });

        if ( res.length ) return res[0].split( '=' )[1];
       
        return 0;
    };

    function prepareUrl( m ) {

        var lang = meta("lang") || "lang-ru-RU",
            db = meta("db") || "db0",
            _u = m.get('Url');

        if (_u.indexOf("http") === -1 || _u.indexOf("https") === -1) {
            var url = _u.replace("{lang}", lang);

            if (_u.indexOf("{db}") === -1)
                url = url + "?db=" + db;
            else
                url = url.replace("{db}", db);

            m.set('Url', url);
        }
    };

    var tabsView = Mn.CollectionView.extend({

        className: 'default-start-tabs',

        childView: Mn.View.extend({
            tagName: 'a',
            template: _.template('<%= GroupTitle %>'),

            triggers: {
                'click':'change:module'
            },

            onRender: function () {

                if (this.model.has('active'))
                    this.$el.addClass('active');

                this.$el.attr('href', '#');

                if (this.model.get('Edges'))
                    this.triggerMethod('add:edges', this.model.get('Edges'));

            }
        }),

        childViewOptions: function (m, i) {
            if (!i)
                m.set('active', true);
        },

        childViewTriggers: {
            'add:edges':'add:edges',
            'change:module': 'change:module'
        }
    });

    var modulesView = Mn.CollectionView.extend({

        tagName: 'ul',

        childView: Mn.View.extend({
            tagName: 'li',
            template: _.template('<a href="<%= Url %>" class="btn-start btn-start--<%= Code %>" target="_blank"><%= Title %></a>'),

            triggers: {
                'click a': {
                    event: 'edge:collapse',
                    preventDefault: false
                }
            }
        }),

        childViewOptions: function (m) {
            prepareUrl(m);
        },

        childViewTriggers: {
            'edge:collapse': 'edge:collapse'
        }
    });

    return Mn.View.extend({

        className: 'default-start-nav collapsed',
        template: '#edge-block-template',
        templateContext:{
            Resources:Resources
        },

        events: {

            "touchstart .default-start-nav-path": 'defaultNav',
            "click .default-start-nav-path": 'defaultNav',

            "touchstart .default-start-nav-close": 'startNav',
            "click .default-start-nav-close": 'startNav'
        },

        defaultNav: function () {

            var lang = meta("lang") || "lang-ru-RU",
                db = meta("db") || "db0";
            location.href = db === "db0" ? '/' + lang + '/home/main' : '/' + lang + '/' + db + '/home/main';

        },

        startNav:function () {

            var checkUser = $('#InfoUser').text();
            if (checkUser == "ABS\\Demo01") {
                location.href = '/';
                return;
            }

            if (this.$el.hasClass("collapsed")) {

                this.$el.animate({ height: EXPAND_HEIGHT, width: EXPAND_WIDTH }, 150, function (e) {
                    this.$el.addClass('expanded').removeClass('collapsed');
                    $('header').prepend('<div class="overlay"></div>');
                }.bind(this));

            }
            else if (this.$el.hasClass("expanded"))
                this._collapse();
        },

        regions:{
            tabs: { el: '.default-start-tabs', replaceElement: true },
            modules: '.default-start-tabs-inner'
        },

        onRender: function () {
            this.showChildView('tabs', new tabsView({ collection: this.collection }));
        },

        _collapse: function () {

            this.$el.animate({ height: 44, width: 44 }, 150, function (e) {
                this.$el.addClass('collapsed').removeClass('expanded');
                $('div.overlay').remove();
            }.bind(this));
        },

        childViewEvents: {

            'edge:collapse': function () {
                this._collapse();
            },

            'add:edges': function (o) {

                var d = _.filter(o, function (a) {
                    return a.Enabled && include.indexOf(a.Code) !== -1
                });

                if (!this.getRegion('modules').hasView())
                    this.showChildView('modules', new modulesView({ collection: new Backbone.Collection(d) }));
                else
                    this.getRegion('modules').attachHtml(new modulesView({ collection: new Backbone.Collection(d) }).render());
            },

            'change:module': function (v) {

                this.$('.default-start-tabs a.active').removeClass('active');
                v.$el.addClass('active');

                var step = v._index * TAB_STEP;

                this.$(".default-start-tabs-inner").animate({
                    left: step ? "-" + step : 0
                }, 400, 'easeInOutBack');
            }
        }
    });
});