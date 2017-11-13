define(['/tinymce/tinymce.min.js'], function () {
    'use strict'
    var template = "<textarea name='Content' class='TinyEditor' style='width: 90%;height: 280px;' id='<%= id %>'><%= text %></textarea>";

    return Backbone.View.extend({
        initialize:function (a) {
            this.text = (a ? a.text : "") || "";
        },
        render: function (plugins) {
            this.$el.html(_.template(template)({ id: this.cid, text:this.text }));
            var s = this;
            setTimeout(function() {
            
            //require(['/tinymce/tinymce.min.js'], function () {
                tinymce.dom.Event.domLoaded = true;
                tinymce.init({
                    selector: "textarea.TinyEditor",
                    content_css: "/content/site.css",
                    relative_urls: false,
                    //menubar: false,
                    plugins: [
        "linkToResponse linkToObject imagelight imagegallery advlist autolink lists link image charmap print preview anchor",
        "searchreplace visualblocks code fullscreen",
        "insertdatetime media table contextmenu paste"
                    ],
                    toolbar: "insertfile undo redo | styleselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image imagelight imagegallery "+ plugins
                });
                //});
                
            }, 1000);
            return this;
        },
        setContent: function () {
            if (tinymce.get(this.cid))
                tinymce.get(this.cid).setContent(this.text);
        },
        getContent:function () {
            return tinymce.get(this.cid).getContent();
        },
        clear: function () {
            var v = tinymce.get(this.cid);
            if (v)
                tinymce.get(this.cid).remove();
            else
                console.log("lost tynyHtml" + this);
        }
    });
});