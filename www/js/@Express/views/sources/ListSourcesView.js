define(['i18n!nls/resources'], function (Resources) {
    "use strict"

    var template = '<div class="sources-head-panel"><div class="input-group-search"><input class="form-control" type="text" placeholder="<%= Resources.searchByWord %>" id="SearchText" /><span role="button" id="SearchByText"><svg class="icon icon-search"><use xlink:href="#icon-search"></use></svg></span></div><div><span class="btn-link-clear All" role="button"><svg class="icon icon-filtered"><use xlink:href="#icon-filtered"></use></svg><%= Resources.allSources %></span><span class="btn-link-clear Only" role="button"><svg class="icon icon-select"><use xlink:href="#icon-select"></use></svg><%= Resources.selected2 %>&nbsp;<span class="amount-selected"></span></span><span class="dropdown-menu_arrow"></span></div></div><table class="table table-hover" id="SourcesList"><thead><tr><th><div class="checkbox AllItems"><label><input type="checkbox" /></label></div></th><th>№</th><th><%= Resources.title %></th><th class="text-center"><%= Resources.price %> <span class="Currency"></span></th></tr></thead><tbody></tbody></table><table class="table table-hover" id="SelectedList" style="display: none;"><thead><tr><th><div class="checkbox checked AllItems"><label><input type="checkbox" checked="checked" /></label></div></th><th>№</th><th><%= Resources.title %></th><th class="text-center"><%= Resources.price %> <span class="Currency"></span></th></tr></thead><tbody></tbody></table>',
        templateItem = '<td><div class="checkbox"><label><input type="checkbox" /></label></div></td><td><%= num %></td><td><div class="btn-group dropright"><button type="button" class="dropdown-toggle btn-clear" aria-haspopup="true" aria-expanded="false"><%= title %></button><div class="dropdown-menu"><span class="dropdown-menu_arrow"></span><span class="dropdown-menu_close"><svg class="icon icon-close"><use xlink:href="#icon-close"/></svg></span><div class="menu-info-source"><div class="source-logo"><img src="<%= logoUrl?logoUrl:\'/images/photo.png\' %>" alt="" /></div><div class="source-title"><%= title %></div><div class="source-desc"><ul><% _.each(property, function(item){ %><li><%= item %></li><% }) %></ul><p><%= description %></p></div></div></div></div></td><td class="text-center"><%= price?price:Resources.freeTitle %></td>';

    var model = Backbone.Model.extend({
        defaults: { id: null, title: "", property: [], description: "", price: 0, currency: "" }
    });
    var _collection = Backbone.Collection.extend({
        model: model,
        url: function() {
            return "/api/sources";
        }
    });

    var ItemView = Backbone.View.extend({
        tagName: "tr",
        events: {
            "click .checkbox label": "checkbox",
            "click button": "viewDetail",
            "click .dropdown-menu": "hideDetail"
        },
        hideDetail: function () {
            this.$(".dropright").removeClass("open");
        },
        viewDetail: function () {
            this.$el.siblings("tr").each(function () {
                $(this).find(".dropright").removeClass("open");
            });

            this.$(".dropright").addClass("open");
            this.$(".dropdown-menu").css("margin-top", -200);
            this.$(".dropdown-menu_arrow").css("margin-top", 198);

            var wh = $(window).height(),
                ot = this.$(".dropdown-menu").offset().top - $(document).scrollTop();

            if (wh - ot < this.$(".dropdown-menu").height()) this.$(".dropdown-menu").css("margin-top", -200 + (wh - ot) - (this.$(".dropdown-menu").height() + 40));
            if( ot < 0) this.$(".dropdown-menu").css("margin-top", -200 + Math.abs(ot) + 20);

            return this;
        },
        checkbox: function(e) {
            var checkbox = $(e.target).closest("div.checkbox"),
                inp = checkbox.find('input[type=checkbox]');
            if (checkbox.hasClass("disabled")) return null;
            if (inp.is(':checked') !== checkbox.hasClass('checked'))
                this.selectItem(inp.is(':checked'));

            if (inp.is(':checked')) {
                this.$el.addClass("selected");
                checkbox.addClass('checked');
            } else {
                this.$el.removeClass("selected");
                checkbox.removeClass('checked');
            }
        },
        selectItem: function (flag) {
            var basket = this.collection.isBasket ? this.collection : this.collection.basket;
            if (flag) {                
                basket.add(this.model);
            } else {
                basket.remove(this.model);
            }
        },
        initialize: function (o) {
            this.model = o.model;
            this.collection = o.collection;
        },
        render: function() {
            let data = this.model.toJSON();
            data._ = _;
            data.Resources = Resources;
            this.$el.html(_.template(templateItem)( data));
            this.$el.attr("data-id", this.model.id);
            if (this.collection.isBasket) {
                this.$el.addClass("selected");
                this.$("div.checkbox").addClass('checked');
                this.$('input[type=checkbox]').get(0).checked = true;
            }            
            return this;
        }
    });

    return Backbone.View.extend({
        events: {
            "keypress input#SearchText": "searchByKey",
            "click #SearchByText": "search",
            "click .All": "all",
            "click .Only": "only",
            "click #SourcesList .AllItems:not([class='disabled'])": "checkSources",
            "click #SelectedList .AllItems:not([class='disabled'])": "checkSelected"
        },
        checkSelected:function (e) {
            var checkbox = $(e.target).closest("div.checkbox"),
                inp = checkbox.find('input[type=checkbox]');
            if (checkbox.hasClass("disabled")) return null;
            if (inp.is(':checked') !== checkbox.hasClass('checked') && !inp.is(':checked')) {
                var sources = [];
                this.basket.each(function (m) {
                    sources.push(m.id);
                    this.changeMark(m, false);
                }, this);
                this.basket.reset();
                this.changeMark(null, false, this.$("#SourcesList tr:first"));
            }
            this.mcbx(inp,checkbox);
        },
        checkSources: function (e) {
            var checkbox = $(e.target).closest("div.checkbox"),
                inp = checkbox.find('input[type=checkbox]');
            if (checkbox.hasClass("disabled")) return null;

            if (inp.is(':checked') !== checkbox.hasClass('checked')) {
                var flag = inp.is(':checked'),
                    sources = [];
                this.collection.each(function (model) {
                    this.changeMark(model, flag);
                    if (flag) {
                        this.basket.add(model);
                    } else {
                        this.basket.remove(model);
                    }
                    sources.push(model.id);
                }, this);
            }
            this.mcbx(inp, checkbox);
        },
        mcbx:function (inp, checkbox) {
            if (inp.is(':checked')) {
                this.$el.addClass("selected");
                checkbox.addClass('checked');
            } else {
                this.$el.removeClass("selected");
                checkbox.removeClass('checked');
            }
        },

        //enter point
        byfilter: function (o) {
            this.paramsSearch = o;
            this.search();
            return this;
        },
        searchByKey: function (e) {
            if (e.keyCode == 13 && $.trim(this.$("#SearchText").val()))
                this.search();
        },
        search: function (e) {
            this.paramsSearch.DicItems = this.paramsSearch.DicItems || [];
            this.paramsSearch.SearchText = this.$("#SearchText").val();
            this.paramsSearch.DicItems.push(this.model.get("BySaType"));

            this.$("#SourcesList>thead").showIndicator();
            $.post("/api/sources/filterby", this.paramsSearch)
                .done(function (data) { this.collection.reset(data) });
            return this;
        },
        
        all: function () {
            this.mark();
            this.$("#SelectedList").hide();
            this.$("#SourcesList").show();
            this.$(".All").addClass("S");
            this.$(".Only").removeClass("S");
            this.$(".sources-head-panel .dropdown-menu_arrow").css("left", "69px");
        },
        only: function () {
            this.changeMark(null, this.basket.length, this.$("#SelectedList tr:first"));
            this.$("#SelectedList").show();
            this.$("#SourcesList").hide();
            this.$(".All").removeClass("S");
            this.$(".Only").addClass("S");
            this.$(".sources-head-panel .dropdown-menu_arrow").css("left", "210px");
        },
        mark:function () {
            this.basket.each(function (m) {
                this.changeMark(m, true)
            }, this);
        },
        changeMark: function (m, flag, $cbx) {
            var $e = $cbx || this.$('#SourcesList>tbody>tr[data-id="' + m.id + '"]');
            if (flag) {
                $e.addClass("selected");
                $e.find("div.checkbox").addClass('checked');
            }else {
                $e.removeClass("selected");
                $e.find("div.checkbox").removeClass('checked');
            }
            if ($e.find('input[type=checkbox]').get(0))
                $e.find('input[type=checkbox]').get(0).checked = flag;
        },
        
        list: function (c, $e) {
            $e.empty();
            Array.from(c.models, function(m, i) {
                m.set("num", i + 1);
                $e.append(new ItemView({ model: m, collection: c }).render().$el);
            });
        },

        addOneSelected: function (m) {
            this.changeMark(m, true);
            m.set("num", this.basket.length);
            this.$("#SelectedList tbody").append(new ItemView({ model: m, collection: this.basket }).render().$el);
            this.$(".amount-selected").text('(' + this.basket.length + ')');
            this.trigger("change:selected");
        },
        clearOneSelected: function (m) {
            this.changeMark(m, false);
            this.list(this.basket, this.$("#SelectedList tbody"));
            this.$(".amount-selected").text('(' + this.basket.length + ')');
            this.trigger("change:selected");
        },
        
        changecollection: function (model) {
            this.model = model;            
            this.$("#SourcesList>tbody>tr").each(function (i, e) {
                let $e = $(e);
                $e.removeClass("selected");
                $e.find("div.checkbox").removeClass('checked');
                $e.find('input[type=checkbox]').get(0).checked = false;
            });

            if (this.model.get("IsSystem")) {
                this.$("#SourcesList>tbody>tr").each((i,e)=>$(e).find("div.checkbox").addClass('disabled'));
                this.$("#SourcesList>thead>tr").each((i,e)=> $(e).find("div.checkbox").addClass('disabled'));
            } else {
                this.$("#SourcesList>tbody>tr").each((i,e)=> $(e).find("div.checkbox").removeClass('disabled'));
                this.$("#SourcesList>thead>tr").each((i,e)=> $(e).find("div.checkbox").removeClass('disabled'));
            }

            this.$("#SelectedList>thead").showIndicator();
            if (this.model.id) {
                this.basket.url = "/api/sources/persisted/" + this.model.id;
                this.basket.fetch({ reset: true });
            } else
                this.basket.reset();            
        },

        resetSources: function (c) {
            this.list(c, this.$("#SourcesList tbody"));
            if (this.model.id && !this.initBasket) {
                this.initBasket = true;
                this.basket.url = `/api/sources/persisted/${this.model.id}`;
                this.basket.fetch({ reset: true });
            } else if (this.initBasket) {
                this.resetSelected();
            } else {
                this.trigger("change:selected");
                //this.$("#SourcesList>thead").hideIndicator();
            }

            if (this.model.get("IsSystem")) {
                this.$("#SourcesList>tbody>tr").each( (i,e) => $(e).find("div.checkbox").addClass('disabled'));
                this.$("#SourcesList>thead>tr").each((i,e)=> $(e).find("div.checkbox").addClass('disabled'));
            } else {
                this.$("#SourcesList>thead>tr").each((i,e)=> $(e).find("div.checkbox").removeClass('disabled'));
            }

            this.$("#SourcesList>thead").hideIndicator();
            return this;
        },
        resetSelected: function () {
            this.list(this.basket, this.$("#SelectedList tbody"));
            if (this.model.get("IsSystem")) {
                this.$("#SelectedList>tbody>tr").each((i,e)=> $(e).find("div.checkbox").addClass('disabled'));
                this.$("#SelectedList>thead>tr").each((i,e)=> $(e).find("div.checkbox").addClass('disabled'));
            } else {
                this.$("#SelectedList>thead>tr").each((i,e)=> $(e).find("div.checkbox").removeClass('disabled'));
            }
            this.all();
            this.$("#SelectedList>thead").hideIndicator();
            this.$(".amount-selected").text(`(${this.basket.length})`);
            this.trigger("change:selected");
        },
        initialize: function () {
            this.paramsSearch = { };
            this.basket = new _collection;
            this.basket.isBasket = true;
            this.basket.on("reset", this.resetSelected, this);
            this.basket.on("add", this.addOneSelected, this);
            this.basket.on("remove", this.clearOneSelected, this);
            this.collection = new _collection;
            this.collection.basket = this.basket;
            this.collection.on("reset", this.resetSources, this);
        },
        render: function() {
            this.$el.html(_.template(template)( { Resources: Resources }));
            return this;
        }
    });
});