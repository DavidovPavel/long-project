define( '@widget.WidgetCloud', ['i18n!nls/resources.min'], function ( Resources ) {


    return Mn.View.extend( {

        template: _.template( '<div></div>' ),
        templateContext: { Resources: Resources },

        regions: {
            graph: { el: 'div', replaceElement: true }
        },

        onAttach: function () {            

            this.data = this.model.get('feed').variations[0].flow[0].points.map(function (a) {

                return {
                    text: a.text,
                    weight: parseInt(a.y),
                    html: {
                        'data-oid': this.model.id + '_' + a.elId,
                        'dir': 'auto'
                    },
                    handlers: {

                        click: function () {

                            let m = new Backbone.Model({ object_id: a.elId });
                            m.set(a);

                            this.model.trigger('click:item', m);

                        }.bind(this)
                    }
                }

            }, this);

            this.$el.height( this.$el.parent().height() );

            this.$el.jQCloud(this.data);

            this._apply();

        },

        onChildviewClickItem: function ( v ) {

            this.model.trigger( 'click:item', v.model );

        },

        modelEvents: {

            'change:width': function () {
                this._fitSize();
            },

            'change:height': function () {
                this._fitSize();
            }

        },

        _apply: function () {

            var pallete = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: 'PaletteByChart' }),
                sset = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: 'WidgetCloud.SubSettings' });

            if (sset && sset.WidgetParamValue) {
                this.$el.css('font-size', sset.WidgetParamValue.minFontSizeCloud + 'px');
            }

            if (pallete) {
                var colors = pallete.WidgetParamValue;

                var pref = this.model.id + '_';

                setTimeout(function () {

                    _.each(colors, function (o) {

                        if (o.color !== "none")
                            this.$('[data-oid=' + pref + o.object_id + ']').css('color', o.color);

                    }, this);

                }.bind(this), 100);
            }
        },

        _fitSize: function () {

            if ( this.st )
                clearTimeout( this.st );

            this.st = setTimeout( function () {

                this.$el.css( { width: this.$el.parent().width(), height: this.$el.parent().height() } );

                this.$el.empty().jQCloud(this.data);

                this._apply();

            }.bind( this ), 500 );

        }


    } );

} );