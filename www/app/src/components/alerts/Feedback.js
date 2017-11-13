define('Feedback', ['i18n!nls/resources.min'], function (Resources) {

    var template = `<div class="g-dialog--header">
        <div class ="g-dialog--title" data-icon="icon-attention"><%-Resources.alert %></div>
        <div class="g-dialog--manage">
            <i class="close"></i>
        </div>
    </div>
    <div class="g-dialog--container">
        <div class ="g-dialog--content"><%= html %></div>
        <div class="g-dialog--sidebar"></div>
    </div>`;

    return Mn.View.extend({

        className: 'g-dialog--wrapper',

        el: '#feedback-alerts-panel',

        template: _.template(template),
        templateContext:{
            Resources:Resources
        },

        events: {
            "click .close": function () { this.$el.hide(); }
        },

        onRender () {

            window.sendresult = this.send.bind(this);
            window.SetResult = this.send.bind(this);
            window.SetSubResult = this.send.bind(this);
            window.captcha = function () {
                var text = $.trim(this.$("input[type=text]").val());
                if (text)
                    this.send(text);
            };

            this.$el.show();
        },

        send: function ( result ) {

            var r = { result: result },
                senddata = { modelid: this.model.id, modeltypeid: this.model.get( "typeid" ) };

            var hub = SJ.iwc.SignalR.getHubProxy( 'Ticker', { client: {} });

            hub.server.sendMessage( r, senddata.modelid, senddata.modeltypeid );

            if ( this.model.collection )
                this.model.collection.remove( this.model );

            this.$el.hide();

        }
    });
});