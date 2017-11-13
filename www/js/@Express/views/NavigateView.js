define([
    'app',
    '@/views/CheckListView',
    '@/views/forms/PersonView',
    '@/views/forms/CompanyView',
    '@/views/forms/SourcesView',
    'storage'
],
function (App,CheckListView,PersonView,CompanyView,SourcesView,Storage) {
        "use strict";
    return Backbone.View.extend({
        el: $("#Navigation"),
        events: {
            "click .nav-item": "jump"
        },
        jump: function(e) {
            e.preventDefault();
            Storage.Current = null;
            var $a = $(e.target).closest('.nav-item');
            this.trans($a);
        },
        trans: function ($a) {
            this.$(".level-one").show();
            this.$(".level-two").hide();
            if (!$a.hasClass('active')) {
                this.$('.nav-item').removeClass('active');
                $a.addClass('active');
                App.Select.set("query", $a.data("name"));
                App.navigate(App.Select.fullpath());
                this.$(".level-one>div").hide();
                var name = $a.data("name");
                this.$(`#${name}`).show();
                this.show(name);
            }
        },
        levelOne:function (collection) {
            this.$(".level-one").show();
            this.$(".level-two").hide();
        },
        levelTwo:function (model) {
            this.$(".level-one").hide();
            this.$(".level-two").show();
            if (!this.isSources) {
                this.sources = new SourcesView().render();
                this.isSources = true;
            }
            this.sources.fill(model);
        },
        
        show:function(name) {
            switch (name) {
                case "CheckList":
                    if (!this.checkList) {
                        this.checkList = new CheckListView().done(function() {
                            if (this.callback) {
                                this.callback.call(this.context);
                            }
                        }, this);
                    }
                    break;
                case "Person":
                    if (!this.personView) {
                        this.personView = new PersonView().render();
                        this.isCallback = true;
                    } else 
                        this.personView.render();
                    break;
                case "Company":
                    if (!this.companyView) {
                        this.companyView = new CompanyView().render();
                        this.isCallback = true;
                    } else 
                        this.companyView.render();
                    break;
            }
        },
        initialize: function() {
            Backbone.on("to:robots", this.levelTwo, this);
            Backbone.on("to:form", this.levelOne, this);            
        },
        render:function () {
            this.trans(this.$(`.nav-item[data-name='${ App.Select.get("query") }']`));
            return this;
        },
        done: function (fx, ctx) {
            this.callback = fx;
            this.context = ctx || this;
            
            if (this.isCallback && this.callback)
                this.callback.call(this.context);
            return this;
        }
    });
});