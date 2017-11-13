define('sett0', ['i18n!nls/resources.min', 'global.behaviors.input'], function (Resources, InputBehavior) {

    return Mn.View.extend({

        behaviors: {
            input: InputBehavior
        },

        className: 'g-form--input',
        template: '#dashboard-settings0',
        templateContext: { Resources: Resources },

        ui: {
            title: 'input[name="title"]'
        },

        onSave: function () {            
            this.model.save({ 'title': this.ui.title.val() });
        },

        onCancel: function () {},

        modelEvents: {

            invalid: function () {
                this.ui.title.addClass('error');
                setTimeout(function () { this.ui.title.removeClass('error'); }.bind(this), 3000);
            }
        }

    });

});

define('sett1', ['i18n!nls/resources.min', 'g/ImageGalleryView', 'RU', 'syncfusion'], function (Resources, Gallery) {

    return Mn.View.extend({

        template: '#dashboard-settings1',
        templateContext: { Resources: Resources },

        ui: {
            bgColor: 'input[name=BackgroundColor]',
            position: 'input[name="BackgroundPosition"]',
            link: 'input[name="BackgroundImageLink"]'
        },

        events: {

            "click @ui.position": function () {
                this.sender.set('BackgroundPosition', parseInt(this.$('input[name=BackgroundPosition]:checked').val()));                
            }
        },

        regions: {
            gallery: { el: '.image-gallery', replaceElement: true }
        },

        initialize: function () {

            this.sender = new Backbone.Model(this.model.get('Decoration') || {
                BackgroundColor: 'rgba(255, 255, 255, 1)',
                BackgroundImageLink: 'none',
                BackgroundPosition: 3
            });


            this.sender.on('change', function (m, v) {

                this.ui.position.filter("[value='" + v + "']").prop("checked", true);

                if (v === 3) {
                    this.sender.set('BackgroundImageLink', 'none');
                    var mo = this.getChildView('gallery').collection.findWhere({ select: true });
                    if (mo)
                        mo.set('select', false);
                }

                this.model.trigger('change:Decoration', this.model, this.sender.toJSON());

            }, this);
        },

        onRender: function () {

            this.showChildView('gallery', new Gallery({ selectedImgPath: this.sender.get('BackgroundImageLink') }));

            var rgb = {},
                val = this.sender.get('BackgroundColor') || 'rgba(255, 255, 255, 1)',
                arr = val.substr(val.indexOf('('), val.indexOf(')')).replace('(', '').replace(')', '').split(',');

            _.each(['r', 'g', 'b'], function (l, i) { rgb[l] = parseInt(arr[i]); });

            this.ui.bgColor.ejColorPicker({
                cssClass: 'g-cp',
                locale: Resources.Lang
            });

            this.ui.bgColor.ejColorPicker({

                value: this.ui.bgColor.data('ejColorPicker').RGBToHEX(rgb),
                opacityValue: arr[3] ? parseFloat(arr[3]) * 100 : 100,

                close: function (args) {

                    var c = this.ui.bgColor.data('ejColorPicker').getColor();
                    this.sender.set('BackgroundColor', 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + c.a + ')');
                    //this.model.trigger('change:Decoration', this.model, this.sender.toJSON());

                }.bind(this)

            });


        },

        onChildviewChangeItem: function (model) {

            this.sender.set({
                BackgroundImageLink: model.get('FileUrl'),
                BackgroundPosition: this.sender.get('BackgroundPosition') === 3 ? 1 : this.sender.get('BackgroundPosition')
            });          
          
        },

        onSave: function () {

            this.model.save({ Decoration: this.sender.toJSON() }, {
                success: function (r) {

                    this.sender.url = '/api/wall/' + r.id + '/decoration';
                    this.sender.save({ id: r.id });

                }.bind(this)
            });

        },

        onCancel: function () {
            
            this.sender = new Backbone.Model(this.model.get('Decoration') || {
                BackgroundColor: 'rgba(255, 255, 255, 1)',
                BackgroundImageLink: 'none',
                BackgroundPosition: 3
            });

            this.model.trigger('change:Decoration', this.model, this.sender.toJSON());
            this.render();            
        }

    });

});

