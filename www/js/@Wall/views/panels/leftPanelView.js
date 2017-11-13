define('leftPanel', ['WidgetModel', 'MasterCreateView'], function (WidgetModel, MasterCreateView) {

    return Mn.View.extend({

        className: 'side-panel',
        template: _.template('<svg class="svg-icon icon-close"><use xlink:href="#icon-close" /></svg><section id="master-create"></section>'),

        events: {
            'click .icon-close': function () {
                this.$('.step-panel').hide();
                this.$el.removeClass('big').removeClass("show");
            }
        },

        regions: {
            master: "#master-create"
        },

        initialize: function () {

            this.model = new WidgetModel;

            Backbone.Radio.channel('Mode').reply('left:init:model', function (v) {
               
                this.collection = v.collection;

            }.bind(this));

        },

        onRender: function () {
            this.$el.attr('id', 'left-property');
        },

        onShow: function () {

            this.model = new WidgetModel;
            this.model.collection = this.collection;

            if (!this.$el.hasClass("show")) {
                this.$el.addClass("show")
                this.showChildView('master', new MasterCreateView({ model: this.model }));
            }

        },

        onChildviewCloseLeft: function () {
            this.$el.removeClass('show');
            this.getRegion('master').empty();
        }
    });

});