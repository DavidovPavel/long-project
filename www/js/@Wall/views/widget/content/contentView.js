define('widget.content.contentView', ['i18n!nls/resources.min', '/js/dist/video-js/video.js', '/js/dist/jquery.mCustomScrollbar.concat.min.js'],

function (Resources) {
    
    var ContentModel = Backbone.Model.extend({ idAttribute: "object_id" });

    var itemsView = Mn.CollectionView.extend({

        className: 'accordion',

        onAttach: function () {

            this.$el.css({ position: 'relative', overflow:'hidden' });

        },

        childView: Mn.View.extend({

            className: 'item-content',

            template: templates['widget-source-content'],
            templateContext: { Resources: Resources },

            ui: {
                head: '.head-content',
                load: '.load',
                rubrics: '.card-rubric',
                url: '.card-link',
                play: '.play-button'
            },

            events: {

                'click @ui.play': function (e) {

                    var $e = $(e.target),
                        start = parseInt(this.model.get('playingat')),
                        end = parseInt(this.model.get('playinguntil')),

                        p = videojs(this.$('video').get(0));

                    this.ui.play.text('pause');

                    p.ready(function () {

                        if (!end || this.currentTime() < end)
                            if (this.paused()) {
                                $e.text('pause');
                                this.play();
                            } else
                                this.pause();
                        else {
                            this.load();
                            this.play();
                        }
                    });

                    p.on("waiting", function () {
                        $e.attr('disabled');
                    });

                    p.on("loadeddata", function () {
                        $e.removeAttr('disabled');
                    });

                    p.on("pause", function () {
                        $e.text('play');
                    });

                    Backbone.trigger("storage:addPlayer", p, this.model.get("object_id"));
                }

            },

            initialize: function () {

                this.lightPos = [];

            },

            onBeforeRender: function () {

                if (!this.model.has('webfile'))
                    this.model.set('webfile', '');

            },

            onRender: function () {

                if (this.model.has('contentcollection_rubrics') && $.trim(this.model.get('contentcollection_rubrics')) && !this.model.get('hideRubrics')) {

                    var c = this.model.get('contentcollection_rubrics');

                    if (_.isArray(c) && c.length)
                        this.ui.rubrics.find('p').html(c.join(' | '));
                    else
                        this.ui.rubrics.find('p').text(c);

                }
                else
                    this.ui.rubrics.hide();

                if (this.model.get('url_источника'))
                    this.ui.url.html(`<span class="card-link-icon"><svg class="link-icon"><use xlink:href="#link-icon"></use></svg></span>
                        <a href="${this.model.get('url_источника')}" target="_blank">${(this.model.get('massmedia') || this.model.get('url_источника'))}</a>`);


            },

            onAttach: function () {

                var typename = this.model.get('systemtypename');

                if (typename === "Audiosource" || typename === "VideoSource") {

                    var p = videojs(this.$('video').get(0)),
                        videoWidth = 0,
                        videoHeight = 0,
                        isVideo = this.model.get('systemtypename') === "VideoSource",
                            w = this.$el.width();

                    if (!isVideo)
                        p.height(128, true);
                    else
                        p.height((this.$el.width() - 80) / 3, true);

                    p.on("loadeddata", function () {

                        videoWidth = this.L.videoWidth;
                        videoHeight = this.L.videoHeight;

                        if (isVideo) {

                            if (w < videoWidth) {
                                var d = videoWidth / videoHeight;
                                videoWidth = w - 30;
                                videoHeight = videoWidth / d;
                            }

                            this.width(videoWidth, true);
                            this.height(videoHeight, true);

                        }
                    });

                }
                else
                    this._toLightPosition();

            },

            _toLightPosition: function () {

                this.ui.load.css({ width: this.$el.closest('.widget-container').width(), height: this.$el.closest('.widget-container').height() - this.ui.head.height(), overflow: 'auto' });

                this.ui.load.find("span[data-oid]").each((i, e) => {
                    $(e).addClass("Mark");
                    this.lightPos.push($(e).position().top);
                });

                var pd = this.lightPos,
                    sp = 0;

                this.ui.load.mCustomScrollbar();

                if (pd.length && sp !== pd.length) {

                    this.ui.load.mCustomScrollbar("scrollTo", pd[sp] - this.ui.load.position().top - 3);

                    this.ui.load.find("span[data-oknd=2].C").removeClass("C");
                    this.ui.load.find("span[data-oknd=2]").eq(sp).addClass("C");

                    if (sp === pd.length - 1) sp = 0;
                    else sp++;

                }
                else
                    this.ui.load.mCustomScrollbar("scrollTo", 0);


                //this.$(".gotoresult .total").html(Resources.Total + "&nbsp;" + Resources.matches + ":&nbsp;" + pd.length);
                //if (pd.length)
                //    this.$(".gotoresult").show();
                //else
                //    this.$(".gotoresult").hide();

            }
        })

    });

    return Mn.View.extend({

        template: _.template('<div></div>'),        

        regions: {
            items: { el: 'div', replaceElement: true }
        },

        initialize: function () {

            Backbone.trigger("storage:clearPlayers");

            this.collection = new Backbone.Collection;
            this.collection.url = `/api/widget/listen/${this.options.requestID}/source/${this.model.id}/${this.options.objectID}`;
            //'/api/details/ContentV2/' + this.options.objectID;

        },

        onRender: function () {

            this.showChildView('items', new itemsView({ collection: new Backbone.Collection }));

        },

        onAttach: function () {            

            this.collection.fetch({ reset: true });

        },

        modelEvents: {

            'change:height': function () {

                this.getChildView('items').render();

            }

        },

        collectionEvents: {

            request: function () {

                Backbone.Radio.channel('loader').trigger('show', this.$el, { speed: 'fast' });

            },

            reset: function () {

                var o = Backbone.Radio.channel('chW').request('get:param:model', this.model.get('Characteristics'), "WidgetSource.Options"),
                    hideRubrics = false;

                if (o.has('WidgetParamValue'))
                    hideRubrics = o.get('WidgetParamValue').hideRubrics;


                var m = this.collection.at(0),
                    items = m.get('items'),
                    c = [];

                _.each(items, function (item) {

                    var attr = _.chain(item.data).map(function (m) { return [m.systemName, m.value]; }).object().value();

                    attr.links = item.links;

                    if (!attr.textsource)
                        attr.textsource = '';

                    attr.hideRubrics = hideRubrics;

                    c.push(attr);

                }, this);

                this.getChildView('items').collection.reset(c);

                Backbone.Radio.channel('loader').trigger('hide');
                this.triggerMethod('content:loaded');
            },

            error: function () {

                Backbone.Radio.channel('loader').trigger('hide');
                this.triggerMethod('content:loaded');

            }

        }

    });

    //var contentTemplate = '<div class="Tools"></div><div class="gotoresult" data-id="6782E40B-794A-467D-BC8E-21992920317D"><span class="total"></span>&nbsp;<button class="up"><%= Resources.go %></button></div><div class="RubricsLink"></div><div class="contentSnet"></div><div class="Load"></div>',

    //    mediaTemplate = '<% if(systemtypename=="VideoSource"){%><div><video id="videoFact<%= object_id %>" class="video-js vjs-default-skin Videosource" preload="none" poster="/images/Display128x128.png"><source src="<%= MediaUrl %><% if(PlayingAt){ %>#t=<%= PlayingAt %>,<%= PlayingUntil %><% } %>" type="video/mp4"></video><nav><button class ="Play" data-start="<%= PlayingAt %>" data-end="<%= PlayingUntil %>">&nbsp; </button><span class="Duration"></span></nav></div><% } if(systemtypename=="Audiosource"){ %><div><video id="videoFact<%= Object_ID %>" class="video-js vjs-default-skin Audiosource" preload="none" poster="/images/Headphones128x128.png"><source src="<%= mediaurl %><% if(PlayingAt){ %>#t=<%= PlayingAt %>,<%= PlayingUntil %><% } %>" type="audio/mp3"></video><nav><button class ="Play" data-start="<%= PlayingAt %>" data-end="<%= PlayingUntil %>">&nbsp; </button><span class="Duration"></span></nav></div><% } %><%= textsource %><%= webfile %><div><i><%= author %></i><br/><% if(massmedia) { %><a href="<%= url_источника %>" target="_blank"><%= massmedia %>&nbsp; &raquo; </a><br/><% } %></div>',

    //    template = '<p class="buttons"><button id="showOriginalDoc" class="originallink" data-id="0CA650F2-8D85-4C76-8B02-F4080F75B9DE"><%= Resources.originaldoc %></button>&nbsp;&nbsp;'+
    //    '<button id="translate" class="trans" data-id="5C949741-9B72-40EA-AAA6-6FD4419C6E86"><%= Resources.translate %></button>&nbsp;&nbsp;'+
    //    '<button id="toOriginal" class="trans" data-id="5C949741-9B72-40EA-AAA6-6FD4419C6E86"><%= Resources.returnText %></button>&nbsp;&nbsp;'+
    //    '<button id="shortText" data-id="73FCB91F-2E99-4BF7-857F-F3EB59610AFE"><%= Resources.view %></button>&nbsp;&nbsp;'+
    //    '<button class="showSn" data-id="4E38E1F4-38D5-40B5-AAAD-CCE5825100AD"><%= Resources.showSNet %></button>&nbsp;&nbsp;'+
    //    '<span class="modView right"><i><%= Resources.titleView %>: <b id="titleModView"><%= Resources.shortView %></b></i></span></p>';

    //var Dynamo = Backbone.View.extend({

    //    events: {
    //        "click button": "cmd"
    //    },

    //    cmd: function (e) {

    //        e.stopPropagation();

    //        var $b = $(e.target).closest("button");

    //        if ($.trim($b.data("href"))) {

    //            var r = { url: $b.data("href"), data: { }, method: $b.data("verb") };

    //            if ($b.data("name") === "shortText")
    //                this.parent.isMode = !this.parent.isMode;

    //            this.parent.sendRequest(r, this.parent.prepare, this.parent);

    //        } else 
    //            Backbone.trigger('content:'+$b.data("render"), this.parent.data ? new ContentModel(this.parent.data) : this.parent.model);
    //    },

    //    initialize: function(o) {
    //        this.parent = o.parent;
    //    },

    //    render: function () {

    //        this.$el.html(_.template(template)({ Resources: Resources }));

    //        this.$("#titleModView").text(this.parent.isMode ? Resources.fullView : Resources.shortView);

    //        this.collection.each(function (link) {
    //            if (link.get("rel") === "tools") this.addBtn(link.toJSON());
    //        }, this);

    //        //this.$("button").button();

    //        this.$(".buttons").show();

    //        return this;
    //    },

    //    addBtn: function(link) {
    //        var $b = this.$('#'+link.id);
    //        if (!App.check($b))
    //            $b.hide();
    //        else {
    //            _.each(link, function(value, key) {
    //                switch(key) {
    //                    case "id":
    //                        $b.attr("data-name", value);
    //                        if (value === "shortText") this.$(".modView").show();
    //                        break;
    //                    case "prompt":
    //                        $b.attr("title", value);
    //                        $b.button({ label: value });
    //                        break;
    //                    default: $b.attr('data-'+key, value);
    //                        break;
    //                }
    //            },this);
    //            $b.show();
    //        }
    //    },
    //});

    //var Item = Backbone.View.extend({

    //    events: {
    //        "click .gotoresult .up": "toresult",
    //        "click .gotoresult .down": "toresult"
    //    },

    //    toresult: function () {

    //        var pd = this.pd;
    //        if (pd.length && this.sp !== pd.length) {

    //            this.$(".Load").mCustomScrollbar("scrollTo", pd[this.sp] - this.$(".Load").position().top - 3);

    //            this.$(".Load").find("span[data-oknd=2].C").removeClass("C");
    //            this.$(".Load").find("span[data-oknd=2]").eq(this.sp).addClass("C");

    //            if (this.sp === pd.length - 1) this.sp = 0;
    //            else this.sp++;

    //        } else {
    //            this.sp = 0;
    //            this.$("div.Load").mCustomScrollbar("scrollTo", 0);
    //        }
    //        this.$(".gotoresult .total").html(Resources.Total + "&nbsp;" + Resources.matches + ":&nbsp;" + pd.length);
    //        if (pd.length)
    //            this.$(".gotoresult").show();
    //        else
    //            this.$(".gotoresult").hide();
    //    },

    //    initialize: function (o) {
    //        this.options = o;
    //        this.pd = [];
    //        this.sp = 0;
    //        this.isMode = false;

    //        this.model.set("PlayingAt",this.model.get("PlayingAt") || 0);
    //        this.model.set("PlayingUntil", this.model.get("PlayingUntil") || 0);
    //    },

    //    sendRequest: function (o, callback, ctx) {
    //        $.ajax(o).done(function (item) { callback.call(ctx, item) });
    //    },

    //    prepare: function (item) {

    //        var links = item.links;
    //        if ("items" in item) {
    //            this.data = App.prepare(item.items)[0];
    //            links = item.items[0].links;
    //        } else
    //            this.data = App.prepare([item])[0];

    //        this.initTools(new Backbone.Collection(links));
            
    //        this.data.PlayingAt = this.data.PlayingAt || 0;
    //        this.data.PlayingUntil = this.data.PlayingUntil || 0;


    //        // basic settings select TextSource or WebFile
    //        var field = this.options.parent.widget.get('contentProp');

    //        if (!this.model.has('textsource'))
    //            this.model.set('textsource', '');

    //        if (!this.model.has('webfile'))
    //            this.model.set('webfile', '');

    //        this.$(".Load").html(_.template(mediaTemplate)(this.data));
    //        this.loaded().fitLoad().toresult();
    //    },

    //    fitHeight: function () {
    //        var h = this.$el.parent().parent().height() - this.$el.parent().find("h3").outerHeight(), // accordion - parent
    //            dh = 0;
    //        this.$el.children(":not('.Load')").each(function(i, e) {if ($(e).is(":visible")) dh += parseInt($(e).outerHeight());});
    //        if (h) this.$(".Load").height(h - dh);
    //    },

    //    initTools:function(col) {
    //        if (this.Tools) {
    //            this.Tools.remove();
    //            if (!this.$(".Tools").get(0))
    //                this.$el.prepend('<div class="Tools"></div>');
    //        }
    //        this.Tools = new Dynamo({ collection: col, parent: this, el: this.$(".Tools") }).render();
    //        this.listenTo(this.Tools, "button:click", this.prepare);
    //    },

    //    render: function () {

    //        var links = this.model.get("links"),
    //            flag = _.find(links, function (l) { return l.rel === "sys" && l.id === "Mode" && l.value === "9" });

    //        this.$el.html(_.template(contentTemplate)( { Resources: Resources }));

    //        if (!flag) {

    //            this.initTools(new Backbone.Collection(links));

    //            // basic settings select TextSource or WebFile
    //            var field = this.options.parent.widget.get('contentProp');

    //            if (!this.model.has('textsource'))
    //                this.model.set('textsource', '');

    //            if (!this.model.has('webfile'))
    //                this.model.set('webfile', '');

    //            this.$(".Load").html(_.template(mediaTemplate)(this.model.toJSON()));

    //            //this.$("button.up").button({ label: Resources.go, icons: { primary: "ui-icon-seek-next" }, text: false });

    //            this.linkToRubrics();

    //        } else
    //            this.$(".Load").html(Resources.limit);

    //        return this;
    //    },

    //    fitLoad: function () {
    //        this.$(".Load").mCustomScrollbar("scrollTo", 0);//.scrollTop(0);
    //        this.pd = [];
    //        var s = this;
    //        this.$(".Load").find("span[data-oknd=2]").each(function(i, e){
    //            $(e).addClass("Mark");
    //            s.pd.push($(e).position().top);
    //        });
    //        return this;
    //    },

    //    loaded: function () {

    //        var $s = this.$el,
    //            name = '#videoFact' + this.model.get("object_id");

    //        if (this.$(name).get(0)) {
    //            var s = this;
    //            this.$("button.Play")
    //                .button({ text: false, icons: { primary: "ui-icon-play" } })
    //                .click(function () { s.play() });

    //            var p = videojs(this.$(name).get(0)),
    //                videoWidth = 0,
    //                videoHeight = 0,
    //                $c = this.$(".Load"),
    //                $v = this.$(name);
                
    //            //p.width(this.$(".Load").width() - 90, true);
    //            if ($v.hasClass("Audiosource"))
    //                p.height(128, true);
    //            else
    //                p.height((this.$(".Load").width() - 80) / 3, true);

    //            p.on("loadeddata", function () {
    //                videoWidth = this.L.videoWidth;
    //                videoHeight = this.L.videoHeight;
    //                if (!$v.hasClass("Audiosource")) {
    //                    if ($s.width() < videoWidth) {
    //                        var d = videoWidth / videoHeight;
    //                        videoWidth = $s.width() - 30;
    //                        videoHeight = videoWidth / d;
    //                    }
    //                    $c.css({ width: videoWidth + 20, height: videoHeight + 50 });
    //                    this.width(videoWidth, true);
    //                    this.height(videoHeight, true);
    //                }
    //            });
    //        }
    //        this.fitHeight();
    //        this.$(".Load").mCustomScrollbar();// { scrollbarPosition:'outside'}
    //        this.$('.mCSB_container').attr('dir', 'auto');
    //        return this;
    //    },

    //    play: function (e) {
    //        var $e = this.$("button.Play"),
    //            start = parseInt($e.data("start")),
    //            end = parseInt($e.data("end")),
    //            p = videojs(this.$("#videoFact" + this.model.get("object_id")).get(0));

    //        $e.button().button("option", "icons", { primary: "ui-icon-pause" });

    //        p.ready(function () {
                
    //            if (!end || this.currentTime() < end)
    //                if (this.paused()) {
    //                    $e.button("option", "icons", { primary: "ui-icon-pause" });
    //                    this.play();
    //                } else
    //                    this.pause();
    //            else {
    //                this.load();
    //                this.play();
    //            }
    //        });

    //        p.on("waiting", function () {
    //            $e.button("disable");
    //        });
    //        p.on("loadeddata", function () {
    //            $e.button().button("enable");
    //        });
    //        p.on("pause", function () {
    //            $e.button().button("option", "icons", { primary: "ui-icon-play" });
    //        });

    //        Backbone.trigger("storage:addPlayer", p, this.model.get("object_id"));
    //    },

    //    linkToRubrics: function () {
    //        var data = this.model.get("contentcollection_rubrics");
    //        if ($.trim(data))
    //            this.$(".RubricsLink").append('<i>' + Resources.linkToRubricTitle + ':</i>&nbsp;&nbsp;<b>' + data + '</b>');
    //    }
    //});

    

    // Mn.View.extend({

    //    template: _.template( '<div></div>' ),

    //    regions: {
    //        accordion: { el: 'div', replaceElement: true }
    //    },

        

    //    onRender: function () {

    //        this.showChildView( 'accordion', new listItems( { collection: this.collection }) );            

    //        //this.searchPhrase = App.Select.get("params") ? App.Select.get("params").phrase : "";
    //        //this.sendRequest({
    //        //    url: this.options.url || '/api/details/ContentV2/' + this.options.objectID,
    //        //    data: this.options.data || (this.searchPhrase ? $.param({ "highlightPhrase": this.searchPhrase }) : [])
    //        //}, this.prepare, this);

    //    },

    //    onAttach: function () {
    //        this.collection.fetch( { reset: true });
    //    },

        

    //    fitSize: function () {
    //        //_.each(this.items, function (s) { s.fitHeight() });
    //        //return this;
    //    }

    //    //sendRequest: function (o, callback, ctx) {

    //    //    this.$el.showIndicator();

    //    //    $.ajax( o )

    //    //        .done(function (item) {
    //    //            callback.call(ctx, item);
    //    //        })

    //    //        .always(function () {
    //    //            this.$el.hideIndicator();

    //    //            if (this.callback)
    //    //                this.callback.call( this.context, this );

    //    //        }.bind(this));
    //    //},

    //    //prepare: function (item) {

    //    //    this.$el.append("<div id='accordion'></div>");

    //    //    if ("version" in item) {

    //    //        _.each(item.items, this.addOne, this);

    //    //        if ( item.items.length > 1 ) {

    //    //            this.$("#accordion").accordion({
    //    //                heightStyle: "content",
    //    //                collapsible: true,
    //    //                activate: function () {
    //    //                    this.trigger( "action" );
    //    //                }
    //    //            });

    //    //        }
    //    //    } else 
    //    //        this.addOne(item);
            
    //    //    if (this.callback)
    //    //        this.callback.call(this.context, this);
    //    //},

    //    //addOne: function (item) {

    //    //    var m = new Backbone.Model(App.prepare([item])[0]);

    //    //    m.set("links", item.links);

    //    //    var s = new Item({ model: m, parent: this }).render();

    //    //    if (!(this.widget.has('hideTitle') && this.widget.get('hideTitle')))
    //    //        this.$("#accordion").append('<h3>' + m.get("display_name") || "" + '</h3>');

    //    //    this.$("#accordion").append(s.$el);

    //    //    s.loaded().fitLoad().toresult();
    //    //    this.items.push(s);
    //    //},

       

    //});

});