define('sett2', ['i18n!nls/resources.min'], function (Resources) {

    var toolsForUsers = Mn.View.extend({

        tagName: 'span',
        className: 'g-form--input',

        template: _.template('<input type="text" value="" id="uniname" class="g-form--input" placeholder="<%= Resources.alias %>" /><label for="uniname"><%= Resources.alias %></label><i class="add rtl-1"></i>'),

        templateContext: {
            Resources: Resources
        },

        triggers: {
            'click .add': 'user:check'
        }
    });

    var userCollection = Mn.CollectionView.extend({

        tagName: 'tbody',

        emptyView: Mn.View.extend({
            tagName: 'tr',
            template: _.template('<td colspan="4">'+Resources.N+ '</td>')
        }),

        childView: Mn.View.extend({

            tagName: 'tr',

            template: _.template('<td><%- UserTitle %></td><td><%= UserUID %></td><td><%- Access? Resources.rw : Resources.ro %></td><td><span class="clear" data-icon="icon-trash"></span></td>'),
            templateContext: { Resources: Resources },

            triggers: {
                'click .clear': 'clear:item'
            }
        }),

        childViewTriggers: {
            'clear:item': 'clear:item'
        }

    });

    var listUsers = Mn.View.extend({

        tagName: 'table',
        template: _.template('<thead><tr><th><%- Resources.dname %></th><th><%- Resources.login %></th><th><%- Resources.scope %></th><th></th></tr></thead><tbody></tbody><tfoot></tfoot>'),
        templateContext: { Resources: Resources },

        regions: {
            tbody: { el: 'tbody', replaceElement: true }
        },

        onRender: function () {
            this.showChildView('tbody', new userCollection({ collection: this.collection }));
        },

        childViewTriggers: {
            'clear:item':'clear:item'
        }

    });

    var checkedUser = Mn.View.extend({
        tagName: 'tr',

        template: _.template('<td><%- UserTitle %></td><td><%= UserUID %></td><td><select name="Access"><option value="0"><%- Resources.ro %></option><option value="1"><%- Resources.rw %></option></select></td><td><span class="add" data-icon="icon-round-add"></span></td>'),
        templateContext: { Resources: Resources },

        triggers: {
            'click .add': 'user:add'
        },

        onUserAdd: function () {
            this.model.set('Access', parseInt(this.$('select[name=Access]').val()));
        }
    });

    return Mn.View.extend({

        template: '#dashboard-settings2',

        regions: {
            tools: { el: 'div', replaceElement: true },
            check: { el: '.checked-user', replaceElement: true },
            list: { el: '.list', replaceElement: true }
        },

        initialize: function () {

            this.collection = new Backbone.Collection([], {
                model: Backbone.Model.extend({
                    idAttribute: 'UserID',
                    defaults: {
                        UserID: null,
                        UserUID: '',
                        UserTitle: '',
                        Access: 0
                    }
                })
            });

            this.collection.url = '/api/wall/' + this.model.id + '/users';
        },

        collectionEvents: {
            add: function (m) {
                $.post('/api/wall/' + this.model.id + '/sharewith', m.toJSON());
            }
        },

        onRender: function () {
            this.showChildView('tools', new toolsForUsers());
            this.showChildView('list', new listUsers({ collection: this.collection }));
            this.collection.fetch({ reset: true });
        },

        childViewEvents:{

            'user:add': function (v) {
                this.getRegion('check').reset();
                this.collection.add(v.model.toJSON());
            },

            'user:check': function () {

                var $v = this.getRegion('tools').currentView.$('input');

                if ($.trim($v.val())) {
                    var m = new Backbone.Model();
                    m.url = '/api/users/checkname?name=' + $v.val();
                    m.fetch({
                        success: function (m) {
                            if (m && m.get('UserID')) {
                                this.showChildView('check', new checkedUser({ model: m }));
                                $v.val('').removeClass('error');
                            } else {
                                $v.addClass('error').val(Resources.nf);
                                setTimeout(function () {
                                    $v.removeClass('error').val('');
                                }, 5000);
                            }

                        }.bind(this)
                    });
                } else
                    $v.addClass('error');

                setTimeout(function () { $v.removeClass('error'); }, 5000);
            },

            'clear:item': function (v) {

                this.triggerMethod('show:message:confirm', {
                    text: Resources.askyousure,
                    fx: function () {
                        v.model.destroy();
                    },
                    ctx: this
                });

            }

        },

        onSave: function () {

        },

        onCancel: function () {

        }

    });

});

