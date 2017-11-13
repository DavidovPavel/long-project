
define(['syncfusion'], function () {

    var BrowsingView = Backbone.View.extend({

        initialize: function () {
            this.isOpen = false;
            if (!this.isRender) {
                this.isRender = true;
                this.render();
            }
        },

        render: function () {
            this.$el = $("<div id='BrowserWin'></div>");
            $("body").append(this.$el);

            this.d = this.$el.ejDialog({
                showOnInit: false,
                zIndex: 9999999,
                position: { X: '30%', Y: 100 + $(window).scrollTop() },
                //width: 550,
                maxHeight: $(window).height() - 200,
                minWidth: 785,
                minHeight: 215,
                close: this.end.bind(this),
                target: "body",
                resizeStop: function (a) {
                    this.d.restore();
                    this.trigger("browsing:resize", {
                        width: a.model.width,
                        height: a.model.height - (a.model.showHeader ? this.d.wrapper.find(".e-titlebar").outerHeight() : 0)
                    });
                }.bind(this)
            }).data("ejDialog");

            $(window).scroll(function () {
                this.$el.ejDialog({ position: { Y: $(window).scrollTop() } });
            }.bind(this));
           
            return this;
        },

        set:function(o){
            this.$el.ejDialog(o);
        },

        show: function () {
            if(!this.isOpen){
                this.isOpen = true;
                this.$el.ejDialog("open");
                //$("#BrowserWin_wrapper").css("z-index", 9999999);
            }
            return this;
        },

        hide:function(){
            if (this.isOpen) {
                this.isOpen = false;
                this.$el.ejDialog("close");
            }
        },

        start: function (title) {
            if (title) {
                this.$el.ejDialog({ title: title });                
                this.show();
            }
            return this;
        },

        end: function () {
            this.isOpen = false;
            return this;
        }
    });
    var Browsing = new BrowsingView;
    return Browsing;
});