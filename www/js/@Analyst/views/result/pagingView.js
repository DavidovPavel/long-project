define([
'app',
'i18n!nls/resources.min'
],
function( App,            Resources) {

        var pagingTemplate = "<div class='all'><%= Resources.Total %>: <span></span></div><span class='tostart'>...</span><span class='pages'></span><span class='toend'>...</span>&nbsp;&nbsp;<span class='wallpage'><%= Resources.pages %>: <span class='allpage'></span></span>";

        return Backbone.View.extend({
            className: "Paging",
            perpage: 30,
            count: 0,
            viewpage: 3,
            events: {
                "click .tostart": "start",
                "click .toend": "end",
                "click span[pagenum]": "page"
            },
            start:function () {
                this.current--;
                this.go();
            },
            end:function () {
                this.current++;
                this.go();
            },
            page:function (e) {
                this.current = $(e.target).attr("pagenum");
                this.go();
            },
            go:function () {
                this.trigger("list:topage", parseInt(this.current));
                this.select();
                //this.render();
            },
            initialize: function () {
                this.current = parseInt(App.Select.get("page")) || 1;
                //this.listenTo(this.$list, "parent:resize", function () { this.$list.height(this.$list.height() - 55); });
            },
            select: function () {
                var index = this.current;
                this.$(".pages span.active").removeClass("active");
                this.$(".pages span").each(function () {
                    if ($(this).attr("pagenum") == index) $(this).addClass("active");
                });
            },
            render: function (o) {
                if (o.current)
                    this.current = o.current;
                
                this.$list = o.$list;
                this.count = o.totalItems;

                if (this.count < this.perpage)
                    this.$el.hide();
                else {
                    this.$el.show();
                }
                
                var pages = Math.ceil(this.count / this.perpage);
                if (pages > 1) {
                    this.$list.css("overflow", "auto").height(this.$list.height() - 55);
                    this.$el.html(_.template(pagingTemplate)( { Resources: Resources }));
                    var $p = this.$(".pages");
                    $p.empty();
                    var start = this.current > this.viewpage ? this.current - this.viewpage : 1;
                    var end = parseInt(this.current) > this.viewpage ? parseInt(this.current) + this.viewpage : this.viewpage * 2;
                    if (end > pages) end = pages;

                    if (start === 1) this.$(".tostart").hide();
                    else
                        this.$(".tostart").show();

                    if (end === pages) this.$(".toend").hide();
                    else
                        this.$(".toend").show();

                    this.$("div.all span").text(this.count);
                    this.$(".allpage").text(pages);

                    for (var i = start; i <= end; i++) {
                        var el = $("<span>" + i + "</span>").attr("pagenum", i);
                        if (i === parseInt(this.current)) el.addClass("active");
                        $p.append(el);
                    }
                }
                return this;
            }
        });
    });