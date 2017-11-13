define('widget:map:legendView', [], function () {

    return Mn.View.extend({

        template: '#widget-map-legend-template',

        ui: {
            container: '.LegendContainer'
        },

        onRender: function () {

            if (!this.model.get('LegendIsVisible'))
                this.$el.hide();

            this.setPosition();
        },

        modelEvents: {

            change: function () {
                this.render();
            }
        },

        setPosition: function () {

            var p = this.model.get('LegendPosition') || 'top-right',
                _p = p.split("-"),
                b = _p[1],
                css = {};

            css[_p[0]] = "1px";
            css[b] = b === "top" ? (36 + "px") : "1px";

            this.ui.container.fadeTo("hide", .8).css(css);
        }
    });
});