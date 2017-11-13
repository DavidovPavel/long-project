
define('app', ['i18n!nls/resources.min'],
function (Resources) {
    var Select = Backbone.Model.extend({
        defaults: function () {
            return {
                present: "3",
                query: null,
                list: null,
                page: 1,
                detail: null,
                tab: 0,
                sub: 0, // субменю в деталях
                params: { id: -1 }
            }
        },
        data: ["query", "list", "page", "detail", "tab", "sub"],
        initialize: function () {
            this.on("change:query", this.query, this);
            this.on("change:list", this.list, this);
            this.on("change:detail", this.detail, this);
            this.on("change:tab", this.detail, this);
            this.on("change:sub", this.detail, this);
            Backbone.on("balance:start", function (timeout) {
                this.tickBalance = timeout;
            }, this);
            this.on("change", this.change, this);
        },
        fill: function (path) {
            // вызывается один раз только в момент загрузки страницы
            if (!path) return;
            var segments = path.split("/");
            for (var i = 0; i < this.data.length; i++) {
                this.set(this.data[i], segments[i] || this.get(this.data[i]));
            }
        },
        fullpath: function () {
            return this.get("present") + "|" + this.getpath();
        },
        getpath: function () {
            var data = [];
            for (var i = 0; i < this.data.length; i++) {
                var v = this.get(this.data[i]);
                if ($.trim(v))
                    data.push(v);
                else break;
            }
            return data.join("/");
        },
        query: function () {
            this.set("list", null);
        },
        list: function () {
            if (this.get("list") && this.get("list").indexOf("=") !== -1) {
                this.set("params", this.getObjectByParam(this.get("list")));
            } else {
                this.set("params", null);
            }
            this.set({ page: 1 });
        },
        detail: function () {
            this.checkMonitoring();
            if (this.tickBalance) {
                clearTimeout(this.tickBalance);
                this.tickBalance = null;
            }
        },
        monitoring: { o: -1, f: null },
        checkMonitoring: function () {

            var detail = parseInt(this.get("detail")),
                m = this.monitoring,
                flag = (parseInt(this.get("tab")) === 4 || parseInt(this.get("tab")) === 2) && parseInt(this.get("sub")) === 0,
                gon = m.f !== flag;
            if (m.o !== detail) {
                m.o = detail;
                gon = true;
            }
            if (gon) {
                m.f = flag;
                require(['signalR'], function () {
                    require(['/signalr/hubs'], function () {
                        require([
               '/scripts/IWC-SignalR-master/signalr-patch.js',
               '/scripts/IWC-SignalR-master/iwc-signalr.js'
                        ], function () {
                            var hub = SJ.iwc.SignalR.getHubProxy('Ticker', { client: {} });

                            if (detail)
                                setTimeout(function () {
                                    if (flag) {
                                        hub.server.startMonitoringTasks($.ajaxSettings.url, detail);
                                    } else {
                                        hub.server.stopMonitoringTasks($.ajaxSettings.url, detail);
                                    }
                                }, 1000);

                        });
                    });
                });
            }
        },
        change: function () {

        },
        getObjectByParam: function (str) {
            if (!$.trim(str)) return null;
            var out = {},
                s = str.split("&");
            for (var i = 0; i < s.length; i++) {
                var el = s[i];
                var sel = el.split("=");
                if (!out.hasOwnProperty(sel[0]))
                    out[sel[0]] = sel[1];
            }
            return out;
        }
    });

    var s = new Select;

    return {
        Select: s,
        link: function () {
            var param = arguments[0],
                action = arguments[1] || "details",
                _id = param.id;
            return location.pathname + '/files/' + action + '/' + _id;
        },
        prepare: function (data, field, datetime) {
            var arr = [],
                fieldName = field || 'systemName',
                href = data.href;

            if (!$.isArray(data)) data = [data];

            Array.from(data, function (el) {
                var o = {
                    propType: {}
                };

                Array.from(el.data, function (p) {
                    o[p[fieldName]] = p.value; //  this.parse(p.value, p.propType, datetime);
                    o.propType[p[fieldName]] = p.propType;
                }, this);

                o.href = el.href;
                arr.push(o);

            }, this);
            return arr;
        },
        parse: function (v, t, datetime) {
            var output = v;
            switch (t) {
                case 2: // date
                    output = datetime ? new Date(v).toLocaleString() : new Date(v).toLocaleDateString(Resources.Lang);
                    break;
            }
            return output;
        },
        Get: function (r) {
            var items = r.items;
            var il = items.length;
            var c1 = new Backbone.Collection({ data: [{ name: "Display_Name", value: "Not found" }] });
            if (il) {
                c1 = new Backbone.Collection(items);
                //for (var i = 0; i < il; i++) {
                //    var el = items[0];
                //    var href = el.href;
                //    var data = el.data;
                //    var dl = data.length;
                //    //for (var k = 0; k < dl; k++) {
                //    //    var p = data[k];
                //    //    var name = p.name;
                //    //    var value = p.value;
                //    //    var prompt = p.prompt;
                //    //}
                //}
            }
            return c1;
        },
        _param: function (obj) {
            var output = "";
            var result = [];
            for (var pr in obj) {
                if (pr) {
                    output = (pr + "=" + obj[pr]);
                    result.push(output);
                }
            }
            return result.join("&");
        },
        check: function ($el, request, context) {

            if (this.access) {
                var guid = $.type($el) === "string" ? $el : $el.attr("data-id");
                if (guid) {
                    var flag = this.access.indexOf(guid) !== -1;
                    if (request && flag) {
                        
                            if (!$.cookie("hia")) {
                                $.ajax({ url: "/api/common/0/" + guid }).done(function (d) {
                                    if (d) {
                                        if (parseInt(d.data[0].value))
                                            request.call(context, d.data[1].value);
                                        $.cookie("hia", d.data[1].value, { expires: 30, path: "/" });
                                    }
                                }).fail(function () {
                                    $.Error(arguments[0]);
                                });
                            } else {
                                request.call(context, $.cookie("hia"));
                            }
                  
                    } else {
                        return flag;
                    }

                } else
                    return false;
            }
        },
        show: function ($list) {
            var s = this;
            $list.each(function (i, e) {
                if (s.check($(e).attr("data-id"))) { $(e).show(); } else { $(e).hide(); }
            })
        },
        navigate: function (fragment, options) {
            var router = this.router || new Backbone.Router;
            //if (Backbone.history.fragment == fragment) {
            //    Backbone.history.fragment = null;
            //}
            var _o = options ? true : false;
            router.navigate(fragment, { trigger: _o });
        },
        get: function () {
            var hash = location.hash;
            var s1 = hash.split("|");
            var s2 = s1[1].split("?");
            var s3 = s2[0];
            var segments = s3.split("/");
            return this.fill(segments);
        },
        collectUrl: function (obj, qstr) {
            var r = this.addParams(obj, qstr, true);
            if (r[0].indexOf("?") === -1 && r[0].indexOf("=") === -1) {
                var two = r[1];
                r.splice(1, 1);
                r[0] = r[0] + "?" + two;
            }
            return r.join("&");
        },
        getContext: function() {
            return {
                "key":$.ajaxSettings.url                  
            }
        },
        // нужно для формирования урлов с параметрами для api
        addParams: function (obj, qstr) {
            var path = "";
            if (qstr && qstr.indexOf("?") !== -1) {
                var s = qstr.split("?");
                path = s[0];
                qstr = s[1];
            }
            var q = qstr ? qstr.split("&") : [];
            for (var pr in obj) {
                var txt = (pr + "=" + obj[pr]);
                s = this.getParam(pr, qstr);
                if (!s) {
                    q.push(txt);
                } else {
                    var _s = (pr + "=" + s),
                        ind = q.indexOf(_s);
                    q[ind] = txt;
                }
            }
            return (path ? (path + "?") : "") + q.join("&");
        },
        // return array key, value
        getParams: function (name, qstr) {
            var r = [name, ""];
            if (qstr) {
                var s = qstr.split("&");
                for (var i = 0; i < s.length; i++) {
                    var el = s[i],
                        sel = el.split("=");
                    if (sel[0] === name)
                        return sel;

                }
            }
            return r;
        },
        getParam: function (name, qstr) {
            return this.getParams(name, qstr)[1];
        },

        parseHash: function () {
            var result = {};
            if (location.hash) {
                var lh = location.hash;
                var s = lh.split("?");
                if (s.length >= 2) {
                    var p = s[1].split("&");
                    for (var i = 0; i < p.length; i++) {
                        var el = p[i];
                        var sel = el.split("=");
                        result[sel[0]] = sel[1];
                    }
                }
            }
            return result;
        }
    };
});
