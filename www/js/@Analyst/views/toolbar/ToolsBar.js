define(['app'],function(App) {
    "use strict";

    var Storage = new Backbone.Model;

    var b = Backbone.View.extend({
        el: $(".MainMenu"),
        events: {
            "click div.Item div": "item",
            "click .Person": "addPerson",
            "click .Organization": "addOrg",
            "click .Fact": "addFact",
            "click .Document": "addDoc",
            "click .Element": "addObject",
            "click .Connect": "backToConect",
            "click .Home": "toHome",
            
            "click .PERSON": "addPerson",
            "click .COMPANY": "addOrg"
        },
        item: function (e) {
            var target = e.target || ".MainMenu ." + e;
            var $p = $(target).parent("div");
            if (!$p.hasClass("D")) {
                this.$el.find(".S").removeClass("S");
                $(target).parent("div").addClass("S");
            }
            return this;
        },
        done: function () {
            this.$el.find(".S").removeClass("S");
            this.$(".Home").parent("div").addClass("S");
            $("#NextPage").hide("slide");
        },

        trans: function (data) {
            var output = { };
            for (var i = 0; i < data.length; i++) {
                var a = data[i];
                if (a.systemName == "Object_ID") {
                    output.id = parseInt(a.value);
                    continue;
                }
                output[a.systemName] = a.value;
            }
            return output;
        },


        load: function (o, $el, to, data) {

            var flag = this.preff;

            if ($.type(o) === "object") {

                var data = this.trans(o.data);
                this.load(o.name, null, null, data);

            } else {

                this.view(o, function () {

                    var mp = '@/models/elems/' + o + 'Model',
                        vp = '@/views/add/' + (to || o) + 'View';

                    if (flag) {
                        App.Select.set("query", o);
                        App.navigate('my/' + App.Select.getpath());
                        mp = '@Express/models/forms/' + o + 'Model';
                        vp = '@Express/views/forms/' + o + 'View';
                    }

                    require([vp, mp], function(v, m) {
                        var c = null;
                        if (!Storage.has(o)) {
                            c = new v({ model: new m(data) });
                            if ($el)
                                c.setElement($el);
                            c.render();
                            Storage.set(o, c);
                        } else {
                            c = Storage.get(o);
                            if (data) {
                                c.model.set(data);
                                flag = false;
                            }
                            if ($el)
                                c.setElement($el);
                            if (!flag)
                                c.render();
                        }
                    });
                }, this);
            }
        },
        clear:function (o) {
            if (Storage.has(o))
                Storage.unset(o);
        },
        initialize: function () {
            this.preff = "";
            Backbone.on("toolsbar:created", this.done, this);
            //Backbone.on("toolsbar:sources", this.toSources, this);
        },
 
        view: function (o, fx, context) {
            $("#NextPage>div").hide();
            $('#NextPage div.' + o).show();
            if ($("#NextPage").is(":hidden"))
                $("#NextPage").show("slide", function () { if (fx) fx.call(context); });
            else if (fx) fx.call(context);
        },
        toHome: function () {
            $("#NextPage").hide("slide");
            Backbone.trigger("navigate:home");
        },
        //toSources: function (m) {
        //    if (!this.initSources) {
        //        this.initSources = true;
        //        require(['@Express/views/forms/SourcesView'], SourcesView=> this.Sources = new SourcesView({ model: m }).render().toList());
        //    } else {
        //        this.Sources.model = m;
        //        this.Sources.toList();
        //    }
        //    this.view("Sources");
        //},

        addPerson: function (e) {
            if (App.check("251EE346-BF51-4724-B6F1-29688A231F81")) {
                this.load($(e.target).attr("class"));
            }
        },
        addOrg: function (e) {
            if (App.check("C1644690-426E-4257-9270-4265D9BA2868")) {
                this.load($(e.target).attr("class"));
            }
        },
        addFact: function () {
            if (App.check("F1A2AB77-7400-4CE6-890B-06B094C2BBEC")) {
                this.load("Fact", $("#NextPage .Fact"), "Element");
            }
        },
        addObject: function () {
            if (App.check("006D41F9-900A-404D-BF65-5CCDA3445E58")) {
                this.load("Element");
            }
        },
        addDoc: function () {
            if (App.check("A1BE8009-3EE6-4098-850F-9C1814E1A7FD")) {
                this.clear("Document");
                this.load("Document");
            }
        },
        update:function(o) {
            if (App.check("8AB272AC-C71A-4C92-83B6-DFFC15E3DF8D")) {
                this.load(o);
                this.item(o.name);
            }
        },
        backToConect: function () {
            var lang = /\/.*?\//i.exec(location.pathname);
            if (!lang) lang = "/lang-en-US/";
            if (App.netVersion === "Internet")
                location.href = lang + 'account/loginex';
            else {
                location.href = "/account/login";
            }
        }
    });
    return new b;
});