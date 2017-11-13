define('global.files.attachFile', ['i18n!nls/resources.min'], function (Resources) {

    // старая верстка, требуется jquery.form.js


    var template = '<span class="dropdown-menu_arrow"></span>'+
                     '<span class="dropdown-menu_close hide-attach-manage"><span class="icon-close" data-icon="icon-close-l"></span></span>'+
                     '<div class="menu-info-message"><div class="form-group">'+
                             '<label for="add-files"><%= Resources.addfiles %></label>'+
                             '<div id="uploadFileBlock" data-id="CE669C9B-4E43-4E24-B968-D97679A5A1A0">'+
                                 '<form id="uploadFile" method="post" enctype="multipart/form-data">'+                                
                                     '<label class ="uploadbutton">'+
                                         '<div class="button blue"><span data-icon="icon-import"></span></div>' +
                                         '<div class="button"><span data-icon="icon-folder"></span></div>' +
                                         '<div class ="input"><%= Resources.selFile %></div><input type="file" name="fileToUpload" id="fileToUpload" />'+
                                     '</label></form>'+
                                 '<div class="percent">0%</div>'+
                                 '<div class="progress"><div class="bar"></div></div>'+
                             '</div></div></div>'+
                     '<div class="list-cmd-panel"></div>';

    return Backbone.View.extend({

        events: {         
            "click .clear": "clear",
            "change #uploadFile input": "onchangefile"
        },

        onchangefile: function (e) {
            var v = e.target.value;
            e.target.previousSibling.innerHTML = v;
            if ($.trim(v)) {
                var segm = v.split("\\"),
                    name = segm[segm.length - 1],
                    ex = this.collection.get(name);
                if (!ex)
                    this.$("#uploadFile").submit();
            }
        },

        valid: function () {
            this.$("#uploadFile").css("border-color", "");
            var v = this.$("#fileToUpload").val();
            if ($.trim(v)) {
                var segm = v.split("\\"),
                    name = segm[segm.length - 1],
                    ex = this.collection.get(name);
                if (!ex)
                    this.$("#uploadFile").submit();
            } else {
                this.$("#uploadFile").css("border-color", "red");
            }
        },

        clear: function (e) {
            var name = $(e.target).closest("div").attr("data-name"),
                model = this.collection.get(name);
            this.collection.remove(model);
            this.setModel();
        },

        initialize: function (o) {
            this.collection = new Backbone.Collection();
            this.collection.model = Backbone.Model.extend({ idAttribute: "FileName" });
            this.collection.on("add", this.change, this);
            this.collection.on("remove", this.change, this);
            this.collection.on("reset", this.list, this);            
        },

        render: function () {

            this.$el.html(_.template(template)( {Resources:Resources}));

            //if (App.check(this.$("#uploadFileBlock"))) {

                this.$('#uploadFileBlock').show();
                this.$("#uploadFile").attr("action", ("/api/common/upload/?st=1"));

                var s = this,
                    $bar = this.$('.bar'),
                    $percent = this.$('.percent');

                $bar.width(0);
                $percent.html("0%");

                this.$("#fileToUpload").val("");

                this.$('#uploadFile').ajaxForm({
                    beforeSend: function () {
                        var percentVal = '0%';
                        $bar.width(percentVal)
                        $percent.html(percentVal);
                        //this.error();
                    },
                    uploadProgress: function (event, position, total, percentComplete) {
                        var percentVal = percentComplete + '%';
                        $bar.width(percentVal)
                        $percent.html(percentVal);
                    },
                    success: function () {
                        var percentVal = '100%';
                        $bar.width(percentVal)
                        $percent.html(percentVal);
                    },
                    complete: function (xhr) {
                        var segm = this.$("#fileToUpload").val().split("\\"),
                            name = segm[segm.length - 1];
                        _.map(xhr.responseJSON, function (path) {
                            this.collection.add({ FileName: name, FilePath: path });
                        }, this);
                        this.setModel();
                        this.$("#fileToUpload").val("");
                        this.$("#fileToUpload").prev(".input").text("");
                        setTimeout(function () {
                            $bar.width(0);
                            $percent.html("0%");
                        }, 1000);
                    }.bind(this)
                });
            //} else {
            //    this.$('#uploadFileBlock').hide();
            //}
            
            return this;
        },

        setModel: function () {
            this.output = {}
            this.collection.each(function (m) {
                this.output[m.get("FileName")] = m.get("FilePath");
            }, this);
            if (this.model)
                this.model.set("AttacheedFiles", this.output);
            return this;
        },

        change: function () {
            this.list();
            this.trigger("change:collection");
        },

        list: function () {
            this.$(".list-cmd-panel").empty();
            this.collection.each(function (m) {
                this.$(".list-cmd-panel").append(_.template(
                   "<div data-name='<%= FileName %>'><span><%= FileName %></span><span class='cmd'>"+
                    "<a href='<%= FilePath %>' target='_blank' class='view'><span data-icon='icon-eye'></span></a>"+
                    "<button type='button' class='clear'><span data-icon='icon-close-l'></span></button>"+
                    "</span></div>"
                    )(m.toJSON()));
            }, this);            
        }
    });

});