define('visualization', ['i18n!nls/resources.min'], function (Resources) {

    var ZOOM_MIN = 0.125,
        ZOOM_MAX = 6;

    return Mn.Object.extend( {

        initialize: function () {
            this.content = this.options.content;
            this.model = this.options.model;
            this.activeEvent = 'hand';

            //this.contextMenuInit();
            this.zoomInit();
            this.zoomSet();
            this.initSelectedArea();
        },

        Transform: function () {

            var t = d3.zoomTransform(this.zoomSelection.node()),
                event = this.activeEvent;
            this.contextMenuInit();
            this.zoomSet();
            //this.zoom.transform(this.zoomSelection, t);
        },

        active: function (name) {
            this.activeEvent = name.split('--')[1];
            this.content.removeClass('hand-mode');
            this.content.removeClass('editor-mode');
            this.content.removeClass('zoom-mode');
            switch (this.activeEvent) {
                case 'zoom':
                case 'zoomout':
                case 'zoomin':
                case 'zoomfit':
                    this.content.addClass('zoom-mode');
                    d3.select(this.content.get(0)).on('mousedown', null);
                    break;
                case 'hand':
                    this.content.addClass('hand-mode');
                    break;
                case 'editor':
                    this.content.addClass('editor-mode');
                    this.initSelectedArea();
                    break;
            }
        },

        contextMenuInit: function () {

            //var nodes = d3.select(this.content.get(0)).selectAll('g'),
            //    a = d3.select(this.content.get(0));

            //var data = [];

            //var no = nodes.filter(function () {
            //    data.push(_.chain(this.attributes).map(function (a, i, val) { return [a.nodeName, a.nodeValue]; }).object().value());
            //    return parseInt(this.getAttribute("data-objectid"));
            //});

            ////no.transition().duration(750).attr("transform", "translate(200,200)");

            //no.on("contextmenu", function () {
            ////    if (d3.event.which !== 3) return;
            ////    d3.event.preventDefault();
            ////}).on("mousedown", function () {

            //    if (this.activeEvent !== 'editor') return;
            //    d3.event.stopPropagation();
            //    d3.event.preventDefault();
            //    var xy = d3.mouse(a.node()),
            //        $t = $(d3.event.currentTarget);
            //    this.contextMenu.current = { id: $t.attr("data-objectid"), title: $.trim($t.text()) };
            //    this.contextMenu.css({ left: xy[0], top: xy[1] }).slideDown();

            //}.bind(this));
        },

        zoomInit: function () {
            var s = this;
            this.zoom = d3.zoom()
                 .filter(function () {
                     //this.contextMenu.hide();
                     var flag = true;
                     if ((this.activeEvent === 'zoom' || this.activeEvent === 'zoomout' || this.activeEvent === 'zoomin') && d3.event.type === 'mousedown') flag = false;
                     if (this.activeEvent === 'editor') flag = false;
                     return flag;
                 }.bind(this))
                .scaleExtent([ZOOM_MIN, ZOOM_MAX])
                .on("start", function () {
                    if (this.activeEvent === 'hand')
                        this.content.addClass('hold');
                }.bind(this))
                .on("zoom", function () {
                    var t = d3.event.transform;
                    this.firstElementChild.setAttribute("transform", "translate(" + t.x + "," + t.y + ") scale(" + t.k + ")");
                }).on("end", function () {
                    if (this.activeEvent === 'hand')
                        this.content.removeClass('hold');
                }.bind(this));
        },
        zoomSet: function () {
            this.zoomSelection = d3.select(this.content.find('svg').get(0))
                .call(this.zoom)
            //.on("click.zoom", function (a, b, c) {

            //    var t = this.__zoom;
            //    t.k -= 0.1;
            //    t.x = t.k * t.x;
            //    t.y = t.k * t.y;

            //    this.firstElementChild.setAttribute("transform", "translate(" + t.x + "," + t.y + ") scale(" + t.k + ")");

            //})
                .on("dblclick.zoom", null);
            //this.zoom.transform(this.zoomSelection, d3.zoomIdentity);
        },

        initSelectedArea: function () {

            var contextMenu = this.contextMenu,
                a = d3.select(this.content.get(0)),
                s = this;

            a.on("mousedown", function () {

                var $e = $(d3.event.target);
                if ($e.hasClass('item') && $e.attr('data-cmd')) {
                    switch ($e.attr("data-cmd")) {
                        case "more":

                            var oid = this.contextMenu.current.id;
                            if (oid) {
                                var PropertyModel = Backbone.Model.extend({
                                    default: function () {
                                        return {
                                            id: null,
                                            title: "",
                                            html: "",
                                            text: ""
                                        };
                                    },
                                    url: function () {
                                        return "/api/Details/" + this.id;
                                    }
                                });

                                var model = new PropertyModel({ id: oid });
                                //model.fetch({
                                //    success: function (m) {
                                //        var d = m.toJSON();
                                //        d.Resources = Resources;
                                //        Browsing.$el.html(_.template('<h1><%= title %></h1><div><span class="originallink" style="font-size:1.2em;" data-id="0CA650F2-8D85-4C76-8B02-F4080F75B9DE"><%= Resources.originaldoc %>&nbsp;</span><span id="linkToOriginalFile"></span></div><div class="RubricsLink"></div><br /><div class="HtmlReport"><%= html %></div>')(d));
                                //        Browsing.start(Resources.propobj);
                                //    }
                                //});
                            }

                            break;

                        case "check":

                            $.get('/api/interestObjects/input/id' + this.contextMenu.current.id).done(function (data) {

                                //Backbone.Radio.channel('oM').request('load:form', data);

                                Backbone.history.navigate(`project/${this.options.projectId}/edit/${models[0].id}`, { trigger: true });

                            });

                            //var setname = ["PersonView", "CompanyView", "AddressView", "AutoView"];

                            //require(["@/views/forms/" + setname[0]], function (view) {
                            //    Browsing.set({ width: $(window).width() - 100, height: $(window).height() - 20, position: { X: 50, Y: 50 } });
                            //    var pid = parseInt(App.getParam("prjid", location.search.substr(1))),
                            //        data = {
                            //            ProjectID: pid,
                            //            ProjectName: window.sessionStorage[pid],
                            //            title_INTERN: this.contextMenu.current.title,
                            //            lname_INTERN: this.contextMenu.current.title
                            //        },
                            //        v = new view().setElement(Browsing.$el);
                            //    v.model.set(data);
                            //    v.render({ hideButton: ["tolist"] }).done(function () {
                            //        Browsing.hide();
                            //        // TODO: тригер - реакция на добавление нового объекта проверки, обновить списки
                            //        require(['signalR'], function () {
                            //            require(['/signalr/hubs'], function () {
                            //                require(['/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'],
                            //                    function () {
                            //                        SJ.iwc.EventBus.fire('added-new-object-check');
                            //                    }.bind(this));
                            //            }.bind(this));
                            //        }.bind(this));
                            //    });
                            //    Browsing.start(Resources.addObject);
                            //}.bind(this));

                            break;
                    }

                }
                contextMenu.hide();
                d3.event.stopPropagation();
                d3.event.preventDefault();

                //var step = ZOOM_MIN,
                //    currentBox = this.zoomSelection.node().getBBox();

                //if (s.activeEvent === 'zoomout') {
                //    var t = d3.zoomTransform(this.zoomSelection.node());                    
                //    if (t.k > ZOOM_MIN) {                        
                //        t.k -= step;
                //        if (t.k < 1) {
                //            t.x = (currentBox.width - currentBox.width * t.k) / 2 * t.k + t.x;
                //            t.y = (currentBox.height - currentBox.height * t.k) / 2 * t.k + t.y;
                //        } else {
                //            t.x = (currentBox.width * t.k - currentBox.width) / 2 * t.k - t.x;
                //            t.y = (currentBox.height * t.k - currentBox.height) / 2 * t.k - t.y;
                //        }
                //    }
                //    this.zoom.transform(this.zoomSelection, t);
                //    return;
                //}
                //if (s.activeEvent === 'zoomin') {
                //    var t = d3.zoomTransform(this.zoomSelection.node());
                //    if (t.k < ZOOM_MAX) {
                //        t.k += step;
                //        t.x = ((t.k - 1) * currentBox.width / 2) * t.k - t.x;
                //        t.y = ((t.k - 1) * currentBox.height / 2) * t.k - t.y;
                //    }
                //    this.zoom.transform(this.zoomSelection, t);
                //    return;
                //}


                if (s.activeEvent !== 'zoom' || d3.event.which !== 1) return;

                var startXY = d3.mouse(this.zoomSelection.node());

                this.content.find('.selected-area').remove();
                var $d = $("<div class='selected-area' style='position:absolute;border:dashed 2px #333;z-index:1000;width:1px;height:1px;'></div>");
                $d.css({ top: startXY[1] + 'px', left: startXY[0] + 'px' });
                this.content.prepend($d);

                a.on("mousemove", function () {

                    var m = d3.mouse(a.node()),
                        x = startXY[0],
                        y = startXY[1],
                        dx = m[0] - x,
                        dy = m[1] - y;

                    if (dx < 0 || dy < 0) {
                        //console.log(d3.mouse(a.node()));
                    }

                    $d.css({ top: startXY[1] + 'px', left: startXY[0] + 'px', width: dx + 'px', height: dy + 'px' });
                }).on("mouseup", function () {
                    d3.event.stopPropagation();
                    a.on("mousemove", null).on("mouseup", null);
                    this.content.find('.selected-area').remove();
                    var stopXY = d3.mouse(this.zoomSelection.node());
                    this.zoomIn(startXY, stopXY);
                }.bind(this));

            }.bind(this));
        },

        zoomIn: function (start, stop) {

            var p = this.content.parent('div'),
                area = [stop[0] - start[0], stop[1] - start[1]],
                main = [p.width(), p.height()],
                mainW2H = main[0] / main[1],
                w2h = area[0] / area[1];

            if (area[0] < 50 || area[1] < 50) return;

            area[0] = area[0] < 80 ? 80 : area[0];
            area[1] = area[1] < 80 ? 80 : area[1];

            if (w2h > 1)
                area[1] = area[0] / mainW2H;
            else
                area[0] = area[1] * mainW2H;

            var kx = main[0] / area[0],
                ky = main[1] / area[1],
                k = (kx + ky) / 2;

            console.log(start, stop);
            console.log(d3.zoomTransform(this.zoomSelection.node()));
            console.log(k);

            var t = d3.zoomTransform(this.zoomSelection.node());

            if (k * t.k > 6) k = 6 / t.k;
            t.k = k * t.k;
            t.x = k * t.x - start[0] * k;
            t.y = k * t.y - start[1] * k;
            this.zoom.transform(this.zoomSelection, t);

            //this.activeEvent = 'zoomfit';

            console.log(d3.zoomTransform(this.zoomSelection.node()));

            //if (start[0] * k < this.model.get("width") * k)
            //    p.scrollLeft(start[0] * k);
            //if (start[1] * k < this.model.get("height") * k)
            //    p.scrollTop(start[1] * k);
        }
    });
});


