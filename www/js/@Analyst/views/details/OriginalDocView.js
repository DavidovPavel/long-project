define([
        'app',
        'i18n!nls/resources.min',
        'text!@/templates/details/originalDocTemplate.html'
    ],
    function(App, Resources, originalDocTemplate) {

        var uploadView = Backbone.View.extend({
            linkId: "CEA8253E-4EE0-4825-BB15-91BA09F9992E",
            el: $("#OriginalAll"),
            events: {
                "click .Close": "hide"
            },
            hide: function() {
                this.$el.empty();
                this.$el.hide("scale", { percent: 0 }, 500);
                this.$el.hideIndicator();
                clearInterval(this.si);
            },
            initialize: function () {
                Backbone.on("content:showOriginalDoc", this.render, this);
                this.position();
                Backbone.on("window:resizeend", function() {
                    this.position();
                    if (this.$("iframe").get(0))
                        this.$("iframe").height((this.$el.height() - (this.$("#uploadFileBlock").is(":visible") ? 150 : 20)));
                }, this);
            },
            position: function() {
                var w = $(window).width() - 200;
                var h = $(window).height() - 200;
                this.$el
                    .css({ "width": w, "height": h, "left": ($(window).width() - w) / 2, "top": ($(window).height() - h) / 2 });
            },
            getFrame: function() {
                this.$el.showIndicator();
                this.counter = 0;
                var s = this;
                this.si = setInterval(function () {
                   s.counter++;
                    if (s.counter > 50) {
                        clearInterval(s.si);
                        s.$el.hideIndicator();
                        s.$("#inLoad").html(Resources.timeended);
                    } else {
                        $.get("/api/original/checkconvert?uid=" + s.model.get("uid"))
                            .done(function(status) {
                                s.stopConvert({ status: status, counter: s.counter });
                            }).fail(function() {
                                clearInterval(s.si);
                                $.Error(arguments);
                            });
                    }
                }, 2000);
            },
            stopConvert: function (o) {
                var status = o.status, counter = o.counter;
                var anime = ["..", "...."];
                if (status == 200) {
                    if (this.Visualization) {
                        this.$el.hideIndicator();
                        $.xhrAbortAll();
                        clearInterval(this.si);
                        var s = this;
                        // pdf js
                        require(["/js/@Wall/views/ReportView.js"], function (ReportLoad) {
                            ReportLoad.setElement(s.$("#inLoad")).render(s.RelativePath);
                        });
                    } else if (this.$el.find("iframe").size()) {
                        $.xhrAbortAll();
                        clearInterval(this.si);
                    } else {
                        this.$el.hideIndicator();
                        clearInterval(this.si);
                        var src = "/Temp/OD/" + this.model.get("uid") + "/" + this.model.get("uid") + ".html";
                        this.$("#inLoad").html("<iframe src=" + src + " style='width:98%;height:" +
                            (this.$el.height() - 150) + "px;border:solid 1px #ccc;'></iframe>");
                    }
                }
                else {
                    var txt = Resources.convert + ", " + Resources.wait + "&nbsp;" + anime[counter % 2];
                    switch (status) {
                    case 404:
                        txt = "ошибка при конвертации: 404";
                        clearInterval(this.si);
                        this.$el.hideIndicator();
                        break;
                    case 500:
                        txt = "ошибка при конвертации: 500";
                        clearInterval(this.si);
                        this.$el.hideIndicator();
                        break;
                    }

                    this.$("#inLoad").text(txt);
                }
            },
            convert: function () {
                if (!this.noFile) {
                    $.get("/api/original/startconvert?id=" + this.model.id)
                        .fail(function() { $.Error(arguments) });
                }
            },
            getLink: function($to, $button) {
                var s = this;
                if (!this.linkToFile) {
                    this.linkToFile = Resources.originaldoc + " - <i>" + Resources.notfound + "</i>";
                    var objID = this.model.id || this.model.get("Object_ID");
                    $.get("/api/original/" + objID).done(function(data) {
                        if (data) {
                            var output = "&nbsp;";
                            if (data.Mode != 9) {
                                if ($button) {
                                    s.noFile = data.FileName == "";
                                    s.Visualization = data.Visualization;
                                    s.RelativePath = data.RelativePath;
                                    if (!s.noFile) {
                                        s.convert();
                                        $button.button({ disabled: false });
                                    }
                                }
                                if (App.check(s.linkId)) {
                                    output = "<a target='_blank' href='" + App.link({ id: objID }, "OriginalDoc") + "'>" +
                                        data.FileName + "<span title='extlink' class='ui-icon ui-icon-extlink' style='display:inline-block'></span></a>";
                                }
                            } else {
                                output = "<i style='color:red;'>" + Resources.limit + "</i>";
                            }
                            s.linkToFile = output;
                        }
                    });
                }
                if ($to)
                    $to.html(this.linkToFile);
            },
            render: function(m) {
                if (m) this.model = m;
                if (!this.model) return;

                var objID = this.model.id || this.model.get("Object_ID");
                this.$el.empty();
                var s = this;
                var linktoupload = App.link({ id: objID }, "upload");
                this.$el.html(_.template(originalDocTemplate)( { Resources: Resources, linktoupload: linktoupload }))
                    .show("scale", { percent: 100 }, 500, function () {
                        s.$("#inLoad").height(s.$el.height() - 135);
                        s.getFrame();
                    })
                    .append("<div class='btn Close'></div>");

                this.$('#uploadFile input[name=objId]').val(objID);

                var $bar = this.$('.bar');
                var $percent = this.$('.percent');
                var $status = this.$('#status');
                var $link = this.$("#linkToFile");

                $status.empty();
                $bar.width(0);
                $percent.html("0%");

                this.$("#fileToUpload").val("");

                this.getLink($link);

                if (App.check(this.$("#uploadFileBlock"))) {
                    this.$('#uploadFileBlock').show();

                    this.$('#uploadFile').ajaxForm({
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
                            $status.html();
                            if (xhr.responseText.indexOf("Ошибка") == -1) {
                                $link.html("<a target='_blank' href='" + App.link({ id: objID }, "OriginalDoc") + "'>" + xhr.responseText + "<span title='extlink' class='ui-icon ui-icon-extlink'></span></a>");
                                s.convert();
                                s.getFrame();
                            } else {

                            }
                        }
                    });
                } else {
                    this.$('#uploadFileBlock').hide();
                }
            }
        });

        var p = new uploadView;

        return {
            get: function () {
                p.linkToFile = "";
                if (arguments[0]) {
                    p.model = arguments[0];
                }
                return p;
            }
        }
    });