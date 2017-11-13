define('settings.visualisation.table.fields', [], function () {

    return Mn.View.extend({

        template: _.template('<img  class = "card-example" src = "" />'),
        //if(card) {src = '../../Images/vertical_card.png'}
        //if(card2) {src = '../../Images/horizontal_card.png'}

        onRender: function () {

            this.$el.addClass('container-example');

            if (this.model.get('Visualization') === 'card')
                this.$('img').attr('src', '../../Images/vertical_card.png');
            else
                this.$('img').attr('src', '../../Images/horizontal_card.png');

        },

        onSave: function (callback) {


            callback.call(this);

        }
    });

});