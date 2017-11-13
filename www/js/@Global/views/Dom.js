'use strict';
define(['i18n!nls/resources.min'], function (Resources) {
    
    $.ajaxSetup({

        headers: {
            'key': window.location.origin + window.location.pathname + window.location.search + encodeURIComponent(window.location.hash)
        },

        timeout: 120000,

        error: function (x, t) {
            switch (t) {
                case 'timeout': break;
                case 'abort': break;
            }
        },

        beforeSend: function (xhr, ajax) {
            //var p = { id: ajax.url, xhr: xhr };
            //$.xhrPool.push(p);
        },

        complete: function (jqXHR) {
            //$.xhrPool.splice(0, 1);
        }
    });

    $.xhrPool = [];
    $.xhrAbortAll = function () {
        $.xhrPool.map(function (x) { x.abort(); });
        $.xhrPool = [];
    };

    // resizeend event
    var rtime = new Date(1, 1, 2000, 12, '00', '00'),
        timeout = false,
        delta = 200;

    $(window).resize(function (e, o) {

        if (o && $(o.element).hasClass("anbr-widget")) return;

        rtime = new Date();
        if (timeout === false) {
            timeout = true;
            setTimeout(resizeend, delta);
        }

    });

    function resizeend() {
        if (new Date() - rtime < delta) {
            setTimeout(resizeend, delta);
        } else {
            timeout = false;
            Backbone.trigger("window:resizeend");
        }
    }


    (function($) {        

        $.prepare = function (data, field) {

            if (!data) return [];

            var arr = [],
                fieldName = field || 'systemName',
                href = data.href;

            if (!$.isArray(data)) data = [data];

            Array.from(data, function (el) {

                var o = { propType: {} };

                Array.from(el.data, function (p) {

                    o[p[fieldName]] = p.value;
                    o.propType[p[fieldName]] = p.propType;

                }, this);

                o.href = el.href;
                o.links = el.links;

                arr.push(o);

            }, this);

            return arr;
        };


        $.Format = function () {
            var text = "";
            for (var i = 0; i < arguments.length; i++) {
                var v = arguments[i];
                if (i === 0)
                    text = v;
                else {
                    var l = "{" + (i - 1) + "}";
                    text = text.replace(l, v);
                }
            }
            return text;
        },

        $.fn.showIndicator = function () {
            var id = '_' + new Date().getTime(),
                css = this.get(0) ? { left: this.offset().left + this.width() / 2, top: this.offset().top + this.height() / 2 } :
                { left: $(window).width() / 2, top: $(window).height() / 2 };

            if (this.attr("loaderid")) {
                this.hideIndicator();
                //console.warn("избыточные запросы?", this);
            }

            this.attr("loaderid", id);
            $("#Rotor").clone().attr("id", id).addClass("loader-indicator").appendTo("body").css(css).show();
            setTimeout(function () {
                this.hideIndicator();
            }.bind(this), 60000);
        };

        $.fn.hideIndicator = function (a) {
            $('#' + this.attr("loaderid")).remove();
            this.removeAttr("loaderid");
        };

        $.mergeUrlParam = function (url, o) {

            if (url.indexOf('#') === -1) {

                var u = url.split("?"),
                    s = [],
                    p = u[1] ? _.chain(u[1].split('&')).map(function (item) { if (item) return item.split('='); }).compact().object().value() : {},
                    r = _.chain(p).extend(o).map(function (v, k) { return k + '=' + v; }).value();
                return u[0] + "?" + r.join("&");

            } else {

                u = url.split("#"),
                s = u[0].split("?"),
                p = s[1] ? _.chain(s[1].split('&')).map(function (item) {

                    if (item && item.indexOf('=') !== -1)
                        return item.split('=');

                }).compact().object().value() : {},

                r = _.chain(p).extend(o).map(function (v, k) { return k + '=' + v; }).value();

                return s[0] + '?' + r.join("&") + "#" + u[1];
            }
        };

        $.Error = function (text) {};

        $.GetData = function ($p) {

            var result = {};

            $p.find("input:not(.ignore)").each(function () {

                if ($(this).attr("name")) {

                    if ($(this).attr("type") === "checkbox") {
                        result[$(this).attr("name")] = $(this).prop("checked");
                    } else
                        if ($(this).attr("type") === "radio") {
                            if ($(this).prop("checked"))
                                result[$(this).attr("name")] = $(this).val();
                        }
                        else {
                            if ($(this).hasClass("Timepicker") || $(this).hasClass("datepicker")) {
                                var d = $(this).datetimepicker("getDate");
                                if (d !== null)
                                    result[$(this).attr("name")] = d.toISOString();
                                else
                                    result[$(this).attr("name")] = null;
                            } else
                                if ($(this).hasClass("ejdatepicker")) {
                                    result[$(this).attr("name")] = $.ToISO($(this).data("ejDatePicker").getValue());
                                }
                                else
                                    if ($(this).hasClass("ejtimepicker")) {
                                        result[$(this).attr("name")] = $.ToISO($(this).data("ejTimePicker").getValue());
                                    }
                                    else {
                                        result[$(this).attr("name")] = $(this).val();
                                    }
                        }
                }
            });

            $p.find("select:not(.ignore)").each(function () {
                if ($(this).is(":visible")) {
                    result[$(this).attr("name")] = $(this).val();
                }
            });

            $p.find("textarea:not(.ignore)").each(function () {
                if ($(this).is(":visible")) {
                    result[$(this).attr("name")] = $(this).val();
                }
            });

            return result;
        };

        $.MarkErrorForm = function (model, error) {
            this.$el.hideIndicator();
            this.$("#info").text("");
            this.$("input").css("border-color", "");
            _.each(error, function (data) {
                if (data.text) {
                    this.$("#info").text(data.text);
                }
                this.$("[name='" + data.name + "']").css("border-color", "red");
            }, this);
        };

        $.GenQuery = function(request, response, dict) {
            var accentMap = {
                "ё": "е",
                "и": "й",
                "е": "ё",
                "й": "и"
            };
            var normalize = function(term) {
                var ret = "";
                for (var i = 0; i < term.length; i++) {
                    ret += accentMap[term.charAt(i)] || term.charAt(i);
                }
                return ret;
            };

            var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");
            var param = { lit: request.term, name: dict };

            $.ajax({
                url: "/api/Dictionary/ByName/",
                dataType: "json",
                data: param,
                error: function(er, m) { $.Error(m); },
                success: function(data) {
                    response($.grep(data.data, function(value) {
                        value = value.label || value.value || value;
                        return matcher.test(value) || matcher.test(normalize(value));
                    }));
                }
            });
        };

        $.addIcon = function ($e, robot) {

            var $o = $e.closest("div").find("span.TreeElementTitle span"),
                icon_class = getIcon(robot.status),
                pc = 'severity' + robot.severity;

            if (!$o.get(0)) {

                $o = $("<span class='ui-icon ui-corner-all " + icon_class + "' title='" + robot.state + "' data-ic='" + icon_class + "'></span><span>" + robot.state + "</span>");
                $e.closest("div").find("span.TreeElementTitle").addClass(pc).attr("data-pc", pc).append($o);

            } else if ($o.attr("title") !== robot.state) {

                var $p = $e.closest("div").find("span.TreeElementTitle"),
                    npc = "severity" + robot.severity;

                pc = $p.attr("data-pc");
                nicon_class = getIcon(robot.status);
                $o.removeClass(icon_class).addClass(nicon_class).attr("data-ic", nicon_class).attr("title", robot.state);
                icon_class = $o.attr("data-ic");
                $p.removeClass(pc).addClass(npc);
            }
        };

        //у локальной даты обрезает время и приводит к UTC формату (чтобы избежать проблемы с временной зоной)
        $.ToISODateOnly = function (enteredDate) {
            function pad(n) {
                return n < 10 ? '0' + n : n;
            }    

            var enteredDateDateISO = enteredDate.getFullYear() + "-" + pad(enteredDate.getMonth() + 1) + "-" + pad(enteredDate.getDate());
            return enteredDateDateISO + "T00:00:00Z";
        }

        $.ToISO = function (a) {
            if (a) {

                if (!isNaN(Date.parse(a)) && new Date(a).toISOString() === a) return a;

                // time
                if (a.indexOf(":") !== -1) {
                    var timePart = a.split(":"),
                        c = new Date();
                    c.setHours(parseInt(timePart[0]));
                    c.setMinutes(parseInt(timePart[1]));
                    return c.toISOString();
                }

                if (Resources.Lang === "ru-RU") {
                    var p = a.split("."),
                        ptt = p[1] + '/' + p[0] + '/' + p[2];

                    if (!isNaN(Date.parse(ptt)))
                        return new Date(ptt).toISOString();
                    else console.error('Дата [' + a + '] не валидна! - ' + ptt);

                } else {
                    return new Date(a).toISOString();
                }

                return a;
            }
            return undefined;
        };

        $.parseDate = function (d) {

            var sd = d.split(' ');

            if (Date.parse(sd[0]))
                return new Date(sd[0]).toLocaleDateString(Resources.Lang);
            return sd[0];
        };

    })(jQuery);
    

    var count = 0;

    function getPropertyObj(text) {
        count++;
        if (count > 5) return "";
        var txt = "";
        for (var pr in text) {
            var v = text[pr];
            if ($.type(v) === "function") continue;
            else if ($.type(v) === "object") {
                txt += getPropertyObj(v);
            } else
                txt += pr + "=" + text[pr] + "</br>";
        }
        return txt;
    }

    function getIcon(s) {
        var _out = "ui-icon-info";
        switch (s) {
            case "unknown":
                _out = "ui-icon-info";
                break;
            case "stopped":
                _out = "ui-icon-lightbulb";
                break;
            case "complited":
                _out = "ui-icon-check";
                break;
            case "created":
                _out = "ui-icon-pencil";
                break;
            case "processing":
                _out = "ui-icon-clock";
                break;
            case "invalid":
                _out = "ui-icon-trash";
                break;
        }
        return _out;
    }

});