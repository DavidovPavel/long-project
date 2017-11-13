
define('global.view.dialog', ['i18n!nls/resources.min', 'global.model.dialog'], function (Resources, dialogModel) {

    var Z_INDEX = 9000;

    var footerView = Mn.CollectionView.extend({

        className: 'g-dialog--footer',

        childView: Mn.View.extend({

            tagName: 'span',

            getTemplate: function () {
                if (this.model.has('template'))
                    return _.template(this.model.get('template'));
                else
                    return _.template('<button name="<%- id %>" class="g-form--button flat <%- className %>"><%- title %></button>');
            },

            events: {
                'click input[type=checkbox]': function (e) {
                    this.model.set('selected', $(e.target).prop('checked'));
                }
            },

            triggers: {
                'click button:not(.disabled)': 'footer:button:click'
            },

            modelEvents: {

                'change:selected': function (m, v) {
                    this.$('input[type=checkbox]').prop('checked', v);
                }
            },

            onRender: function () {
                
                if ( this.model.has( 'selected' ) )
                    this.$( 'input[type = checkbox]' ).prop( 'checked', this.model.get( 'selected' ) );
                
            },

            templateContext: function () {
                return { viewid: this.cid };
            }
        }),

        childViewOptions: function (m) {

            if (!m.has('className'))
                m.set('className', '');

        },

        onFooterButtonClick: function (r) {
            this.triggerMethod( 'content:reflect', r );
        },

        childViewTriggers: {
            'footer:button:click': 'footer:button:click'
        }
    });

    var toolsView = Mn.CollectionView.extend({

        tagName: 'ul',

        childView: Mn.View.extend( {

            tagName: 'li',

            getTemplate: function () {

                if (this.model.has('template'))
                    return _.template(this.model.get('template'));
                else
                    return _.template('<span name="<%- id %>" title="<%- caption %>" toolbar-icon="<%- icon %>" class="<%- className %>"><i><%- title %></i></span>');
            },

            triggers: {
                'click :not(.disabled)': 'toolbar:item:click',
                'input input': 'toolbar:input:keyup'
            },

            onBeforeRender: function () {

                if (!this.model.has('className'))
                    this.model.set('className', this.model.id);

                if (!this.model.has('icon'))
                    this.model.set('icon', this.model.get('className'));

                if (!this.model.has('title'))
                    this.model.set('title', '');

                if (!this.model.has('caption'))
                    this.model.set('caption', this.model.get('title'));
            },

            onRender: function () {
                if (this.model.get('disabled'))
                    this.$el.attr('disabled', 'disabled');
            }
        }),

        onToolbarItemClick: function (r) {
            this.triggerMethod( 'content:reflect', r );
        },

        onToolbarInputKeyup: function (r) {
            this.triggerMethod( 'content:reflect', r );
        },

        childViewTriggers: {
            'toolbar:item:click': 'toolbar:item:click',
            'toolbar:input:keyup': 'toolbar:input:keyup'
        },

        collectionEvents: {

            reset: function (c) {

                this.triggerMethod('toolbar:update', c);

            },

            update: function () {

            }

        }
    });

    var buttonsView = Mn.CollectionView.extend({

        className: 'row',

        childView: Mn.View.extend( {

            className: 'g-form--button',
            tagName: 'button',
            template: _.template('<%- title %>'),

            onRender: function () {
                if (this.model.get('className'))
                    this.$el.addClass(this.model.get('className'));
            },

            triggers: {
                'click': 'click:button'
            }
        }),

        childViewTriggers: {
            'click:button': 'click:button'
        }
    });

    var notifyView = Mn.View.extend( {

        className: 'g-dialog--promt',
        template: _.template('<span></span><div></div>'),

        regions: {
            buttons: { el: 'div', replaceElement: true }
        },

        onRender: function () {

            this.showChildView( 'buttons', new buttonsView( { collection: new Backbone.Collection() } ) );

        },

        onChildviewClickButton: function ( b ) {

            if (b.model.id === 'delete' && this.callback) {
                this.callback.call(this.context);
                this.callback = null;
            }
            this.$el.slideUp();
        },

        showNotify: function ( text ) {

            this.getChildView('buttons').collection.reset([{ id: 'ok', title: 'Ok', className: 'blue small flat' }]);
            this.$('span').html(text);
            this.$el.slideDown( 150 );
            this.triggerMethod( 'notice:show:message' );
        },

        showConfirm: function ( text, fx, ctx ) {

            this.getChildView('buttons').collection.reset([
                { id: 'delete', title: Resources.del, className: 'rightsmall flat blue' },
                { id: 'cancel', title: Resources.cancel, className: 'left small flat' }
            ]);

            this.$( 'span' ).html( text );
            this.callback = fx;
            this.context = ctx;
            this.$el.slideDown( 150 );

            this.triggerMethod( 'notice:show:message' );

        },

        childViewTriggers: {
            'click:button': 'notice:click:button'
        }
    });

    var manageView = Mn.CollectionView.extend({

        className: 'g-dialog--manage',

        childView: Mn.View.extend({

            tagName: 'i',

            template: _.template(''),

            triggers: {
                'click': 'manage:item:click'
            },

            onRender: function () {
                this.$el.addClass(this.model.id);
            }

        }),

        childViewTriggers: {
            'manage:item:click': 'manage:item:click'
        }

    });

    return Mn.View.extend({

        className: 'g-dialog--wrapper',
        template: '#dialog-window-template',

        ui: {
            header: '.g-dialog--header',
            title: '.g-dialog--title',
            content: '.g-dialog--content',
            blocker: '.g-dialog--blocker'
        },

        regions: {
            notify: { el: '.g-dialog--promt', replaceElement: true },
            toolbar: '.g-toolbar',
            content: '@ui.content',
            sidebar: '.g-dialog--sidebar',
            footer: { el: '.g-dialog--footer', replaceElement: true },
            manage: { el: '.g-dialog--manage', replaceElement: true }
        },

        initialize: function () {

            if ( !this.options.model )
                this.model = new dialogModel( this.options );

        },

        modelEvents: {

            'change:content': function (m, v) {
                this.getRegion( 'content' ).show( v );
            },

            'change:title': function (m, v) {
                this.ui.title.html( v );
            },

            'change:icon': function (m, v) {
                this.ui.title.attr('data-icon', 'icon-' + v);
            },

            'change:showContext': function (m, v) {

                this.$el.attr( 'context', v );

            },

            'change:size': function ( m, v ) {

                this.model.set({
                    top: this.$el.position().top,
                    left: this.$el.position().left,
                    width: this.$el.width(),
                    height: this.$el.height()
                });

                this.$el.attr( 'size', v );

                if (v === 'max') {

                    this.$el.css( { left: 0, top: 45, width: '', height:'', transform: 'initial' } )
                        .draggable().draggable( "destroy" )
                        .resizable().resizable("destroy");

                }
                else {

                    var p = this.model.previousAttributes();

                    this.$el.css({
                        left: p.left,
                        top: p.top,
                        width: p.width,
                        height: p.height
                    });

                    this._initDragAndResize();
                }

            }

        },

        onRender: function () {

            this.$el.attr('size', this.model.get('size'));
            this.$el.attr( 'footer', !!this.model.get( 'footer' ).length );
            this.$el.attr( 'toolbar', !!this.model.get( 'toolbar' ).length );
            this.$el.attr( 'modal', !!this.model.get( 'modal' ) );
            this.$el.attr( 'context', this.model.get( 'showContext' ) );
            this.$el.attr( 'header', this.model.get( 'color' ) );

            if ( this.model.get( 'zindex' ) )
                this.$el.css('zIndex', Z_INDEX + this.model.get('zindex'));

            var size = this.model.get('size');

            if (size !== 'full')
                this._initDragAndResize();
            else {
                this.model.get('header').manage = [{ id: 'close' }];
            }

            this.showChildView( 'manage', new manageView( { collection: new Backbone.Collection( this.model.get( 'header' ).manage ) } ) );
            this.showChildView( 'notify', new notifyView() );            
            this.showChildView( 'toolbar', new toolsView( { collection: this.model.get( 'toolbar' ) } ) );
            this.showChildView( 'footer', new footerView( { collection: this.model.get( 'footer' ) } ) );

            if ( this.model.has( 'content' ) )
                this.showChildView( 'content', this.model.get( 'content' ) );

            if ( this.model.has( 'sidebar' ) ) {
                this.$el.attr( 'sidebar', true );
                this.showChildView( 'sidebar', this.model.get( 'sidebar' ) );
            } else
                this.$el.attr( 'sidebar', false );

        },

        onAttach: function () {           

            if (this.model.get('size') !== 'full') {

                let win = $('main'),
                    cv = this.$el,
                    top = win.height() / 2 - cv.height() / 2;

                cv.css({
                    top: top < 44 ? 44 : top,
                    left: win.width() / 2 - cv.width() / 2
                });

            }
            if (!this.model.get('autoOpen'))
                this.$el.hide();
            else
                this.$el.show();

        },

        childViewEvents: {

            'show:message': function ( text ) {
                this.getChildView( 'notify' ).showNotify( text );
            },

            'show:message:confirm': function ( o ) {
                this.getChildView( 'notify' ).showConfirm( o.text, o.fx, o.ctx );
            },

            'notice:show:message': function () {
                this.ui.blocker.show();
            },

            'notice:click:button': function () {
                this.ui.blocker.hide();
            },

            'manage:item:click': function ( i ) {
                this[i.model.id]();
            },

            'content:reflect': function ( r ) {

                var content = this.getChildView( 'content' ),
                    fx = content[r.model.id];

                if ( fx && typeof fx === 'function' )
                    fx.call( content, r );
            },

            'toolbar:update': function (c) {

                this.$el.attr('toolbar', !!c.length);
            }
        },

        childViewTriggers: {

            'toolbar:item:click': 'toolbar:item:click',

            'toolbar:input:keyup': 'toolbar:input:keyup',

            'container:select:item': 'container:select:item',

            'footer:button:click': 'footer:button:click',

            'after:load': 'after:load'
        },

        close: function () {

            this.$el.hide();
            this.triggerMethod( 'dialog:closed' );
            Backbone.Radio.channel('Notify').request('hide:overlay');

        },

        size: function () {

            this.model.set( 'size', this.model.get( 'size' ) === 'max' ? 'def' : 'max' );
        },

        menu: function () {

            this.model.set( 'showContext', !this.model.get( 'showContext' ) );
        },

        _initDragAndResize: function () {

            this.$el
                .resizable({

                    stop: function (e, u) {

                        try {

                            if (this.model.has('content') && _.isFunction(this.model.get('content')))
                                this.model.get('content').triggerMethod('container:resize:stop', this.getRegion('content').$el);

                        } catch (e) {
                            console.error(e.message);
                        }

                    }.bind(this)

                })
                .draggable({ handle: this.ui.header, helper: "original", containment: "main" });

            this.$el.css('position', 'fixed');
        }
    });

});