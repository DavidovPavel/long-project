define(['i18n!nls/resources',
'views/details/semnet/SvgEditor',
"/js/libs/d3/d3.v3.min.js"],
function ( Resources,        SvgEditor,        d3) {

    var SemModel = Backbone.Model.extend({
        defaults: {
            id: null,
            snid: null,
            title: "",
            html: ""
        }
    });

    return Backbone.View.extend({
        resize:function() {
            _.each(this.wins, function (w) {
                $(this.container).width($(this.container).parent().parent().width()-15);
                w.reduceControl();
                w.maximizeControl();
            }, this);
        },
        initialize: function () {
            var container = this.options.container,
                w = this;
            Backbone.on("fullscreen", this.resize, this);
            this.wins = { };
            this.container = container;
            //this.tab = new TabView();
            
            // start pergola
            require(["/js/libs/pergola/pergola_min.js"], function () {
                var pergola = window.pergola;
                pergola.settings = { skin: "rubber", theme: "lightsteelblue" };
                pergola.path = "/js/libs/pergola/";
                pergola.debug = false;
                pergola.container = container;
                pergola.doc = $C({ element: "svg", width: "100%", height: "100%", appendTo: pergola.container });
                pergola.defs = $C({ element: "defs", id: "pergola_defs", appendTo: pergola.doc });
                define("pergola", pergola);

                require(["/js/libs/pergola/lib/filters/filters.js"], function () {
                    require(["/js/libs/pergola/lib/markers/markers.js"], function () {
                        require(["/js/libs/pergola/lib/patterns/patterns.js"], function () {
                            require(["/js/libs/pergola/lib/shapes/shapes.js"], function () {
                                require(["/js/libs/pergola/lib/symbols/symbols.js"], function () {
                                    require(["/js/libs/pergola/lib/cursors/cursors.js"], function () {
                                        require(["/js/libs/pergola/lib/qtips.js"], function () {
                                            require(["/js/libs/pergola/lib/msg.js"], function () {
                                                require(["/js/libs/pergola/lib/skins/skins.js"], function () {
                                                    require(["/js/libs/pergola/c.js"], function () {
                                                        require(["pergola"], function (pergola) {
                                                            w.pergola = pergola;
                                                            w.getWindow(pergola);
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
            // end pergola  
        },
        countWin: [],
        clear:function () {
            for (var w in this.wins) {
                var a = this.wins[w];
                a.control.innerHTML = "";
                $(a.tab.group).remove();
            }
            this.wins = { };
        },
        getWindow: function () {
            this.clear();
            var Tabs = this.model.get("Tabs");
            Tabs = _.sortBy(Tabs, function (a) { return a.snid <= -1;});
            _.each(Tabs, function (o) {
                this.createWin(o);
            }, this);
        },
        createWin:function (o) {
            var win = new pergola.Window(o.title), s = this;
            win.build({
                id: o.snid,
                resizable: true,
                isFull: true,
                x: 0,
                y: 0,
                //width: 640,
                //height: 480,
                menu: {
                    menu1: {
                        title: Resources.Operation,
                        items: {
                            item1: { string: Resources.download, active: true, fn: function () { s.handler("downloadSwg", s, o.snid); } },
                            item2: { string: Resources.refresh, active: true, fn: function () { s.handler("render", s, { snid: o.snid }); } }
                        }
                    },
                    menu2: {
                        title: Resources.Filters,
                        items: {
                            item1: { name: 1, string: Resources.snfname, active: true, check: false, fn: function () { s.handler("sendParam", s, this, { snid: o.snid }); } },
                            item2: { string: Resources.snshowlf, active: true, check: false, fn: function () { s.handler("sendParam", s, this, { snid: o.snid }); } },
                            item3: { string: Resources.snhidemo, active: true, check: false, fn: function () { s.handler("sendParam", s, this, { snid: o.snid }); }, separator: new pergola.Separator() },
                            item4: {
                                string: Resources.Filterbytype,
                                active: false,
                                submenu: {
                                    items: {
                                        item1: { string: Resources.selectTree, active: true, fn: function () { s.handler("selectFilter", s, { snid: o.snid }); }, },
                                        item2: { string: Resources.clear, active: true, fn: function () { s.handler("clearFilter", s, { snid: o.snid }); }, }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            //$(window).resize(function () { win.maximizeControl(); });
            
            this.getToolBal(win,o);

            win.tab.button.snid = o;
            win.tab.button.onclick = function () {
                s.setCurrent(o);
            }
            if (o.snid == -1) {
                o.isInit = true;
                this.render(o);
            }
            this.wins[o.snid] = win;
        },
        setCurrent: function (o) {
            if (!o.isInit) {
                o.isInit = true;
                this.render(o);
            }
        },
        getToolBal: function (win, o) {
            var s = this;
            function _fitWidth(s) {
                var w = s.width - 10;
                $(s.group).find("g[transform*='5']").attr("transform", "translate(" + w + ",5)");
                $(s.group).find("g[transform*='17']").attr("transform", "translate(" + w + ",17)");
            }

            var pTools = $C({ element: "g", id: "pTools", transform: "translate(136 3)", appendTo: win.toolBar.group.lastChild });

            var sLayout = new pergola.Selector("sLayout");
            sLayout.build({
                x: 30, width: 40, parent: pTools, list: ["0", "1", "2", "3", "4", "5", "6"], index: 0,
                fn: function () { s.handler("sendLayout", s, this.index, o); },
                caption: { text: { x: -3, y: 15, fill: "white", textNode: Resources.display, "pointer-events": "none" } }
            });

            var sStr = new pergola.Selector("sStr");
            sStr.build({
                width: 120, x: 75, parent: pTools, list: [Resources.ss1, Resources.ss2, Resources.ss3], index: 0,
                fn: function () { s.handler("sendVisio", s, this.index, o); }
            });

            var sLevel = new pergola.Selector("sLevel");
            sLevel.build({
                x: 200, width: 66, parent: pTools, list: ["Level 1", "Level 2", "Level 3"], index: this.model.get("level") || 1,
                fn: function () { s.handler("sendLevel", s, this.index, o); }
            });

            var sTypes = this.text = $C({ element: 'text', x: 282, y: 16, textNode: "", appendTo: pTools });


            //this.editButton = new pergola.ToolButton("editButton");
            //this.editButton.build({
            //    parent: pTools,x: 300,width: 26,height: 22,fill: "#FFC835",ev: "mouseup",
            //    extra: {rx: 6},
            //    quickTip: {tip: Resources.editopt},
            //    image: {"xlink:href": "/Images/edit.png",width: 16,height: 16,x: 6,y: 3},
            //    symbol : {symbol: "/Images/edit.png",width : 16,height : 16,x : 6,y : 3,opacity : .8},
            //    fn: function () {
            //        this.selected = !this.selected;
            //        s.forEvents(this.selected);
            //    }
            //});

            win.tools = { panel: pTools, layout: sLayout, struct: sStr, ftypes: sTypes };

            _fitWidth(sLayout);
            _fitWidth(sStr);
            _fitWidth(sLevel);
        },
        render: function (o) {
            this.model.url = ("/api/SemNet/" + this.model.id + "/?semnetid=" + o.snid + "&"
                + $.param({
                    "layout": this.model.get("layout"),
                    "level": this.model.get("level") || 2,
                    "astree": this.model.get("astree"),
                    "filter": this.model.get("filterValue"),
                    "fname": this.model.get("filterName"),
                    "eparam": this.model.get("eparam")
                }));
            var w = this;
            $("#SemNet").showIndicator();
            this.model.fetch({
                success: function () {
                    w.initWinPergola(o);
                    $("#SemNet").hideIndicator();
                },
                error: function () {
                    $.Error(arguments[1], this.$el);
                }
            });
            return this;
        },
        initWinPergola: function (o) {

            var win = this.wins[o.snid];
            if (win.tools)
                win.tools.ftypes.innerHTML = this.model.get("filterName");

            var parser = new DOMParser(),
                doc = parser.parseFromString(this.model.get("html"), "text/xml"),
                node = document.importNode(doc.documentElement, true);
            
            if (win.childDoc.transformable.hasChildNodes()) {
                win.childDoc.transformable.removeChild(win.childDoc.transformable.firstChild);
            }
            win.childDoc.transformable.appendChild(node);

            var bBox = win.childDoc.transformable.firstChild.getBBox();
            win.childDoc.transformable.firstChild.setAttribute("width", bBox.width + bBox.x);
            win.childDoc.transformable.firstChild.setAttribute("height", bBox.height + bBox.y);
            //svg.viewBox = "0.00 0.00 " + (bBox.width + 20) + " " + (bBox.height + 20);

            if (!pergola.mutationEvnt) win.childDoc.updateOnMutationEvent();
            win.topBar.title.textContent = o.title + " :: " + (o.snid == -1 ? Resources.SemNetWindowName : Resources.SemNetWindowName2);
            $(win.childDoc.transformable).attr("transform", "matrix(1 0 0 1 0 0)");

            var s = this;
            d3.selectAll(win.childDoc.transformable.getElementsByTagName("g"))
               .on("dblclick", s.dblclick)
               .on("click", s.clk);

        },
        dblclick: function () {
           
        },
        clk: function () {
            var o = { id: $(this).attr("data-objectid"), title: $(this).attr("data-text") };
            if (o.id) {
                //GeneralView.render(o);
                Backbone.trigger("general:add", o);
            }
        },

        forEvents: function (flag) {
            if (flag) {
                var ind = "edit" + "_" + this.countWin.length;
                var sn002 = new pergola.Window(ind);
                sn002.build({
                    resizable: true,
                    isFull: true,
                    x: 0,
                    y: 0,
                    width: 640,
                    height: 480
                });
                $(window).resize(function () { sn002.maximizeControl(); });
                this.wins["edit"] = sn002;
                this.initWinPergola({ snid: "edit", title: Resources.editwin + "_" + this.countWin.length });
                SvgEditor.get().shift(flag, sn002);
            }
        },
        handler: function (cmd, o, arg, arg2) {
            o[cmd].call(o, arg, arg2);
        },
        clearFilter: function (o) {
            this.model.set("filterName", "");
            this.model.set("filterValue", "");
            this.render(o);
        },
        selectFilter: function (o) {
            var m = Backbone.Model.extend({}),
                mi = new m({ ParametrType: "Type" });
            mi.on("choice:close", this.finish, this);
            this.osnid = o;
            Backbone.trigger("choice:view", mi);
        },
        finish: function (c) {
            if (c.size()) {
                var names = c.pluck("title");
                var ids = c.pluck("id");
                var sn = require('views/details/SemNetView').get().WinPergola;
                sn.model.set("filterName", names.toString());
                sn.model.set("filterValue", ids);
                sn.render(sn.osnid);
            }
        },
        sendParam: function (arg, o) {
            var eparam = [];
            var s = arg.menuObject.items;
            var l = arg.menuObject.list;
            for (var el in s) {
                eparam.push(l[el].check ? 1 : 0);
            }
            this.model.set("eparam", eparam);
            this.render(o);
        },
        downloadSwg: function (w) {
            var a = this.wins[w],
                svg = a.childDoc.transformable.innerHTML,
                form = document.forms["svgToPng"],
                b64 = require("/js/libs/base64.js");

            form["data"].value = encodeURIComponent(b64.encode(svg));
            //$.Error(b64.decode(form["data"].value));
            form.submit();
        },
        sendLevel: function (arg, o) {
            this.model.set("level", arg + 1);
            this.render(o);
        },
        sendVisio: function (arg, o) {
            this.model.set("astree", arg);
            this.render(o);
        },
        sendLayout: function (arg, o) {
            this.model.set("layout", arg);
            this.render(o);
        }
        //refresh: function () {
        //    this.model.url = ("/api/SemNet/" + this.model.id + "/?"
        //        + $.param({
        //            "layout": this.model.get("layout"),
        //            "level": this.model.get("level"),
        //            "astree": this.model.get("astree"),
        //            "filter": this.model.get("filterValue"),
        //            "fname": this.model.get("filterName"),
        //            "eparam": this.model.get("eparam")
        //        }));
        //    var w = this;
        //    $("#SemNet").showIndicator();
        //    this.model.fetch({
        //        success: function (model) {
        //            w.initWinPergola(model);
        //            $("#SemNet").hideIndicator();
        //        },
        //        error: function () {
        //            $.Error(arguments[1], this.$el);
        //        }
        //    });
        //}
    });

});