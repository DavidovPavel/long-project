define(['i18n!nls/resources.min', 'g/Tree/TreeView', 'g/ejRTEView'],

function (Resources, Tree, Editor) {

    return Mn.View.extend({

        template: '#global-create-document',
        templateContext: { Resources: Resources },


        events: {

            'click .nav a': function (e) {

                e.preventDefault();

                var $e = $(e.target);

                $e.closest('li').addClass('active').siblings().removeClass('active');

                this.$('.tabs>div').hide();
                this.$($e.attr("href")).show();

                this.tabActive = $e.attr("href");

                //$(window).trigger('resize');
            }
        },

        initialize: function () {

            this.tabActive = '#doc3';
        },

        regions: {
            editor: '.htmlEditor'
        },

        onRender: function () {

            new Tree({
                el: this.$(".loadTree"),
                modelName: "Tree",
                api: "/api/Tree",
                branch: { parentid: "10002", id: "10006" }
            })
            .operation = function (m) {
                this.model.set("typeid", parseInt(m.id));
                this.$(".titleType").text(m.get("title"));
            }.bind(this);

            this.$("#fileToUpload").change(function () {
                if (this.$("#fileToUpload").val()) {
                    var f = this.$("#fileToUpload").val().split("\\"),
                        v = f[f.length - 1];
                    this.$(".title").val(v);
                    this.model.set("Display_Name", v);
                }
            }.bind(this));

            this.$(".smi").autocomplete({
                select: function (t, el) { this.model.set("MassMedia", el.item.value); }.bind(this),
                source: function (request, response) { response($.GenQuery(request, response, "MassMedia")); }
            });

            this.$(".author").autocomplete({
                select: function (t, el) { this.model.set("Author", el.item.value); }.bind(this),
                source: function (request, response) { response($.GenQuery(request, response, "Author")); }
            });

            require(['RU'], function () {
                this.$(".datepicker").ejDatePicker({
                    locale: Resources.Lang,
                    buttonText: Resources.Today
                });
            }.bind(this));
        },

        onAttach:function(){
            this.showChildView('editor', new Editor);
        },

        modelEvents: {

            sync: function () {
                this.triggerMethod('document:created');
            }
        },

        mark: function () {
            _.each(this.model.validationError, function (o) {
                this.$('input[name="' + o.name + '"]').css({ 'border-color': 'red' });
            }, this);
        },


        clear: function () {

            this.$("input").css("border-color", "");

            this.$('.bar').width(0),
            this.$('.percent').html("0%"),
            this.$('#status').empty();
        },

        save: function (v) {

            if (this.tabActive === '#doc2')
                this.saveTxt(v);
            else
                this.saveFile(v);
        },

        saveTxt: function (v) {

            this.model.set({
                "Display_Name": this.$(".title").val(),
                "title": this.$(".title").val(),
                "pdate": $.ToISO(this.$(".datepicker").data("ejDatePicker").getValue()),
                "content": this.getChildView('editor').ejRTE.getHtml(),
                "smi": this.model.get("MassMedia") || this.$(".smi").val(),
                "author": this.model.get("Author") || this.$(".author").val(),
                "IsMedia": this.$("input[name='IsMedia']").is(":checked")
            });

            if (this.model.isValid()) {

                v.$el.addClass('disabled');

                this.model.save();
            }
            else this.mark();
        },

        saveFile: function (v) {

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
                this.$('#uploadFile input[name=pdate]').val($.ToISO(this.$(".datepicker").data("ejDatePicker").getValue()));
                this.$('#uploadFile input[name=rubricid]').val(this.model.get("rubricid"));

                this.$('#uploadFile').ajaxSubmit({
                    beforeSend: function () {
                        $status.empty();
                        var percentVal = '0%';
                        $bar.width(percentVal);
                        $percent.html(percentVal);
                    },
                    uploadProgress: function (event, position, total, percentComplete) {
                        var percentVal = percentComplete + '%';
                        $bar.width(percentVal);
                        $percent.html(percentVal);
                    },
                    success: function () {
                        var percentVal = '100%';
                        $bar.width(percentVal);
                        $percent.html(percentVal);
                    },
                    complete: function (xhr) {
                        if (xhr.responseText.indexOf("Ошибка") === -1) {
                            this.$("#fileToUpload").val("");
                            $status.html("<b style='color:red'>Данные успешно отправлены</b>");
                            this.clear();
                            this.trigger('document:created');
                        } else {
                            $status.html(xhr.responseText);
                        }
                        $bar.width(0);
                        $percent.html("0%");
                    }.bind(this)
                });
            } else this.mark();
        }
    });

});