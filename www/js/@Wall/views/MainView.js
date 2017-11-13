define('mainView', ['i18n!nls/resources.min', '@FirstView', '@SliderView', '@DashboardsView', 'leftPanel', 'topPanel', 'global.radio.sideBar'],

    function (Resources, firstView, sliderView, dashboardsView, leftPanel, topPanel) {

    var modeChannel = Mn.Object.extend({
        channelName: 'Mode'
    });

    new modeChannel;

    var selectWidget = Mn.Object.extend({
        channelName: 'selectWidget'
    });

    new selectWidget;

    var boardModel = Backbone.Model.extend({
        defaults: {
            id: null,
            title: Resources.title,
            IsShared: false,
            current: false,
            isInit: false,
            Screen: '',
            Decoration: {
                BackgroundColor: 'rgba(255, 255, 255, 1)',
                BackgroundImageLink: 'none',
                BackgroundPosition: 3
            },
            CDate: new Date().toISOString()
        },
        validate: function (attr, o) {
            var output = [];

            if (!$.trim(attr.title))
                output.push({ name: "title" });

            if (output.length)
                return output;
        }
    });

    var boardCollection = Backbone.Collection.extend({
        model: boardModel,
        url: function () {
            return '/api/wall/';
        }
    });

    return Mn.View.extend({

        template: '#main-template',
        templateContext: {
            Resources:Resources
        },

        ui: {
            mode: '.mode-info',
            sw: '.g-form--switch'
        },

        regions: {
            first: { el: '#first', replaceElement: true },
            container: { el: '#container', replaceElement: true },
            top: { el: '.Shna', replaceElement: true },
            left: { el: '#left-property', replaceElement: true },
            slider: { el: '#slider', replaceElement: true },
            dialog: { el: '#dialog', replaceElement: true }
        },

        triggers: {

            'click @ui.mode:not(.disabled) button': 'click:mode'

        },

        onClickMode: function () {
            Backbone.Radio.channel('Mode').request('turn:switch', this.ui.sw.attr("mode") !== "on");
        },

        initialize: function () {

            this.collection = new boardCollection;
            this.collection.comparator = function (m) { return -new Date(m.get('CDate')); };

            var channelMode = Backbone.Radio.channel('Mode');

            channelMode.reply('show', function (flag) {
                if (flag) this.ui.mode.show();
                else this.ui.mode.hide();
            }.bind(this));

            channelMode.reply('enabled', function (flag) {
                if (flag) this.ui.mode.removeClass('disabled');
                else this.ui.mode.addClass('disabled');
            }.bind(this));


            // switch-mode
            channelMode.reply('turn:switch', this.switchMode.bind(this));


            // render dialog
            Backbone.Radio.channel('Notify').reply('add:dialog', function (dialog) {

                if (this.getRegion('dialog').hasView()) {

                    var f = this.getChildView('dialog').$el.is(':visible');

                    if (f) {

                        //

                    } else
                        this.showChildView('dialog', dialog);

                } else
                    this.showChildView('dialog', dialog);

            }.bind(this));

        },

        onBeforeRender: function () {

            Backbone.trigger('message:modal');
            this.collection.fetch({ reset: true });

        },

        onRender: function () {

            this.showChildView('top', new topPanel);
            this.showChildView('left', new leftPanel);

            this.showChildView('slider', new sliderView({ collection: this.collection }));

            this.showChildView('container', new dashboardsView({ collection: this.collection }));

        },

        childViewEvents: {

            'render:vitrin:after:clone:widget': function (m) {

                var v = this.getChildView('container').children.findByModel(m);

                if (v.isFetch)
                    v.collection.fetch({ reset: true });


            },

            'select:more:widget': function (m) {

                this.getChildView('top').getChildView('position').collection.add(m);

            },

            'select:one:widget': function (m) {

                var pos = this.getChildView('top').getChildView('position');

                pos.collection.reset();
                if (m)
                    pos.collection.add(m);

            },

            'dashboards:container:full': function () {

                if (this.isWaitShow)
                    this.show();

            },

            'slider:new:dashboard': function () {
                this.options.uid = null;
                this.show();
            },

            'show:left:panel': function () {

                this.getChildView('left').onShow();

            }

        },

        showFirst: function (filter) {

            this.getRegion('dialog').empty();
            
            Backbone.Radio.channel('Mode').request('show', false);

            if (this.getRegion('first').hasView()) {

                if (this.getChildView('first').options.filter !== filter) {
                    this.getChildView('first').options.filter = filter;                    
                    this.getChildView('first').render();
                    this.getChildView('first').$el.show();
                } else
                    this.getChildView('first').$el.slideDown();
            }
            else
                this.showChildView('first', new firstView({ collection: this.collection, filter: filter }));

        },

        onShow: function () {

            if (this.getRegion('first').hasView())
                this.getChildView('first').$el.slideUp();

            if (this.collection.length)
                this.show();
            else
                this.isWaitShow = true;
        },

        show: function () {

            if (this.options.uid) {

                this.clearCurrent();
                var m = this.collection.get(this.options.uid);

                if ( m )
                    m.set( 'current', true );
                else {
                    Backbone.trigger( 'message:warning', { message: Resources.dnvu });
                    Backbone.history.navigate( '', { trigger: true });
                }

            }
            else {

                this.getRegion('dialog').empty();
                Backbone.Radio.channel('Mode').request('enabled', false);
                this.getChildView('left').$el.removeClass('show');
                this.getChildView('top').getChildView('position').collection.reset();

                var model = this.collection.findWhere({ id: null }) || new boardModel;
                model.collection = this.collection;

                this.collection.add(model);

                this.clearCurrent();
                model.set('current', true);

                var v = this.getChildView('container').children.findByModel(model);
                this.getChildView('top').onShow(v);

            }
        },

        collectionEvents: {

            remove: function () {

                if (!this.collection.length) {
                    this.options.uid = null;
                    this.show();
                }

            },

            reset: function () {

                if (!this.collection.length) {
                    this.options.uid = null;
                    this.show();
                }

                Backbone.trigger('message:hide');
            },

            error: function () {
                Backbone.trigger('message:hide');
            }
        },

        clearCurrent: function () {

            var c = this.collection.findWhere({ current: true });
            if (c)
                c.set('current', false);
        },

        switchMode: function (flag) {

            var m = this.collection.findWhere({ current: true }),
                v = this.getChildView('container').children.findByModel(m);

            if (flag) {

                this.ui.sw.attr("mode", "on");
                v.$el.addClass('edit-mode');

                this.getChildView('top').onShow(v);

                v.showSideBar();

                // show edit buttons
                this.getChildView('slider').getChildView('list').children.each(function (v) {
                    if (!v.model.get('IsShared'))
                        v.$('span').css("display", "inline-block");
                });

                v.children.each(function (w) {
                    w.switchMode(true);
                });
            }
            else {

                this.ui.sw.attr("mode", "off");
                v.$el.removeClass('edit-mode');

                this.getChildView('top').$el.hide();
                this.getChildView('left').$el.removeClass('show');
                //this.getChildView('right').$el.removeClass('show');

                Backbone.Radio.channel('sidebar').trigger('hide');

                this.getRegion('dialog').empty();

                // hide edit buttons                    
                this.getChildView('slider').getChildView('list').children.each(function (v) {
                    if (v.model.id)
                        v.$('span').hide();
                });

                v.children.each(function (w) {
                    w.switchMode(false);
                });
            }
        }

    });

});