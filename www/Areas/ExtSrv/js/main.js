"use strict";
var anbr = {
    domain: "saweb5.anbr.ru", protocol: "http", dbase: null, lang: "ru-RU", action: "send",
    HEIGHT_WIDGET:400,
    timeUpdate: 10000,
    TIME_ABORT:30000,
    set: function (o) {
        this.domain = o.domain || this.domain;
        this.dbase = o.dbase || this.dbase;
        this.protocol = o.protocol || this.protocol;
        this.lang = o.lang || this.lang;
        this.action = o.action || this.action;
    }
};
anbr.net = {

    method: "POST",

    url: function (o) {

        var domain = o.domain || anbr.domain,
            action = o.action || anbr.action;

        return document.location.protocol + "//" + domain + "/api/extsrv/" + action;
        //return anbr.protocol + "://" + domain + "/lang-" + anbr.lang + "/db" + 159 + "/extsrv/get/" + action;

    },

    init: function (params, onload, caller, method, domain, dbase) {

        var me = method || this.method, url = this.url({ domain: domain, action: caller.action });

        this.xhr = this.makeCORSRequest(url, me);

        this.xhr.onload = function () {
            clearTimeout(timeout);
            onload.call(caller, this);
        }
        //
        //this.xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://localhost');

        this.xhr.setRequestHeader('Accept', 'application/json');
        this.xhr.setRequestHeader('Content-Type', 'application/json');
        this.xhr.setRequestHeader("key", window.location.href); //("//" + (domain || anbr.domain) + "/lang-" + anbr.lang + "/db" + (dbase || anbr.dbase)));
        
        this.xhr.onreadystatechange = function () {
            //if (this.readyState !== 4)
            
            if (this.status === 200) {
                caller.preloader.setAttribute("style", "display:none;");
            } else {
                caller.feedback.call(caller.origin, { event: "errorNot200" });
            }
        };

        this.xhr.onerror = function () {
            caller.feedback.call(caller.origin, { event: "errorXHR" });
        };

        this.xhr.onabort = function () {
            caller.feedback.call(caller.origin, { event: "abortXHR" });
        };


        caller.preloader.setAttribute("style", "");
        this.xhr.send(params);
        var xhr = this.xhr;
        var timeout = setTimeout(function () {
            caller.preloader.setAttribute("style", "display:none;");
             xhr.abort();
        }, anbr.TIME_ABORT);
    },

    makeCORSRequest: function (url, method) {

        if (typeof XMLHttpRequest === "undefined") {
            return null;
        }

        var xhr = new XMLHttpRequest();

        if ("withCredentials" in xhr) {
            xhr.withCredentials = true;
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest !== "undefined") {
            xhr = new XDomainRequest();
            xhr.withCredentials = true;
            xhr.open(method, url);
        } else {
            xhr = null;
        }
        return xhr;
    },
};

anbr.widget = function (a) {

    this.origin = a;
    this.canva = a.cid;

    var o = a.model.toJSON();

    this.switchOff = new Array();

    if (o.requestParameters) {
        this._rid = o.requestParameters.rid;
        this._param = o.requestParameters.parameters;
        this._page = o.requestParameters.page;
        this._pagesize = o.requestParameters.pagesize;
        anbr.set(o.requestParameters);
    }

    this.typeName = o.typeName;
    this.Decoration = o.Decoration;
    this.Columns = o.ColumnCustomizations;
    this.timeUpdate = o.timeUpdate;
    this._update = o.update;
    this._height = o.height;
    this._width = o.width;

    this.mainTitle = o.title;
    this.ts = "";
    this.getNextPage = true;
    
    this.id = "anbr_" + new Date().getTime();

    this.render();

    if (o.requestParameters.IsInvalid) {
        return;
    }

    this.action = "send";

    if (o.id) {
        this.widgetID = o.id;
        this.requestID = this._rid;
        if (this._rid)
            anbr.net.init(this.setParam(), this.load, this);
    }

    var types = ["WidgetTable", "WidgetRunning", "WidgetGraph", "WidgetMap"];

    if (this._update && types.indexOf(this.typeName) !== -1) {
        this.action = "LatestPosts";
        this._page = 1;
        setInterval(function () {
            var pagesize = this._pagesize + this.origin.feedItems.length;
            anbr.net.init(this.setParam({ ts: this.ts, pagesize: pagesize }), this.load, this);
        }.bind(this), this.timeUpdate);
    }

};

