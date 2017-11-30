
define('global:maps:GeoMapGoogleView', ['async!http://maps.google.com/maps/api/js?v=3.22&key=AIzaSyD2WhtWvymVvaSFTjqufGtxBgdEaDQbpEw'], function () {
    
    return Mn.View.extend( {

        template: false,

        onRender: function () {
            this.$el.css( { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, margin: '-20px' });
        },

        onAttach: function () {

            let zoom = this.model.get( "Zoom" ),
                lat = this.model.get( "CenterLat" ),
                long = this.model.get( "CenterLong" ),
                flag = zoom && lat && long,

                bounds = new google.maps.LatLngBounds(),

                mapOptions = {
                    center: new google.maps.LatLng( lat || 55.76, long || 37.64 ),
                    zoom: zoom || 10,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                },

                map = new google.maps.Map( this.el, mapOptions );

            // для сохранения позиции и масштаба

            function setCenter() {

                var zoom = map.getZoom(),
                    center = map.getCenter();

                if (!this.model.get("ReadOnly")) {
                    var m = new Backbone.Model({
                        widget: {
                            name: this.model.get('title'),
                            type: this.model.get('type'),
                            uid: this.model.id,
                            Visualization: this.model.get('Visualization')
                        },
                        CenterLat: center.lat(),
                        CenterLong: center.lng(),
                        Zoom: zoom
                    });
                    m.url = `/api/widget/${this.model.id}/setstate`;
                    m.save();
                }

            };

            google.maps.event.addListener( map, "dragend", setCenter.bind(this) );
            google.maps.event.addListener( map, "zoom_changed", setCenter.bind(this) );

            var shape = {
                coords: [1, 1, 1, 20, 18, 20, 18, 1],
                type: 'poly'
            };

            var infoWindow = new google.maps.InfoWindow();
            var widgetModel = this.model;

            this.collection.each( function ( m ) {

                if ( m.get( 'latitude' ) && m.get( 'longitude' ) ) {

                    var image = {
                        url: m.get( 'markerurl' ),
                        size: new google.maps.Size( 17, 32 ),
                        origin: new google.maps.Point( 0, 0 ),
                        anchor: new google.maps.Point( 0, 32 )
                    };

                    var position = new google.maps.LatLng( parseFloat( m.get( 'latitude' ).replace( ",", "." ) ), parseFloat( m.get( 'longitude' ).replace( ",", "." ) ) );

                    bounds.extend( position );

                    var marker = new google.maps.Marker( {
                        position: position,
                        map: map,
                        icon: image,
                        shape: shape,
                        title: m.get( 'display_name' ),
                        zIndex: 1
                    });

                    google.maps.event.addListener( marker, 'click', ( function ( marker, i ) {

                        return function () {

                            widgetModel.trigger( 'click:item', m );

                            infoWindow.setContent( m.get( 'display_name' ) );
                            infoWindow.open( map, marker );
                        }

                    })( marker ) );

                }

            }, this );

            if ( !flag )
                map.fitBounds( bounds );

        }
    });
});