define('sett3', ['baseurl', 'i18n!nls/resources.min', 'g/ImageGalleryView'], function (baseurl, Resources, Gallery) {

    return Mn.View.extend({

        template: '#dashboard-settings3',
        templateContext: {Resources:Resources},

        ui: {
            pre: '.thumb-image'
        },

        regions: {
            gallery: '.thumb-gallery'
        },

        events: {

            'change input[name=thumb]': function (e) {

                this.kind = $(e.target).val();

                if (this.kind !== '3')
                    this.hideGallery();

                switch (this.kind) {

                    case '0':
                        this.image = '';
                        this.ui.pre.css('background', 'none');
                        break;

                    case '1':

                        this.ui.pre.append($('<i class="loading" size="l" speed="slow"></i>'));

                        require(['/js/dist/html2canvas.min.js'], function () {
                            html2canvas(this.options.content).then(function (canvas) {

                                //var w = 220, h = 160;
                                //var img = new Image(w, h);
                                //img.src = canvas.toDataURL();

                                //var ca = document.createElement('canvas');
                                //ca.width = w;
                                //ca.height = h;
                                //ca.getContext("2d").drawImage(img, 0, 0, w, h);

                                this.image = canvas.toDataURL()
                                this.ui.pre.css({ 'background-image': 'url(' + this.image + ')' });

                                this.ui.pre.find('i').remove();

                            }.bind(this));
                        }.bind(this));
                        break;

                    case '2':
                        if (this.model.get('Decoration') && this.model.get('Decoration').BackgroundImageLink) {
                            this.image =  this.model.get('Decoration').BackgroundImageLink;
                            this.ui.pre.css({ 'background-image': 'url(' + baseurl + '/Files/ImageTransform?path=' + this.image + '&width=220&height=160)' });
                        }
                        else
                            this.triggerMethod('show:message', Resources.noselect);
                        break;

                    case '3':
                        this.image = '';
                        this.getRegion('gallery').$el.show();                       
                        break;
                } 

            }

        },

        initialize: function () {
            this.kind = '0';
            this.image = '';
        },

        onRender: function () {

            var flag = !!this.model.get('Screen') && this.model.get('Screen').indexOf('data:image') === -1;

            if(flag)
                this.ui.pre.css({ 'background-image': 'url(' + baseurl + '/Files/ImageTransform?path=' + this.model.get('Screen') + '&width=220&height=160)' });
            else
                this.ui.pre.css({ 'background-image': 'url(' + this.model.get('Screen') + ')' });

            this.showChildView('gallery', new Gallery({
                selectedImgPath: flag ? this.model.get('Screen') : ''
            }));

            if (flag && this.model.get('Screen') !== this.model.get('Decoration').BackgroundImageLink)
                this.getRegion('gallery').$el.show();
        },

        hideGallery: function () {

            var m = this.getChildView('gallery').collection.findWhere({ select: true });
            if (m)
                m.set('select', false);

            this.getRegion('gallery').$el.hide();

        },

        onChildviewChangeItem: function (model) {
            this.image = model.get('FileUrl');
            this.ui.pre.css('background-image', 'url(' + baseurl + '/Files/ImageTransform?path=' + model.get('FileUrl') + '&width=220&height=160)');
        },

        onSave: function (dialog) {

            if (this.kind === '3' && !this.image)
                this.triggerMethod('show:message', Resources.noselect);
            else 
                this.model.save({ "Screen": this.image });

        },

        onCancel: function () {
            this.render();
        }

    });

});