define('global.semnet.layout', ['i18n!nls/resources.min', 'global.view.dropDown', 'visualization', 'baseurl', 'g/tree', 'c/ContextMenuView' ],
function (Resources, DropDownView, Visual, baseurl, treeView, contextMenu) {

    var contextMenuCollection = new Backbone.Collection([
        //{
        //    title: Resources.cmsn1, status: 'disabled', child: [
        //        { title: Resources.cmsn11, status: 'disabled' },
        //        { title: Resources.cmsn12, status: 'disabled' }
        //    ]
        //},
        //{
        //    title: Resources.cmsn2, status: 'disabled', child: [
        //        { title: Resources.cmsn21, status: 'disabled' },
        //        { title: Resources.cmsn22, status: 'disabled' }
        //    ]
        //},
        //{ title: Resources.prop, cmd: 'more' },
        //{ title: Resources.cmsn3, status: 'disabled' },
        //{ title: Resources.cmsn4, status: 'disabled' },
        //{ title: Resources.cmsn5, status: 'disabled' },
        {
            id: '_runTask', title: Resources.runagain, icon: 'next',
            child: [
                { id: '_runTaskPerson', title: Resources.person },
                { id: '_runTaskOrganization', title: Resources.company }
            ]
        }
    ]);


    Resources.hashurl = "abscp:lang-" + Resources.Lang + "/analyst/sndesign/" + window.btoa(encodeURIComponent(location.href));

    var layoutCollection = new Backbone.Collection([
                   { title: Resources.snl1, id: 0 },
                   { title: Resources.snl2, id: 1 },
                   { title: Resources.snl3, id: 2 },
                   { title: Resources.snl4, id: 3 },
                   { title: Resources.snl5, id: 4 },
                   { title: Resources.snl6, id: 5 },
                   { title: Resources.snl7, id: 6 }
    ]),

        modeCollection = new Backbone.Collection([
                   { title: Resources.ss1, id: 0 },
                   { title: Resources.ss2, id: 1 },
                   { title: Resources.ss3, id: 2 }
        ]),

        deptCollection = new Backbone.Collection([
                   { title: 'level 1', id: 1 },
                   { title: 'level 2', id: 2 },
                   { title: 'level 3', id: 3 }
        ]);

    var LayoutModel = Backbone.Model.extend({
        idAttribute: 'snid',
        defaults: {
            "snid": -1,
            "title": "",
            "subtitle": "",
            "width": 0,
            "height": 0,
            "html": ""
        }
    });

    var LayoutCollection = Backbone.Collection.extend({
        model: LayoutModel
    });

    var LayoutView = Mn.View.extend({

        tagName: 'li',

        getTemplate: function () {

            if (this.model.id === 'add') {
                this.$el.addClass('controls');
                return _.template('<span class="semantic-tabs--add"></span>');
            }
            else if (this.model.id === 'set') {
                this.$el.addClass('controls');
                return _.template('<span class="semantic-tabs--settings"></span>');
            }
            else
                return _.template('<span class="semTab <%- snid===-1?\'default\':\'\' %>"><%- title %><% if(snid!==-1){ %><i></i><% } %></span>');
        },

        triggers: {
            'click:not(.controls)': 'click:view'
        },

        events: {

            'click .semantic-tabs--settings': function () {
                this.$el.closest('.semantic-tabs').toggleClass('edit-mode');
            },

            'click .semantic-tabs--add': function () {
                Backbone.trigger("message:warning", { title: Resources.alert, message: 'in developing' });
            },

            'click i': function () {
                Backbone.trigger("message:confirm", {
                    title: Resources.alert,
                    message: Resources.askyousure + '<br/>' + Resources.wdostr.replace("{0}", '[' + this.model.get('title') + ']'),
                    fx: function () {
                        Backbone.trigger("message:warning", { title: Resources.alert, message: 'in developing' });
                    },
                    ctx: this
                });
            }
        }
    });

    var LayoutsView = Mn.CollectionView.extend({

        tagName: 'ul',
        childView: LayoutView,

        setActive: function (model) {

            this._activeModel = model;

            this.children.each(function (v) {
                v.$el.removeClass('active');
            });

            var a = this.children.findByModel(model);
            if (a)
                a.$el.addClass('active');
        },

        getActive: function () {
            return this._activeModel;
        },

        initialize: function () {

            this.collection.comparator = 'position';
        },

        onBeforeRender: function () {
            this.collection.add([
                new LayoutModel({ snid: 'add', position: 0 }),
                new LayoutModel({ snid: 'set', position: this.collection.length + 2 })
            ]);
        },

        childViewOptions: function (m, i) {
            if (!m.has('position'))
                m.set('position', i - 1);
        },

        onAttach: function () {
            this.collection.sort();
        }

    });

    var ToolsBarModel = Backbone.Model.extend({
        defaults: function () {
            return {
                Resources: Resources,
                layout: 0,        // отображение сем.сети (0-6, типы раскладки)
                level: 2,         // уровень показа сем.сети
                astree: 0,        // тип сем.сети (Стратегическая - 0, Дерево - 1, Граф - 2) (astree)
                filter: [],       // фильтр по типам объектов (filter)
                eparam: [0, 0, 0] //показать полные имена фактов (eparam[0]),показать легенду фактов (eparam[1]), скрыть главные объекты (eparam[2])   
            };
        }
    });

    var typesBlock = Mn.CollectionView.extend({

        className: 'g-form--filter',

        childView: Mn.View.extend({
            tagName: 'span',
            template: _.template('<%- title %>'),
            triggers: {
                'click': 'click:item'
            }
        }),

        onChildviewClickItem: function (v) {
            this.collection.remove(v.model);
        },

        collectionEvents: {
            reset: function () {
                this.triggerMethod('change:types:collection');
            },
            update: function () {
                this.triggerMethod('change:types:collection');
            }
        }
    });

    var ToolsBarView = Mn.View.extend({

        template: '#semantic-scheme-tools',
        className: 'semantic-sidebar',

        regions: {
            ddlevel: '#level',
            ddtree: '#astree',
            ddlayout: '#layout',
            typesBlock: {
                el: '.g-form--filter',
                replaceElement: true
            }
        },

        triggers: {
            'click input[name=reload]': 'sem:reload',
            'click input[name=export]': 'sem:export'
        },

        events: {

            'click input[name=clear]': function (e) {

                this.getChildView('typesBlock').collection.reset();
            },

            'click input[name=objects]': function (e) {

                var collection = new Backbone.Collection;
                collection.url = '/api/Type';               

                var dm = {
                    title: Resources.selectTree,
                    controls: [],
                    view: new treeView({ collection: collection, node: { checkbox: false, levelOpen: 3 } })
                };

                collection.fetch({ reset: true });

                var dialog = Backbone.Radio.channel('Notify').request('once:dialog', dm);

                this.listenTo(dm.view, 'container:select:item', function (v) {

                    this.getChildView('typesBlock').collection.add(v.model);
                    dialog.$el.hide();

                });

            },

            'click input[type=checkbox]': function (e) {
                var $e = $(e.target), a = ['id1', 'id2', 'id3'], r = this.model.get('eparam');
                r[a.indexOf($e.attr('id'))] = $e.is(':checked') ? 1 : 0;
                this.model.trigger('change');
            },

            'click #tools-hamburger': function (e) {
                var $e = $(e.target).closest('div');
                $e.toggleClass('active').parent('.semantic-sidebar').toggleClass('active');
                this.triggerMethod('click:tools:hamburger', $e.hasClass('active'));
            },

            'click #editmode': function (e) {
                $(e.target).toggleClass('enabled');
                this.triggerMethod('switch:edit:mode', $(e.target).hasClass('enabled'));

                if ($(e.target).hasClass('enabled')) {
                    //this.$('.semantic-tools span').removeClass('active');
                    this.$('.semantic--tool-viewmode').hide();
                    this.$('.semantic--tool-viewmode.edit').show();
                } else {
                    this.$('.semantic--tool-viewmode').show();
                    this.$('.semantic--tool-viewmode.edit').hide();
                }
            },

            'click .semantic-tools span': function (e) {
                this.$('.semantic-tools span').removeClass('active');
                $(e.target).toggleClass('active');
                this.triggerMethod('click:tools:bar', e);
            }

        },

        onRender: function () {
            this.showChildView('ddlayout', new DropDownView({ collection: layoutCollection, current: this.model.get('layout'), name: 'layout' }));
            this.showChildView('ddtree', new DropDownView({ collection: modeCollection, current: this.model.get('astree'), name: 'astree' }));
            this.showChildView('ddlevel', new DropDownView({ collection: deptCollection, current: this.model.get('level'), name: 'level' }));
            //this.showChildView('typesBlock', new typesBlock({ collection: new Backbone.Collection() }));
        },
        onChildviewDropdownSelect: function (model, name) {
            this.model.set(name, model.id);
        },
        onChildviewChangeTypesCollection: function () {
            this.model.set('filter', this.getChildView('typesBlock').collection.pluck("id"));
        }
    });

    var SvgContentView = Mn.View.extend({

        className: 'semantic-board',

        template: _.template('<div class="inner"><div id="context-menu"></div><div class="svg-content"><%= html %></div></div>'),

        regions:{
            cmenu: '#context-menu'
        },

        events: {

            'contextmenu g[data-objectid]': function (e) {

                e.preventDefault();

                let $e = $(e.target),
                    oid = $e.closest('g').data("objectid");

                this.getRegion('cmenu').$el.hide();

                if (parseInt(oid)) {

                    this.selectedObject = { id: oid, title: $.trim($e.text()) };

                    this.getRegion('cmenu').$el.css({ left: event.layerX, top: event.layerY });

                    let sto = setTimeout(() => { this.getRegion('cmenu').$el.slideDown(); }, 100);

                    this.getRegion('cmenu').$el.on('mouseenter', () => { clearTimeout(sto) });

                    this.getRegion('cmenu').$el.on('mouseleave', () => {
                        sto = setTimeout(() => { this.getRegion('cmenu').$el.slideUp(); }, 300)
                    });
                }
            },

            "mousedown g[data-objectid]": function (e) {
                //e.preventDefault();
                //this.click++;
                //if (this.click === 1) {
                //    this.timer = setTimeout(function () {
                //        this.click = 0;
                //        var oid = $(e.target).closest("g").data("objectid");
                //        if (oid) {
                //            this.selectText = $.trim($(e.target).closest("g").find("text").text());
                //            var target = $("body"),
                //            radialRadius = 150,
                //            radialDiameter = 2 * radialRadius,
                //            iframeY = target.offset().top + e.clientY,
                //            iframeX = target.offset().left + e.clientX,
                //            x = iframeX > target.width() - radialRadius ? target.width() - radialDiameter : (iframeX > radialRadius ? iframeX - radialRadius : 0),
                //            y = iframeY > target.height() - radialRadius ? target.height() - radialDiameter : (iframeY > radialRadius ? iframeY - radialRadius : 0);
                //            this.radialObj.setPosition(x + 25, y - 230 + $(window).scrollTop());
                //        }
                //    }.bind(this), 300);
                //} else {
                //    clearTimeout(this.timer);
                //    this.click = 0;
                //}
            }
        },

        initialize: function () {

            this.listenTo(this.options.request, 'change', this.getContent);
        },

        onRender: function () {

            this.showChildView('cmenu', new contextMenu({ collection: contextMenuCollection }));

            this.getContent();
        },

        modelEvents: {

            sync: function () {

                if (parseInt(this.model.get('width')) > this.$el.width())
                    this.$('.svg-content').css({ width: this.model.get('width') });
                if (parseInt(this.model.get('height')) > this.$el.height())
                    this.$('.svg-content').css({ height: this.model.get('height') });

                var svg = '<svg width="100%" height="100%"><g id="main" transform="translate(0,0) scale(1)">' +
                    $(this.model.get('html')).html() + "</g></svg>";

                this.$(".svg-content").html(svg);

                if (!this.Visualization) {

                    this.Visualization = new Visual({ content: this.$(".svg-content"), model: this.model });
                    this.setVisualization('semantic-tools--hand');

                } else
                    this.Visualization.Transform();

            },
            error: function () {

            }
        },

        childViewEvents: {

            'menu:click:item': function (v) {

                this.getRegion('cmenu').$el.hide();

                let id = v.model.id;

                if (this.selectedObject) {
                    
                    if (id === '_runTaskPerson')
                        Backbone.history.navigate(`project/${this.options.projectId}/add/PERSON?lname_INTERN=${this.selectedObject.title}`, { trigger: true });

                    if (id === '_runTaskOrganization')
                        Backbone.history.navigate(`project/${this.options.projectId}/add/COMPANY?title_INTERN=${this.selectedObject.title}`, { trigger: true });

                }

            }

        },

        switchMode: function (flag) {
            this.$('.svg-content').toggleClass('edit-mode');
        },

        setVisualization: function (name) {
            this.Visualization.active(name);
        },

        getContent: function () {

            var d = this.options.request.toJSON();
            delete d.Resources;

            this.model.url = "/api/SemNet/" + this.model.get("id") + "/?semnetid=" + this.model.id + "&" + $.param(d);

            this.model.fetch();
        }
    });

    return Mn.View.extend({

        template: '#semantic-scheme-wrapper',

        events: {

            'click .semantic-tabs .control': function () {
                this.$('.semantic-tabs').toggleClass('active');
                if (!this.$('.semantic-tabs').hasClass('active'))
                    this.getChildView('svgContent').$el.animate({ height: '+=44' }, 150);
                else
                    this.getChildView('svgContent').$el.animate({ height: '-=44' }, 150);
            },

            'click #sfs': function () {
                this.$('section').toggleClass('fullscreen');
                this.fitSize();
            }
        },

        regions: {
            //setLayout: { el: '#set-layout', replaceElement: true },
            svgContent: { el: '#svg-content', replaceElement: true },
            toolsBar: { el: '#tools-bar', replaceElement: true }
        },

        initialize: function () {
            Backbone.on("window:resizeend", this.fitSize, this);
            this.request = new ToolsBarModel();
        },

        fitSize: function () {
            var h = $(window).height() - this.$('section').offset().top;
            this.$('.semantic-wrapper').css({ height: h });

            var dh = h - 26, //(this.getChildView('setLayout').$el.parent().hasClass('active') ? 70 : 26),
                svg = this.getChildView('svgContent');

            svg.$el.css({ height: dh });
            svg.$('.svg-content').css({ height: dh });
            if (parseInt(svg.model.get('height')) > svg.$el.height())
                svg.$('.svg-content').css({ height: svg.model.get('height') });
        },

        onBeforeRender: function () {
            if (!$('#form-svg2png').get(0))
                $('body').append($('<form action="' + baseurl + '/Svg" id="form-svg2png" class="svgToPng" method="post" name="svgToPng" target="_blank"><input id="data" name="data" type="hidden" value="" /></form>'));
        },

        onRender: function () {
            this.model.url = "/api/SemNet/UserSNMeta/" + this.model.id;
            this.model.fetch();
        },

        viewLayout: function (m) {

            //this.getChildView('setLayout').setActive(m);
            this.showChildView('toolsBar', new ToolsBarView({ model: this.request }));
            this.showChildView('svgContent', new SvgContentView({ model: m, request: this.request, projectId: this.model.get('projectId') }));
            this.fitSize();

        },

        modelEvents: {

            sync: function (model) {
                var collection = new LayoutCollection(model.get('Tabs'));
                //this.showChildView('setLayout', new LayoutsView({ collection: collection }));
                this.viewLayout(collection.get(-1));
            }
        },

        onChildviewClickView: function (v) {
            if (v.model)
                this.viewLayout(v.model);
        },

        onChildviewSwitchEditMode: function (flag) {
            this.getChildView('svgContent').switchMode(flag);
        },

        onChildviewClickToolsBar: function (e) {
            this.getChildView('svgContent').setVisualization($(e.target).attr("class").split(' ')[0]);
        },

        onChildviewClickToolsHamburger: function (flag) {
            //if (flag)
            //    this.getChildView('svgContent').$el.animate({ 'margin-left': '+=265'}, 150);
            //else
            //    this.getChildView('svgContent').$el.animate({ 'margin-left': 44 }, 150);

            //this.fitSize();
        },

        onChildviewSemReload: function () {

            this.request.set(this.request.defaults());

            var m = this.getChildView( 'svgContent' ).model; 
            this.viewLayout(m);
        },

        onChildviewSemExport: function () {

            var svg = this.getChildView('svgContent').$('.svg-content').get(0).outerHTML,
                form = document.forms["svgToPng"];

            require(["dist/base64"], function (b64) {
                form["data"].value = encodeURIComponent(b64.encode(svg));
                form.submit();
            });
        }
    });

});