define(function(require) {

    var Resources = require('i18n!nls/resources.min'),
        pagingTemplate = require('text!templates/list/pagingTemplate.html');

    return Backbone.View.extend({
        className: "Paging",
        events: {
            "click .tostart": "start",
            "click .toend": "end",
            "click span[pagenum]": "page"
        },
        start: function() {
            this.current--;
            this.go();
        },
        end: function() {
            this.current++;
            this.go();
        },
        page: function(e) {
            this.current = $(e.target).attr("pagenum");
            this.go();
        },
        go: function() {
            this.select();
            this.trigger("list:topage", parseInt(this.current));
        },
        initialize: function () {
            this.current = 1;
            this.totalItems = 0;
            this.perpage = this.options.perpage || 30;
            this.viewpage = this.options.viewpage || 3;
        },
        select: function() {
            var index = this.current;
            this.$(".pages span.active").removeClass("active");
            this.$(".pages span").each(function() {
                if ($(this).attr("pagenum") == index) $(this).addClass("active");
            });
        },
        render: function() {
            this.$el.html(_.template(pagingTemplate)( { Resources: Resources }));
            if (this.totalItems < this.perpage)
                this.$el.hide();
            else
                this.$el.show();

            var pages = Math.ceil(this.totalItems / this.perpage);
            if (pages > 1) {

                var $p = this.$(".pages"),
                    start = this.current > this.viewpage ? this.current - this.viewpage : 1,
                    end = parseInt(this.current) > this.viewpage ? parseInt(this.current) + this.viewpage : this.viewpage * 2;
                
                if (end > pages) end = pages;

                if (start === 1) this.$(".tostart").hide();
                else
                    this.$(".tostart").show();

                if (end === pages) this.$(".toend").hide();
                else
                    this.$(".toend").show();

                this.$("div.all span").text(this.totalItems);
                this.$(".allpage").text(pages);

                $p.empty();
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