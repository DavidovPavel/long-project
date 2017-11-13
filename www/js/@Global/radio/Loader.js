define('global.radio.loader', [], function () {

    // size ['', 'l', 'xl']
    // speed [slow, medium, fast]
    // overlay: false 

    const loader = $('<i class="loading" size="xl" speed="medium"></i>'),
        overlay = $('<div class="g-dialog--overlay" style="display:block"></div>');

    var channel = Mn.Object.extend({

        channelName: 'loader',

        radioEvents: {

            show: function ($el, options) {

                this.$el = $el;

                if (!this.$el.find('.loading').get(0)) {

                    loader.css('display', 'block');

                    if (options) {

                        if (_.has(options,'size'))
                            loader.attr('size', options.size);

                        if (_.has(options, 'speed'))
                            loader.attr('speed', options.speed);

                        if (options.overlay)
                            $el.append(overlay);
                    }

                    $el.append(loader);                   

                    this.timeout = setTimeout(() => {

                        let $e = this.$el;
                        if ($e) {
                            $e.find('.loading').remove();
                            $e.find('.g-dialog--overlay').remove();
                        }

                    }, 120000);
                }
            },

            hide: function () {

                let $e = this.$el;

                if ($e) {
                    $e.find('.loading').remove();
                    $e.find('.g-dialog--overlay').remove();
                }

                clearTimeout(this.timeout);
            }

        }

    });

    return new channel;
});