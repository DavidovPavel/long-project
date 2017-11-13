define([
    "i18n!nls/resources.min",
    //'views/details/PropView',
    //'g/ContentView',
    "syncfusion"
],
function (
    Resources
    //PropView,
    //ContentView
) {

    /*
        попытка сделать окно просмотра 
        просматриваемые объекты сохраняются в историю
        и доступны для просмотра    
    */

    var template = '<h3><%= title %></h3><p><span class="link ToObject" data-id="<%= id %>"><%= Resources.gotoobject %></span></p><div class="ContainerTab"><ul><li class="Details" data-title="Props" data-id="FBB44316-1A0C-450A-8DC6-A1D10F560C01"><span></span><a href="#Props"><%= Resources.titleProp %></a></li><li class="Links" data-title="LinksToDocs" data-id=""><span></span><a href="#LinksToDocs"><%= Resources.linkToDocuments %></a></li><li class="Content" data-title="Content" data-id="E7087740-A79F-493C-8B46-77BDBB8EA74E"><span></span><a href="#Content"><%= Resources.content %></a></li></ul><div id="Props"></div><div id="LinksToDocs"></div><div id="Content"></div></div>';

    var detailsObject = Backbone.View.extend({
        className: "DetailItem",
        events: {
            "click .ToObject":"toObject"
        },
        initialize: function() {
            this.model.set("view", this);
        },
        render: function () {
            var data = this.model.toJSON();
            data.Resources = Resources;
            this.$el.html(_.template(template)( data));
            this.$el.attr("data-oid", this.model.id);
            var s = this;
            this.$(".ContainerTab").ejTab({
                itemActive: function(a) { s.active(a); }
            });
            return this;
        },
        toObject: function (e) {
            var id = $(e.target).attr("data-id");
            Backbone.trigger("goto:object", id);
        },
        active: function (a) {
            Backbone.trigger("storage:clearPlayers");
            var title = $(a.activeHeader).data("title"),
                $e = this.$("#" + title),
                objID = parseInt(this.model.id);
            
            switch(title) {
                case "Props":
                    if (!this.isInitProps) {
                        this.isInitProps = true;
                        PropView.get(objID).setElement($e).sync().done(this.final, this);
                    }
                    break;
                case "LinksToDocs":
                    if (!this.isInitLinks) {
                        this.isInitLinks = true;
                        var cv = new ContentView({ objID: objID, url: "/api/facts/InSources/" + objID }).setElement($e).render().done(this.final, this);
                        this.listenTo(cv, "action", this.final);
                    }
                    break;
                case "Content":
                    if (!this.isInitContent) {
                        this.isInitContent = true;
                        new ContentView({ objID: objID }).setElement($e).render().done(this.final, this);
                    }
                    break;
            }
        },
        final:function() {
            if (this.callback)
                this.callback.call(this.context, this.$el);
            return this;
        },
        done:function(cb, ctx) {
            this.callback = cb;
            this.context = ctx || this;
            return this;
        }
    });

    return Backbone.View.extend({
        el: $("#DetailsInWindow"),
        add: function (o) {
            if (!this.dialog.isOpened())
                this.dialog.open();

            //new detailsObject({ model: o }).render().done(function ($p) {
            //    this.$(".DetailItem").hide();
            //    this.dialog.option("title", o.get("title"));
            //    $p.show();
            //    this.dialog.element.prepend($p);
            //    this.dialog.restore();
            //}, this);
            
        },
        gotoItem:function(o) {
            if (!this.dialog.isOpened())
                this.dialog.open();
            this.$(".DetailItem").hide();
            this.$(".DetailItem[data-oid='" + o.id + "']").show();
        },
        initialize:function() {
            this.collection = new Backbone.Collection();
            this.collection.on("add", this.add, this);

            Backbone.on("general:add", function (o) {

                if (!this.dialog.isOpened())
                    this.dialog.open();

                new ContentView({ objID: o.id })
                    .setElement(this.$el)
                    .done(function (view) {

                    }.bind(this))
                    .render();

                //if (!this.collection.get(o.id))
                //    this.collection.add(o);
                //else this.gotoItem(o);

            }, this);
        },
        
        render: function () {
            var w = $(window).width() / 2 - 100,
                h = $(window).height() - 100;
            
            this.$el.ejDialog({
                width: w,
                height: h,
                position: {X:20, Y: 20},
                actionButtons: ["close", "collapsible", "maximize", "minimize", "pin"],
                close: this.onDialogClose,
                resizeStop: this.resizeStop,
                enableResize: true,
                isResponsive: true,
                showOnInit:false,
                content: "body"
            });
            this.dialog = this.$el.data("ejDialog");

            //this.$("#sliderContent").ejRotator({
            //    slideWidth: $(window).width() / 2 - 180,
            //    slideHeight: $(window).height() - 320,
            //    displayItemsCount: "1",
            //    navigateSteps: "1",
            //    enableResize: true,
            //    pagerPosition: ej.Rotator.PagerPosition.TopRight,
            //    orientation: ej.Orientation.Horizontal,
            //    showPager: true,
            //    enabled: true,
            //    showCaption: false,
            //    showNavigateButton: false,
            //    animationType: "slide",
            //    enableRTL: true,
            //    create:this.createRotator
            //});
            //this.rotator = this.$("#sliderContent").data("ejRotator");
            
            return this;
        },
        resizeStop:function() {
            
        },
        onDialogClose:function() {
            Backbone.trigger("storage:clearPlayers");
        }
    });
});