anbr.widget.prototype = {

    bind: function (evt, el, handler) {
        if (el.length) {
            Array.from(function (el, a) {
                this.bind(evt, a, handler);
            }, this);
        } else {
            if (el.addEventListener)
                el.addEventListener(evt, handler, false);
            else if (el.attachEvent)
                el.attachEvent("on" + evt, handler);
        }
    },

    getParams: function (obj) {
        var output = [];
        for (var pr in obj) {
            output[pr] = obj[pr];
        }
        return output;
    },

    setParam: function (o, notUseDefParams) {
        if (o) {
            this._rid = o.rid || this._rid;
            this._page = o.page || this._page;
            this._pagesize = o.pagesize || this._pagesize;
            this._param = o.parameters || this._param;
            this.ts = o.ts;
        }
        var p = { id: this._rid, page: this._page, pagesize: this._pagesize, pars: this._param, ts: this.ts };

        if (notUseDefParams)
            p.useDefParams = false;

        return JSON.stringify(p);
    },

    setDecoration: function () {

        var defaultBg = "background:#fff;",
            tcss = "padding:10px 10px 0;font-size: 18px;",
            mtcss = "font-size:1em;cursor:default;text-decoration:none;",
            lcss = 'font-size:13px;overflow:auto;clear:both;' + (this.typeName !== "WidgetTable" ? "padding:20px;" : "");
        
        if (this.Decoration) {
            if (this.Decoration.CaptionIsVisible) {
                if (this.Decoration.CaptionBackground)
                    tcss += "background:" + this.Decoration.CaptionBackground + ";";

                if (this.Decoration.BorderIsVisible) {
                    tcss += 'border:solid 1px ' + this.Decoration.CaptionBackground + ';border-bottom:0;';
                }

                if (this.Decoration.CaptionForeground)
                    mtcss += 'color:' + this.Decoration.CaptionForeground + ';';
            }else {
                tcss += "display:none;";
            }

            if (this.Decoration.ContainerIsTransparent)
                defaultBg = "background:transparent;";
            else if (this.Decoration.ContainerBackground)
                defaultBg = 'background:' + this.Decoration.ContainerBackground + ';';
            if (this.Decoration.ContainerForeground)
                lcss += 'color:' + this.Decoration.ContainerForeground + ';';

            if (this.Decoration.BorderIsVisible) {
                lcss += 'border:solid 10px ' + this.Decoration.CaptionBackground + ';';
            } else {
                tcss += "padding-bottom:10px;";
            }
        }
        
        this.head.setAttribute("style", tcss);
        this.container.setAttribute("style", lcss + defaultBg);
        this.mainTitleSpan.setAttribute("style", mtcss);
    },

    update: function (o, notUseDefParams) {
        var flag = false;
        if (o.requestParameters) {
            flag = true;// this._rid !== o.requestParameters.rid;
            this._rid = o.requestParameters.rid;
            this._param = o.requestParameters.parameters;
            this._page = o.requestParameters.page;
            this._pagesize = o.requestParameters.pagesize;
        }
        this.typeName = o.typeName;
        this.Decoration = o.Decoration;
        this.Columns = o.ColumnCustomizations;
        this.setDecoration();
        this.timeUpdate = o.timeUpdate;
        this._update = o.update;
        this._height = o.height;
        this._width = o.width;
        this._left = o.left;
        this._top = o.top;
        this.mainTitleSpan.textContent = this.mainTitle = o.title;
        var dataWidget = ["WidgetTable", "WidgetMap", "WidgetGraph", "WidgetRunning"];
        if (flag) {

            if (this.typeName !== "WidgetHtml")
                this.inload.innerHTML = "";

            anbr.net.init(this.setParam(o, notUseDefParams), this.load, this, null, o.requestParameters.domain, o.requestParameters.dbase);

        } else if (dataWidget.indexOf(this.typeName) !== -1) {
            this.feedback.call(this.origin, { event: "visual", data: (this.data.posts || this.data.feed.items), load: this.inload });
        }
        return this;
    },

    render: function () {

        var l = document.getElementById(this.canva);
        if (!l) return;
        var t = document.createElement("div"),
            c = document.createElement("div"),
            ca = document.createElement("div"),
            pl = document.createElement("span");
        
        t.setAttribute("class", "anbr_head");
        this.head = t;
        c.setAttribute("id", this.id);
        ca.setAttribute("class", "anbr_list");
        c.appendChild(ca);
        this.container = c;
        
        pl.innerHTML = '<svg><use xlink:href="#loader-rotator"></use></svg>';
        pl.setAttribute("style", "display:none;");
        pl.setAttribute("class", "loader Preloader");
        this.preloader = pl;

        this.mainTitleSpan = document.createElement("span");
        this.mainTitleSpan.textContent = this.mainTitle;
        t.appendChild(this.mainTitleSpan);

        // rubrics
        if (this.typeName === "WidgetTable") {

            var numNote = document.createElement("div");
            numNote.setAttribute("class", "number-update");
            this.head.appendChild(numNote);

            var filter = document.createElement("span");
            filter.setAttribute("class", "font-icon font-icon-filter");
            this.head.appendChild(filter);

            var view = document.createElement("span");
            view.innerHTML = '<svg class="view-all-list"><use xlink:href="#view-all-list"></use></svg>';
            this.head.appendChild(view);

            var filterFace = document.createElement("div");
            filterFace.setAttribute("class", "filter-panel");
            ca.appendChild(filterFace);           
        }
        
        this.setDecoration();
        
        t.appendChild(pl);
        l.appendChild(t);
        l.appendChild(c);
        


        var s = this, top = 0;
        if (this.typeName === "WidgetTable") {
            this.bind("scroll", ca.parentNode, function() {
                if (ca.style.display === "none") return;
                if (this.scrollTop > top && this.scrollTop > (this.scrollHeight - anbr.HEIGHT_WIDGET) / 2) {
                    top = this.scrollTop;
                    if (s.getNextPage) {
                        s.getNextPage = false;
                        s._pagesize = s.inload.getElementsByTagName("tr").length + s.origin.feedItems.length;
                        anbr.set({ action: "send" });
                        anbr.net.init(s.setParam({ pagesize: s._pagesize, page: 2 }), s.nextPageload, s);
                    }
                }
            });
        }


        var br = document.createElement("span");
        br.setAttribute("style", "clear:both;display:block;");
        this.head.appendChild(br);
        this.inload = ca;
    },

    nextPageload:function (o) {
        var data = JSON.parse(o.response);
        if (!data) return;

        var obs = data.posts || data.feed.items;
        anbr.set({ action: "LatestPosts" });        

        this.getNextPage = true;
        this.feedback.call(this.origin, { event: "update", data: obs });
    },
    
    done: function (a) {
        this.feedback = a;
        return this;
    },

    parsePosts:function () {
        var obs = this.data.posts;
        this.feedback.call(this.origin, { event: "post", data: obs });
    },
    
    parseFeed: function () {
        if (!this.data.feed)  return null;
        
        var obs = this.data.feed.items,
            table = this.inload.getElementsByTagName("table")[0],
            head = this.data.feed.head || [];
        
        this.linksCollection = this.data.feed ? this.data.feed.links : this.linksCollection || [];

        if (!table && head.length) {
            table = document.createElement("table");
            table.setAttribute("class", "widget-table");
            this.inload.appendChild(table);
        }
        
        this.data.feed.links = this.linksCollection;
        this.feedback.call(this.origin, { event: "visual", data: this.data.feed.items, load: this.inload });
    },

    load: function (o) {
        var data = JSON.parse(o.response);

        if (!data) return;
        else
            this.data = data;

        if (data.feed) {
            //this._page = data.feed.pagination.currentPage;
            //this._pagesize = data.feed.pagination.pageSize;
        }

        this.ts = data.ts;
        if (data.posts)
            this.parsePosts();
        else
            this.parseFeed();

        anbr.set({ action: "LatestPosts" });

    }   
}