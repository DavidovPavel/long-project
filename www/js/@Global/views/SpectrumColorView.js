
define('spectrumColorView', [ 'i18n!nls/resources.min', 'dist/color/spectrum.min' ], function (Resources, spectrum) {
    
    return Backbone.View.extend({

        tagName:"input",

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.spectrum({
                color: this.$el.val(),
                showAlpha: true,
                showInput: true,
                chooseText: Resources.choose,
                cancelText: Resources.cancel,
                replacerClassName: 'awesome',
                preferredFormat: "rgb",
                change: this.change.bind(this)
            });
            return this;
        },

        change: function (color) {
            this.trigger("change:color", this.$el, color.toRgbString(), this.$el.attr("name"))
        }
    });
});