define('@DashboardsView', ['i18n!nls/resources.min', 'WidgetModel', '@widget.WidgetView', 'global.view.dialog'], function (Resources, widgetModel, widgetView, dialog) {

    var channelSelect = Backbone.Radio.channel('selectWidget');

    var sideBarCollection = [
        { id: 'sett0', title: Resources.msd0, icon: 'gear' },
        { id: 'sett1', title: Resources.msd1, icon: 'appearance' },
        { id: 'sett2', title: Resources.msd2, icon: 'permission' },
        { id: 'sett3', title: Resources.msd3, icon: 'thumb' }
    ];

    return Mn.CollectionView.extend({

        className: 'main-container',

        onRenderChildren: function () {

            this.triggerMethod('dashboards:container:full');

        },

        childView: Mn.CollectionView.extend({

            className: 'content',

            initialize: function () {

                this.collection = new Backbone.Collection([], { model: widgetModel });
                //this.collection.comparator = function (w) { return w.get("top") * 100 + w.get("left"); };
                this.collection.url = function () { return '/api/wall/' + this.model.id; }.bind(this);

            },

            events: {
                'touchstart': 'onEmpty',
                'click': 'onEmpty'
            },

            onEmpty: function (e) {

                if (!$(e.target).closest('.anbr-widget').get(0)) {

                    this.triggerMethod('select:one');

                    Backbone.Radio.channel('sidebar').request('open', { nameView: this.model.get('title'), view: this, title: Resources.dbs }, sideBarCollection);

                }
            },

            showSideBar: function () {

                Backbone.Radio.channel('sidebar').trigger('show');
                Backbone.Radio.channel('sidebar').request('open', { nameView: this.model.get('title'), view: this, title: Resources.dbs }, sideBarCollection);

            },

            sideBarTrigger: function (m) {

                var controls = m.id==='sett2'? []: [
                            { id: 'onSave', title: Resources.save, className: 'right blue nest-right' },
                            { id: 'onCancel', title: Resources.cancel, className: 'right' }
                ];

                require([m.id], function (setView) {

                    var dialogOptions = {
                        icon: 'gear',
                        className: 'settings',
                        title: this.model.id ? m.get('title') : Resources.addVitrin,
                        content: new setView({ model: this.model, content: this.$el }),
                        footer: controls
                    };

                    Backbone.Radio.channel('Notify').request('show:overlay');
                    var dialog = Backbone.Radio.channel('Notify').request('once:dialog', dialogOptions);

                    this.listenTo(dialog, 'footer:button:click', function (a) {
                        
                        if ( a.model.id === 'onSave' ) {
                            //dialogOptions.content.onSave();

                            dialog.$el.hide();
                            Backbone.Radio.channel('Notify').request('hide:overlay');
                        }

                        if ( a.model.id === 'onCancel' ) {
                            //dialogOptions.content.onCancel();
                            Backbone.Radio.channel('Notify').request('hide:overlay');
                            this.removeNew(dialog);
                        }
                    });

                    this.listenTo(dialog, 'dialog:closed', function () {
                        this.removeNew(dialog);
                    }, this);

                    this.listenTo(dialog, 'detach', function () {
                        Backbone.Radio.channel('Notify').request('hide:overlay');
                    });

                }.bind(this));
            },

            removeNew: function ( dialog ) {

                if (!this.model.id) {

                    //dialog.$el.hide();
                    //Backbone.Radio.channel('Notify').request('hide:overlay');

                    this.model.set('current', false);
                    this.model.collection.remove(this.model);

                    Backbone.history.navigate('', { trigger: true });
                }
            },

            onRenderChildren: function () {

                this._loadWidgets(0);

            },

            onRender: function () {

                Backbone.on("window:resizeend", function () { }, this);

            },

            _loadWidgets: function (count) {

                if (this.children.length > count) {

                    var v = this.children.findByIndex(count);
                    count++;

                    this.listenToOnce(v, 'load:end', function () {
                        this._loadWidgets(count);
                    });

                    var p = v.model.get('requestParameters');

                    if (p.IsInvalid) {

                        v.ui.load.html('<p><i style="color:red;">' + Resources.irdb + '</i></p>');
                        v.trigger('load:end');

                    } else
                        v.onLoad();


                } else
                    Backbone.Radio.channel('Mode').request('enabled', true);

            },

            show: function () {

                Backbone.Radio.channel('Mode').request('show', !this.model.get("IsShared"));
                Backbone.Radio.channel('Mode').request('left:init:model', this);

                this.model.trigger('change:Decoration', this.model, this.model.get('Decoration'));

                if (this.model.id) {

                    if (!this.isFetch) {

                        Backbone.Radio.channel('Mode').request('enabled', false);
                        Backbone.trigger('message:modal');
                        this.collection.fetch({ reset: true });
                        this.isFetch = true;

                    } else
                        Backbone.Radio.channel('Mode').request('enabled', true);

                } else {
                    this.showSideBar();
                    this.sideBarTrigger(sideBarCollection[0]);
                }

                this.$el.show();

                var ratio = $(window).width() / this.$el.width();
                $('head meta[name=viewport]').attr('content', `width=device-width, initial-scale=${ratio < 1 ? ratio : '1.0'}`);

            },

            collectionEvents: {

                update: function (c, o) {

                    if (o.add) {

                        var m = o.changes.added[0],
                            v = this.children.findByModel(m);

                        v.switchMode(true).onLoad();
                        this.triggerMethod('select:one', m);

                        v._addSettings();

                        Backbone.Radio.channel('sidebar').request('open', { nameView: v.model.get('title'), view: v.getChildView('settings'), title: Resources.wst }, v.getChildView('settings').getMenu());

                    }

                },

                destroy: function () {

                    Backbone.Radio.channel('sidebar').request('open', { nameView: this.model.get('title'), view: this, title: Resources.dbs }, sideBarCollection);

                },

                reset: function () {

                    Backbone.Radio.channel('Mode').request('enabled', true);
                    Backbone.trigger('message:hide');

                },

                error: function () {
                    Backbone.trigger('message:hide');
                }
            },

            modelEvents: {

                'change:id': function (m, id) {

                    if (id) {
                        Backbone.history.navigate(id, { trigger: false });
                        Backbone.Radio.channel('Mode').request('enabled', true);
                        Backbone.Radio.channel('Mode').request('turn:switch', true);
                    }

                },

                'change:current': function (m, v) {                    

                    if (v) {

                        Backbone.Radio.channel('Mode').request('turn:switch', false);
                        $(window).scrollTop(0);

                        Backbone.history.navigate(m.id || 'new', { trigger: !m.id });

                        this.show();

                    }
                    else {
                        this.$el.removeClass('edit-mode').hide();
                    }

                },

                'change:Decoration': function (m, d) {

                    if (d) {
                        var css = {
                            "background-color": d.BackgroundColor,
                            "background-image": d.BackgroundImageLink ? "url('" + d.BackgroundImageLink + "')" : "none",
                            "background-attachment": "fixed",
                            "background-repeat": "no-repeat",
                            "background-position": "50% 50%",
                            "background-size": "auto"
                        };

                        if (d.BackgroundPosition === 1)
                            css["background-size"] = "cover";
                        else if (d.BackgroundPosition === 2)
                            css["background-repeat"] = "repeat";
                        else if (d.BackgroundPosition === 3)
                            css["background-image"] = "none";

                        this.$el.css(css);

                    } else {
                        m.set('Decoration', {
                            BackgroundColor: 'rgba(255, 255, 255, 1)',
                            BackgroundImageLink: 'none',
                            BackgroundPosition: 3
                        });
                    }
                }
            },

            childView: widgetView,

            childViewEvents:{

                'widget:drag': function (m, left, top, isSave) {

                    this.children.each(function (v) {

                        if (v.$el.hasClass("widget-editing") && v.model.id !== m.id) {

                            var t = v.$el.position().top,
                                l = v.$el.position().left;

                            if (t < 0) t = 3;
                            if (l < 0) l = 3;

                            v.model.set({ top: t + top, left: l + left });

                            if (isSave)
                                v.position.save();

                        }

                    }, this);

                },

                'fix:size': function (m) {

                    if (this.$el.width() < m.get('left') + m.get('width')) {

                        this.$el.width(m.get('left') + m.get('width'));

                        var ratio = $(window).width() / this.$el.width();
                        $('head meta[name=viewport]').attr('content', `width=device-width, initial-scale=${ratio < 1 ? ratio : '1.0'}`);
                    }

                    if (this.$el.height() < m.get('top') + m.get('height')) {
                        this.$el.height(m.get('top') + m.get('height'));
                    }                   
                }

            },

            childViewTriggers: {
                'select:more': 'select:more',
                'select:one': 'select:one'
            }
        }),

        childViewTriggers: {
            'select:more': 'select:more:widget',
            'select:one': 'select:one:widget'
        }
       
    });


});