define('global.view.connect', ['i18n!nls/resources.min', 'access'],

function (Resources, access) {

    var listItem = Backbone.Model.extend({
        defaults: function () {
            return {
                id: null,
                title: ""
            };
        }
    });

    var GroupCollection = Backbone.Collection.extend({ model: listItem }),

        Item = Backbone.View.extend({
            tagName: "option",
            render: function () {
                this.$el.attr("value", this.model.id);
                this.$el.html(_.template("<%= title %>")(this.model.toJSON()));
                return this;
            }
        });

    var paramSet = {
        Internet: {
            'Start': { "cmd": "works", "to": "WorkGroups" },
            'WorkGroups': { "cmd": "projects", "to": "Projects" },
            'Projects': { "cmd": "datas", "to": "Connects" },
            'Connects': { "cmd": "connect" }
        },
        Intranet: {
            'Start': { "cmd": "works", "to": "WorkGroups" },
            'WorkGroups': { "cmd": "datas", "to": "Connects" },
            'Connects': { "cmd": "connect" }
        }
    };

    var tempConnect = {};

    return Mn.View.extend({

        className: 'authorisation-block',

        template: '#connect-template',
        templateContext: { 
            Resources: Resources
        },

        ui: {
            //btn: 'button'
        },

        events: {
            "change select": "getData",
            "click @ui.btn:not([data-icon=icon-loader])": "connect"
        },

        initialize: function () {
            this.collection = new GroupCollection();        
        },

        onRender: function () {

            this.NetVersion = access.data.NetVersion || "Internet";

            if (this.NetVersion === "Intranet") {
                this.$("label:eq(1)").hide();
                this.$("#Projects").hide();
            }

            this.fetch('Start');

        },

        collectionEvents: {

            reset: function (c) {

                var name = paramSet[this.NetVersion][this.name].to,
                    $o = this.$('#' + name),
                    cv = $.cookie(name) || tempConnect[name];

                if (name) {

                    Array.from(c.models, function (m) {
                        $o.append(new Item({ model: m }).render().el);
                    }, this);

                    $o.val(cv);

                    this.fetch(name, cv);

                } else if (c.length)
                    this.triggerMethod('connect:made');
                    //this.ui.btn.removeClass("disabled").removeAttr('data-icon');

            },

            error: function () {
                //this.triggerMethod('can:connect');
                //this.ui.btn.removeClass("disabled").removeAttr('data-icon');
            }
        },

        getData: function (e) {

            var v = $(e.target).val(),
                name = $(e.target).attr("id");

            $.ajaxSetup({
                timeout: 30000
            });

            if ($.trim(v)) {

                this.fetch(name, v);
                $.cookie(name, v, { expires: 30, path: "/" });
                tempConnect[name] = v;

            } else
                this.reset(name);

        },

        reset: function (name) {

            this.$('#' + name).nextAll("select").each(function (i, e) {
                $(e).find(":not(option[value=''])").remove();
            });
        },

        fetch: function (name, v) {

            var p = paramSet[this.NetVersion][name];

            if (v) p.itemid = v;

            this.$("#Info").text("");

            if (name === "Connects") {

                p.wgtitle = this.$("#WorkGroups option:selected").text();
                p.wgid = this.$("#WorkGroups").val();

                p.prgtitle = this.$("#Projects option:selected").text();
                p.prgid = this.$("#Projects").val();

                p.dbtitle = this.$("#Connects option:selected").text();
                p.dbid = this.$("#Connects").val();

            }

            //this.paramconect = p;
            this.collection.url = '/api/Authorise?' + $.param(p);

            this.reset(name);
           
            //this.ui.btn.addClass('disabled').attr('data-icon', 'icon-loader');
            this.collection.fetch({ reset: true });

            this.name = name;
        },

        connect: function () {

            if (this.collection.length) {
                var url = this.collection.at(0).get("title") || "/";
                this.triggerMethod("authorize:end", url);
            }

        }
    });
});