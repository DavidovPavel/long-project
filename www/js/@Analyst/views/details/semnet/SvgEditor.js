define(["/js/libs/d3/d3.v3.min.js"], function (d3) {

    var editor = Backbone.View.extend({
        isInit:false,
        initialize: function() {

        },
        fn:function() {
            
        },
        btns: [],
        getDataBtn: function () {
            return {
                x: 4, width: 26, height: 22, fill: "#FFC835", ev: "mouseup", stroke: "peru", extra: { rx: 6 }, quickTip: {}
            };
        },
        addImageButton: function (name, tip) {
            var dy = this.btns.length * 26;
            this.btns.push(name);
            var src = "/Images/editor/" + name + ".png";
            var b = new pergola.ToolButton(name);
            var dataBtn = this.getDataBtn();
            dataBtn.parent = this.panel.control;
            dataBtn.y = dy + 4;
            if (tip) dataBtn.quickTip.tip = tip;
            dataBtn.image = { "xlink:href": src, width: 16, height: 16, x: 6, y: 3 };
            dataBtn.symbol = { symbol: src, width: 16, height: 16, x: 6, y: 3, opacity: .8 };
            var s = this;
            dataBtn.fn = function () {
                this.selected = !this.selected;
                s.fn(name, this.selected);
            };
            b.build(dataBtn);
        },
        addTextButton: function (name, tip) {
            var dy = this.btns.length * 26;
            this.btns.push(name);
            var b2 = new pergola.ToolButton(name);
            var s = this;
            var dataBtn = this.getDataBtn();
            dataBtn.parent = this.panel.control;
            dataBtn.y = dy + 4;
            if (tip) dataBtn.quickTip.tip = tip;
            dataBtn.text = { x: 13, y: 17, textNode: name, "font-size": 18, "font-family": "'Times New Roman'", 'pointer-events': "none", 'text-anchor': "middle" };
            if (arguments[2]) {
                var key = arguments[2][0], value = arguments[2][1];
                dataBtn.text[key] = value;
            }
            var s = this;
            dataBtn.fn = function () {
                this.selected = !this.selected;
                s.fn(name, this.selected);
            };
            b2.build(dataBtn);
        },
        shift: function (flag, win) {
            this.switchon = flag;
            var s = this;
            
            d3.selectAll(win.childDoc.transformable.getElementsByClassName("node"))
               .on("dblclick", null)
               .on("click", null);

            var drag = d3.behavior.drag().on("drag", s.dragging);
            d3.selectAll(win.childDoc.transformable.getElementsByClassName("node")).call(drag);

            if (!this.isInit) {
                this.isInit = true;
                this.panel = new pergola.Panel("editorTools");
                this.panel.build({ type: "basic", x: 20, y: 150, width: 34, fill: "#FFFFF8", "fill-opacity": .96, "stroke-opacity": .8, filter: "none", display: "block" });

                this.addImageButton("edit", "выбрать");
                this.addTextButton("B", "bold", ["font-weight", "bold"]);
                this.addTextButton("I", "italic", ["font-style", "italic"]);
                this.addTextButton("U", "underline", ["text-decoration", "underline"]);
                this.addImageButton("left", "выравнивание по левому краю");
                this.addImageButton("center", "выравнивание по центру");
                this.addImageButton("right", "выравнивание по по правому краю");

                this.addImageButton("front", "на передний план");
                this.addImageButton("back", "на задний план");
            }
        },
        dragging: function () {
            /**/

            var deltaX = d3.event.dx;
            var deltaY = d3.event.dy;

            //связи которые идут к фигуре (набор селекторов вида #edge3_2,#edge3_5)
            var linksTo = this.attributes["data-edgesTo"].value;
            //связи которые идут от нее (набор селекторов вида #edge3_2,#edge3_5)
            var linksFrom = this.attributes["data-edgesFrom"].value;

            if (linksTo != null && linksTo != "") {
                //обракботка кривой каждой связи вида (d="M113.729,-75.0987C114.69,-77.9282 115.835,-81.2976 117.048,-84.8709")
                //где мы меняем начало M113.729,-75.0987
                //предварительно преобразуя кривую в прямую линию
                //see: http://www.w3.org/TR/SVG/paths.html

                var sel = $(this.parentNode).find(linksTo);

                d3.selectAll(sel).each(function () {
                    var path = d3.select(this).select("path");
                    var pathDom = path[0][0];
                    var segments = pathDom.pathSegList;
                    var d = path.attr("d");

                    var seg1 = segments.getItem(segments.numberOfItems - 1);
                    if (d.indexOf("C") != -1) {
                        var finalX = seg1.x + deltaX;
                        var finalY = seg1.y + deltaY;
                        while (segments.numberOfItems != 1) {
                            segments.removeItem(segments.numberOfItems - 1);
                        }

                        segments.appendItem(pathDom.createSVGPathSegLinetoAbs(finalX, finalY));
                    } else {
                        seg1.x = seg1.x + deltaX;
                        seg1.y = seg1.y + deltaY;
                    }

                })
            }

            if (linksFrom != null && linksFrom != "") {
                //обракботка кривой каждой связи вида (d="M113.729,-75.0987C114.69,-77.9282 115.835,-81.2976 117.048,-84.8709")
                //где мы меняем конец 117.048,-84.8709
                //предварительно преобразуя кривую в прямую линию
                //see: http://www.w3.org/TR/SVG/paths.html
                
                var sel2 = $(this.parentNode).find(linksFrom);

                d3.selectAll(sel2).each(function () {
                    var path = d3.select(this).select("path");
                    var pathDom = path[0][0];
                    var segments = pathDom.pathSegList;

                    var d = path.attr("d");

                    var seg0 = segments.getItem(0);
                    var seg1 = segments.getItem(segments.numberOfItems - 1);
                    if (d.indexOf("C") != -1) {
                        var finalX = seg1.x;
                        var finalY = seg1.y;
                        while (segments.numberOfItems != 1) {
                            segments.removeItem(segments.numberOfItems - 1);
                        }

                        segments.appendItem(pathDom.createSVGPathSegLinetoAbs(finalX, finalY));
                    }
                    seg0.x = seg0.x + deltaX;
                    seg0.y = seg0.y + deltaY;
                })
            }

            var x = d3.event.dx + parseFloat(this.attributes["x"].value);
            var y = d3.event.dy + parseFloat(this.attributes["y"].value);
            this.setAttribute("x", x);
            this.setAttribute("y", y);

            d3.select(this).attr("transform", function () {
                return "translate(" + [x, y] + ")"
            });
        }

    });


    var e = new editor;
    return {
        get :function () {
            return e;
        }
    }

});