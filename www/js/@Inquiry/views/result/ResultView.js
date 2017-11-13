
define('result:dossier', ['dossier'], function (dossier) {

    return Mn.View.extend({

        className: 'workbench--content',
        template: _.template('<div></div>'),

        regions: {
            content: { el: 'div', replaceElement: true }
        },

        onRender: function () {

            this.getRegion('content').show(new dossier(this.options));

        },

        childViewTriggers: {
            'render:tools': 'render:tools'
        }
    });

});

define('sqlreports', ['report_url'], function (reportUrl) {

    return Mn.View.extend({

        template: _.template('<div style="height: 2100px; "><iframe src="<%= report_url %>" style="border: 0;width:100%;height: 99%" id="SqlRepFrame"></iframe></div>'),
        templateContext: function () {
            return {
                report_url: reportUrl + '?pid=' + this.model.id
            };
        },

        onBeforeRender: function () {
            Backbone.Radio.channel('tools').request('get:tools').collection.reset();
        },

        onAttach: function () {
            Backbone.Radio.channel('loader').trigger('hide');
        }
    });

});

define( 'rawresults', [], function () {

    return Mn.View.extend( {

        template: false,

        initialize: function () {

            var side = Backbone.Radio.channel( 'side' ).request( 'get:sidebar' ),
                m = side.collection.get( 'check' ),
                childChecks = side.getChildView( 'children' ).children.findByModel( m ).getChildView( 'children' ),
                cm = childChecks.collection.get( this.options.checkId ),
                cv = childChecks.children.findByModel( cm );

            $.get( '/api/InterestObj/TotalCheck/' + this.model.id ).done( function ( ar ) {

                cv.getChildView( 'children' ).children.each( function ( v, i ) {
                    if ( v.model.id !== 'statistic' )
                        v.model.set( 'count', ' (' + ar[i - 1] + ')' );
                });

            }.bind( this ) );

            Backbone.Radio.channel( 'side' ).request( 'get:sidebar' ).setCurrent( ['check', this.options.checkId, 'statistic'] );
        }

    });

});

define('content:result', ['i18n!nls/resources.min', 'global.view.dialog'], function (Resources, dialog) {

    return Mn.View.extend({

        className: 'workbench--content',
        template: _.template('<div id="content"></div>'),
        templateContext: {
            Resources: Resources
        },

        regions: {
            content: '#content'
        },

        initialize: function () {

            var side = Backbone.Radio.channel( 'side' ).request( 'get:sidebar' );

            Backbone.Radio.channel( 'side' ).reply('sidebar:click:item', function (o) {

                //Backbone.Radio.channel('loader').trigger('show', this.getRegion('content').$el);

                require([o.get('name')], function (view) {

                    if (o.has('checkUid')) {
                        $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.headers.key, { checkuid: o.get('checkUid') });
                        this.options.checkId = o.id;
                    }

                    if (o.has('options'))
                        this.options = Object.assign(this.options, o.get('options'));

                    this.getRegion( 'content' ).show( new view( this.options ) );


                    if ( o.get( 'name' ) === 'statistic' ) {

                        var checkid = this.model.id;

                        SJ.iwc.SignalR.getHubProxy( 'Ticker', { client: {} })
                            .server
                            .startMonitoringTasks( $.ajaxSettings.headers.key, checkid );

                        console.log( "SR > StartMonitoringTasks", checkid );

                        var checks = Backbone.Radio.channel( 'oM' ).request( 'get:app' ).currentChecks;

                        if ( checks.get( checkid ) ) {

                            var lastcheck = side.collection.get( 'check' ).get( 'children' )[1];

                            side.$el.find( '#' + lastcheck.id + '>span' ).append( $( '<i class="loading"></i>' ) );
                        }

                    }


                }.bind(this));
            }.bind(this));

        },

        onRender: function () {

            var checks = Backbone.Radio.channel( 'oM' ).request( 'get:app' ).currentChecks;

            // при запуске проверки
            if ( checks.get( this.model.id ) ) {

                this.model.set( 'searchTasksInfo', checks.get( this.model.id ).get( 'searchTasksInfo' ) );

                Backbone.Radio.channel( 'side' ).request( 'get:sidebar' ).setCurrent( ['check'] );

            } else
                Backbone.Radio.channel( 'side' ).request( 'get:sidebar' ).setCurrent( ['result'/*, 'rep', 'rep1'*/] );

        },

        modelEvents: {

            'change:id': function ( m, id ) {

                if ( id ) {
                    this.model.url = '/api/details/' + this.model.id + '?mode=1';
                    this.model.fetch();
                }

            },

            sync: function () {

                Backbone.Radio.channel( 'loader' ).trigger( 'hide' );

                Backbone.Radio.channel( 'crumbs' ).request( 'add:new:crumb', [
                    { id: 0, title: Resources.ile },
                    { id: 1, path: this.model.get( 'projectId' ), title: this.model.get( "projectName" ) },
                    { id: 2, path: this.model.id, title: this.model.get( "title" ) }] );
            }
        },

        childViewEvents: {

            'show:content': function (name) {

                require([name], function (view) {

                    this.getRegion('content').show(new view(this.options));

                }.bind(this));

            }

        }
        
    });

});