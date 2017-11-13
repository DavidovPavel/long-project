define('global.radio.dialog', ['i18n!nls/resources.min', 'global.model.dialog', 'global.view.dialog'], function (Resources, dialogModel, DialogView) {

    /* 
        mainView reply 'add:dialog'
        Backbone.Radio.channel('Notify').reply('add:dialog', function (dialog) {
            this.showChildView('need', dialog);
        });

    */

    //var showModel = Backbone.Model.extend({
    //    defaults: function() {
    //        return {
    //            icon: 'folder',
    //            className: 'info default',
    //            title: '',
    //            autoOpen: true,
    //            tools: new Backbone.Collection, 
    //            controls: new Backbone.Collection([
    //                { id: 'save', title: Resources.save, className: 'right blue' }
    //            ])
    //        };
    //    }
    //});

    var messageHandler = Mn.Object.extend({

        channelName: 'Notify',

        radioRequests: {

            'show:overlay': function () {

                var overlay = $( 'body' ).find( '.g-dialog--overlay' );

                if ( !overlay.get( 0 ) ) {

                    overlay = $('<div class="g-dialog--overlay"></div>');
                    $( 'body' ).append( overlay );

                }

                overlay.show();
            },

            'hide:overlay':function(){
                $('body').find('.g-dialog--overlay').hide();
            },

            'uniq:dialog': function (options) {

                throw "uniq:dialog, - see to callstack";

                //var dialog = new DialogView( { model: this.initDialog( options ) } );

                //if ( !$( '#' + options.id ).get( 0 ) ) {

                //    $('body').prepend(dialog.render().$el);
                //    dialog.$el.attr( 'id', options.id );

                //} else
                //    dialog.render().setElement($('#' + options.id)).$el.show();
                
                //return dialog;
            },

            'once:dialog': function (options) {

                var model = this.initDialog(options);

                this.dialog = new DialogView( { model: model } );

                // добавляем в корневую view приложения
                this.getChannel().request( 'add:dialog', this.dialog );

                this.listenTo( this.dialog, 'toolbar:item:click', this.callToolsDialog);

                this.listenTo( this.dialog, 'toolbar:input:keyup', this.callFilterDialog);

                this.listenTo( this.dialog, 'container:select:item', this.treeSelectItem);

                return this.dialog;
            }

        },

        initDialog: function (options) {

            var m = new dialogModel;

            _.each(options, function (v, k) {
                switch ( k ) {
                    case 'tools':
                    case 'toolbar':
                        m.get( 'toolbar' ).set( v );
                        break;
                    case 'controls':
                    case 'footer':
                        m.get( 'footer' ).set( v );    // collecton
                        break;
                    default:
                        m.set( k, v );
                        break;
                }
            });


            return m;

        },

        treeSelectItem: function (v) {

            if (!this.dialog.getChildView('toolbar')) return this;

            this.editableView = v;

            var tools = this.dialog.getChildView( 'toolbar' );

            if ( tools.collection.length ) {

                var add = tools.collection.get( 'add' ),
                    rename = tools.collection.get( 'rename' ),
                    remove = tools.collection.get( 'clear' );

                tools.children.findByModel( add ).$( 'span' ).removeClass( 'disabled' );

                if ( v.model.id !== '-1' ) {
                    tools.children.findByModel( rename ).$( 'span' ).removeClass( 'disabled' );
                    tools.children.findByModel( remove ).$( 'span' ).removeClass( 'disabled' );
                } else {
                    tools.children.findByModel( rename ).$( 'span' ).addClass( 'disabled' );
                    tools.children.findByModel( remove ).$( 'span' ).addClass( 'disabled' );
                }
            }
        },

        callToolsDialog: function (v) {

            if (!this.editableView) return;

            switch (v.model.id) {

                case 'add':
                    this.editableView.showAddTemplate();
                    break;

                case 'rename':
                    this.editableView.model.set('isEdit', true);
                    break;

                case 'clear':

                    if (this.editableView.model === '-1') return;

                    Backbone.trigger("message:confirm", {
                        title: Resources.askyousure, message: $.Format(Resources.deltext, "", this.editableView.model.get("title")),
                        fx: function () {
                            this.editableView.model.destroy();
                        },
                        ctx: this
                    });

                    break;
            }

        },

        callFilterDialog: function (v) {

            var input = v.$('input').val().toLowerCase(),
                treeView = this.dialog.model.get('content').children ? this.dialog.model.get('content') : this.dialog.model.get('content').getChildView('tree');

            var recurcive = function (v) {
                v.children.each(function (a) {

                    var m = a.model;

                    if (parseInt(m.id) !== -1) {
                        if (m.get('title').toLowerCase().indexOf(input) === -1 && !m.has('nodes'))
                            a.$el.hide();
                        else
                            a.$el.show();
                    }

                    if (m.has('nodes'))
                        recurcive(a.getChildView('tree'));

                });
            };

            recurcive(treeView);

        }

    });

    return new messageHandler;

});