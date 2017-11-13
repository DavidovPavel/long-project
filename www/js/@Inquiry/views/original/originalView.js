define('content:original', ['i18n!nls/resources.min'], function (Resources) {

    return Mn.View.extend({

        className: 'workbench--content',
        template: _.template('<div id="content"></div>'),

        regions: {
            content: { el: '#content', replaceElement: true }
        },

        initialize: function () {

            this.model = new Backbone.Model;
            this.model.url = `/api/original/startconvert?id=${this.options.objid}${this.options.pid ? `&pid=${this.options.pid}` : ''}`;
            },

        onRender: function () {

            Backbone.trigger("message:modal");
            this.$el.text(`${Resources.convert}, ${Resources.wait}...`);
            this.model.fetch();

        },

        modelEvents: {

            error: function () {
                this.model.set( 'Status', 500 );
            },

            'change:Status': function (m, s) {

                switch (s) {

                    case 0:

                        this.counter = 0;

                        this.si = setInterval( function () {

                            this.counter++;

                            if ( this.counter > 50 ) {

                                clearInterval( this.si );
                                Backbone.trigger( "message:hide" );
                                this.$el.html(`<div class="g-notice sad">${Resources.timeended}</div>`);

                            } else

                                // check convert
                                $.get( this.model.get( 'ConvertedCheckLink' ) )

                                    .done( function ( status ) {

                                        this.model.set( 'Status', status );

                                    }.bind( this ) )

                                    .fail( function () {

                                        this.model.set( 'Status', 500 );

                                    });


                        }.bind( this ), 3000 );

                        break;

                    case 200:

                        clearInterval( this.si );
                        Backbone.trigger( "message:hide" );

                        if ( this.$el.find( "iframe" ).size() )
                            $.xhrAbortAll();
                        else
                            this.$el.html( `<iframe src="${this.model.get( 'FileUrl' )}" style='width:98%;height:99%;'></iframe>` );

                        var link = {
                            id: 'link',
                            url: this.model.get( 'FileOriginalUrl' ),
                            className: 'export',
                            title: this.model.has( 'OriginalFileName' ) ? this.model.get( 'OriginalFileName' ) : Resources.dod,
                            template: '<a toolbar-icon="export" href="<%= url %>" target="_blank"><i><%- title %></i></a>'
                        };

                        Backbone.Radio.channel( 'tools' ).request( 'get:tools' ).collection.reset( link );

                        break;

                    case 404:                       
                    case 500:
                        clearInterval(this.si);
                        Backbone.trigger("message:hide");
                        this.$el.html(`<div class="g-notice sad">${Resources.ndso}<br/><a href="${this.model.get('FileOriginalUrl')}">${Resources.dod}</a></div>`);
                        break;
                }

            }

        }

    });

});