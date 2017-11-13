define('tools:sidebar', ['i18n!nls/resources.min', 'access'], function (Resources, acc) {

    var sideBarChannel = Mn.Object.extend({
        channelName: 'side'
    });

    new sideBarChannel;

    var channel = Backbone.Radio.channel('side');

    var listItem = Mn.CollectionView.extend({

        tagName: 'ul',

        childView: Mn.View.extend({

            tagName: 'li',
            template: _.template('<span title="<%- title %>" class="<%- active?"active":"" %> <%- className || id %>"><%= title %><span id="cu"><%- count %></span></span><i class="toggler"></i><ul></ul>'),

            ui: {
                toggler: 'i:first.toggler'
            },

            triggers: {
                'click span': 'click:item'
            },

            regions: {
                children: { el: 'ul', replaceElement: true }
            },

            events: {

                'click @ui.toggler': function () {
                    this.model.set('expanded', !this.model.get('expanded'));
                    if (this.model.get('expanded'))
                        this.triggerMethod('click:item', this);
                }
            },

            childViewTriggers: {
                'click:item': 'click:item'
            },

            onBeforeRender: function () {

                if (!this.model.has('className'))
                    this.model.set('className', '');
            },

            onRender: function () {

                if (!acc.data.IsDev && this.model.has('inDev')) {
                    this.$el.hide();
                    return;
                }

                this.ui.toggler.hide();

                this.$el.attr('id', this.model.id);

                if (this.model.has('children')) {

                    this.ui.toggler.show();
                    
                    this.showChildView('children', new listItem({ collection: new Backbone.Collection(this.model.get('children')) }));

                    if (this.model.has('expanded'))
                        this.$el.addClass('expanded');
                }
            },

            modelEvents: {

                'change:expanded': function (m, v) {

                    if (v)
                        this.$el.addClass('expanded');
                    else
                        this.$el.removeClass('expanded');

                    this.triggerMethod('model:expanded', m, v);
                },

                'change:children': function (m, v) {
                    this.showChildView('children', new listItem({ collection: new Backbone.Collection(v) }));
                },

                'change:count': function (m, v) {
                    this.$('#cu').text(v);
                }
            }
           
        }),

        childViewOptions: function (m) {

            if (!m.has('active'))
                m.set('active', false);

            if (!m.has('count'))
                m.set('count', '');
        },

        onChildviewModelExpanded: function (c, flag) {

            if (flag) {

                var mo = this.collection.find(function (m) { return m.get('expanded') && m.id !== c.id; });
                if (mo)
                    mo.set('expanded', false);
            }

        },

        childViewTriggers: {
            'click:item': 'child:click:item'
        },

        onChildviewClickItem: function (v) {
            this.triggerMethod('click:item', v);
        }
    });

    return Mn.View.extend({

        tagName: 'aside',
        className: 'g-sidebar--left expanded',

        template: _.template( '<div class="control" title="<%- Resources.show %> / <%- Resources.close %>"><i></i></div><div id="list"></div>' ),
        templateContext: {
            Resources: Resources
        },

        regions: {
            children: { el: '#list', replaceElement: true }
        },

        initialize: function () {

            this.current = [];      // сохранение пути при переходах

            this.collection = new Backbone.Collection();

            channel.reply('get:sidebar', function () {
                return this;
            }.bind(this));

        },

        onBeforeRender: function () {
            $('body').addClass('hls ls-on');
        },

        onRender: function () {

            this.showChildView('children', new listItem({ collection: this.collection }));

        },

        events: {

            'click .control': function () {

                this.$el.toggleClass('expanded', function () {
                    if ($(this).hasClass('expanded'))
                        $('body').addClass('ls-on');
                    else
                        $('body').removeClass('ls-on');
                });
            }
        },

        toggleExpanded: function () {

            this.$el.toggleClass('expanded', function () {
                if ($(this).hasClass('expanded'))
                    $('body').addClass('ls-on');
                else
                    $('body').removeClass('ls-on');
            });

        },

        req: function (level, v, arr) {

            if (this.current.length && this.current[level] !== arr[level]) {

                var id = this.current[level],
                    m = level === 0 ? this.collection.get(id) : v.getChildView('children').collection.get(id);

                m.set('expanded', false);
            }

            if (this.current.length < level)
                this.req(level++, v.getChildView('children').children.findByModel(m), arr);
        },

        setCurrent: function (arr, reload) {

            this.current = arr;

            var m = this.collection.get(arr[0]),
                v = this.getChildView('children').children.findByModel(m);

            if (m.has('children')) {

                var ach = m.get('children');
                m.set('expanded', true);

                _.each(arr, function (n, i) {

                    var c = _.find(ach, function (a) { return a.id === arr[i + 1] });

                    if (c) {

                        var cm = v.getChildView('children').collection.get(arr[i + 1]);

                        cm.set('expanded', true);

                        v = v.getChildView('children').children.findByModel(cm);

                        if (c.children)
                            ach = c.children;

                    }
                });

            } else {

                v.model.set('expanded', true);

                var mo = v.model.collection.find(function (m) { return m.get('expanded') && m.id !== v.model.id; });
                if (mo)
                    mo.set('expanded', false);

            }

            this.current[this.current.length - 1] = v.model.get('name');

            this.getChildView('children').children.each(function (v) { v.$('span').removeClass('active'); });
            v.$('span:first').toggleClass('active');


            //if (v)
            //    this.onClickItem(v, reload);


        },

        childViewEvents: {
            'child:click:item': 'onClickItem'
        },

        onClickItem: function (v, reload) {

            if (v.model.has('path'))
                Backbone.history.navigate(v.model.get('path'), { trigger: true });

            channel.request('sidebar:click:item', v.model);

            //var flag = reload !== undefined ? reload : true;

            //if (flag)
            //    channel.request('sidebar:click:item', v.model);

        },

        open: function () {
            this.$el.addClass('expanded', function () {
                $('body').addClass('ls-on');
            });
        },

        close: function () {
            this.$el.removeClass('expanded', function () {
                $('body').removeClass('ls-on');
            });
        }

    });

});