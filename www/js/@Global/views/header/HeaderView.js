
define('MessageView', ['app', 'i18n!nls/resources.min'], function (App, Resources) {

    var templateModalMessage = '<div class="message"><% if(cancelBtn) { %><span class="dropdown-menu_close"><svg class="icon icon-close"><use xlink: href="#icon-close"></use></svg></span><% } %><b><%= title %></b><p class="message-text"><%= message %></p><div class="sk-cube-grid"><div class="sk-cube sk-cube1"></div><div class="sk-cube sk-cube2"></div><div class="sk-cube sk-cube3"></div><div class="sk-cube sk-cube4"></div><div class ="sk-cube sk-cube5"></div><div class="sk-cube sk-cube6"></div><div class ="sk-cube sk-cube7"></div><div class="sk-cube sk-cube8"></div><div class ="sk-cube sk-cube9"></div></div></div>',
        templateConfirm = '<div class="message"><span class="dropdown-menu_close"><svg class="icon icon-close"><use xlink:href="#icon-close"></use></svg></span><b><%= title %></b><div class="message-text"><%= message %></div><div><button class="btn-exec"><%= textBtnExec %></button>&nbsp;<button class="btn-cancel"><%= Resources.cancel %></button></div></div>',
        templateInfo = '<b><%= title %></b><div><%= message %></div>';

    var clear = ["86056534-0DCB-48CF-B06D-3E8D23FD5001"];

    var m = Backbone.View.extend({

        el: $("#message-area"),

        events: {
            "click .icon-close": "close",
            "click .btn-exec": "_execConfirm",
            "click .btn-cancel": "close"
        },

        initialize: function () {
            Backbone.on("message:hide", this.hide, this);
            Backbone.on("message:modal", this.modal, this);
            Backbone.on("message:warning", this.warning, this);
            Backbone.on("message:success", this.success, this);
            Backbone.on("message:exec", this.exec, this);
            Backbone.on("message:confirm", this.confirm, this);
            this.render();
        },

        render: function () {

            this.$el.html('<div id="info"></div><div id="sho"><div class="container"></div></div>');

            $("body").on("click", function () {
                this.$("#info").hide();
            }.bind(this));

            return this;
        },

        close: function () {
            this.$("#sho").hide();
        },

        exec: function (o) {
            //if (App.check(o.sid)) {
            if (clear.indexOf(o.sid) !== -1) {
                var message = Resources.confirmObjDelete.replace("{0}", o.amount);
                this.confirm({ title: Resources.warning, message: message, fx: o.fx, ctx: o.ctx });
            } else {
                var result = o.fx.call(o.ctx);
                if (result)
                    this.success({ title: result.title, message: result.message });
            }
            //} else
            //    this.show("warning", { title: Resources.fiasco });
            return this;
        },

        show: function (mode, o) {
            switch (mode) {
                case "modal":
                    if (!o.cancelBtn)
                        o.cancelBtn = false;
                    this.$(".container").html(_.template(templateModalMessage)(o));
                    this.$("#sho").removeClass("nobg");
                    this.$("#sho").show();
                    break;
                case "confirm": this.confirm(o); break;
                case "success": this.success(o); break;
                case "warning": this.warning(o); break;
            }
            return this;
        },

        modal: function (o) {
            if (!o) o = { title: Resources.wait2, message: Resources.message };
            this.show("modal", o);
        },

        warning: function (o) {
            this.success(o);
            this.$("#info b").addClass("state-error");
        },

        success: function (o) {
            if (!o.title) o.title = Resources.alert;
            var flag = this.storage !== o.message;
            if (flag)
                this.storage = o.message;

            if (this.$("#info").is(":hidden")) {

                if (flag)
                    this.$("#info").html(_.template(templateInfo)(o));

                this.$("#info").show("slide", { direction: "right" });
                this.$("#info").delay(7000).hide("slide", { direction: "right" });
            }
            else if (flag) {
                this.$("#info").append(_.template(templateInfo)(o));
            }

        },

        _execConfirm: function () {
            this.execConfirm.call(this.contextConfirm);
            this.hide();
        },

        confirm: function (o) {
            var $l = $("body").children().last();
            this.$el.insertAfter($l);
            this.$(".container").html(_.template(templateConfirm)({
                Resources: Resources,
                title: o.title,
                message: o.message,
                textBtnExec: o.titleExec || Resources.deleteItem
            }));
            this.$("#sho").addClass("nobg").show();
            this.execConfirm = o.fx;
            this.contextConfirm = o.ctx;
            return false;
        },

        hide: function () {
            this.$("#sho").hide();
            return this;
        }

    });

    return new m;
});

