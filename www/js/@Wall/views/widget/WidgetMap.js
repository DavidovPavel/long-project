define('@widget.WidgetMap', ['global:maps:GeoMapGoogleView', 'widget:map:legendView'], function (GeoMap, legendView) {

    return Mn.View.extend({

        template: _.template('<div class="legend"></div><div class="map"></div>'),

        regions: {
            legend: { el: '.legend', replaceElement: true },
            map: { el: '.map', replaceElement: true }
        },

        onRender: function () {

            this.showChildView('map', new GeoMap({
                model: this.model,
                collection: this.collection
            }));

            var data = this.model.get('Legend');
            if (data && data.LegendIsVisible)
                this.showChildView('legend', new legendView({ model: new Backbone.Model(data) }));

        }

    })

})