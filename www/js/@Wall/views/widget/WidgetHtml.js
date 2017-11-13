define('@widget.WidgetHtml', ['app'], function (App) {

    return Mn.View.extend({

        template: _.template('<div dir="auto"><%= contentHtml %></div>'),

        ui: {
            oid: 'span[data-oid]'
        },

        onRender: function () {

            var output = '';

            if (this.collection.length === 1) {
                output = this.collection.at(0).get('display_name');

            } else {

                output = '<table>';

                this.collection.each(function (e) {

                    output += '<tr>';

                    _.each(e.attributes, function (a) {

                        if (!_.isObject(a))
                            output += '<td>' + (a ? a : '') + '</a>';

                    }, this);

                    output += '</tr>';

                }, this);

                output += '</table>';
            }

            this.ui.oid.html( output );

            var Decoration = this.model.get( 'Decoration' );
            this.$el.css( { color: Decoration.ContainerForeground } );
            this.$el.find( "a" ).css( { "background-color": Decoration.LinkBackground, "color": Decoration.LinkForeground } );

        }


    })

})