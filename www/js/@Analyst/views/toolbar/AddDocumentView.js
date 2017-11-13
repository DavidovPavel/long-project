define(function(require) {

    var Resources = require('i18n!nls/resources.min'),
        App = require('app'),
        Dialog = require('@/views/DialogView'),
        template = require('text!@/templates/edit/createDocument.html'),
        jui = require('jqueryui'),
        t = require('/tinymce/tinymce.min.js'),
        t2 = require('/tinymce/jquery.tinymce.min.js'),
        t3 = require('/js/libs/jquery/jquery.form.min.js'),
        t4 = require('/js/libs/jquery/jquery-ui-timepicker-addon.js');

    var panel = Backbone.View.extend({
        typeid: 10006,
        smi: null,
        author: null,
        pdate: null,
        objID: null,
        events: {
            "click button.send": "send",
            "keyup .title": "valid",
            "blur .title": "valid"
        },
        next: function() {
            $(this).next("div").show(300);
        },
        valid: function() {
            var $obj = arguments[0].target ? $(arguments[0].target) : arguments[0];
            var val = $.trim($obj.val());
            if (val) {
                //this.$("#tabsDoc").tabs("enable", 2);
                this.$(".send").button({ disabled: false });
            } else {
                //this.$("#tabsDoc").tabs("disable", 2);
                this.$(".send").button({ disabled: true });
            }
        },
        getDate: function() {
            var pdate = null;
            var d = this.$(".datepicker").datepicker("getDate");
            if (d !== null) {
                pdate = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
            }
            return pdate;
        },
        send: function() {
            if (this.$("#tabsDoc").tabs("option", "active"))
                this.saveTxt();
            else
                this.saveFile();
        },
        saveTxt: function() {
            if (confirm(Resources.sure)) {
                var rubricid = (App.Select.get("query") === "Rubrics" ? App.Select.get("list") : 0);
                var result = {
                    "title": this.$(".title").val(),
                    "typeid": parseInt(this.typeid),
                    "smi": this.smi,
                    "author": this.author,
                    "pdate": this.getDate(),
                    "rubricid": rubricid,
                    "content": tinymce.get("tmce").getContent()
                };
                this.model = new Backbone.Model(result);
                this.model.url = function() {
                    return "/api/Object/";
                }
                var s = this;
                this.model.save(result, {
                    success: function(model, response) {
                        s.dialog.$el.dialog("close");
                        s.objID = response;
                        if (parseInt(rubricid) != 0) {
                            App.Select.set("list", App.addParams({ "rubricid": rubricid, "id": rubricid }, App.Select.get("list")));
                            App.navigate(App.Select.fullpath());
                        } else {
                            App.Select.set({ list: 0, detail: response });
                            App.navigate(App.Select.fullpath());
                        }
                        Backbone.trigger(":P", { cmd: "c" });
                    },
                    error: function(model, response) {
                        $.Error(response);
                    }
                });
            }
        },
        saveFile: function() {
            if (confirm(Resources.sure)) {
                var $bar = this.$('.bar');
                var $percent = this.$('.percent');
                var $status = this.$('#status');

                $status.empty();
                $bar.width(0);
                $percent.html("0%");

                //this.$("#fileToUpload").val("");
                var rubricid = (App.Select.get("query") === "Rubrics" ? App.Select.get("list") : 0);
                this.$('#uploadFile input[name=title]').val(this.$(".title").val());
                this.$('#uploadFile input[name=typeid]').val(this.typeid);
                this.$('#uploadFile input[name=smi]').val(this.smi);
                this.$('#uploadFile input[name=author]').val(this.author);
                this.$('#uploadFile input[name=pdate]').val(this.getDate());
                this.$('#uploadFile input[name=rubricid]').val(rubricid);

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
                            s.dialog.$el.dialog("close");
                            s.$("#fileToUpload").val("");
                            //if (parseInt(rubricid) != 0)
                            //    App.navigate(App.select.present + "|" + "Rubrics/" + rubricid + "/" + xhr.responseText, { trigger: true });
                            //else
                            App.navigate(App.Select.get("present") + "|" + App.Select.get("query") + "/0/1/" + xhr.responseText, { trigger: true });
                        } else {
                            $status.html(xhr.responseText);
                        }
                    }
                });
            }
        },
        initialize: function() {
        },
        render: function() {

            var linktoupload = App.link({ id: "" }, "newdoc");
            this.$el.html(_.template(template)( { Resources: Resources, linktoupload: linktoupload }));

            this.dialog = new Dialog({ title: Resources.addDoc }).render();
            this.dialog.fill(this.$el);

            tinymce.init({
                selector: "#tmce",
                toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image"
            });
            //this.$("button.next").on("click", this.next);
            var s = this;
            this.$("#fileToUpload").change(function() {
                if (s.$("#fileToUpload").val()) {
                    var f = s.$("#fileToUpload").val().split("\\");
                    s.$(".title").val(f[f.length - 1]);
                    s.valid(s.$(".title"));
                }
            });


            this.$("#tabsDoc").tabs();

            this.$(".send").button({ disabled: true });

            Resources.setlocal();
            $(".datepicker").datetimepicker({
                "changeYear": true,
                yearRange: 'c-20:c+5',
                "changeMonth": true,
                onSelect: function() {
                    //if (s) {
                    //    s.set("Value", arguments[0]);
                    //}
                }
            });

            var Tree = require("@/views/Tree/TreeView");
            var st = new Tree({ modelName: "Tree", api: "/api/Tree", openLevel: 2, branch: { parentid: "10002", id: "10006" }, markCurrent: true })
                .done(function() {
                    var model = arguments[0].selectedModel;
                    if (model) {
                        s.typeid = model.id;
                        s.$(".titleType").text(model.get("title"));
                    }
                });
            st.setElement(this.$(".loadTree"));
            st.operation = function() {
                s.typeid = this.model.id;
                s.$(".titleType").text(this.model.get("title"));
            }

            this.$(".smi").autocomplete({
                select: function(t, el) {
                    s.smi = el.item.id; //$(this).blur();
                },
                source: function(request, response) { response($.GenQuery(request, response, "MassMedia")); }
            });

            this.$(".author").autocomplete({
                select: function(t, el) {
                    s.author = el.item.id; //$(this).blur();
                },
                source: function(request, response) { response($.GenQuery(request, response, "Author")); }
            });

            return this;
        }
    });
    var p = new panel;
    return {
        get: function() {
            return p.render();
        }
    }
});