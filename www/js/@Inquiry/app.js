require.config({
    paths: {
        '@': "@Inquiry"
    }
});

define(
    [
    'baseurl',
    'access',
    'i18n!nls/resources.min',
    'global.view.headerView',
    'config',
    'tools:sidebar',
    'main',
    'global:collection:dictionary',
    'block:project',
    'block:object',
    'block:check',
    'global.radio.loader'
    ],
function (baseurl, acc, Resources, Header, config, sidebarView, mainView, typesCollection, projectBlock, objectBlock, checkBlock) {

    var init = function () {

        $.ajaxSetup({
            headers: {
                'key': `${$.ajaxSettings.url}/wg-${acc.data.WGID}`
            }
        });

        var sidebar = new sidebarView;
        sidebar.render().$el.insertAfter($('body>header'));

        var inquiryApp = Mn.Application.extend({

            channelName: 'app',

            region: 'main',

            radioEvents: {

                'start:check': function (m) {

                    this.currentChecks.add(m);

                }

            },

            initialize: function () {

                this.sidebar = sidebar;

                this.projectBlock = new projectBlock({ app: this });
                this.objectBlock = new objectBlock;
                this.checkBlock = new checkBlock;

                this.currentChecks = new Backbone.Collection;   // коллекция текущих проверок
                this.Tasks = [];                                // масив uid tasks signalR - проверка по ЮГРЛ и пр.

                this.model = new Backbone.Model;
                this.model.on('change:id', (m, id) => {
                    if (id)
                        m.set({ title: null, projectName: null });
                });

                var om = Backbone.Radio.channel('oM');
                //var main = this.getRegion();

                om.reply('get:app', function () { return app; });

                // форма добавления объектов              
                //this.listenTo(om, 'show:form:view', function (view) {
                //    main.attachHtml(view);
                //});

                //om.reply('get:current:module', function () {
                //    return app.СurrentModule;
                //});

            },

            onStart: function () {

                this.showView(new mainView);

                if (!acc.data.Mode)
                    new modeView;

                new Header().render();

                Backbone.history.start();

                var nv = acc.data.NetVersion === "Intranet" ? ["foreverFrame", "serverSentEvents", "longPolling"] :
                    ["webSockets", "foreverFrame", "serverSentEvents", "longPolling"];

                var hub = SJ.iwc.SignalR.getHubProxy('Ticker', {

                    client: {

                        updateRobot: function (robot) {

                            if (this.getRegion().hasView() && this.getView().getRegion('content').hasView() && this.getView().getChildView('content')._updateStatistic)
                                this.getView().getChildView('content')._updateStatistic(robot);

                        }.bind(this),

                        infoActiveChecks: function (arr) {

                            console.log("Ticker::info active checks >> ", arr.join('; '));

                            if (this.getRegion().hasView() && this.getView().getRegion('content').hasView()) {

                                if (this.getView().getChildView('content')._addIcon)
                                    this.getView().getChildView('content')._addIcon(arr);


                                if (!this.model.id) return;

                                if (arr.indexOf(this.model.id) === -1) {

                                    let ch = this.currentChecks.get(this.model.id);
                                    if (ch)
                                        this.currentChecks.remove(ch);

                                }
                                else
                                    if (!this.currentChecks.get(this.model.id))
                                        this.currentChecks.add(this.model);


                                if (!arr.length)
                                    this.currentChecks.reset();

                                if (this.getView().getChildView('content').isProof) {

                                    if (this.currentChecks.get(this.model.id))
                                        try {
                                            sidebar
                                                .getChildView('children')
                                                .children
                                                .findByModel(sidebar.collection.get('proof'))
                                                .getChildView('children')
                                                .children
                                                .findByIndex(1)
                                                .$el.append($('<i class="loading"></i>'));
                                        } catch (e) {
                                        }
                                    else
                                        sidebar.$el.find('.loading').remove();

                                }

                            }

                        }.bind(this)

                    }
                });

                SJ.iwc.SignalR.start({ transport: nv }).done(function () {

                    hub.server.startListening($.ajaxSettings.url);

                    console.log("Ticker :: monitoring alerts init", [$.ajaxSettings.url, hub]);

                    hub.server.pingConnect('done');

                    setInterval(function () {
                        hub.server.pingConnect('done');
                    }, 30000);

                });

            },

            getOptions() {

                return new Promise(resolve=> {

                    if (this.model.get('title') || this.model.get('projectName'))
                        resolve();
                    else
                        this.model.fetch({ success: () => { resolve(); } });

                });

            },

            getDataTasksInfo: function (p) {

                return new Promise(resolve=> {

                    require(['result:proof'], function (page) {

                        let c = new Backbone.Collection;

                        c.url = `/api/CheckRes/${app.model.id}`;

                        app.getView().getRegion('content').show(new page({ model: app.model, collection: c }));

                        c.fetch({
                            reset: true,
                            success: function () {

                                var data = c.map(function (m) {

                                    const path = `${p}/${m.id}`;

                                    m.set('data', JSON.parse(m.get('data')));

                                    return {
                                        id: m.id,
                                        path: path,
                                        name: 'statistic',
                                        title: m.get('date') ? new Date(m.get('date')).toLocaleString() : Resources.all,
                                        children: [
                                            { id: 'infos', title: Resources.info2, name: 'infos', checkUid: m.get('uid'), path: `${path}/infos` },
                                            { id: 'facts', title: Resources.titleFacts, name: 'facts', checkUid: m.get('uid'), path: `${path}/facts` },
                                            { id: 'docs', title: Resources.titleDocs, name: 'docs', checkUid: m.get('uid'), path: `${path}/docs` },
                                            { id: 'reqs', title: Resources.info3, name: 'requisits', checkUid: m.get('uid'), path: `${path}/reqs` }
                                        ]
                                    };

                                }, this);

                                let point = c.length > 1 ? c.at(1).id : c.at(0).id;

                                if (app.currentChecks.get(app.model.id)) {

                                    var checkInfo = app.currentChecks.get(app.model.id).get('searchTasksInfo') || { checkId: point };

                                    var pdata = _.findWhere(data, { id: checkInfo.checkId });

                                    if (!pdata) {

                                        var path = `${p}/${checkInfo.checkId}`,

                                            bots = _.chain(checkInfo.typesOfSearchTasks).map(function (a) {
                                                return {
                                                    title: a.m_Item2,
                                                    id: a.m_Item1,
                                                    status: 'processing',
                                                    state: '',
                                                    details: ''
                                                };
                                            }).value();


                                        pdata = {
                                            id: checkInfo.checkId,
                                            path: path,
                                            uid: checkInfo.checkUid,
                                            title: new Date().toLocaleString(),
                                            children: [
                                                { id: 'infos', title: Resources.info2, name: 'infos', path: `${path}/infos` },
                                                { id: 'facts', title: Resources.titleFacts, name: 'facts', path: `${path}/facts` },
                                                { id: 'docs', title: Resources.titleDocs, name: 'docs', path: `${path}/docs` },
                                                { id: 'reqs', title: Resources.info3, name: 'requisits', path: `${path}/reqs` }
                                            ]
                                        };
                                        data.splice(1, 0, pdata);
                                    }

                                    point = checkInfo.checkId;

                                    data.find((a) => { return a.id === point }).data = bots;

                                    c.add(data);
                                }

                                sidebar.collection.get('proof').set({ children: data });

                                resolve(point);

                            }
                        });

                    });

                });
            },

            getProofContent: function (checkId, page) {

                let navArr = ['proof', checkId];

                const checkModel = this.getView().getChildView('content').collection.get(checkId),
                      proofMenu = sidebar.getChildView('children').children.findByModel(sidebar.collection.get('proof'));

                if (!checkModel) {

                    // TODO: избежать такой ситуации
                    // запрос может быть раньше инициализации при запущенной проверке

                    return;
                }

                $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.headers.key, { checkuid: checkModel.get('uid') });

                if (!page) {    // statistic page

                    this.getView().getChildView('content')._showRobotsInfo(checkId);                    

                    this.statisticCollection = new Backbone.Collection;
                    this.statisticCollection.url = `/api/InterestObj/TotalCheck/${this.model.id}`;

                    proofMenu.$(`#${checkId}`).append($('<i class="loading"></i>'));

                    this.statisticCollection.fetch({
                        reset: true,
                        success: function (c, a) {

                            const m = proofMenu.getChildView('children');

                            m.children.findByModel(m.collection.get(checkId)).getChildView('children').children.each(function (v, i) {

                                v.model.set('count', ` ( ${a[i]} )`);
                            });


                            if (this.currentChecks.get(this.model.id)) {    // только когда запущена проверка

                                SJ.iwc.SignalR.getHubProxy('Ticker', { client: {} })
                                   .server
                                   .startMonitoringTasks($.ajaxSettings.headers.key, this.model.id);

                                console.log("Ticker::start monitoring tasks >> ", [$.ajaxSettings.headers.key, this.model.id]);
                            }


                            proofMenu.$(`#${checkId} i.loading`).remove();

                        }.bind(this)
                    });


                } else {

                    if (this.currentChecks.get(this.model.id))
                        SJ.iwc.SignalR.getHubProxy('Ticker', { client: {} })
                          .server
                          .stopMonitoringTasks($.ajaxSettings.headers.key, this.model.id);


                    navArr.push(page);

                    require([`result:${page}`], function (module) {

                        this.getView().getChildView('content').showChildView('content', new module({ model: app.model }));

                    }.bind(this));

                }

                sidebar.setCurrent(navArr);

            }

        });

        var InquiryRouter = Mn.AppRouter.extend({

            controller: {

                default: function (a) {
                    Backbone.history.navigate('projects/my', { trigger: true });
                },

                projects: function (a) {

                    app.projectBlock.setModules(a);

                    require([a], function (module) {

                        app.getView().getRegion('content')
                            .show(new module({
                                collection: new Backbone.Collection,
                                inquiry: app.projectBlock.model
                            }));
                    });
                },

                project: function (page, pid) {

                    Backbone.history.navigate(`projects/${page}/${pid}/objects`, { trigger: true });

                },

                objects: function (page, pid, content) {

                    if (app.attachedView)
                        app.attachedView.destroy();

                    $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { prjid: pid });

                    app.projectBlock.model.set({ projectId: parseInt(pid) });
                    app.projectBlock.resetModules();

                    if (app.getView().getRegion('content').hasView())
                        Backbone.Radio.channel('loader').trigger('show', app.getView().getChildView('content').$el, { speed: 'fast', overlay: true });

                    app
                        .projectBlock
                        .getModel()
                        .then(() => {

                            const main = app.getView(),
                                   path = `projects/${page}/${pid}`,
                                   mapPath = { origin: 'forms.inquiryView', resume: 'notesView' },
                                   module = mapPath[content] || `project:${content}`;

                            main.getChildView('crumbs').collection.reset([
                                { path: `projects/${page}`, title: Resources.ile },
                                { path: path, title: app.projectBlock.model.get('projectName') }
                            ]);

                            require([module], function (page) {

                                main.getRegion('content').show(new page({ model: app.projectBlock.model, hideCancel:true }));

                                let menu =
                                    [
                                        { id: 'objects', className: 'inuiry-objects', title: Resources.a },
                                        { id: 'origin', className: 'origin4', title: Resources.b },
                                        { id: 'resume', className: 'result', title: Resources.c }
                                    ]
                                    .map((a) => {

                                        a.path = `${path}/${a.id}`;
                                        return a;

                                    });

                                sidebar.collection.reset(menu);
                                sidebar.setCurrent([content]);

                            });

                        });
                },

                addObject: function (pid, type, field, value) {

                    $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { prjid: pid });

                    Backbone.trigger('message:modal');

                    typesCollection.done(function (c) {

                        if (c.length) {

                            Backbone.trigger('message:hide');

                            let objTypesCode = c.findWhere({ DicCode: 'BySAType' }).get('DicItems'),
                                code = _.findWhere(objTypesCode, { DicCodeItem: type.toUpperCase() }),
                                data = { Project_ID: pid };


                            if (field)
                                data[field] = value;

                            require([`forms/${code.ID}View`, `forms/${code.ID}Model`], function (view, model) {

                                app.attachedView = new view({ model: new model(data), DicID: code.ID });
                                app.getRegion().attachHtml(app.attachedView.render());

                            });

                        } else {

                            Backbone.history.back();
                            Backbone.trigger('message:warning', { message: Resources.mbfe });

                        }

                    }, this);

                },

                editObject: function (pid, oid) {

                    $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { prjid: pid, id: oid });

                    $.get(`/api/interestObjects/input/id${oid}`).done(function (data) {

                        const sat = { 10021: 1002, 10022: 1003, 10023: 1004 };
                        const dicid = sat[data.typeid];

                        require([`forms/${dicid}View`, `forms/${dicid}Model`], function (view, model) {

                            app.attachedView = new view({ model: new model(data), DicID: dicid });
                            app.getRegion().attachHtml(app.attachedView.render());

                        });

                    });
                },

                toObject: function (page, pid, oid) {

                    Backbone.history.navigate(`${Backbone.history.fragment}/reports`, { trigger: true });

                },

                object: function (page, pid, oid, content, last) {

                    if (app.attachedView)
                        app.attachedView.destroy();

                    $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { prjid: pid, id: oid });

                    app.model.set({
                        id: parseInt(oid)
                    });
                    app.model.url = `/api/details/${oid}?mode=1`;

                    const main = app.getView(),
                        path = `projects/${page}/${pid}/objects/${oid}`,

                        mapPath = { notes: 'notesView', semnet: 'global.semnet.layout' },
                        module = last ? (mapPath[last] || `result:${last}`) : `result:${content}`;

                    main.getChildView('tools').collection.reset();
                    sidebar.collection.reset();

                    if (main.getRegion('content').hasView())
                        Backbone.Radio.channel('loader').trigger('show', main.getChildView('content').$el, { speed: 'fast', overlay: true });

                    app.getOptions().then(() => {

                        main.getChildView('crumbs').collection.reset([
                            { path: `projects/${page}`, title: Resources.ile },
                            { path: `projects/${page}/${app.model.get('projectId')}`, title: app.model.get('projectName') },
                            { path: path, title: app.model.get("title") }
                        ]);

                        require([module], function (page) {

                            main.getRegion('content').show(new page({ model: app.model }));

                            sidebar.collection.reset(config.pages['result'].sidebar(path));
                            sidebar.setCurrent([content, last]);

                            Backbone.Radio.channel('loader').trigger('hide');
                        });

                    });
                },

                proof: function (page, pid, oid) {

                    $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { prjid: pid, id: oid });

                    app.model.set({
                        id: parseInt(oid),
                        currentCheckId: null
                    });
                    app.model.url = `/api/details/${oid}?mode=1`;

                    const main = app.getView(),
                        path = `projects/${page}/${pid}/objects/${oid}`;

                    main.getChildView('tools').collection.reset();
                    sidebar.collection.reset();


                    if (main.getRegion('content').hasView())
                        Backbone.Radio.channel('loader').trigger('show', main.getChildView('content').$el, { speed: 'fast', overlay: true });

                    app.getOptions().then(() => {

                        main.getChildView('crumbs').collection.reset([
                            { path: `projects/${page}`, title: Resources.ile },
                            { path: `projects/${page}/${app.model.get('projectId')}`, title: app.model.get('projectName') },
                            { path: path, title: app.model.get("title") }
                        ]);

                        sidebar.collection.reset(config.pages['result'].sidebar(path));
                        sidebar.setCurrent(['proof']);

                        app.getDataTasksInfo(`${path}/proof`).then((point) => {

                            Backbone.history.navigate(`${Backbone.history.fragment}/${point}`, { trigger: true });

                        });

                    });

                },

                check: function (path, pid, oid, cid, page) {

                    $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { prjid: pid, id: oid });

                    app.model.set({
                        id: parseInt(oid),
                        currentCheckId: parseInt(cid)
                    });

                    app.model.url = `/api/details/${oid}?mode=1`;

                    const main = app.getView();

                    main.getChildView('tools').collection.reset();
                    //sidebar.collection.reset();

                    if (main.getRegion('content').hasView())
                        Backbone.Radio.channel('loader').trigger('show', main.getChildView('content').$el, { speed: 'fast', overlay: true });

                    app.getOptions().then(() => {

                        main.getChildView('crumbs').collection.reset([
                            { path: path, title: Resources.ile },
                            { path: `${path}/${pid}`, title: app.model.get('projectName') },
                            { path: `${path}/${pid}/objects/${oid}`, title: app.model.get("title") }
                        ]);


                        if (main.getRegion('content').hasView() && main.getChildView('content').isProof) {

                            app.getProofContent(parseInt(cid), page);

                        } else {

                            sidebar.collection.reset(config.pages['result'].sidebar(`${path}/${pid}/objects/${oid}`));
                            sidebar.setCurrent(['proof']);

                            app.getDataTasksInfo(`${path}/${pid}/objects/${oid}/proof`).then(() => {

                                app.getProofContent(parseInt(cid), page);

                            });
                        }

                        Backbone.Radio.channel('loader').trigger('hide');
                    });
                },

                source: function (path, pid, oid, cid, page, sid) {

                    $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { prjid: pid, id: oid });

                    app.model.set({
                        id: parseInt(oid),
                        currentCheckId: parseInt(cid),
                        path: `${path}/${pid}/objects/${oid}/proof`
                    });

                    app.model.url = `/api/details/${oid}?mode=1`;

                    const main = app.getView();

                    main.getChildView('tools').collection.reset();
                    sidebar.collection.reset();

                    if (main.getRegion('content').hasView())
                        Backbone.Radio.channel('loader').trigger('show', main.getChildView('content').$el, { speed: 'fast', overlay: true });

                    app.getOptions().then(() => {

                        main.getChildView('crumbs').collection.reset([
                            { path: path, title: Resources.ile },
                            { path: `${path}/${pid}`, title: app.model.get('projectName') },
                            { path: `${path}/${pid}/objects/${oid}`, title: app.model.get("title") }
                        ]);

                        require(['source:result'], function (view) {

                            main.getRegion('content').show(new view({ model: app.model, mode: page, sourceId: sid }));

                            sidebar.collection.reset(config.pages['source'].sidebar(`${path}/${pid}/objects/${oid}`));

                            Backbone.Radio.channel('loader').trigger('hide');
                        });

                    });
                },

                print: function (id) {

                    require(['print'], function (module) {
                        app.getView().getRegion('content').show(new module({ model: new Backbone.Model({ id: id }) }));
                    });

                },

                original: function (oid, uid, pid) {

                    require(['content:original'], function (module) {

                        sidebar.close();
                        app.getView().getRegion('content').show(new module({ id: uid, objid: oid, pid: pid }));

                    });

                }

            },

            appRoutes: {

                '': 'default',
                'projects/:page': 'projects',
                'projects/:page/:id': 'project',
                'projects/:page/:id/:obj': 'objects',
                'projects/:page/:id/objects/:oid': 'toObject',

                'projects/:page/:pid/objects/:oid/proof': 'proof',
                '(*path)/:pid/objects/:oid/proof/:cid': 'check',
                '(*path)/:pid/objects/:oid/proof/:cid/:page': 'check',
                '(*path)/:pid/objects/:oid/proof/:cid/:page/:sid': 'source',


                'projects/:page/:id/objects/:oid/:content': 'object',
                'projects/:page/:id/objects/:oid/:content/:last': 'object',

                'project/:id/add/:obj?:field=:value': 'addObject',
                'project/:id/add/:obj': 'addObject',
                'project/:id/edit/:objid': 'editObject',

                'print/:id': 'print',

                ':oid/original/:uid': 'original',
                ':oid/original/:uid/pid:pid': 'original'

            }

        });

        var modeView = Backbone.View.extend({

            initialize: function () {

                var channel = Backbone.Radio.channel('Notify');

                channel.request('show:overlay');

                var dialog = channel.request("once:dialog", {
                    color: 'red',
                    header: { manage: [] },
                    content: Resources.nt0,
                    footer: [
                        { id: 'mod', title: Resources.bb1 },
                        { id: 'cbd', title: Resources.bb0, className: 'right nest-left' }
                    ]
                });

                this.listenTo(dialog, 'footer:button:click', function (e) {

                    let s = location.pathname.split('/', 3).join('/');

                    if (e.model.id === "mod")
                        location.href = '/';

                    if (e.model.id === "cbd")
                        location.href = `${s}/account/login?returnUrl=inquiry`;

                });

            }
        });

        const app = new inquiryApp();
        new InquiryRouter;
        app.start();

    };

    return {
        init: init
    };
});