define(function(require) {

    var Resources = require("i18n!nls/resources.min"),
        template = "<h3><%= title %></h3>" +
            "<div><p class='buttons'><span class='gotoresult'><span class='total'></span>&nbsp;<button class='up'><%= Resources.go %></button></span></p><%= text %><p style='text-align:right;'><i><%= author %></i><br/><a href='<%= url %>' target='_blank'><%= media %>&nbsp;&raquo;</a></p></div>";
    
    var p = Backbone.View.extend({
        events: {
            "click .gotoresult .up": "toresult"
        },
        addOne:function (el) {
            var text = this.getValue("TextSource", el),
                    title = this.getValue("Display_Name", el),
                    author = this.getValue("Author", el),
                    url = this.getValue("URL_источника", el),
                    media = this.getValue("MassMedia", el);

            text = text.replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>");

            this.$el.append(_.template(template)( { Resources: Resources, text:text, title: title, url: url, author: author, media: media }));
        },
        render: function (obj) {
            this.sp = 0;
            this.$el.empty();

            _.each(obj.items, function(el) {
                this.addOne(el);
            }, this);
            
           this.$el.find("button.up").button({
                label: Resources.go,
                icons: {
                    primary: "ui-icon-seek-next"
                },
                text: false
            });

            this.fitLoad();
            this.toresult();
            return this;
        },
        fitLoad: function() {
            this.$el.scrollTop(0);
            this.pd = [];
            var s = this;
            this.$el.find("span[data-oid]").each(function () {
                $(this).addClass("Mark");
                s.pd.push($(this).position().top);
            });
        },
        toresult: function () {
            var pd = this.pd;
            if (pd.length && this.sp != pd.length) {
                this.$el.parent("div").scrollTop(pd[this.sp]);
                this.$el.find("span[data-oid].C").removeClass("C");
                this.$el.find("span[data-oid]").eq(this.sp).addClass("C");

                if (this.sp === pd.length - 1) {
                    this.sp = 0;
                } else {
                    this.sp++;
                }
            } else {
                this.sp = 0;
                this.$el.scrollTop(0);
            }
            
            this.$(".gotoresult .total").html(Resources.Total + "&nbsp;" + Resources.matches + ":&nbsp;" + pd.length);
            
            if (pd.length)
                this.$(".gotoresult").show();
            else
                this.$(".gotoresult").hide();
        },
        getValue: function (sn, el) {
            var output = "", data = el.data;
            for (var j = 0; j < data.length; j++) {
                var v = data[j];
                if (v.systemName === sn) {
                    output = v.value;
                    break;
                }
            }
            return output;
        }
    })
    return new p;
});