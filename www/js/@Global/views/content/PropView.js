define([
'i18n!nls/resources.min',
'@Analyst/views/details/OriginalDocView',
],
function (Resources
    , OriginalView
    ) {

    var template = '<h1><%= title %></h1><div><span class="originallink" style="font-size:1.2em;" data-id="0CA650F2-8D85-4C76-8B02-F4080F75B9DE"><%= Resources.originaldoc %>&nbsp;</span><span id="linkToOriginalFile"></span></div><div class="RubricsLink"></div><br /><div class="HtmlReport"><%= html %></div>';

    var PropModel = Backbone.Model.extend({
        default: function () {
            return {
                id: null,
                uid: "",
                title: "",
                html: "",
                text: "",
                width: 0,
                height: 0,
                level: 3,
                astree: 0,
                filterValue: "",
                filterName: "",
                Rubrics: []
            };
        },
        url: function () {
            return "/api/Details/" + this.id;
        }
    });


    var PropView = Backbone.View.extend({
        delivered: false,
        events: {
            
        },
        docLink: function() {
            if (this.oriDoc) {
                this.oriDoc.render();
            }
        },
        initOriginalData: function() {
            if (this.model.get("issource")) {
                this.$(".originallink").show();
                this.oriDoc = OriginalView.get(this.model);
                this.oriDoc.getLink(null, this.$(".originallink"));
            }
        },
        initialize: function() {
            Backbone.on("smd:datas", this.sync, this);
            this.model = new PropModel();
            this.model.on("sync", this.render, this);
        },
        sync: function() {
            this.$el.showIndicator();
            this.model.fetch();
            return this;
        },
        render: function() {
            this.$el.hideIndicator();
            this.$el.empty();
            var data = this.model.toJSON();            
            data.Resources = Resources;
            this.$el.html(_.template(template)( data));
            Backbone.trigger("issource", this.model.get("issource"));
            var s = this;
            this.$(".originallink").button({ disabled: true }).hide().click(function() {
                s.docLink();
            });

            this.initOriginalData();
            this.$(".dataview a").each(function () {
                if ($(this).attr("object_id")) {
                    var id = $(this).attr("object_id");
                    $(this).click(function (e) {
                        e.preventDefault();
                        Backbone.trigger("general:add", { id: id, title: $(this).text() });
                    });
                }
            });
            if (!this.model.get("html"))
                this.$el.parent("div").children("span.link").unbind("click");

            if (this.feedback) {
                this.feedback.call(this.context, this.model);
            }
            return this;
        },
        done: function(fb, ctx) {
            this.feedback = fb;
            this.context = ctx || this;
            return this;
        }
    });
    var p = new PropView;
    return {
        get: function (oid) {
            if (p.model.id !== oid)
                p.model.set("id", oid);
            else {
                p.render();
            }
            return p;
        }
    }
});
