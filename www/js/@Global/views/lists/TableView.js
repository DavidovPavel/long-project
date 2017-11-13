define([
    'app',
    'i18n!nls/resources.min',
    'g/content/BrowsingView',
    'baseurl',
    '/Scripts/jquery.mCustomScrollbar.concat.min.js',
    'jqueryui'
],
function (App, Resources, Browsing, baseUrl) {

    /*
        используется для списков в Результатах работы источников 
        @Inquiry\views\result\CheckTabsView
    */

    var Kit = Backbone.View.extend({
        events: {
            "click li": "exec"
        },
        exec: function (e) {
            var $e = $(e.target).closest("li"),
                name = $e.attr("class"),
                sid = $e.attr("data-id");

            if ($.trim(sid)) {

                if (!this.selected.length)
                    this.selected.push(parseInt(this.model.id));

                Backbone.trigger("message:exec",
                    {
                        sid: sid,
                        fx: function () {
                            // goto line 293
                            this.trigger("kit:exec", { name: name, model: this.model });
                            this.selected = [];
                        },
                        ctx: this,
                        amount: this.selected.length
                    });
            }
            this.$('ul').hide();
        },        
        render: function (tmpl) {
            this.$el.html(_.template(tmpl)({ Resources: Resources }));
            return this;
        },
        show: function (e) {

            var link = baseUrl + "#3|Tree/0/1/" + this.model.id + "/0/0";
            this.$(".cmd_analyst a").attr("href", link);

            this.$('ul').clearQueue();
            this.$('button').removeClass('active');

            var $b = $(e.target).is("button") ? $(e.target) : $(e.target).closest("button"),
               pos = $b.offset(),
               top = pos.top,
               left = pos.left,
               bh = this.$("ul").height(),
               bw = this.$("ul").width();

            $b.toggleClass('active');
 
            var ww = $(window).width();

            if (pos.top < bh) {
                top = 10;
            }

            if (pos.left > ww - bw) {
                left = ww - bw - 10;
                this.$(".list-area").css("left", 0);
                this.$(".list-area").css("margin-left", "-" + (this.$(".list-area").width() + 4) + "px");
            } else {
                this.$(".list-area").css("margin-left", 0);
                this.$(".list-area").css("left", bw + 2);
            }

            this.$el.css({ position: 'absolute', top: top, left: left });

            this.$('ul').show();            
        }
    });

    return Backbone.View.extend({
        //tagName: "table",
        events: {
            "click .link": "showinfo",
            "click button.btn-link": "showKit",
            "mouseleave tr": "hideMenu",
            "mouseenter tr": "showButtonKit",
            "mouseenter .dropdown-list-menu": "clearHide",
            "click .paginator a": "gopage",
            "click td>a":"ancor"
        },
        ancor:function(e){
            if (Browsing.isOpen) {
                e.preventDefault();
                require(['g/content/ContentView'], function (ContentView) {
                    var cnt = new ContentView({ objID: $(e.target).closest("tr").attr("data-id"), oid: this.model.id }).setElement(Browsing.$el).done(function (v) {
                        Browsing.start(v.model.get("Display_Name"));
                        cnt.fitSize({
                            width: Browsing.$el.width(),
                            height: Browsing.d.model.showHeader ?
                                Browsing.d.model.maxHeight - Browsing.d.wrapper.find(".e-titlebar").outerHeight() : Browsing.d.model.maxHeight
                        });
                    }.bind(this)).render();
                    cnt.listenTo(Browsing, "browsing:resize", function (a) {
                        cnt.fitSize(a);
                    });
                }.bind(this));
            }
        },
        showinfo: function (e) {
            // todo:
            var id = $(e.target).closest("tr").attr("data-id");
            this.trigger("show:info", id);
        },
        initialize: function (o) {
            this.options = o;
            if (o) {
                this.head = o.head;
                this.foot = o.foot;
                this.template = o.template;
                this.isScroll = o.isScroll;
            }
            this.collection = new Backbone.Collection();
            this.collection.on("add", this.addOne, this);
            this.collection.on("remove", this.remove, this);
            this.collection.on("reset", this.list, this);
        },
        showButtonKit: function (e) {
            //if (!this.buttonKitHide)
                $(e.target).closest("tr").find("button").show();
        },
        clearHide: function () {
            this.$('.dropdown-list-menu ul').clearQueue();
        },
        hideMenu: function (e) {
            var $tr = $(e.target).closest("tr"),
                vid = $tr.attr("data-id");
            if (this.$('.dropdown-list-menu ul').is(":visible") && vid)
                this.$('.dropdown-list-menu ul').delay(1000).hide(100);
            $tr.find("button").hide();
        },
        select: function (e) {
            if (e.target.tagName.toLowerCase() === "th") return null;
            var _target = $(e.target).closest("tr"),
                _id = _target.attr("data-id");
            this.$el.find("tr.ui-selected").removeClass("ui-selected");
            _target.addClass("ui-selected");
            return _id;
        },
        showKit: function (e) {
            e.stopPropagation();
            var id = this.select(e);
            if (id) {
                if ($(e.target).closest("button").hasClass("viewer")) {
                    require(['g/content/ContentView'], function (ContentView) {
                        Browsing.set({ width: $(window).width() - 100, height: $(window).height() - 20, position: { X: 50, Y: 50 } });
                        var cnt = new ContentView({ objID: id, oid: this.model.id }).setElement(Browsing.$el).done(function (v) {
                            Browsing.start(v.model.get("Display_Name"));
                            cnt.fitSize({
                                width: Browsing.$el.width(),
                                height: Browsing.d.model.showHeader ?
                                    Browsing.d.model.maxHeight - Browsing.d.wrapper.find(".e-titlebar").outerHeight() : Browsing.d.model.maxHeight
                            });
                        }.bind(this)).render();
                        cnt.listenTo(Browsing, "browsing:resize", function (a) {
                            cnt.fitSize(a);
                        });
                    }.bind(this));
                    return;
                }

                this.kit.model = this.collection.get(id);
                this.kit.selected = this.data;
                this.kit.show(e);
                this.$("tr[data-id='" + id + "']").addClass("ui-selected");
            }
        },

        remove:function(a){
            if (this.isScroll) {
                this.$(".scroll-wrap tbody tr[data-id='" + a.id + "']").remove();
                this.$(".scroll-wrap").mCustomScrollbar("update");
            } else {
                this.$("tbody tr[data-id='" + a.id + "']").remove();
            }
            this.thimColum();
        },

        addOne:function(m){
            if (this.isScroll) {
                this.$(".scroll-wrap tbody").append(_.template(this.template)(m.toJSON()));
                this.$(".scroll-wrap").mCustomScrollbar("update");
            } else {
                this.$("tbody").append(_.template(this.template)(m.toJSON()));
            }
            this.thimColum();
        },

        list: function () {
            this.$el.hideIndicator();
            this.$(".info").hide();
            this.$(".paging-box").hide();
            this.$("tbody").empty(); 

            this.collection.each(function (m) {
                if (!this.template)
                    this.getTemplate(m);
                if (m.id) {
                    var r = m.toJSON();
                    r.Resources = Resources;
                    this.$("tbody").append(_.template(this.template)(r));
                }
            }, this);

            if (this.isScroll) {
                this.$(".scroll-wrap").mCustomScrollbar("update");
            }

            this.getFoot().thimColum().paging().selectableInit();
            return this;
        },

        thimColum: function () {
            if (this.isScroll) {
                var SCROLL_WIDTH = this.$(".mCSB_scrollTools_vertical").is(":visible") ? 10 : 0,
                    $th = this.$(".table-scroll-head tr th:first"),
                    $td = this.$(".scroll-wrap tr:has(td):first td:first");
                $th.width($td.width() - SCROLL_WIDTH);               
            }
            return this;
        },

        render: function () {
            var $table = $(_.template("<table class='table inquiry table-hover'><thead></thead><tbody></tbody><tfoot><tr><td><div class='dropdown-list-menu'></div></td></tr></tfoot></table>")({ Resources: Resources }));

            this.$el.append($table);

            if (this.head)
                this.$("table thead").html(_.template(this.head)({ Resources: Resources }));


            if (this.isScroll) { 
                var $wrap = $("<div class='scroll-wrap'></div>");
                $table.wrap($wrap);

                var $cloneHead = $table.find("thead").clone(),
                    $newHead = $("<table class='table table-hover table-scroll-head'></table>").append($cloneHead);

                $newHead.insertBefore(this.$(".scroll-wrap"));

                this.$(".scroll-wrap").height(this.$el.height() - $newHead.outerHeight());

                this.$(".scroll-wrap").mCustomScrollbar({
                    callbacks: {
                        onInit: this.thimColum.bind(this),
                        onUpdate: this.thimColum.bind(this)
                    }
                });

                $table.find("thead").hide();
            }
            this.$el.append(_.template("<div class='paging-box'><div class='paginator' id='pagination'></div><div class='paginator_pages'><%= Resources.Pages2 %>: <span>0</span></div></div>")({ Resources: Resources }));
            this.paginatorSelector = "pagination" + this.cid;
            this.$("#pagination").attr("id", this.paginatorSelector);
            this.$(".paging-box").hide();
            return this;
        },        
        getTemplate: function(m) {
            var head = "<tr>";
            this.template = "<tr>";
            _.each(m.toJSON(), function (value, key) {
                    this.template += "<td><%= " + key + " %></td>";
                head += "<th><%= " + key + "%></th>";
            }, this);
            this.template += "</tr>";
            head += "</tr>";
            if (!this.head) {
                this.head = head;
                this.$("thead").html(head);
            }
        },
        getFoot: function () {
            var cs = this.$("thead tr").find("th").size();
            this.$("tfoot tr td").attr("colspan", cs);

            if (this.foot && !this.kit) {
                this.kit = new Kit({ el: this.$(".dropdown-list-menu") }).render(this.foot);

                this.listenTo(this.kit, "kit:exec", function (o) {
                    switch (o.name) {
                        case "play":                          
                            $.get("/api/interestObjects/input/id" + o.model.id).done(function (data) {
                                Backbone.trigger("message:success", Resources.success);
                            });
                            break;
                        case "basket":
                            Backbone.trigger("basket:add", this.data);
                            this.data = [];
                            break;
                        case "trash":
                            var i = 0;
                            _.each(this.data, function (id) {
                                o.model.url = function () { return "/api/object/" + id; };
                                o.model.destroy({
                                    success: function () {
                                        i++;
                                        if (i === this.data.length) {
                                            this.trigger("to:page", this.currentPage);
                                            Backbone.trigger("change:total");
                                        }
                                    }.bind(this)
                                });
                            }, this);                            
                            break;
                          
                        default:
                            this.trigger("kit:exec", o);
                            break;
                    }
                });
            } else {
                //this.buttonKitHide = true;
            }

            return this;
        },
        paginatorInit: function (totalPages, size) {
            this.Paginator = new Paginator(this.paginatorSelector, totalPages, size, this.currentPage);
        },
        paging: function () {
            var paging = this.collection.get(0); // {pageSize:5, num:totoalItems, page: currentPage}
            if (paging) {
                var PAGING_SIZE = parseInt(paging.get("pageSize")) || 30,
                    totalPages = Math.ceil(parseInt(paging.get("num")) / PAGING_SIZE);

                this.currentPage = paging.get("page") || this.currentPage || 1;
                if (totalPages > 1) {                    
                    require(['/js/dist/paginator3000.min.js'], this.paginatorInit.bind(this, totalPages, PAGING_SIZE));
                    this.$(".paginator_pages span").text(totalPages);
                    this.$(".paging-box").show();
                } else
                    this.$(".paging-box").hide();
            } else
                this.$(".paging-box").hide();

            return this;
        },
        gopage: function (e) {
            e.preventDefault();
            //$(e.target).addClass("link");
            this.currentPage = $(e.target).text();
            this.trigger("to:page", this.currentPage);
        },

        selectableInit: function () {
            this.data = [];
            this.$("tbody").selectable({
                cancel: this.options.cancel || "a, span, button.btn-link, label, svg",
                stop: function (e) {
                    this.data = [];
                    var m = $(e.target).find("tr.ui-selected");
                    m.each(function (i, e) {
                        var _id = $(e).attr("data-id");
                        if (this.data.indexOf(_id) === -1)
                            this.data.push(parseInt(_id));
                    }.bind(this));
                    this.trigger("selectable:stop", this.data);
                }.bind(this)
            });
        }
    });
});