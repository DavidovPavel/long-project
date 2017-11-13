define(function(require) {

    var App = require('app'),
        Resources = require('i18n!nls/resources.min');

    var templ = {
        10021: {
            form: require('text!@/templates/edit/addpersonTemplate.html'),
            list: require('text!@/templates/search/listPersonTemplate.html')
        },
        10022: {
            form: require('text!@/templates/edit/orgTemplate.html'),
            list: require('text!@/templates/search/listOrgTemplate.html')
        }
    };

    function digitValid($obj) {
        var val = $obj.val(), num = val.length; // $obj.attr("maxlength");
        var namefield = $obj.closest('td').prev("td").text();
        var pat = "^[\\d]+$";// "^[\\d]{" + num + "}$";
        var t = new RegExp(pat);
        if (t.test(val)) {
            var fieldname = $obj.attr("name");
            switch (fieldname) {
            case "inn":
                if (num === 10) {
                    var aval = $obj.val().split("");
                    var am = [2, 4, 10, 3, 5, 9, 4, 6, 8];
                    var pr = 0;
                    for (var i = 0; i < am.length; i++) {
                        pr += am[i] * aval[i];
                    }
                    var del = parseInt(pr / 11) * 11;
                    var r = pr - del;
                    if (r === 10) r = 0;
                    if (r != aval[9]) {
                        return "Введенный ИНН не корректен";
                    }
                }
                break;
            case "ogrn":
                var exp = $obj.val().length == 13 && ($obj.val().slice(12, 13) == (($obj.val().slice(0, -1)) % 11 + '').slice(-1));
                if (!exp) {
                    return "Введенный ОГРН не корректен";
                }
                break;
            case "ogrnip":
                var s = parseInt($obj.val().substr(0, 1));
                if (s === 3 || s === 4) {
                } else {
                    return "Введенный ОГРНИП не корректен";
                }
                break;
            default:
                break;
            }
            return "";
        }
        //else {
        //    return ("Поле [" + namefield + "] содержит " + num + " цифр(ы).");
        //}
    }

    function mark($o, txt) {
        $o.data("novalid", txt).css("border-color", "red").next("i").text(txt);
    }

    function clearmark($o) {
        $o.data("novalid", "").css("border-color", "").next("i").text("");
    }

    var patternView = Backbone.View.extend({
        isValid: false,
        events: {
            "click .Search": "search",
            "click .Create": "create",
            "click .Clear": "clear",
            "click .Update": "update",
            "click .Restore": "restore",
            "keyup input.Valid": "valid",
            "focus input.Valid": "valid",
            "blur input.Valid": "valid"
        },
        noValidForm: function() {
            this.$("input").each(function() {
                if ($(this).data("novalid")) {
                    return $(this).data("novalid");
                }
            });
        },
        valid: function() {
            var $obj = $(arguments[0].target);
            if ($obj.hasClass("datepicker")) {
                return;
            }
            var val = $.trim($obj.val());

            if ($obj.hasClass("Required")) { // обязательное поле для заполнения
                if (!val) {
                    mark($obj, "*");
                } else {
                    clearmark($obj);
                }
            }

            if ($obj.hasClass("Digits")) { // только цифры
                if (val) {
                    var o = digitValid($obj);
                    if (o) mark($obj, o);
                    else clearmark($obj);
                } else {
                    clearmark($obj);
                }
            }

            var flag = true;
            var a = this.$("input");
            for (var i = 0; i < a.length; i++) {
                var el = $(a[i]);
                if (el.hasClass("Required") && !$.trim(el.val()) && el.is(":visible")) {
                    flag = true
                    break;
                } else {
                    flag = false;
                }
            }
            this.$("button.Create").button({ "disabled": flag });
            this.$("button.Update").button({ "disabled": flag });
        },
        clear: function() {
            this.$("input").each(function() { $(this).val(""); });
            this.$("textarea").each(function() { $(this).val(""); });
            this.$("i").text("");
            this.$("button.Create").attr("disabled", true);
            this.$("#ResultSearchObjects").empty();
        },
        getData: function() {
            var result = { };
            this.$("input").each(function() {
                if ($(this).is(":visible")) {
                    if ($(this).attr("type") === "checkbox") {
                        result[$(this).attr("name")] = ($(this).attr("checked") === "checked" || $(this).attr("checked") ? true : false);
                    } else {
                        if ($(this).hasClass("datepicker")) {
                            var d = $(this).datepicker("getDate");
                            if (d !== null) {
                                var day = d.getDate();
                                var month = d.getMonth() + 1;
                                var year = d.getFullYear();
                                result[$(this).attr("name")] = year + "-" + month + "-" + day;
                            } else
                                result[$(this).attr("name")] = null;
                        } else {
                            result[$(this).attr("name")] = $(this).val();
                        }
                    }
                }
            });
            this.$("textarea").each(function() {
                if ($(this).is(":visible")) {
                    result[$(this).attr("name")] = $(this).val();
                }
            });
            return result;
        },
        update: function() {
            var data = this.getData();
            var s = this;
            this.model.validate = function() {
                var obj = arguments[0];
                if (!obj.title) {
                    return obj.typeid === 10021 ? "Заполните поля Фамилия и Имя" : "Заполните поле Наименование.";
                }
            }
            data["typeid"] = this.typeid;

            this.$el.showIndicator();
            this.model.save(data, {
                silent: true,
                error: function() {
                    $.Error(arguments[1]);
                },
                success: function(a) {
                    s.$el.hideIndicator();
                    s.dialog.dialog("close");
                    s.done(a.id, "patt:updated");
                }
            });
        },
        restore: function() {
            this.render();
        },
        create: function() {
            var result = this.getData();
            if (!result["title"]) {
                result["title"] = result["lname"] + " " + result["fname"] + " " + result["mname"];
            }
            result["typeid"] = this.model.get("typeid");
            result["parentid"] = this.model.get("parentid");
            if (App.Select.get("query") === "Rubrics") {
                result["rubricid"] = App.Select.get("params") && App.Select.get("params").rubricid ? App.Select.get("params").rubricid : null;
            }

            var w = this;
            this.model = new Backbone.Model(result);
            this.model.url = function() {
                var str = "/api/Object/";
                if (w.host) {
                    if ($.type(w.host.collection.url) === "string") {
                        str = w.host.collection.url;
                    } else {
                        str = w.host.collection.url();
                    }
                }
                return str;
            }
            this.model.validate = function() {}
            this.model.save(result, {
                success: function(model, response) {
                    if ($("#Info").get(0)) {
                        $("#Info").dialog("close");
                    }
                    w.dialog.dialog("close");
                    w.done(response, "patt:created");
                },
                error: function(model, response) {
                    if (response) {
                        w.errorHandler(response);
                    }
                }
            });
        },
        errorHandler: function (response) {
            var w = this;
            if (!$("#Info").get(0)) {
                $("<div id='Info'></div>").html(response.responseText || response).dialog({
                    width: 300,
                    height: 250,
                    title: "Ошибка при вводе данных!",
                    resizable: false,
                    buttons: {
                        "Исправить": function () {
                            $(this).dialog("close");
                        },
                        "Продолжить": function () {
                            var $wi = $(this);
                            model.save(result, {
                                success: function (model, response) {
                                    $wi.dialog("close");
                                    w.dialog.dialoag("close");
                                    if ($.type(w.typeid) === "number") {
                                        App.navigate("List/" + w.typeid + "/" + response, { trigger: true });
                                    } else {
                                        App.navigate(w.typeid + "/" + response, { trigger: true });
                                    }
                                    if (w.done) {
                                        w.done();
                                    }
                                    App.reload();
                                },
                                error: function (model, response) {
                                    $.Error(response);
                                }
                            });
                        }
                    },
                });
            } else {
                $("#Info").html(response.responseText || response).dialog("open");
            }
        },
        search: function() {
            var txt = [];
            this.$("input").each(function() {
                if ($(this).hasClass("forSearch")) {
                    txt.push($(this).val());
                }
            });
            var stxt = txt.join(" ");
            if (stxt) {
                this.searchresult(stxt);
            } else {
                $.Error("Пустая строка для поиска! Заполните одно или несколько из полей.");
            }
        },
        searchresult: function(txt) {
            this.searchtxt = txt || this.searchtxt;
            var str = { "text": this.searchtxt, "typeid": this.typeid };
            var s = this;
            var List = require("@/views/ListView");
            this.result = new List({
                el: this.$("#ResultSearchObjects"),
                api: function() { return ("/api/List/?" + $.param(str)); },
                templ: this.listtempl,
                operation: function(model) {
                    Backbone.trigger("goto:object", model.id);
                    s.dialog.dialog("close");
                }
            });
        },
        initialize: function (o) {
            this.options = o;
            var data = this.options;
            //this.host = data.host;
            //this.model = data.model;
            this.dialog = data.dialog || null;
            this.done = function(response) {
                Backbone.trigger(arguments[1], response);
            };

            this.typeid = this.model.get("typeid") || 10001;
            this.listtempl = templ[this.typeid] ? templ[this.typeid].list : null;

            if (this.model.get("typeid") && this.model.id != -1) {
                //this.model.set("title", "");
                this.model.on("sync", this.render, this);
                var s = this;
                this.model.url = function() {
                    var url = "/api/object/" + s.model.id + "?typeid=" + s.model.get("typeid");
                    if (!parseInt(s.model.get("typeid"))) {
                        url = s.model.collection ? s.model.collection.url() : s.model.url();
                        url = (url + "/item/" + s.model.id);
                    }
                    return url;
                }
                this.dialog.showIndicator();
                this.model.fetch({
                    reset: true, error: function () {
                        s.$el.hideIndicator();
                        $.Error(arguments[1]);
                    }
                });

            } else {
                this.render();
            }
        },
        render: function() {
            this.dialog.hideIndicator();
            var addTemplate = require('text!@/templates/edit/addTemplate.html');
            var template = this.options.template || (templ[this.model.get("typeid")] ? templ[this.model.get("typeid")].form : addTemplate);
            var r = this.model.toJSON();
            r.title = r.title.replace(/\"/g, "&quot;");
            this.$el.html(_.template(template)( { m: r, Resources: Resources }));

            var data = this.model;
            if (data.id != -1) {
                this.$(".wList").hide();
                if (data.get("typeid") === 10021) {
                    this.$("table.person tr").not(".a").hide();
                    this.$("table.person tr.edit").show();
                    this.$("table.person tr.edit td input").width(300);
                }
                this.$("button.Search").hide();
                this.$("button.Create").hide();
                this.$("button.Clear").hide();
                this.$("button.Update").show();
                this.$("button.Restore").show();
            } else {
                if (data.get("typeid") === 10021) {
                    this.$("table.person tr.edit").hide();
                }
                this.$(".wList").show();
                this.$("button.Search").show();
                this.$("button.Create").show();
                this.$("button.Clear").show();
                this.$("button.Update").hide();
                this.$("button.Restore").hide();
            }

            this.$("button").button();

            this.$("#DataObject td:nth-child(odd)").css("text-align", "right");
            this.$("#DataObject input[type='checkbox']").css("width", "auto");

            Resources.setlocal();
            this.$(".datepicker").datepicker({
                changeYear: true,
                yearRange: 'c-80:c+1',
                changeMonth: true,
                onSelect: function() {
                }
            });
            return this;
        }
    });
    return patternView;
});