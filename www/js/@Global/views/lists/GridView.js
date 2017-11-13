define([
    'app',
    'i18n!nls/resources.min',
    'dist/paginator3000.min'
],
function (App, Resources) {
    "use strict";
    var  tableTemplate = '<table class="table table-hover"><thead></thead><tbody></tbody><tfoot></tfoot></table>'+
        '<div class="paging-box"><div class="paginator" id="pagination"></div><div class="paginator_pages"><%= Resources.Pages2 %>: <span>0</span></div></div>';

    /*
        "selectable:stop" id-s (array),
        "to:page", numpage (string)
    */

    var ItemModel = Backbone.Model.extend({ idAttribute: "Object_ID" });
    
    return Backbone.View.extend({
        initialize: function () {

            this.collection = new Backbone.Collection();
            this.collection.on("reset", this.reception, this);

            // items from result request
            this.items = new Backbone.Collection();
            this.items.model = ItemModel;
            this.items.on("reset", this.reset, this);
            this.items.on("add", this.addOne, this);
            this.items.on("remove", this.removeItem, this);

        },        
        render: function () {
            this.$el.html(_.template(tableTemplate)( { Resources: Resources }));
            this.paginatorSelector = "pagination" + this.cid;
            this.$("#pagination").attr("id", this.paginatorSelector);
            return this;
        },
        reception: function () {
            this.$el.hideIndicator();
            if (this.collection.length === 1 && this.collection.at(0).get("feed"))
                this.bind(this.collection.at(0).get("feed"));
        },

        bind:function (d) {            

            let arr = ["Display_Name", "CreatedDate", "TypeName"],
                items = App.prepare(d.items),
                head = _.sortBy(d.head, o=> arr.indexOf(o.systemName));
            
            this.pagination = d.pagination;

            this.addHeader(head);
            this.addItems(items);

            if (this.callback)
                this.callback.call(this.context, this);
            
            return this;
        },
        addItems:function (items) {
            if (items.length) {
                this.items.reset(items);
                this.selectableInit();
            }
            this.pagingInit();
            this.subrender(items);
        },
        subrender: function (items) {
            if (items.length) {
                this.$el.show();
                if (this.pagination.totalItems <= this.pagination.pageSize)
                    this.$(".paging-box").hide(); // 1 page
                else
                    this.$(".paging-box").show();

            } else {
                if (this.pagination.currentPage > 1) {
                    this.newPage = this.pagination.currentPage - 1;
                    console.log("no data for this page - " + this.pagination.currentPage + "; get data for new page -" + this.newPage);
                } else this.empty();
            }
        },
        selectableInit: function () {
            var s = this;
            this.data = [];
            this.$("tbody").selectable({
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
        pagingInit:function () {
            var s = this,
                totalPages = Math.ceil(this.pagination.totalItems / this.pagination.pageSize);

            if (totalPages > 1) {
                //require([""], function() {
                    this.Paginator = new Paginator(s.paginatorSelector, totalPages, s.pagination.pageSize, s.pagination.currentPage);
                    this.bindpage();
                //});
                this.$(".paginator_pages span").text(totalPages);
                this.$(".paging-box").show();
            }
        },

        bindpage: function () {
            var s = this;
            this.$("#" + this.paginatorSelector + " a").each(function () {
                $(this).on("click", function (e) {
                    e.preventDefault();
                    s.trigger("to:page", $(this).text());
                });
            });
        },
       
        addHeader: function (head) {
            this.clear();

            this.itemTemplate = "<tr data-id='<%= Object_ID %>'>";
            let ah = { "Display_Name": Resources.title, "CreatedDate": Resources.date, "TypeName": Resources.type };
           
            this.$("thead").append($("<tr></tr>"));
            Array.from(head, el=> {
                if (el.isVisible) {
                    this.itemTemplate += `"<td><%= ${el.systemName} %></td>`;
                    this.$("thead>tr").append($(`<th>${el.displayName || ah[el.systemName]}</th>`));
                }
            });
        },
        
        add:function (a) {
            var items = App.prepare(a);
            this.items.add(items);
            this.$el.show();
        },
        addOne: function (m, i) {
            this.$("tbody").append(_.template(this.itemTemplate)( m.toJSON()));
            this.totalItems = this.items.length;
        },
        reset: function () {
            this.$("tbody").empty();
            this.items.each(this.addOne, this);
        },
        remove: function () {
            _.each(this.data, function(id) {
                var m = this.items.get(id);
                this.items.remove(m);
            }, this);
            this.data = [];
            this.reset();
        },

        done:function (fn, ctx) {
            this.callback = fn;
            this.context = ctx || this;
        },
        empty:function () {
            this.$el.hide();
            this.$(".paging-box").hide();
            this.items.reset();
        },
        clear: function () {
            this.$("thead").empty();
            this.$("tbody").empty();
            return this;
        }
    });
});