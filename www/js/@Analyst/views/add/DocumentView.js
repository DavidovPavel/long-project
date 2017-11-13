define([
    "app",
    'i18n!nls/resources.min',
    "@/views/add/AddView",    
    "g/ejRTEView",
    "text!@/templates/add/document.html",
    "@/views/Tree/TreeView"
], 
function (App, Resources, Add, HtmlEditor, template, Tree) {

    return Add.extend({

        el: $("#NextPage .Document"),

        addEvents: {
            "click .clear": "clear",
            "click button.send": "send"
        },

        clear:function () {
            this.$("input").css("border-color", "");

            var $bar = this.$('.bar'),
                $percent = this.$('.percent'),
                $status = this.$('#status');

            $status.empty();
            $bar.width(0);
            $percent.html("0%");
        },

        reloadEditor:function () {
            //if (this.initEditor) {
            //    var text = this.editor.getContent();
            //    this.editor.clear();
            //    this.editor = new HtmlEditor({ text: text }).setElement(this.$(".htmlEditor")).render("linkToObject");
            //}
        },

        send: function () {
            if (this.$("#tabsDoc").tabs("option", "active"))
                this.saveTxt();
            else
                this.saveFile();
        },

        saveTxt: function () {
            this.model.set({
                "Display_Name": this.$(".title").val(),
                "title": this.$(".title").val(),
                "pdate": this.getDate(),
                "content": this.editor.getHtml(),
                "smi": this.model.get("MassMedia") || this.$(".smi").val(),
                "author": this.model.get("Author") || this.$(".author").val(),
                "IsMedia": this.$("input[name='IsMedia']").get(0).checked
            });
            if (this.model.id)
                this.update();
            else
                this.create(true);
        },

        saveFile: function () {
            if (this.model.isValid()) {
                this.$("input").css("border-color", "");

                var $bar = this.$('.bar'),
                    $percent = this.$('.percent'),
                    $status = this.$('#status');

                $status.empty();
                $bar.width(0);
                $percent.html("0%");

                this.$('#uploadFile input[name=title]').val(this.$(".title").val());
                this.$('#uploadFile input[name=typeid]').val(this.model.get("typeid"));
                this.$('#uploadFile input[name=smi]').val(this.model.get("MassMedia") || this.$(".smi").val());
                this.$('#uploadFile input[name=author]').val(this.model.get("Author") || this.$(".author").val());
                this.$('#uploadFile input[name=pdate]').val(this.getDate());
                this.$('#uploadFile input[name=rubricid]').val(this.model.get("rubricid"));

                var s = this;
                this.$('#uploadFile').ajaxSubmit({
                    beforeSend: function() {
                        $status.empty();
                        var percentVal = '0%';
                        $bar.width(percentVal)
                        $percent.html(percentVal);
                    },
                    uploadProgress: function(event, position, total, percentComplete) {
                        var percentVal = percentComplete + '%';
                        $bar.width(percentVal)
                        $percent.html(percentVal);
                    },
                    success: function() {
                        var percentVal = '100%';
                        $bar.width(percentVal)
                        $percent.html(percentVal);
                    },
                    complete: function(xhr) {
                        if (xhr.responseText.indexOf("Ошибка") == -1) {
                            s.$("#fileToUpload").val("");
                            $status.html("<b style='color:red'>Данные успешно отправлены</b>");
                            Backbone.trigger("patt:created", xhr.responseText);
                        } else {
                            $status.html(xhr.responseText);
                        }
                        $bar.width(0);
                        $percent.html("0%");
                    }
                });
            }
        },

        render: function () {
            //Backbone.on("reload:editor", this.reloadEditor, this);
            var rid = this.model.get("rubricid");
            if (rid && rid.indexOf("=") != -1) {
                var a = App.getParam("rubricid", rid);
                this.model.set("rubricid", a[1]);
            }

            var linktoupload = App.link({ id: "" }, "newdoc"),
                data = this.model.toJSON();

            data.Resources = Resources;
            data.linktoupload = linktoupload;
            data.Display_Name = this.model.escape("Display_Name");

            this.$el.html(_.template(template)( data));
            
            if (this.model.id)
                this.$(".TreeTypes").hide();
            else
                this.$(".TreeTypes").show();


            this.$("input[name='IsMedia']").prop("checked", this.model.get("IsMedia"));
            

            this.$("#tabsDoc").tabs();
            var s = this;

            //if (this.editor)
            //    this.editor.clear();

            this.editor = new HtmlEditor({ el: this.$(".htmlEditor"), height: 200, value: this.model.get("TextSource") }).onAttach();

            //require(['/js/libs/jquery/jquery-ui-timepicker-addon.js'], function () {
            //    Resources.setlocal();
            //    s.$(".datepicker").datetimepicker({
            //        "changeYear": true,
            //        yearRange: 'c-20:c+5',
            //        "changeMonth": true
            //    });
            //});

            require(['RU'], function () {
                this.$(".datepicker").ejDatePicker({
                    locale: Resources.Lang,
                    buttonText: Resources.Today
                });
            }.bind(this));

            var st = new Tree({el:this.$(".loadTree"), modelName: "Tree", api: "/api/Tree", openLevel: 3, branch: { parentid: "10002", id: "10006" } })
            .operation = function () {
                s.model.set("typeid", parseInt(this.model.id));
                s.$(".titleType").text(this.model.get("title"));
            }

            this.$("#fileToUpload").change(function() {
                if (s.$("#fileToUpload").val()) {
                    var f = s.$("#fileToUpload").val().split("\\"),
                        v = f[f.length - 1];
                    s.$(".Display_Name").val(v);
                    s.model.set("Display_Name", v);
                }
            });

            this.$(".smi").autocomplete({
                select: function(t, el) {
                    s.model.set("MassMedia", el.item.value);
                },
                source: function(request, response) { response($.GenQuery(request, response, "MassMedia")); }
            });

            this.$(".author").autocomplete({
                select: function(t, el) {
                    s.model.set("Author", el.item.value);
                },
                source: function(request, response) { response($.GenQuery(request, response, "Author")); }
            });
           
            return this;
        },

        getDate: function () {
            var pdate = this.model.get("Дата_публикации");
            var d = this.$(".datepicker").datepicker("getDate");
            if (d !== null) {
                pdate = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
            }
            return pdate;
        }
    });


});