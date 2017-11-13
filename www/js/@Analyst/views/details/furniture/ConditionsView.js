define([], function () {

    var p = Backbone.View.extend( {

        el: $( ".Furniture" ),

        events: {
            "click .Close": "close"
        },

        close: function () {
            this.$( "#Load" ).empty();
            this.$el.hide( "scale" );
            this.clear();
        },

        clear: function () {
            Backbone.trigger( "storage:clearPlayers" );
        },

        initialize: function () {
            Backbone.on( "window:resizeend", this.render, this );
        },

        render: function () {
            this.$( "#Load" ).height( this.$el.height() - 32 );
            this.$el.width( $( window ).width() / 2 - 50 );
            return this;
        },

        show: function ( data ) {
            this.clear();
            if ( data ) {
                this.currentid = data.cid;
                this.$el.show( "scale", { percent: 100 } );
                data.code.call( this, data.cid, data.param );
            }
            return this;
        }

    } );

    var panel = new p;
    return {
        get: function() {
            return panel.render();
        },
        close: function() {
            panel.$el.hide("scale");
        }
    }

});