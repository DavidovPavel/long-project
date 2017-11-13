define(function(require) {

    var Backbone = require('backbone');
    return Backbone.View.extend({
        initialize: function () {
            this.data = this.options.items;
            var s = this;
            require(['http://api-maps.yandex.ru/2.1/?lang=ru-RU'], function () {
                var template = "<div class='Hint'><div>{{ properties.object }}</div></div>";
                s.ymaps = this.ymaps;
                this.ymaps.ready(function () {
                    s.HintLayout = ymaps.templateLayoutFactory.createClass(template, {
                        getShape: function () {
                            var el = this.getElement(),
                                result = null;
                            if (el) {
                                var firstChild = el.firstChild;
                                result = new ymaps.shape.Rectangle(
                                    new ymaps.geometry.pixel.Rectangle([
                                        [0, 0],
                                        [firstChild.offsetWidth, firstChild.offsetHeight]
                                    ])
                                );
                            }
                            return result;
                        }
                    }
                );
                    s.collection = new this.ymaps.GeoObjectCollection({}, {});
                    s.$el.width(s.$el.parent().width());
                    s.$el.height(s.$el.parent().height());
                    s.myMap = new ymaps.Map(s.el, {
                        center: [55.76, 37.64],
                        zoom: 6
                    });
                    s.mapInit = true;
                    s.render();
                });
            });
        },
        resize:function () {
            this.myMap.container.getElement().style.width = this.$el.parent().width() + 'px';
            this.myMap.container.getElement().style.height = this.$el.parent().height() + 'px';
            this.myMap.container.fitToViewport();
        },
        render: function () {
            if (this.data) {
                this.collection.removeAll();
                this.myMap.geoObjects.removeAll();
                _.each(this.data, function (o) {
                    var a = this.getObj(o);
                    if (a.Latitude && a.Longitude) {
                        var p = new this.ymaps.Placemark([parseFloat(a.Latitude), parseFloat(a.Longitude)], {
                                //placeid: a.placeId,
                                object: a.Display_Name
                            }, {
                                iconLayout: 'default#image',
                                //iconImageHref: '/images/mapsprite.png',
                                //iconImageSize: [50, 70],
                                //iconImageOffset: [-12, -36],
                                hintLayout: this.HintLayout
                            });
                        p.events.add(["click"], function(e) {
                            Backbone.trigger("map:point", a.Object_ID);
                        });
                        this.collection.add(p);
                    }
                }, this);
                this.myMap.geoObjects.add(this.collection);
                this.myMap.setBounds(this.myMap.geoObjects.getBounds());
            }
            return this;
        },
        getObj:function (o) {
            var data = o.data, output = { };
            for (var i = 0; i < data.length; i++) {
                var el = data[i];
                output[el.systemName] = el.value;
            }
            return output;
        }
    })

});