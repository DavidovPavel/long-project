define('project:origin', ['forms.inquiryView'], function (formView) {

    return Mn.View.extend({

        template: _.template('<div></div>'),

        regions: {
            form: 'div'
        },

        onRender: function () {

            this.showChildView('form', new formView);

            if (this.model.id)
                this.getChildView('form').model.set('id', this.model.id);
        },

        initTools: function () {
            Backbone.Radio.channel('tools').request('get:tools').collection.reset();
        }

    });

});