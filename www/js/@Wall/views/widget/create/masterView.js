define('MasterCreateView',
    ['i18n!nls/resources.min', 'settings.subscribeList', 'requestView', 'settings.visualisation.chart.choice', 'g/ejRTEView', 'settings.decorationWidget', 'syncfusion'],

function (Resources, subscribeList, Requests, visualView, HtmlEditor, decorationView) {

    var MIN_SIZE = 50;

    return Mn.View.extend({

        template: '#widget-create-template',
        templateContext: {
            Resources: Resources
        },

        ui: {
            next: '#next',
            back: '#back'
        },

        regions: {
            reqArea: '.requestParam>section',
            subscrArea: '#Subscribe',
            editor: ".htmlEditor",
            visual: ".visualization",
            decoration: { el: '#decoration', replaceElement: true }
        },

        initialize: function () {

            this.panels = {
                "Default": ["one", "requestParam", "decoration"],
                "WidgetGraph": ["one", "requestParam", "visualization", "decoration"],
                "WidgetSource": ["one", "requestParam", "decoration", "subscribe"],
                "WidgetSemNet": ["one", "requestParam", "decoration", "subscribe"],
                "WidgetReporting": ["one", "requestParam", "decoration", "subscribe"],
                "WidgetHtml": ["one", "requestParam", "decoration", "htmlEditor"]
            };

            this.step = new Backbone.Model( { step: 0 } );
            this.step.on( "change:step", this.checkStep, this );

            this.publishers = new Backbone.Collection();
        },

        onRender: function () {
            this.step.set( "step", 1 );
        },

        events: {

            "keyup #titleWidget": "checkTitle",

            "blur #titleWidget": "checkTitle",

            "mouseover .types-widget span": function ( e ) {

                var name = $( e.target ).closest( "span" ).attr( "id" ),
                    data = {
                        "WidgetTable": Resources.WidgetTable,
                        "WidgetRunning": Resources.WidgetRunning,
                        "WidgetMap": Resources.WidgetMap,
                        "WidgetGraph": Resources.WidgetGraph,
                        "WidgetCloud": Resources.WidgetCloud,
                        "WidgetSource": Resources.WidgetSource,
                        "WidgetReporting": Resources.WidgetReporting,
                        "WidgetHtml": Resources.WidgetHtml,
                        "WidgetSemNet": Resources.WidgetSemNet
                    };

                if ( this.step.get( "step" ) === 1 )
                    this.$( ".one>.description" ).html( data[name] ).fadeIn();
            },

            "mouseleave .types-widget span": function() {
                this.$( ".one>.description" ).hide();
            },


            "click .types-widget span": function ( a ) {

                var $s = $( a.target ).closest( "span" );

                this.model.set( "typeName", $s.attr( "id" ) );
                this.isInitRequest = false;
                this.next();
            },

            "click @ui.back": function () {

                var step = this.step.get( "step" );

                if ( step > 1 ) {
                    step--;
                    this.step.set( "step", step );
                }
            },

            "click @ui.next":'next',

            "click nav>div": function ( e ) {

                this.$( "nav>div" ).toggleClass( "ac" );
                this.$( ".tab-content" ).toggleClass( "show" );

            },

            "click #decor-chbx span.font-icon-checkbox": function ( e ) {

                var $c = $( e.target ).closest( "span" ),
                    inpt = $c.find( "input" ).get( 0 );

                $c.toggleClass( "checked" );

                inpt.checked = !inpt.checked;

            },
        },

        modelEvents: {

            change: function () {

                this.ui.next.attr( 'disabled', !this.model.isValid() );
            },

            'change:width': function (m, v) {
                this.$( 'input[name="width"]' ).val( v );
            },

            'change:height': function (m, v) {
                this.$( 'input[name="height"]' ).val( v );
            }
        },

        childViewEvents: {

            'chart:selected': function (v) {
                this.ui.next.attr('disabled', false);
            }
        },

        next: function () {            

            var step = this.step.get("step");
            step++;
            this.step.set( "step", step );

        },

        checkTitle: function () {

            this.model.set("title", $.trim(this.$("#titleWidget").val()));

        },

        checkStep: function () {

            this.$el.closest('.side-panel').removeClass('big');

            var s = this.step.get("step"),
                p = this.panels[this.model.get("typeName")] || this.panels["Default"];

            if (p.indexOf("htmlEditor") !== -1 && this.getRegion('editor').hasView())
                this.model.set("contentHtml", this.getChildView('editor').ejRTE.getHtml());

            if (s >= 0 && s <= p.length) {

                this.ui.next
                    .text( s === p.length ? Resources.createdWidget : Resources.next )
                    .attr( 'disabled', !this.model.isValid() );

                this.ui.back.attr( 'disabled', s === 1 );

                this.$(".step-panel").hide();
                var panelName = p[s - 1];
                this.$("." + panelName).show();


                if (s === 1) 
                    this.$(".cmd").hide();
                else
                    this.$(".cmd").show();

                switch ( panelName ) {

                    case "requestParam":

                        this.showChildView( 'reqArea', new Requests( { model: this.model } ) );

                        break;

                    case "visualization":

                        this.$el.closest('.side-panel').addClass('big');
                        this.ui.next.attr('disabled', true);
                        this.showChildView('visual', new visualView({ model: this.model }));

                        break;

                    case "subscribe":

                        if ( !this.getRegion( 'subscrArea' ).hasView() ) {

                            var ss = new subscribeList( { collection: this.model.collection } );

                            this.getRegion( 'subscrArea' ).show( ss );

                            this.listenTo( ss, 'click:item:subscribe', function ( v ) {

                                if ( !v.$( 'input' ).is( ':checked' ) ) {

                                    v.$( 'input' ).prop( 'checked', true );
                                    this.publishers.add( new Backbone.Model( { id: v.model.id, title: v.model.get( 'title' ) } ) );
                                } else {

                                    v.$( 'input' ).prop( 'checked', false );
                                    this.publishers.remove( this.publishers.get( v.model.id ) );
                                }
                            } );
                        }
                        break;

                    case "htmlEditor":

                        if ( !this.getRegion( 'editor' ).hasView() )
                            this.showChildView( 'editor', new HtmlEditor );

                        break;

                    case "decoration":

                        if (!this.getRegion('decoration').hasView())
                            this.showChildView('decoration', new decorationView({ model: this.model }));

                        break;

                }

            } else if (s > p.length) {

                if (this.publishers.length)
                    this.model.set("publishers", this.publishers.pluck("id"));

                this.getDecoration();

                var win = $('main');

                this.model.set({
                    top: win.height() / 2 - this.model.get('height') / 2 + win.scrollTop(),
                    left: win.width() / 2 - this.model.get('width') / 2 + win.scrollLeft()
                });

                this.model.collection.create(this.model, { wait: true });

                this.getRegion('reqArea').empty();
                this.getRegion('subscrArea').empty();

                this.triggerMethod("close:left", this.model);
            }
        },

        getDecoration: function () {

            var output = this.model.get( 'Decoration' ) || {},

                w = parseInt( this.$( 'input[name="width"]' ).val() ),
                h = parseInt( this.$( 'input[name="height"]' ).val() );

            this.model.set( {
                width: isNaN(w) ? this.model.get('width') : w < MIN_SIZE ? MIN_SIZE : w,
                height: isNaN(h) ? this.model.get('height') : h < MIN_SIZE ? MIN_SIZE : h
            } );

        }

    });
});