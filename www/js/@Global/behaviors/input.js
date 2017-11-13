define('global.behaviors.input', [], function () {

    return Mn.Behavior.extend({

        ui: {
            input: 'input[type=text].g-form--input',
            clear: 'i.clear',
            switchEdit: '#switch-edit',
            help: 'i.help'
        },

        events: {

            'click .g-tip kbd': function (e) {
                $(e.target).closest('.g-tip').hide();
            },

            'click @ui.help': function (e) {
                $(e.target).next('.g-tip').show().delay(3000).fadeOut();
            },

            'click @ui.clear': function (e) {
                $(event.target).prevAll('input').val('').removeClass('filled');
            },

            'focus @ui.input:not(".disabled")': 'filled',
            'blur @ui.input:not(".disabled")': 'filled',

            'click @ui.switchEdit': function (e) {

                var $e = $(e.target),
                    flag = $e.attr('mode') === 'off';
                $e.attr('mode', flag ? 'on' : 'off');

                this.$form.toggleClass('readonly');
                if (flag)
                    this.$form.find('.inquiry-form--controls .row div:last').show();
                else
                    this.$form.find('.inquiry-form--controls .row div:last').hide();

                _.each(this.ui.input, function (e) {
                    var $e = $(e);

                    if (this.$form.hasClass('readonly'))
                        $e.prop('disabled', true);
                    else
                        $e.prop('disabled', false);

                }, this);
            }
        },

        filled: function (e) {

            var $e = $(e.target);

            if ($.trim($e.val())) {
                $e.addClass('filled');
                this.ui.clear.show();
            }
            else
                $e.removeClass('filled');
        },

        onRender: function () {

            this.$form = null;

            _.each(this.ui.input, function (e) {

                var $e = $(e);

                if ($.trim($e.val()))
                    $e.addClass('filled');

                if ($e.closest('.readonly').get(0) && !this.$form)
                    this.$form = $e.closest('.readonly').eq(0);

                if (this.$form)
                    $e.prop('disabled', true);


            }, this);

            _.each(this.ui.help, function (e) {
                if (!$.trim($(e).next('.g-tip').text()))
                    $(e).hide();
            });

            //
            if (!this.$form) {
                this.ui.switchEdit.hide();
                this.ui.switchEdit.siblings('label').hide();
            } else {
                
            }
        }
    });

});