define('ModeInfoView', ['i18n!nls/resources.min', 'access'], function (Resources, acc) {

    var access = acc.data.Points;

    //temrtempl = "<span class='dropdown-menu_close'><svg class='icon icon-close closed'><use xlink:href='#icon-close'></use></svg></span><div class='Text' data-sec='true'></div><div class='NoMore'><button class='closed'><%= Resources.closeText %></button><p><input type='checkbox' name='NoMore' />&nbsp;<label><%= Resources.noMoreView %></label></p></div><div class='WT'></div>";

    //var TermView = Backbone.View.extend({
    //    el: $("#Terms"),
    //    events: {
    //        "click .closed": "close"
    //    },
    //    close: function() {
    //        this.$el.hide();
    //        if (this.$("input[name='NoMore']").prop("checked"))
    //            $.cookie((this.options.dataid + "_" + this.ts), "nomore", { expires: 30 });
    //        Backbone.trigger("info:hide");
    //    },
    //    initialize: function (o) {
    //        this.options = o;
    //        Backbone.on("window:resizeend",
    //            function () { $("#Terms").css({ "height": $(window).height() - 200, "width": $(window).width() - 400 }).position({ of: $(window) }) }, this);
    //    },
    //    render: function() {
    //        this.$el.html(_.template(temrtempl)({ Resources: Resources }));
    //        this.$(".Text").attr("data-secid", this.options.dataid);
    //        return this;
    //    }
    //});

    return Mn.View.extend({

        template: false,

        onRender: function () {           
        }
    });
});


define('global.view.headerView', [
    'access',
    'i18n!nls/resources.min',
    'MessageView',
    'c/AlertsView',   
    'c/EdgeView',
    'c/BasketView',
    'global.radio.dialog'
],
function (acc,Resources, MessageView, AlertsBar, EdgeView, BasketView) {
    
    var demoInfo = Mn.Object.extend({

        initialize: function () {
            this.collection = new Backbone.Collection;
            this.collection.url = '/api/common/0/' + this.options.guid;
        }

    });

    return Mn.View.extend({

        template:false,

        el: "header",

        ui: {
            casebtn: '.case-block',
            casenum: '.badge',
            logo: '.logo',
            info: '.info-block'
        },

        regions: {
            'edge': { el: '#edge', replaceElement: true },
            'alert': { el: '.alert-block', replaceElement: true },
            'case': '#case-window'
        },

        events: {

            "click #InfoDB": "show",
            "click #InfoUser": "show",

            "mouseleave": "hide",

            'click @ui.casebtn': function () {
                this.getChildView('case').$el.show();
            },

            'click @ui.logo': function () {
                Backbone.history.navigate('', { trigger: true });
            },

            'click @ui.info': function () {
                this.showDemoInfo();
            }

        },

        initialize: function (o) {
            this.storage = [];
            this.currentid = "";
        },

        onRender: function () {
               
            if (this.ui.casebtn.get(0))
                this.showChildView('case', new BasketView);

            this.showChildView('alert', new AlertsBar);

            //new OnlineEditorView();

            if ( !this.options.isDemo )
                this.showChildView( 'edge', new EdgeView( { collection: new Backbone.Collection( acc.data.Edges ) } ) );
            else
                this.ui.casebtn.hide();


            var guid= 'FE195E4A-CAAD-4987-A1E8-2788F1796F95';
            var demo = new demoInfo({ guid: guid });

            if (acc.data.Points && acc.data.Points.indexOf(guid) !== -1)
                demo.collection.fetch({
                    reset: true,
                    success: function (c, o) {
                        this.demoInfoContent = o.data[1].value;
                        this.demoTs = o.data[2].value;
                        if (o && parseInt(o.data[0].value) && !$.cookie("DemoMode_" + this.demoTs) && $.trim(this.demoInfoContent))
                            this.showDemoInfo();

                    }.bind(this)
                });

        },

        showDemoInfo: function () {

            var controls = _.template('<input type="checkbox" <% if(checked){ %>checked="checked"<% } %> class="g-form--checkbox" name="dontshow" id="hidemenow"><label for="hidemenow"><%- Resources.noMoreView %></label>')(
                   {
                       Resources: Resources,
                       checked: $.cookie("DemoMode_" + this.demoTs)
                   });

            var dialog = Backbone.Radio.channel( 'Notify' ).request( 'once:dialog',
                {
                    title: Resources.information,
                    content: $.trim( this.demoInfoContent ) ? this.demoInfoContent : Resources.N,
                    footer: [
                        { id: 'cbx', template: controls }
                    ]
                } );

            this.listenTo(dialog, 'dialog:closed', function () {

                if (dialog.getChildView('footer').children.findByIndex(0).$("input[name='dontshow']").prop("checked"))
                    $.cookie("DemoMode_" + this.demoTs, "nomore", { expires: 30 });
                else
                    $.cookie("DemoMode_" + this.demoTs, '');
            });

            //this.$(".Text").attr("data-secid", this.options.dataid);

        },

        onChildviewUpdateCase: function (num) {

            this.ui.casenum.text(num);

            if (num) {
                this.ui.casebtn.addClass('action--blink');
                setTimeout(function () { this.ui.casebtn.removeClass('action--blink'); }.bind(this), 2000);
            }
        },

        hide: function () {

            if (this.currentid)
                this.$("#" + this.currentid).next("div").removeClass('active');
        },

        show: function ( e ) {

            var $b = $(e.target).closest('span');

            this.currentid = $b.attr("id");

            this.close();

            if (this.storage.indexOf(this.currentid) === -1)
                this.storage.push(this.currentid);

            $b.next("div").addClass('active');
        },

        close: function () {

            _.each( this.storage, function ( n ) {

                if (n !== this.currentid)
                    this.$( "#" + n ).next( "div" ).removeClass( 'active' );

            }, this);
        }
       
       
    });
});