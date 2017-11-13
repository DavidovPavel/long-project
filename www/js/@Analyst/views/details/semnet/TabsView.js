define(function(require) {

    var Resources = require('i18n!nls/resources.min'),
        SvgEditor = require('views/details/semnet/SvgEditor'),
        //GeneralView = require('views/GeneralView').get(),
        d3 = require("/js/libs/d3/d3.v3.min.js");

    return Backbone.View.extend({
        resize: function () {
            this.win.maximizeControl();
        },
        initWinPergola: function () {
            
            var win = this.win;
            if (win.tools)
                win.tools.ftypes.innerHTML = this.model.get("filterName");

            var parser = new DOMParser();
            var doc = parser.parseFromString(this.model.get("html"), "text/xml");
            var node = document.importNode(doc.documentElement, true);
            if (win.childDoc.transformable.hasChildNodes()) {
                win.childDoc.transformable.removeChild(win.childDoc.transformable.firstChild);
            }
            win.childDoc.transformable.appendChild(node);
            if (!pergola.mutationEvnt) win.childDoc.updateOnMutationEvent();
            //win.topBar.title.textContent/*innerHTML*/ = this.model.get("title") + " :: " + Resources.SemNetWindowName;
            $(win.childDoc.transformable).attr("transform", "matrix(1 0 0 1 0 0)");

            var s = this;
            d3.selectAll(win.childDoc.transformable.getElementsByTagName("g"))
               .on("dblclick", s.dblclick)
               .on("click", s.clk);
            
        },
        setCurrent:function () {
            if (!this.isInit) {
                this.isInit = true;
                this.render();
            }
        },
        initialize: function () {
            
            Backbone.on("fullscreen", this.resize, this);

            var pergola = this.options.pergola,
                s = this;
            
            this.win = new pergola.Window(this.model.get("title"));
            this.win.build({
                resizable: true,
                isFull: true,
                x: 0,
                y: 0,
                width: 640,
                height: 480,
                //name: this.model.get("title"),
                menu: {
                    menu1: {
                        title: Resources.Operation,
                        items: {
                            item1: { string: Resources.download, active: true, fn: function() { s.handler("downloadSwg", s); } },
                            item2: { string: Resources.refresh, active: true, fn: function() { s.handler("refresh", s); } }
                        }
                    },
                    menu2: {
                        title: Resources.Filters,
                        items: {
                            item1: { name: 1, string: Resources.snfname, active: true, check: false, fn: function() { s.handler("sendParam", s, this); } },
                            item2: { string: Resources.snshowlf, active: true, check: false, fn: function() { s.handler("sendParam", s, this); } },
                            item3: { string: Resources.snhidemo, active: true, check: false, fn: function() { s.handler("sendParam", s, this); }, separator: new pergola.Separator() },
                            item4: {
                                string: Resources.Filterbytype,
                                active: false,
                                submenu: {
                                    items: {
                                        item1: { string: Resources.selectTree, active: true, fn: function() { s.handler("selectFilter", s, this); }, },
                                        item2: { string: Resources.clear, active: true, fn: function() { s.handler("clearFilter", s, this); }, }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            Backbone.on("window:resizeend", this.win.maximizeControl, this);
            
            this.getToolBal(pergola);

            this.win.tab.button.snid = this.model.get("snid");
            this.win.tab.button.onclick = function () {
                s.setCurrent(this.snid);
            }
            if (this.model.get("snid") == -1) {
                this.isInit = true;
                this.render();
            } 
            
        },
        getToolBal: function (pergola) {
            var s = this, win = this.win;
            function _fitWidth(s) {
                var w = s.width - 10;
                $(s.group).find("g[transform*='5']").attr("transform", "translate(" + w + ",5)");
                $(s.group).find("g[transform*='17']").attr("transform", "translate(" + w + ",17)");
            }

            var pTools = $C({ element: "g", id: "pTools", transform: "translate(136 3)", appendTo: win.toolBar.group.lastChild });

            var sLayout = new pergola.Selector("sLayout");
            sLayout.build({
                x: 30,width: 40,parent: pTools,list: ["0", "1", "2", "3", "4", "5", "6"],index: 0,
                fn: function() { s.handler("sendLayout", s, this.index); },
                caption: { text: { x: -3, y: 15, fill: "white", textNode: Resources.display, "pointer-events": "none" } }
            });

            var sStr = new pergola.Selector("sStr");
            sStr.build({
                width: 120, x: 75, parent: pTools, list: [Resources.ss1, Resources.ss2, Resources.ss3], index: 0,
                fn: function () { s.handler("sendVisio", s, this.index); }
            });

            var sLevel = new pergola.Selector("sLevel");
            sLevel.build({
                x: 200, width: 66, parent: pTools, list: ["Level 1", "Level 2", "Level 3"], index: this.model.get("level")||1,
                fn: function () { s.handler("sendLevel", s, this.index); }
            });

            var sTypes = this.text = $C({element: 'text',x: 282,y: 16,textNode: "",appendTo: pTools});


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
        render: function () {
            this.model.url = ("/api/SemNet/" + this.model.id + "/?semnetid=" + this.model.get("snid") + "&"
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
                success: function(model) {
                    w.initWinPergola(model);
                    $("#SemNet").hideIndicator();
                },
                error: function() {
                    $.Error(arguments[1], this.$el);
                }
            });
            return this;
        },
        
        dblclick: function () {
            
        },
        clk: function () {
            var o = { id: $(this).attr("data-objectid"), title: $(this).attr("data-text") };
            if (o.id) {
                Backbone.trigger("general:add", o);
                //GeneralView.render(o);
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
                this.countWin.push(sn002);
                this.initWinPergola(null, sn002, Resources.editwin + "_" + this.countWin.length);
                SvgEditor.get().shift(flag, sn002);
            }
        },
        handler: function (cmd, o, arg) {
            o[cmd].call(o, arg);
        },
        clearFilter: function () {
            this.model.set("filterName", "");
            this.model.set("filterValue", "");
            this.refresh();
        },
        selectFilter: function () {
            var m = Backbone.Model.extend({}),
                mi = new m({ ParametrType: "Type" });
            mi.on("choice:close", this.finish, this);
            Backbone.trigger("choice:view", mi);
        },
        finish: function (c) {
            if (c.size()) {
                var names = c.pluck("title");
                var ids = c.pluck("id");
                var sn = require('views/details/SemNetView').get().WinPergola;
                sn.model.set("filterName", names.toString());
                sn.model.set("filterValue", ids);
                sn.render();
            }
        },
        sendParam: function (arg) {
            var eparam = [];
            var s = arg.menuObject.items;
            var l = arg.menuObject.list;
            for (var el in s) {
                eparam.push(l[el].check ? 1 : 0);
            }
            this.model.set("eparam", eparam);
            this.render();
        },
        downloadSwg: function () {
            var svg = this.sn001.childDoc.transformable.innerHTML;
            var form = document.forms["svgToPng"];
            var b64 = require("/js/libs/base64.js");
            form["data"].value = encodeURIComponent(b64.encode(svg));
            //$.Error(b64.decode(form["data"].value));
            form.submit();
        },
        sendLevel: function (arg) {
            this.model.set("level", arg + 1);
            this.render();
        },
        sendVisio: function (arg) {
            this.model.set("astree", arg);
            this.render();
        },
        sendLayout: function (arg) {
            this.model.set("layout", arg);
            this.render();
        }
    });
});