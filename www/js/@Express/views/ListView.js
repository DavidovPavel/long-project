define([
    'app',
    'i18n!nls/resources',
    'baseurl'
],
function (App, Resources, baseUrl) {
    "use strict";
    var tableTemplate = '<table class="table table-hover List"><thead><tr></tr></thead><tbody></tbody><tfoot><tr><td colspan="6"><div class="my-checks-menu dropdown-list-menu"></div></td></tr></tfoot></table><div class="paging-box"><div class="paginator" id="pagination"></div><div class="paginator_pages"><%= Resources.Pages2 %>: <span>0</span></div></div>';

    var kitTemplate = '<ul class="dropdown-menu"><li class="cmd_play" data-id="EA932373-3647-471A-87C1-DDB56657FEBC"><span role="button"><span class="button-icon"><svg class="icon icon-play-s"><use xlink:href="#icon-play-s" /></svg></span><span><%= Resources.runagain %></span></span></li>' +
                            '<li class="cmd_case" data-id="B7787886-AF0E-4B5A-9061-49B182200B8C"><span role="button"><span class="button-icon"><svg class="icon icon-case-s"><use xlink:href="#icon-case-s" /></svg></span><span><%= Resources.addbasket %></span></span></li>' +
                            '<li class="cmd_trash" data-id="86056534-0DCB-48CF-B06D-3E8D23FD5001"><span role="button"><span class="button-icon"><svg class="icon icon-trash-s"><use xlink:href="#icon-trash-s" /></svg></span><span><%= Resources.deleteItem %></span></span></li>' +
                            '<li class="cmd_analyst"><a href="/" target="_blank" class="external"><span class="button-icon"><svg class="icon icon-analyst"><use xlink:href="#icon-analyst" /></svg></span><span><%= Resources.toanal %></span></a></li>' +
                            '<li class="cmd_gs" data-id=""><span role="button" class="external disabled"><span class="button-icon"><svg class="icon icon-gs"><use xlink:href="#icon-gs" /></svg></span><span><%= Resources.togs %></span></span></li></ul>';

    var ItemModel = Backbone.Model.extend({
        idAttribute: "Object_ID"
    });

    var Kit = Backbone.View.extend({
        events: {
            "click li": "exec"
        },
        exec: function (e) {
            var $e = $(e.target).closest("li"), name = $e.attr("class"), sid = $e.attr("data-id");
            if ($.trim(sid)) {
                if (!this.selected.length)
                    this.selected.push(parseInt(this.model.id));
                Backbone.trigger("message:exec", { sid: sid, fx: this[name], ctx: this, amount: this.selected.length });
            }
            this.$('ul').hide();
        },
        cmd_play: function () {
            $.get("/api/interestObjects/input/id"+this.model.id).done(function(data) {
                Backbone.trigger("storage:temp-object", data);
                var tmpl = { 10021: "Person", 10022: "Company" };
                App.Select.set({ "query": tmpl[data.typeid] });
                App.navigate(App.Select.fullpath(), { trigger: true });
            });
        },
        cmd_case: function () {
            Backbone.trigger("basket:add", this.selected);
        },
        cmd_trash: function () {
            var i = 0, s = this;
            _.each(this.selected, function (id) {
                this.model.url = function () { return "/api/object/" + id; }
                this.model.destroy({
                    success: function () {
                        i++;
                        if (i == s.selected.length) {
                            s.trigger("deleted");
                            Backbone.trigger("change:total");
                        }
                    }
                });
            }, this);
        },
        analyst: function () {
            this.$('ul').hide();
        },
        gs: function () {
            //
        },
        render: function () {
            this.$el.html(_.template(kitTemplate)({ Resources: Resources }));
            return this;
        },
        show: function (e) {

            var link = baseUrl + "#3|Tree/0/1/" + this.model.id + "/0/0";
            this.$(".cmd_analyst a").attr("href", link);

            this.$('ul').clearQueue();
            this.$('button').removeClass('active');
            var $b = $(e.target).is("button") ? $(e.target) : $(e.target).closest("button"),
                pos = $b.offset();
            $b.toggleClass('active');
            this.$('ul').show();
            this.$el.css({
                'position': 'fixed', 'top': pos.top + 'px', 'left': pos.left + 'px', 'marginTop': -this.$('ul').height() - 2, 'marginLeft': $b.width() / 2
            });
        }
    });

    return Backbone.View.extend({
        events: {
            //"click tr": "select",
            "mouseleave tr": "hideMenu",
            "mouseenter .my-checks-menu": "clearHide",
            "click button.btn-link": "showKit",
            "click td span": "todetail"
        },
        todetail: function (e) {
            e.stopPropagation();
            var id = $(e.target).closest("tr").attr("data-id");
            //console.log(id);
            //App.Select.set({ "list": "detail", "detail": id });
            //App.navigate(App.Select.fullpath());
        },
        clearHide: function () {
            this.$('.my-checks-menu ul').clearQueue();
        },
        hideMenu: function (e) {
            var vid = $(e.target).closest("tr").attr("data-id");
            if (this.$('.my-checks-menu ul').is(":visible") && vid)
                this.$('.my-checks-menu ul').delay(1000).hide(100);
        },
        showKit: function (e) {
            e.stopPropagation();
            var id = $(e.target).closest("tr").attr("data-id");
            if (id) {
                this.kit.model = this.items.get(id);
                this.kit.selected = this.data;
                this.kit.show(e);
                this.$("tr[data-id='" + id + "']").addClass("ui-selected");
            }
        },

        fetch: function () {
            this.$el.showIndicator();
            if (this.collection.url) {                
                this.collection.url = App.addParams({ "page": this.newPage }, this.collection.url);
                this.collection.fetch({
                    reset: true,
                    error: () => this.$el.hideIndicator()
                });
            }
            if (this.operation) {
                this.operation.params.url = App.addParams({ "page": this.newPage }, this.operation.params.url);
                $.ajax(this.operation.params).done(data=> this.render(data)).always(() =>this.$el.hideIndicator());
            }
            return this;
        },

        initialize: function (o) {
            this.operation = o.operation;
            this.collection = new Backbone.Collection();
            this.collection.on("reset", this.render, this);
            this.items = new Backbone.Collection();
            this.items.model = ItemModel;
            //this.items.on("destroy", this.clear, this);
        },
        paginatorInit:function(totalPages, paging){
            this.Paginator = new Paginator(this.paginatorSelector, totalPages, paging.pageSize, paging.currentPage);
            this.bindpage();
        },
        render: function (d) {
            this.$(".info").hide();
            if (!this.kit) {
                this.$el.html(_.template(tableTemplate)({ Resources: Resources }));
                this.kit = new Kit({ el: this.$(".my-checks-menu") }).render();
                this.listenTo(this.kit, "deleted", this.fetch);
                //this.kit.listenTo(this, "selectable:stop", function(data) {
                //     this.data = data;
                //});
                this.paginatorSelector = "pagination" + this.cid;
                this.$("#pagination").attr("id", this.paginatorSelector);
            }

            this.$el.hideIndicator();

            var data = !d.models ? d.items : d.models[0].get("items"),
                head = !d.models ? d.head : d.models[0].get("head"),
                paging = !d.models ? d.pagination : d.models[0].get("pagination"),
                arr = ["Display_Name", "CreatedDate", "TypeName"];

            this.paging = paging;

            head = _.sortBy(head, function (o, i, a) {
                return arr.indexOf(o.systemName);
            });

            if (data.length) {

                var items = App.prepare(data);
                this.addHeader(head);
                this.items.reset(items);

                if (this.items.length)
                    this.items.each(this.addOne, this);

                var totalPages = Math.ceil(paging.totalItems / paging.pageSize);

                if (totalPages > 1) {
                    require(['/js/dist/paginator3000.min.js'], this.paginatorInit.bind(this, totalPages, paging));
                    this.$(".paginator_pages span").text(totalPages);
                    this.$(".paging-box").show();
                }

                this.selectableInit();

                this.$("table").show();

                if (paging.totalItems <= paging.pageSize)
                    this.$(".paging-box").hide(); // 1 page
                else
                    this.$(".paging-box").show();


            } else {
                //
                if (paging.currentPage > 1) {
                    this.newPage = paging.currentPage - 1;
                    this.fetch()
                } else {
                    this.$("table").hide();
                    this.$(".paging-box").hide();
                }
                var $info = this.$(".info");
                if (!$info.get(0)) {
                    this.$el.append("<div class='info'></div>");
                    $info = this.$(".info");
                }
                $info.show().text(Resources.nodata);
            }

            if (this.callback)
                this.callback.call(this.context, this);

            return this;
        },
        selectableInit: function () {
            var s = this;
            this.data = [];
            this.$("tbody").selectable({
                cancel: "a, button.btn-link",
                stop: function () {
                    s.data = [];
                    var m = $(this).find("tr.ui-selected");
                    m.each(function () {
                        var _id = $(this).attr("data-id");
                        if (s.data.indexOf(_id) == -1)
                            s.data.push(parseInt(_id));
                    });
                    s.trigger("selectable:stop", s.data);
                }
            });
        },
        bindpage: function () {
            var s = this;
            this.$("#" + this.paginatorSelector + " a").each(function () {
                $(this).on("click", function (e) {
                    e.preventDefault();
                    App.Select.set("page", $(this).text());
                    App.navigate(App.Select.fullpath());
                    s.trigger("to:page", $(this).text());
                });
            });
        },

        addHeader: function (head) {
            this.$("table.List>thead>tr").empty();
            this.$("table.List>tbody").empty();

            var str = "<tr data-id='<%= Object_ID %>'><td><%= Num %></td>",
                ah = { "Display_Name": Resources.title, "CreatedDate": Resources.date, "TypeName": Resources.type };
            this.$("table.List>thead>tr").append($("<th>№</th>"));
            _.each(head, function (el) {
                if (el.isVisible) {
                    if (el.systemName == "Display_Name")
                        str += ("<td><a href='#id=<%= Object_ID %>' target='_blank'><%= " + el.systemName + " %></a></td>");
                    else
                        str += ("<td><%= " + el.systemName + " %></td>");
                    this.$("table.List>thead>tr").append($("<th>" + (el.displayName || ah[el.systemName]) + "</th>"));
                }
            }, this);
            this.$("table.List>thead>tr").append("<th>" + Resources.status + "</th><th>&nbsp;</th>");
            str += ('<td><svg class="icon icon-<%= Status %>"><use xlink:href="#icon-<%= Status %>"/></svg></td><td class="controls"><button type="button" class="btn-link"><svg class="icon icon-burger-menu"><use xlink:href="#icon-burger-menu"/></svg></button></td>');
            this.itemTemplate = str;
        },

        addOne: function (m, i) {
            var page = parseInt(this.paging.currentPage) * this.paging.pageSize - this.paging.pageSize + 1;
            m.set({ "Num": i + page, Status: "check" });
            this.$("table.List>tbody").append(_.template(this.itemTemplate)(m.toJSON()));
        },
        done: function (fn, ctx) {
            this.callback = fn;
            this.context = ctx || this;
        }
    });
});