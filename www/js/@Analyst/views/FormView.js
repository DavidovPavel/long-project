define(function(require) {

    var Resources = require('i18n!nls/resources.min'),
        AddTemplate = require('text!@/templates/edit/addTemplate.html');

    return Backbone.View.extend({
        events: {
            "click .Create": "create",
            "click .Clear": "clear",
            "click .Update": "update",
            "click .Restore": "restore",
            "keyup input.Valid": "valid",
            "focus input.Valid": "valid",
            "blur input.Valid": "valid"
        },
        initialize: function() {
            this.template = this.options.template || AddTemplate;
            this.method = this.options.method;
        },
        render: function () {
            var m = this.model.toJSON();
            this.$el.html(_.template(this.template)( { m: m, Resources: Resources }));
            this.$("button").button();
            this.$(".Info").text("");
            return this;
        },
        create: function () {
            var data = this.getData();
            data.parentid = this.model.get("parentid");
            this.model.collection.create(data, { wait: true });
            this.$(".Info").text(Resources.done);
        },
        update: function () {
            var data = this.getData();
            this.model.save(data);
        },
        restore: function () {
            this.render();
        },
        clear:function() {
            this.$("input").each(function () { $(this).val(""); });
            this.$("textarea").each(function () { $(this).val(""); });
            this.$(".Info").text("");
            this.$("button.Create").attr("disabled", true);
            this.$("button.Update").attr("disabled", true);
            //this.$("#ResultSearchObjects").empty();
        },
        getData: function () {
            var result = {};
            this.$("input").each(function () {
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
            this.$("textarea").each(function () {
                if ($(this).is(":visible")) {
                    result[$(this).attr("name")] = $(this).val();
                }
            });
            return result;
        },
        valid: function() {
            var $obj = $(arguments[0].target);
            if ($obj.hasClass("datepicker")) {
                return;
            }
            var val = $.trim($obj.val());

            if ($obj.hasClass("Required")) { // обязательное поле для заполнения
                if (!val) {
                    this.mark($obj, "*");
                } else {
                    this.clearmark($obj);
                }
            }

            if ($obj.hasClass("Digits")) { // только цифры
                if (val) {
                    var o = this.digitValid($obj);
                    if (o) this.mark($obj, o);
                    else this.clearmark($obj);
                } else {
                    this.clearmark($obj);
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
        digitValid: function($obj) {
            var num = $obj.attr("maxlength");
            var val = $obj.val();
            var namefield = $obj.closest('td').prev("td").text();
            var pat = "^[\\d]{" + num + "}$";
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
            } else {
                return ("Поле [" + namefield + "] содержит " + num + " цифр(ы).");
            }
        },
        mark: function($o, txt) {
            $o.data("novalid", txt).css("border-color", "red").next("i").text(txt);
        },
        clearmark: function($o) {
            $o.data("novalid", "").css("border-color", "").next("i").text("");
        }
    });

});