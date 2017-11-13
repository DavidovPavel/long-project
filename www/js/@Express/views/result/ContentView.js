define([
    'i18n!nls/resources',
    'g/content/ContentView'
],
function (Resources, ContentView) {
    "use strict";
    // TODO: needs some works

    return Backbone.View.extend({
        el: $("#DetailContent"),
        initialize: function (o) {
            this.objID = o.id;
            this.mode = o.mode;
            this.parentID = o.objid;
        },
        render: function () {
            switch (this.mode) {
                case "fact":
                    var s = new ContentView({
                        url: ("/api/facts/InSources/" + this.objID),
                        objID: this.objID
                    }).setElement(this.$el).done(function () {
                        this.callback();
                        if (s.model)
                            $(document).find("head>title").text((s.model.get("Display_Name") + " :: " + Resources.titleFacts));
                        else {
                            $(".obj-title").text(Resources.isEmpty);
                            $(document).find("head>title").text((Resources.isEmpty + " :: " + Resources.titleFacts));
                        }
                    },this).render();                    
                    break;
                case "doc":
                    new ContentView({ objID: this.objID }).setElement(this.$el).done((v)=> {
                        this.callback();
                        $(document).find("head>title").text((v.model.get("Display_Name") + " :: " + Resources.titleDocs));
                    }).render();                    
                    break;
                case "original":

                    $.get('/api/original/startconvert?id=' + this.parentID);

                    var $c = $('<div id="inLoad"></div>');
                    this.$el.html($c);
                    Backbone.trigger("message:modal");
                    this.counter = 0;

                    this.si = setInterval(function () {
                        this.counter++;
                        if (this.counter > 50) {
                            clearInterval(this.si);
                            Backbone.trigger("message:hide");
                            this.$("#inLoad").html(Resources.timeended);
                        } else {
                            $.get('/api/original/checkconvert?uid=' + this.objID)
                                .done(function (status) {
                                    this.stopConvert({ status: status, counter: this.counter })
                                }.bind(this))
                                .fail(function () {
                                    Backbone.trigger("message:hide");
                                    clearInterval(this.si);
                                }.bind(this));
                        }
                    }.bind(this), 2000);
                    break;
            }            
            return this;
        },
        done: function (fx, ctx) {
            this.callback = fx;
            this.context = ctx;
            return this;
        },
        
        //

        stopConvert: function (o) {
            var status = o.status, counter = o.counter;
            if (status === 200) {
                if (this.Visualization) {
                    $.xhrAbortAll();
                    var s = this;
                    // pdf js
                    require(['/js/@Wall/views/ReportView.js'], function (ReportLoad) {
                        ReportLoad.setElement(s.$("#inLoad")).render(s.RelativePath);
                    });
                } else if (this.$el.find("iframe").size()) {
                    $.xhrAbortAll();
                } else {
                    var src = "/Temp/OD/" + this.objID + "/" + this.objID + ".html";
                    this.$("#inLoad").html("<iframe src=" + src + " style='width:98%;height:99%;'></iframe>");
                }
                clearInterval(this.si);
                if (this.callback)
                    this.callback.call(this.context);
            }
            else {
                var txt = Resources.convert + ", " + Resources.wait;
                switch (status) {
                    case 404:
                        txt = Resources.converterror + ": 404";
                        clearInterval(this.si);
                        if (this.callback)
                            this.callback.call(this.context);
                        break;
                    case 500:
                        txt = Resources.converterror + ": 500";
                        clearInterval(this.si);
                        if (this.callback)
                            this.callback.call(this.context);
                        break;
                }                
                this.$("#inLoad").text(txt);
            }
            
        },
    });

});