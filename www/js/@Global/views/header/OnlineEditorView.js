'use strict';
define(['syncfusion'], function () {
    
    var template = '<div><span class="ui-icon ui-icon-circle-close"></span><h3>Edit</h3></div><p><select name="Kind"><option value="">Select the type of content</option><option value="1">default</option><option value="2">special</option><option value="3">key</option></select>&nbsp;<input type="text" name="ClientUID" placeholder="Client UID" /><input type="text" name="DBIDs" placeholder="DB IDs" /><button class="ShowContent">Show Content</button>&nbsp;<button class="ClearContent">Clear Content</button></p><div class="htmlEditor"><textarea></textarea></div><p><button class="save">Save</button></p>';
    
    return Backbone.View.extend({
        el:$("#OnlineEditor"),
        events: {
            "click .save": "save",
            "click .ShowContent": "kind",
            "click .ClearContent": "clear",
            "click .ui-icon-circle-close": "hide"
        },
        hide:function() {
            this.$el.hide();
        },
        getUrl:function () {
            var dc = this.$("input[name='ClientUID']").val(),
                ddb = this.$("input[name='DBIDs']").val();
            return "/api/common/" + this.kind + "/" + this.guid + "/" + (dc ? dc : "0") + "/" + (ddb ? ddb : "0");
        },
        clear: function () {
            this.$("select[name='Kind']").css("border-color", "");
            this.kind = this.$("select[name='Kind']").val();
            if ($.trim(this.kind)) {
                this.model.set("id", 1);
                this.model.url = this.getUrl();
                this.model.destroy();
            } else 
                this.$("select[name='Kind']").css("border-color", "red");
        },
        clearContent:function() {
            this.$o.html("");
            this.editor.setHtml("");
        },
        kind: function () {
            this.$("select[name='Kind']").css("border-color", "");
            this.kind = this.$("select[name='Kind']").val();
            if ($.trim(this.kind)) {
                this.model.url = this.getUrl();
                this.getContent();
            } else
                this.$("select[name='Kind']").css("border-color", "red");
        },
        save: function () {
            this.$("select[name='Kind']").css("border-color", "");
            
            var $o = this.$o,
                html = this.editor.getHtml();

            this.model.set("Html", html);
            this.model.set("ForClientsOnly", this.$("input[name='ClientUID']").val());
            this.model.set("ForDBsOnly", this.$("input[name='DBIDs']").val());

            this.kind = this.$("select[name='Kind']").val();
            if ($.trim(this.kind)) {
                this.model.url = "/api/common/" + this.kind + "/" + this.guid;
                this.model.save({}, {
                    success: function () { $o.html(html); }
                });
            } else
                this.$("select[name='Kind']").css("border-color", "red");
        },
        initialize: function () {
            this.isInit = this.$el.get(0);
            this.model = new Backbone.Model();
            this.model.on("destroy", this.clearContent, this);
            Backbone.on("info:hide", this.hide, this);
        },
        render: function () {
            if (!$("#OnlineEditor").get(0)) return this;
            this.$el.html(template);
            if (this.isInit) {
                this.$el.draggable({ handle: "div.ui-widget-header" });
                this.$el.resizable();
                this.editor = this.$(".htmlEditor>textarea").ejRTE({ width: "100%", height: "508px" }).data("ejRTE");
            }

            $("body").on("click", "*[data-sec='true']", function () {
                this.show($(this));
            }.bind(this));
            return this;
        },
        show: function ($o) {
            if (this.isInit) {
                this.$o = $o;
                this.guid = $o.data("secid");
                this.$el.show();
            }
            return this;
        },
        getContent: function () {
            $.get(this.model.url).done(function (d) {
                if (d) {
                    this.editor.setHtml(d.data[1].value);
                }
            }.bind(this));
        }
    });
});