define([
    'i18n!nls/resources',
    '@Analyst/collections/DictionaryCollection'
],
function (Resources, Dic) {
    "use strict";
    var template = '<div class="filter-title"><span class="btn-link-clear" role="button"><svg class="icon icon-filter-cross"><use xlink:href="#icon-filter-cross"></use></svg><%= R.cancelFilter %></span></div><span class="btn-collapse" role="button" data-toggle="collapse" href="#filterCollection" aria-expanded="true" aria-controls="filterCollection"><%= R.collectionSources %> <svg class="icon icon-collapse"><use xlink:href="#icon-collapse"></use></svg></span><div id="filterCollection" class="panel-collapse collapse in"><div class="filter-list source-collection IsSystem"></div><div class="filter-list source-collection Custom"></div></div><div class="filter-list"><span class="btn-collapse" role="button" data-toggle="collapse" href="#filterCategory" aria-expanded="true" aria-controls="filterCategory"><%= R.category %> <svg class="icon icon-collapse"><use xlink:href="#icon-collapse"></use></svg></span><div id="filterCategory" class="panel-collapse collapse in"><div class="list-group ByPayment ByStatus"></div></div><span class="btn-collapse" role="button" data-toggle="collapse" href="#filterCountry" aria-expanded="true" aria-controls="filterCountry"><%= R.selectCountry %> <svg class="icon icon-collapse"><use xlink:href="#icon-collapse"></use></svg></span><div id="filterCountry" class="panel-collapse collapse in"><div class="list-group ByCountry"></div></div><span class="btn-collapse" role="button" data-toggle="collapse" href="#filterSources" aria-expanded="true" aria-controls="filterSources"><%= R.byTypeSurce %> <svg class="icon icon-collapse"><use xlink:href="#icon-collapse"></use></svg></span><div id="filterSources" class="collapse in"><div class="list-group BySrcKind"></div></div><span class="btn-collapse" role="button" data-toggle="collapse" href="#filterKind" aria-expanded="true" aria-controls="filterKind"><%= R.byInfo %> <svg class="icon icon-collapse"><use xlink:href="#icon-collapse"></use></svg></span><div id="filterKind" class="collapse in"><div class="list-group ByInfo"></div></div></div>',
        templateItem = '<span id="<%= ID %>" data-code="<%= DicCodeItem %>" class="btn-link-filter" role="button"><svg class="icon icon-circle-plus"><use xlink:href="#icon-circle-plus"></use></svg><%= Title %></span>',
        FilterModel = Backbone.Model.extend({ defaults: { id: null, check: false } }),
        FilterCollection = Backbone.Collection.extend({ model: FilterModel });

    return Backbone.View.extend({
        events: {
            "click .btn-link-filter": "active",
            "click .btn-collapse": "collapse",
            "click .btn-link-clear": "clear",
            "click .btn-link-coll": "getCollection",
            "click .icon-close": "deleteItem"
        },
        deleteItem: function (e) {
            e.stopPropagation();
            if (this.$(".Custom>span.btn-link-coll").size()>1) {
                var $s = $(e.target).closest("span"),
                    id = $s.attr("id");
                var c = this.model.collection,
                    m = c.get(id);
                m.destroy();
                this.model.collection = c;
                $s.remove();
                this.getCollection(this.$(".Custom>span.btn-link-coll").get(0));
            }
        },
        getCollection: function (e) {
            this.$(".source-collection span[id='']").remove();
            this.$(".source-collection span.active").each(function () {
                $(this).removeClass('active').find('.radio-button').removeClass('checked');
            });
            var $e = $(e.target).closest("span.btn-link-coll");
            $e.addClass("active").find('.radio-button').addClass('checked');
            var coll = this.model.collection;
            this.model = coll.get($e.attr("id")) || coll.findWhere({ "SearchPackUID": null });
            this.trigger("listsources:changecollection", this.model);
        },
        clear: function () {
            var co = this.collection;
            this.$(".btn-link-filter").each(function() {
                $(this).removeClass('active').find('svg').attr('class', 'icon icon-circle-plus').find('use').attr('xlink:href', '#icon-circle-plus');
                var m = co.get(parseInt($(this).attr("id")));
                co.remove(m, { silent: true });
            });
            this.send();
        },
        collapse:function (e) {
            var $p = $(e.target).closest(".btn-collapse");
            if ($p.is(".collapsed")) {
                $p.removeClass("collapsed");
                $p.next("div.collapse").slideDown();
            } else {
                $p.addClass("collapsed");
                $p.next("div.collapse").slideUp();
            }
        },
        active: function (e) {
            this.mark($(e.target).closest("span"));
        },
        initCountry: function (lang) {
            var $b = this.$("span[data-code='" + lang + "']");
            $b.addClass('active').find('svg').attr('class', 'icon icon-circle-check').find('use').attr('xlink:href', '#icon-circle-check');
            this.collection.add({ id: parseInt($b.attr("id")) });
            return this;
        },
        mark: function ($b) {
            if ($b.is('.active')) {
                $b.removeClass('active').find('svg').attr('class', 'icon icon-circle-plus').find('use').attr('xlink:href', '#icon-circle-plus');
                var m = this.collection.get(parseInt($b.attr("id")));
                this.collection.remove(m);
            } else {
                $b.addClass('active').find('svg').attr('class', 'icon icon-circle-check').find('use').attr('xlink:href', '#icon-circle-check');
                this.collection.add({ id: parseInt($b.attr("id")) });
            }
        },
        send: function () {
            if (this.setTout) {
                clearTimeout(this.setTout);
                this.setTout = 0;
            }
            var s = this;
            this.setTout = setTimeout(function () {
                var a = s.collection.pluck("id");
                s.trigger("listsources:send", { DicItems: a, SearchText: "" });
            }, 300);
            return this;
        },
        initialize: function () {
            this.collection = new FilterCollection();
            this.collection.on("add", this.send, this);
            this.collection.on("remove", this.send, this);
        },
        render: function () {
            this.$el.html(_.template(template)( {R: Resources}));
            Dic.done(function(c) {
                c.each(function(m) {
                    var $p = this.$("." + m.get("DicCode"));
                    _.each(m.get("DicItems"), function(a) {
                        $p.append(_.template(templateItem)( a));
                    }, this);
                }, this);
            }, this);
            return this;
        },
        initCollection: function (model) {
            this.$("#filterCollection .IsSystem").empty();
            this.$("#filterCollection .Custom").empty();
            this.model = model;
            var collection = model.collection.groupBy("IsSystem");
            _.each(collection, function (val, key) {
                var flag = key === "true";
                _.each(val, function (m) {
                    m.set("active", m.id == model.id);
                    this.$("#filterCollection " + (flag ? ".IsSystem" : ".Custom")).append(
                        _.template(
                        `<span id="<%= SearchPackUID %>" class="btn-link-coll <% if(active){%>active<%}%>" role="button">
                        <% if(!IsSystem && SearchPackUID) {%><svg class="icon icon-close"><use xlink:href="#icon-close"/></svg><% } %>
                        <span class="radio-button <% if(active){%>checked<%}%>"><span></span></span>
                        <span class ="title"><%= SearchPackName %></span></span>`
                        )( m.toJSON()));
                }, this);
            }, this);

            return this;
        }
    })

});