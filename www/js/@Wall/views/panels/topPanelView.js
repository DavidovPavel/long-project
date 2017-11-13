define('topPanel', ['i18n!nls/resources.min', 'global.view.dropDown', 'global.view.dialog', 'settings.decorationWidget'], function (Resources, dropDown, dialog, decorationContent) {

    var MIN_SIZE = 150;

    var cloneDialog  = Mn.View.extend({

        template: '#clone-widget-dialog-template',
        templateContext: {
            Resources:Resources
        },

        ui: {
            nd: '#newDBName'
        },

        regions: {
            dd: { el: '#dashboards-list', replaceElement: true }
        },

        events: {
            "change select.profile": "selectVitrina",
        },


        onRender: function () {

            var collection = new Backbone.Collection(this.model.collection.models);
            collection.add({ id: 0, title: Resources.wall_toPanelView_newVitrina }, { at: 0 });

            var dd = new dropDown({ collection: collection, current: "0" })
            this.showChildView('dd', dd);

            this.listenTo(dd, "dropdown:select", function (model) {
                this.selectClonningVitrina(model.id);
            });

            this.getChildView('dd').getChildView('container').setFilter(function (m) {
                return !m.get('IsShared');
            }.bind(this));
        },

        //#4277 Volkov - поле редактирования для ввода имени витриы скрывается, если пользователь клонирует на существующую витрину 
        selectClonningVitrina: function(vitrina) {
            if (vitrina) $(this.ui.nd).parent().parent().hide();
            else
                $(this.ui.nd).parent().parent().show();
        }
    });

    var positionView = Mn.View.extend({

        //tagName: 'span',
        tagName: 'div',
        className: 'position-buttons',

        template: '#position-btns-template',
        templateContext: {
            Resources: Resources
        },

        ui: {
            dx: "input[name='PositonPadding-x']",
            dy: "input[name='PositonPadding-y']",
            width: 'input[name="width"]',
            height: 'input[name="height"]'
        },

        regions: {
            mo: { el: '#multi-operation', replaceElement: true },
            dialog: { el: '#dialog', replaceElement: true }
        },

        events: {

            "click button:not([disabled])": "fixed",

            'keyup @ui.dx': function (e) {
                if (e.keyCode === 13)
                    this.fixed(e, 'dispose-x');
            },

            'keyup @ui.dy': function (e) {
                if (e.keyCode === 13)
                    this.fixed(e, 'dispose-y');
            },

            'keyup @ui.width': function (e) {

                if (e.keyCode === 13)
                    this._setProp(parseInt(this.ui.width.val()), 'width');
            },

            'keyup @ui.height': function (e) {

                if (e.keyCode === 13)
                    this._setProp(parseInt(this.ui.height.val()), 'height');
            }

        },

        _setProp: function (prop, name) {

            //if ( this.keyTimeout )
            //    clearTimeout( this.keyTimeout );

            //this.keyTimeout = setTimeout( function () {

                var ch = this.currentDashboard.children;

                this.collection.each( function ( m ) {

                    if (isNaN(prop) || prop < MIN_SIZE) {
                        this.ui[name].val(m.get(name));                       
                    } else {
                        m.set(name, prop);
                        ch.findByModel(m).position.save();
                    }

                }, this );                

            //}.bind( this ), 500 );

        },

        fixed: function (e, name) {

            var name = $(e.target).closest("button").attr("name") || name,
                dx = parseInt(this.ui.dx.val()),
                dy = parseInt(this.ui.dy.val()),
                propname = name;

            if (name === "front") {
                this.calcPosition(true);
                return;
            }
            if (name === "back") {
                this.calcPosition(false);
                return;
            }

            if (this.collection.length > 1) {

                this.firstModel = this.collection.at(0);

                var data = [],
                    first = this.firstModel.get(propname),
                    prev = {
                        left: this.firstModel.get("left"),
                        top: this.firstModel.get("top")
                    };

                this.collection.each( function ( m ) {

                    var o = {};

                    switch ( name ) {

                        case "dispose-x":
                            propname = "left";
                            first = prev.left;
                            if (isNaN(dx))
                            {
                                this.ui.dx.css('border-color', 'red');
                                setTimeout(function () { this.ui.dx.css('border-color', '');  }.bind(this), 2000);
                                return;
                            } else
                                this.ui.dx.css('border-color', '');

                            prev.left += m.get("width") + dx;
                            break;

                        case "dispose-y":
                            propname = "top";
                            first = prev.top;
                            if (isNaN(dy)) {
                                this.ui.dy.css('border-color', 'red');
                                setTimeout(function () { this.ui.dy.css('border-color', ''); }.bind(this), 2000);
                                return;
                            } else
                                this.ui.dx.css('border-color', '');
                            prev.top += m.get("height") + dy;
                            break;

                        case "size":
                            first = {};
                            first.width = this.firstModel.get("width");
                            first.height = this.firstModel.get("height");
                            propname = "size";
                            break;

                        case "middle":
                            propname = "top";
                            first = this.firstModel.get("top") + this.firstModel.get("height") / 2 - m.get("height") / 2;
                            if (first < 0) first = 5;
                            break;

                        case "bottom":
                            propname = "top";
                            first = this.firstModel.get("top") + this.firstModel.get("height") - m.get("height");
                            if (first < 0) first = 5;
                            break;

                        case "center":
                            propname = "left";
                            first = this.firstModel.get("left") + this.firstModel.get("width") / 2 - m.get("width") / 2;
                            if (first < 0) first = 5;
                            break;

                        case "right":
                            propname = "left";
                            first = this.firstModel.get("left") + this.firstModel.get("width") - m.get("width");
                            if (first < 0) first = 5;
                            break;
                    }

                    data.push({
                        WidgetUid: m.id,
                        PlacementWidth: name === "size" ? first.width : name === "width" ? first : m.get("width"),
                        PlacementHeight: name === "size" ? first.height : name === "height" ? first : m.get("height"),
                        PlacementTop: propname === "top" ?  first :  m.get('top'),
                        PlacementLeft: propname === "left" ? first :  m.get('left'),
                        ZIndex: name === "zIndex" ? first : m.get("zIndex")
                    });

                    if (name !== "size") {
                        m.set(propname, first);
                    } else {
                        m.set({ width: first.width, height: first.height });
                    }

                }, this);

                this.onSave(data);

            }
        },

        calcPosition: function (front) {

            var first = this.collection.at(0),
                child = this.currentDashboard.children,
                p = 1;

            if (!front) {

                var data = [];
                this.currentDashboard.collection.each(function (m) {
                    if (parseInt(m.get('zIndex')) === 1) {
                        var v = child.findByModel(m);
                        m.set("zIndex", m.get('zIndex') + 1);
                        data.push(v.position.toJSON());
                    }
                });

                this.onSave(data);

            } else {

                var max = this.currentDashboard.collection.max(function (m) { return m.get("zIndex") });

                if (max)
                    if (first.id !== max.id)
                        p = parseInt(max.get("zIndex")) + 1;
                    else
                        return;                

            }

            first.set("zIndex", p);
            var fv = child.findByModel(first);
            fv.position.save();
            fv.$el.removeClass('widget-editing');

        },

        onSave: function (data) {

            $.ajax({
                method: "POST",
                contentType: 'application/json; charset=utf-8',
                url: '/api/wall/' + this.model.id + '/positions',
                data: JSON.stringify(data)
            });

            //this.collection.reset();
        },

        collectionEvents: {

            destroy: function (m) {
                this.$('#count').text(this.collection.length);
            },

            add: function (m) {

                this.currentDashboard.children.findByModel(m).$el.addClass('widget-editing');

                this.$("button[name=front], button[name=back], button[name=resize]").removeAttr("disabled", "disabled");

                if ( this.collection.length > 1 ) {

                    this.$("button").removeAttr("disabled");
                    this.ui.width.val( '' );
                    this.ui.height.val('');

                    var a = [
                        { id: 'decoration', title: Resources.m3, icon: 'appearance' },
                        { id: 'clear', title: Resources.del, icon: 'trash' }
                    ];

                    Backbone.Radio.channel('sidebar').request('open', { titleView: '', view: this, name: Resources.dbs }, a);

                }
                else {
                    this.ui.width.val( m.get( 'width' ) );
                    this.ui.height.val( m.get( 'height' ) );
                }

                this.getChildView('mo').$el.removeClass('disabled');
                this.$('#count').text(this.collection.length);
            },

            reset: function (c, o) {

                if (!this.currentDashboard) return;

                this.currentDashboard.children.each(function (v) {

                    v.$el.removeClass('widget-editing');

                    if (v.getRegion('settings').hasView())
                        v.getChildView('settings').hide();

                });

                this.$('#count').text(this.collection.length);

                this.$("button").attr("disabled", "disabled");

                this.getChildView('mo').$el.addClass('disabled');
            }
        },

        initialize: function () {

            this.collection = new Backbone.Collection();
        },

        onRender: function () {

            this.$("button").attr("disabled", "disabled");

            this.showChildView('mo', new dropDown({
                placeholder: '<div class="item"><span><svg><use xlink:href="#selected-widgets" /></svg></span><span>' + Resources.selectedWidgets + '</span><span id="count">0</span></div>',
                collection: new Backbone.Collection([
                    { id: 'clone', title: Resources.cloneTo, icon: 'icon-clone' },
                    { id: 'clear', title: Resources.deleteItem, icon: 'icon-trash' }
                ])
            }));

            this.getChildView('mo').$el.addClass('disabled');
        },

        childViewEvents: {

            'dropdown:select': function (m, name) {

                switch (m.id) {

                    case 'clone':

                        var d = new dialog({
                            content: new cloneDialog({ model: this.model }),
                            title: Resources.cloneTo,
                            icon: 'clone',
                            footer: new Backbone.Collection([
                                { id: 'clone', title: Resources.save, className: 'blue right' }
                            ])
                        });

                        this.listenTo(d, 'footer:button:click', function (v) {

                            var did = d.model.get('content').getChildView('dd').current.id;

                            if (!did) {

                                var title = $.trim(d.model.get('content').ui.nd.val());
                                if (title) {

                                    this.model.collection.create({ title: title }, { wait: true });

                                    this.listenToOnce(this.model.collection, 'sync', function (m) {

                                        this._cloneWidgets(m.id, d);
                                        d.destroy();

                                    }.bind(this));

                                } else
                                    d.getChildView('notify').showNotify(Resources.newDBName + ' - ' + Resources.isEmpty.toLowerCase());


                            } else {
                                this._cloneWidgets(did, d);
                                d.destroy();
                            }

                        });
                        
                        Backbone.Radio.channel('Notify').request('add:dialog', d);

                        break;

                    case 'clear':
                        this._clearWidgets();
                        break;
                }

            }
        },

        sideBarTrigger: function (m) {

            switch (m.id) {

                case 'decoration':

                    var one = this.collection.at(0);

                    var d = new dialog({
                        content: new decorationContent({ model: one }),
                        title: Resources.m3,
                        icon: 'appearance',
                        footer: new Backbone.Collection([
                            { id: 'decor', title: Resources.save, className: 'blue right' }
                        ])
                    });

                    this.listenTo(one, 'change', function () {
                        this.collection.each(function (m) {
                            m.set('Decoration', one.get('Decoration'));
                        });
                    });

                    this.listenTo(d, 'footer:button:click', function (v) {

                        this.collection.each(function (m) {
                            m.save();
                        });

                        d.getChildView('notify').showNotify(Resources.success);
                    });

                    Backbone.Radio.channel('Notify').request('add:dialog', d);

                    break;

                case 'clear':
                    this._clearWidgets();
                    break;
            }

        },

        _cloneWidgets: function (id, d) {

            var data = {
                widgets: this.collection.pluck('id'),
                vitrins: [id]
            };

            if (!data.widgets || !data.widgets.length) {
                this.collection.reset();
                return;
            }

            $.ajax({ url: '/api/wall/service/widgetclonning', data: data, type: "POST" })
                .done(function () {

                    // обновить целевую витрину (если она загружена виджеты не появятся)
                    var md = this.model.collection.get(data.vitrins[0]);
                    this.triggerMethod('render:vitrin:after:clone:widget', md);

                    // если клонирование производится в эту же витрину у виджетов пропадает выделение
                    Backbone.Radio.channel('Mode').request('turn:switch', false);
                    //d.getChildView('notify').showNotify(Resources.success);

                    this.collection.reset();

                }.bind(this))

                .fail(function () {

                    d.getChildView('notify').showNotify("Internal Error");

                });

        },

        _clearWidgets: function () {

            Backbone.trigger("message:confirm", {

                title: Resources.askyousure, message: $.Format(Resources.deltext, Resources.widget, this.collection.pluck("title").join(', ')),

                fx: function () {

                    Array.from(this.collection.models).map(function (m) {

                        m.destroy();

                    });
                },

                ctx: this
            });
        }
    });

    return Mn.View.extend({

        className: 'Shna',

        template: '#top-buttons-template',
        templateContext: {
            Resources: Resources
        },

        triggers: {
            'click .show-add-widget-btn': 'show:left:panel'
            //'click .font-icon-repair': 'show:right:panel'
        },

        events: {

            "mouseenter .show-add-widget-btn": function (e) {
                $(e.target).closest("button").find(".anbr-tooltip").show();
            },

            "mouseleave .show-add-widget-btn": function (e) {
                $(e.target).closest("button").find(".anbr-tooltip").fadeOut();
            }
        },

        regions: {
            position: { el: '#position-buttons', replaceElement: true }
        },

        onRender: function () {

            this.showChildView('position', new positionView);

        },

        onShow: function (v) {

            this.getChildView('position').currentDashboard = v;
            this.getChildView('position').model = v.model;

            this.$el.show();

            if (!v.collection.length)
                this.$(".show-add-widget-btn").find(".anbr-tooltip").show();
        },

        childViewTriggers: {
            'render:vitrin:after:clone:widget': 'render:vitrin:after:clone:widget'
        }

    });

});