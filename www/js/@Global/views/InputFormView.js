define('c/InputFormView',
    [
    'i18n!nls/resources.min',
    'global.behaviors.input'
    ],
function (Resources, inputBehavior) {

    var template =
'<input type="text" id="input" name="" value="" class="g-form--input" placeholder="<%= Resources.nameVidget %>"><label for="input"><%= Resources.nameVidget %></label><i class="add rtl-1"></i><i class="clear rtl-2"></i>';

    return Mn.View.extend({

        behaviors:[inputBehavior],

        tagName: 'span',
        className: 'g-form--input',
        template: _.template(template),
        templateContext: {
            Resources: Resources
        },

        events:{
            'click .clear': function () {
                this.$('input').val('');
            }
        },

        triggers: {
            'click .add': 'input:click:add'
        }
    });

});