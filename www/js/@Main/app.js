define('ItemsEdge', ['includeModules'], function (include) {

    var moduleView = Mn.View.extend({

        getTemplate: function () {

            return _.template('<a href="' + this.prepare() + '" class="<%- Code %>" ><span><%- Title %></span><span class="help" title="<%- Description %>"></span></a>');
        },

        events: {
            "click .help": function (e) {
                e.preventDefault();
            }
        },

        prepare: function () {
            var m = this.model.toJSON();

            if (!m.Enabled)
                return "#";

            if (m.UrlAbsolute)
                return m.Url;

            function meta(p) {
                var m = location.pathname.split("/");
                for (var i = 0; i < m.length; i++) {
                    var e = m[i];
                    if (e.indexOf(p) !== -1) {
                        return e;
                    }
                }

                var s = location.search.substring(1).split("&");
                for (var j = 0; j < s.length; j++) {
                    e = s[j];
                    if (e.indexOf(p) !== -1) {
                        return e.split("=")[1];
                    }
                }
                return 0;
            }

            var lang = meta("lang") || "lang-ru-RU",
                db = meta("db") || "db0",
                url = m.Url.replace("{lang}", lang);

            if (m.Url.indexOf("{db}") === -1)
                url = url + "?db=" + db;
            else
                url = url.replace("{db}", db);

            return url;
        }
    });

    //var areasView = Mn.CollectionView.extend({
    //    childView: moduleView
    //});

   
    return Mn.CollectionView.extend({

        childView: Mn.View.extend({

            template: _.template('<h3><%- GroupTitle %></h3>'),

            onRender: function () {

                this.$el.addClass(this.model.get('ClassName'));
                this.$el.attr('role', "navigation");

                var modules = _.chain(this.model.get('Edges')).filter(function (o) { return include.indexOf(o.Code) !== -1; })
                     //.groupBy('Area')
                     .toArray().value();

                if (!modules.length)
                    this.$el.hide();

                if (modules.length === 1) {
                    this.$('h3').hide();
                    modules[0].Code = modules[0].Code + ' onlyYou';
                }

                _.each(modules, function (a) {

                    var a = new moduleView({ model: new Backbone.Model(a) }).render();
                    this.$el.append(a.$el);

                }, this);
            }
        })
    });
});

define(['access', 'ItemsEdge', 'global.view.headerView'], function (acc, Items, Header) {

    var init = function () {

        $.ajaxSetup({
            headers: {
                'key': $.ajaxSettings.url
            }
        });

        var mainApp = Mn.Application.extend({
            region: '.items-edge',
            onStart: function () {

                var data = acc.data.Edges;
                this.showView(new Items({ collection: new Backbone.Collection(data) }));

                new Header( { isDemo: true }).render();
                
            }
        });

        new mainApp().start();

        $('#news, .control').click(function () {
            $('.apps').toggleClass('collapsed');
            $('.feed').toggleClass('hidden');
            $(this).parent('li').toggleClass('active');
        });

        $('.feed--item .close').click(function () {
            $(this).parent('.feed--item').addClass('removed');
            setTimeout(function () {
                $(this).parent('.feed--item').remove();
            }.bind(this), 300);
        });

    };

    return {
        init: init
    };
});


