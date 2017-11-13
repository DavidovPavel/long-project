
var ScheduleModel = Backbone.Model.extend({
    idAttribute: "UID",
    defaults: {
        UID: null,
        Title: "",
        TimeStartExecution: null,
        PointDateForSelection: null,
        Periodicity: 1,
        WhichDaysOfWeek: [],
        Subscribers: "",
        SchedulingTaskType: 0,
        State: 1,
        EmailTopic: "",
        EmailBody: ""
    },

    validate: function (attr) {
        var output = [];

        if (!$.trim(attr.Title))
            output.push("Title");

        if (!$.trim(attr.TimeStartExecution))
            output.push("TimeStartExecution");

        if (!$.trim(attr.Subscribers))
            output.push("Subscribers");

        if (attr.Periodicity === "3") {
            var arr = [];
            for (var p in attr) {
                if (p.indexOf("Day_") !== -1 && attr[p]) {
                    arr.push(parseInt(p.split("_")[1]));
                }
            }
            this.set("WhichDaysOfWeek", arr);
        }
        this.set("Periodicity", parseInt(attr.Periodicity));
        if (output.length)
            return output;
    }
});

var scheduleCollection = Backbone.Collection.extend({
    model: ScheduleModel,
    url: "/api/autoexecscheduling/items"
});

define('schedule', ['RU', 'i18n!nls/resources.min'], function (ru, Resources) {

    var daysView = Mn.CollectionView.extend({
        childView: Mn.View.extend({
            template: _.template('<input type="checkbox" name="Day_<%- name %>" value="<%- id %>" id="d<%- id %>" class="g-form--checkbox"><label for="d<%- id %>"><%- title %></label>'),
            onRender: function () {
                this.$el.css({ float: 'left', width: '120px' });
                this.$('input').prop('checked', this.model.get('checked'));
            }
        }),
        childViewOptions: function (m) {
            m.set({ checked: this.model.get('value').indexOf(m.id) !== -1 });
        }
    });

    var radioView = Mn.CollectionView.extend({
        childView: Mn.View.extend({
            template: _.template('<input type="radio" name="<%- name %>" value="<%- id %>" class="g-form--radio" id="r<%- id %>" /><label for="r<%- id %>"><%- title %></label>'),
            onRender: function () {
                this.$('input').prop('checked', this.model.id === this.model.get('value'));
            },
            events: {
                'click input': function () { this.triggerMethod('click:radio', this.model); }
            }
        }),
        childViewOptions: function (m) {
            m.set({ name: this.model.get('name'), value: parseInt(this.model.get('value')) });
        }
    });

    return Mn.View.extend({

        template: '#case-schedule-item-template',
        templateContext:{
            Resources:Resources
        },

        regions:{
            period: '.period',
            days: '.days-block'
        },

        events: {

            'click .cancel, .close': function () {
                this.$el.hide();
            },

            "click .save":  function (e) {
                
                var data = $.GetData(this.$(".ScheForm:not(.digest)")),
                    digest = $.GetData(this.$(".digest")),
                    old = JSON.parse(this.model.get("Data"));

                this.model.set("Data", JSON.stringify(Object.assign(old, digest)));

                $(e.target).showIndicator();
                this.model.save(data, { wait: true, success: function () { $(e.target).hideIndicator(); } });

            }
        },

        onChildviewClickRadio: function (m) {

            if (m.id === 3) {
                var local = Resources.setlocal();
                var week = _.map([0, 1, 2, 3, 4, 5, 6], function (d) { return { id: d, title: local.dayNames[d] }; });
                this.showChildView('days', new daysView({
                    model: new Backbone.Model({ value: this.model.get("WhichDaysOfWeek") }),
                    collection: new Backbone.Collection(week)
                }));
            } else
                this.getRegion('days').empty();
        },

        onRender: function (p) {

            this.showChildView('period', new radioView({model:new Backbone.Model({name:'Periodicity', value:this.model.get("Periodicity")}),
                collection:new Backbone.Collection([
                    { title:Resources.everyhour, id:1},
                    { title:Resources.everyday, id:2},
                    { title:Resources.everyweek, id:3}
                ])
            }));

            var value = this.model.get("TimeStartExecution") ? new Date(this.model.get("TimeStartExecution")) : new Date();
            this.$(".ejtimepicker").ejTimePicker({
                locale: Resources.Lang,
                width: '100px',
                interval: 10,
                value: value
            });
        }
    });
});

define('export', ['i18n!nls/resources.min'], function (Resources) {

    return Mn.View.extend({

        template: '#case-export-template',
        templateContext: {
            Resources: Resources
        },

        save: function (r) {

            r.$el.addClass("disabled").attr('data-icon', 'icon-loader');

            var output = $.GetData(this.$el),
                ids = _.map(this.options.selected, function (m) { return m.id; });

            output.list = ids;

            $.post({
                url: "/api/Export",
                data: $.param(output)
            })
                .always(function (result) {

                    r.$el.removeClass("disabled").removeAttr('data-icon');
                    this.triggerMethod('show:message', result);

                }.bind(this));
        }       
    });
});

define('import', ['i18n!nls/resources.min', 'global.view.dropDown'], function (Resources, DropDown) {

    return Mn.View.extend( {

        template: '#case-import-template',
        templateContext: {
            Resources:Resources
        },

        regions:{
            dd: '#exp-items'
        },

        initialize: function () {
            this.collection = new Backbone.Collection();
            this.collection.url = "/api/Export";
        },

        onRender: function () {

            this.showChildView('dd', new DropDown({ collection: new Backbone.Collection }));

            this.collection.fetch({ reset: true});
        },

        collectionEvents: {
            reset: function () {
                this.getChildView('dd').collection.reset(this.collection.map(function (o) { return { title: o.get('CDate'), id: o.get('ID') }; }));
            }
        },

        save: function (r) {

            var s = this.getChildView('dd').current;

            if (s.has('id')) {

                r.$el.removeClass("disabled").attr('data-icon', 'icon-loader');

                $.post({

                    url: "/api/export/transferdata",
                    data: $.param({ ID: s.id, CDate: s.get('title') })

                }).always(function (result) {

                    r.$el.removeClass("disabled").removeAttr('data-icon');
                    this.triggerMethod('show:message', result);

                }.bind(this));
            }
        }        
    });
});

define('factdigest', ['i18n!nls/resources.min', 'schedule', 'RU'], function (Resources, ScheduleView, ru) {

    var factDigestModel = Backbone.Model.extend({
        defaults: {
            id: null,
            TitleTop: '',
            TitleMiddle: '',
            TitleBottom: '',
            PointDateForSelection: new Date().toString()
        }
    });

    return Mn.View.extend({

        template: '#case-factdigests-template',
        templateContext: {
            Resources: Resources
        },

        events: {

            'change #show-sche': function (e) {

                if ($(e.target).prop('checked'))
                    this.showChildView('sche', new ScheduleView({ model: new ScheduleModel }));
                else
                    this.getRegion('sche').empty();
            },

            'blur input': function () {

                if (this.getRegion('sche').hasView()) {
                    var m = this.getChildView('sche').model;
                    m.set($.GetData(this.$(".sche-container")));
                    if (m.isValid()) {
                        this.$("input").each(function () { $(this).css("border-color", ""); });
                        this.$(".next").removeClass("disabled");
                        this.$(".next").find("span.loader").remove();
                    }
                }
            }
        },

        regions:{
            sche: '.sche-container'
        },

        initialize: function () {
            this.model = new factDigestModel();
        },

        onRender: function () {

            this.$("input[name='PointDateForSelection']").ejDatePicker({
                locale: Resources.Lang,
                buttonText: Resources.Today,
                value: new Date(this.model.get('PointDateForSelection')).toLocaleDateString(Resources.Lang)
            });

            var s = this.options.selected[0];
            if (s)
                this.$("#objForFactDigest")
                    .html(s.get("display_name") + '&nbsp;-&nbsp;<i>' + s.get("typename") + '</i>');
            else 
                this.triggerMethod('show:message', Resources.noselect);
            

        },

        save:function (r) {

            this.$("input").each(function () { $(this).css("border-color", ""); });

            this.model.set($.GetData(this.$el));

            if (this.getRegion('sche').hasView()) {

                var m = this.getChildView('sche').model;
                m.set($.GetData(this.$(".sche-container")));

                if (!m.isValid()) {

                    _.each(m.validationError, function (a) {
                        this.$("input[name='" + a + "']").css("border-color", "red");
                    }, this);

                    return this;

                } else {

                    m.set("SchedulingTaskType", 2);
                    this.model.set('SchedulingTaskData', m.toJSON());
                }

            }

            r.$el.addClass("disabled").attr('data-icon', 'icon-loader');

            $.ajax({

                method: 'POST',
                contentType: 'application/json; charset=utf-8',
                url: "/api/export/genfactdigest/" + this.options.selected[0].id,
                data: JSON.stringify(this.model.toJSON())

            }).always(function (result) {

                r.$el.removeClass("disabled").removeAttr('data-icon');
                this.triggerMethod('show:message', result);

            }.bind(this));

        }

    });
});

define('docdigest', ['i18n!nls/resources.min', 'schedule', 'g/tree', 'c/searchPanel', 'global.view.dialog'], function (Resources, ScheduleView, treeView, searchPanel, dialog) {

    var docDigestModel = Backbone.Model.extend({
        defaults: {
            id: null,
            TitleTop: '',
            TitleMiddle: '',
            TitleBottom: '',
            SelectedObjectsForKeyPhrases: [],
            Sources: []
        }
    });

    return Mn.View.extend({

        template: '#case-docdigest-template',

        templateContext: {
            Resources: Resources
        },

        ui: {
            req: '#sel-request',
            keys: '.selected-key-obj'
        },

        regions: {
            sche: '.sche-container',
            sd: '#choose-dialog'
        },

        initialize: function () {

            this.model = new docDigestModel({ Sources: this.collection.pluck('object_id') });
        },

        onRender: function () {

            //var s = this.options.selected;
            //if (s.length)
            //    this.$(".sources-from-basket").html(s.pluck("display_name").join(','));
            //else
            //    this.triggerMethod('show:message', Resources.noselect);

        },

        events: {

            'change #show-sche': function (e) {
                if ($(e.target).prop('checked'))
                    this.showChildView('sche', new ScheduleView({ model: new ScheduleModel }));
                else
                    this.getRegion('sche').empty();
            },

            'click input[value=a]': function () {
                this.model.set('Sources', this.collection.pluck('id'));
                this.ui.req.html('');
            },

            //by request
            'click input[value=b]': function () {           

                let dialogOptions = {
                    title: Resources.selectRequest,
                    color:'blue',
                    controls: [],
                    tools: [],
                    content: new treeView( { collection: new Backbone.Collection, node: { checkbox: false } } ),
                    zindex: 1000
                };

                dialogOptions.content.collection.url = '/api/request';
                dialogOptions.content.collection.fetch( { reset: true } );

                let dialog = Backbone.Radio.channel('Notify').request('once:dialog', dialogOptions);

                this.listenTo(dialog, 'container:select:item', function (v) {

                    if (v.model.get('isdoc')) {
                        this.model.set('Sources', [v.model.id]);
                        this.ui.req.html(' - [ <b>' + v.model.get('title') + '</b> ]');
                        dialog.$el.hide();
                    }

                }.bind(this));
            },

            'blur input': function () {

                if (this.getRegion('sche').hasView()) {
                    var m = this.getChildView('sche').model;
                    m.set($.GetData(this.$(".sche-container")));
                    if (m.isValid()) {
                        this.$("input").each(function () { $(this).css("border-color", ""); });
                        this.$(".next").removeClass("disabled");
                        this.$(".next").find("span.loader").remove();
                    }
                }
            },
            
            'click .choose': function () {

                let dialogOptions = {
                    title: Resources.selectingObj,
                    color: 'blue',
                    toolbar: new Backbone.Collection([
                        {
                            id: 'searchObj',
                            className: 'search',
                            template: '<span class="g-form--input input-data"><input type="text" name="search-name" value="" class="g-form--input" placeholder="Enter keyword"/><i class="search rtl-1" name="search"></i></span>'
                        },
                        { id: 'filterByType', className: 'filter' }
                    ]),
                    footer: new Backbone.Collection([{ id: 'save', title: Resources.save, className: 'right blue' }]),
                    content: new searchPanel( { rig: this.options.rid, collection: new Backbone.Collection } ),
                    zindex: 1000
                };

                //let dialog = Backbone.Radio.channel('Notify').request('once:dialog', dialogOptions);

                this.showChildView('sd', new dialog(dialogOptions));

                this.listenTo(dialog, 'footer:button:click', function (v) {

                    if (v.model.id === 'save') {
                        let c = dialogOptions.view.collection;
                        if (c.length) {
                            this.model.set('SelectedObjectsForKeyPhrases', c.pluck('id'));
                            this.ui.keys.html(c.pluck('title').join('; '));
                        } else
                            this.ui.keys.html(Resources.noselect);
                    }

                    dialog.close();
                });

            }
        },

        save: function (r) {

            this.$("input").each(function () { $(this).css("border-color", ""); });

            this.model.set($.GetData(this.$el));

            if (this.getRegion('sche').hasView()) {

                var m = this.getChildView('sche').model;
                m.set($.GetData(this.$(".sche-container")));

                if (!m.isValid()) {
                    Array.from(m.validationError, function (a) {
                        this.$("input[name='" + a + "']").css("border-color", "red");
                    }, this);
                    return null;
                }
                else {
                    m.set("SchedulingTaskType", 1);
                    this.model.set('SchedulingTaskData', m.toJSON());
                }
            }

            if (!this.model.get('Sources').length) {
                this.triggerMethod("show:message",
                    Resources.warning + ': <br/><small>' + Resources.notselected + " " + Resources.source.toLowerCase() + '</small>');
                return this;
            }

            r.$el.addClass("disabled").attr('data-icon', 'icon-loader');

            $.ajax({

                method: "post",
                contentType: 'application/json; charset=utf-8',
                url: "/api/export/gendocsdigest",
                data: JSON.stringify(this.model.toJSON())

            }).always(function (result) {

                r.$el.removeClass("disabled").removeAttr('data-icon');
                this.triggerMethod('show:message', result.status === 500 ? (Resources.warning + ': <br/><small>' + result.statusText + '</small>') : result);

            }.bind(this));

        }
    });
});

define('schetasks', ['i18n!nls/resources.min', 'schedule', 'c/SimpleTableView', 'factdigest', 'docdigest'], function (Resources, ScheduleView, tableView, factDigestView, docDigestView) {

    return Mn.View.extend({

        template: '#case-schedules-template',
        templateContext: {
            Resources: Resources
        },

        regions: {
            list: '.list-tasks',
            schedule: '.item-sche',
            digest: '.item-digest'
        },

        start: function (m) {

            $.get('/api/autoexecscheduling/items/' + m.id + '/execute')
                .done(function () {
                    this.triggerMethod("show:message", Resources.success);
                }.bind(this));
        },

        clear: function (model) {

            this.triggerMethod("show:message:confirm", {
                text: Resources.askyousure + '<br/><small>'+ $.Format(Resources.deltext, Resources.scheTasks, model.get("Title"))+ "</small>",
                fx: function () {
                    model.destroy({ wait: true });
                },
                ctx: this
            });
        },

        enable: function (m) {

            var url = m.collection.url + '/' + m.id + '/activate';
            m.set('State', 1);
            $.ajax({ method: 'PUT', url: url, data: $.param({ State: 1 }) });
        },

        disable: function (m) {

            var url = m.collection.url + '/' + m.id + '/deactivate';
            m.set('State', 0);
            $.ajax({ method: 'PUT', url: url, data: $.param({ State: 0 }) });
        },

        digest: function (model) {

            if (this.curent !== model.id)
                this.getRegion('schedule').empty();

            if (model.get("SchedulingTaskType") === 1)
                this.showChildView('digest', new docDigestView({ model: new Backbone.Model(JSON.parse(model.get('Data'))), collection: this.collection }));
            else
                this.showChildView('digest', new factDigestView({ model: new Backbone.Model(JSON.parse(model.get('Data'))), collection: this.collection }));
        },

        schedule: function (model) {

            if (this.curent !== model.id)
                this.getRegion('digest').empty();

            this.showChildView('schedule', new ScheduleView({ model: model }));
        },

        onChildviewTableRowCmd: function (r) {            
            var $e = $(event.target);
            this[$e.attr('data-cmd')].call(this, r.model);
            this.curent = r.model.id;
        },

        initialize: function () {
            this.collection = new scheduleCollection();
        },

        onRender: function () {

            var head = new Backbone.Collection([
                { id: 0, title: '' },
                { id: 1, title: Resources.title, width: '30%' },
                { id: 2, title: Resources.type },
                { id: 3, title: Resources.send },
                { id: 4, title: Resources.tosend },
                { id: 5, title: Resources.status },
                { id: 7, title: '' }
            ]),
                rowTemplate = '<td><span data-cmd="start" data-icon="icon-next" title="<%= Resources.run %>"></span></td><td><span class="link" data-cmd="digest"><%= Title %></span>&nbsp;&nbsp;<span data-icon="icon-clock" data-cmd="schedule"></span></td><td><%= SchedulingTaskType==1?Resources.typeTask1:Resources.typeTask2 %></td><td><%= LastStartDateTime?new Date(LastStartDateTime).toLocaleString():"" %></td><td><%= NextStartDateTime?new Date(NextStartDateTime).toLocaleString():"" %></td><td><%= State?Resources.state1:Resources.state2 %>&nbsp;<% if(State){ %><span data-icon="icon-status--green" data-cmd="disable" title="<%= Resources.tostate1 %>"></span><% } else { %><span data-icon="icon-status--grey" data-cmd="enable" title="<%= Resources.tostate2 %>"></span><% } %></td><td><span data-cmd="clear" data-icon="icon-trash"></span></td>';

            this.showChildView('list', new tableView({ collection: this.collection, rowTemplate: rowTemplate, head: head }));

            this.collection.fetch({ reset: true });
        }
    });
});

define('c/BasketView', ['i18n!nls/resources.min', 'global.model.dialog', 'global.view.dialog', 'global.grid.dataItemsView'], function (Resources, dialogModel, dialog, tableView) {

    return dialog.extend({

        initialize: function () {

            Backbone.on("basket:add", this.add, this);

            this.collection = new Backbone.Collection();
            this.collection.url = "/api/Cart/";

            this.model = new dialogModel( {
                size: 'full',
                header: {
                    icon: 'icon-case',
                    manage: [{ id: 'close' }]
                },
                autoOpen: false,
                title: Resources.basket,

                toolbar: new Backbone.Collection( [
                    { id: "export", className: "export", title: Resources.export },
                    { id: "import", className: "import", title: Resources.import },
                    { id: "factdigest", className: "fact", title: Resources.wizarddigest + ' : ' + Resources.factDigest },
                    { id: "docdigest", className: "doc", title: Resources.wizarddigest + ' : ' + Resources.docDigest },
                    { id: "schetasks", className: "task", title: Resources.scheTasks },
                    { id: "clear", className: "clear", title: Resources.clearSelected },
                    { id: "erase", className: "erase right", title: Resources.clearBasket }
                ] ),

                content: new tableView( { collection: this.collection, hideButton: true } )
            } );
        },

        onBeforeRender: function () {

            this.collection.fetch( { reset: true } );

        },

        onChildviewAfterLoad: function ( n ) {
            this.model.set( 'title', Resources.basket + ' (' + n + ')' );
            this.triggerMethod( 'update:case', n );
        },

        onChildviewToolbarItemClick: function ( r ) {

            var act = r.model.id,
                table = this.getChildView( 'content' ).getChildView( 'table' );

            if ( _.isFunction( this[act] ) )
                this[act]();

            else if ( !table.modelsSelected && ( act === 'export' || act === 'factdigest' ) )
                this.getChildView( 'notify' ).showNotify( Resources.selectobj );

            else
                require( [act], function ( cmd ) {

                    var dialogView = new dialog( {

                        title: r.model.get( 'title' ),

                        content: new cmd( {
                            collection: table.getChildView( "body" ).collection,
                            selected: table.modelsSelected
                        } ),

                        toolbar: new Backbone.Collection,

                        footer: new Backbone.Collection( [
                            { title: Resources.next, id: 'save', className: 'right next' }
                        ] )

                    } );

                    if ( !this.hasRegion( 'action' ) ) {
                        this.ui.content.append( '<div class="action-container"></div>' );
                        this.addRegion( 'action', '.action-container' );
                    }

                    this.showChildView( 'action', dialogView );

                }.bind( this ) );

        },

        onChildviewFooterButtonClick: function ( r ) {

            var a = this.getChildView( 'action' ).model.get( 'content' );

            var fx = a[r.model.id];
            if ( fx && typeof fx === 'function' )
                fx.call( a, r );


        },

        erase: function () {

            var c = this.getChildView( 'content' ).getChildView( 'table' ).getChildView( 'body' ).collection,
                notify = this.getChildView( 'notify' );

            if ( c.length ) {
                notify.showConfirm(
                    Resources.sure + '<br/><small>' + Resources.clearall + '?</small>',
                    function () {
                        this.getRegion( 'action' ).empty();
                        $.get( '/api/Cart/Clear/0' )
                            .done( function () {
                                this.collection.fetch( { reset: true } );
                            }.bind( this ) );
                    }.bind( this ) );

            } else {
                notify.showNotify( Resources.selectobj );
            }
        },

        clear: function () {

            var c = this.getChildView( 'content' ).getChildView( 'table' ).modelsSelected,
                notify = this.getChildView( 'notify' );

            if ( c && c.length ) {
                notify.showConfirm(
                    Resources.sure + '<br/><small>' + Resources.confirmObjDelete.replace( '{0}', c.length ) + '</small>',
                    function () {
                        this.getRegion( 'action' ).empty();

                        var ids = _.map( c, function ( m ) { return m.id; } );

                        $.ajax( {
                            method: "DELETE", url: "/api/Cart", contentType: "application/json; charset=utf-8",
                            data: JSON.stringify( { IDs: ids } )
                        } ).done( function () {
                            this.collection.fetch( { reset: true } );
                        }.bind( this ) );
                    }.bind( this ) );

            } else {
                notify.showNotify( Resources.selectobj );
            }
        },

        add: function ( listIDs ) {

            var co = this.getChildView( 'content' ).getChildView( 'table' ).getChildView( 'body' ).collection,
                ids = _.filter( listIDs, function ( a ) { return !co.get( a.toString() ); }, this ),
                m = new Backbone.Model( { id: null, IDs: [] } );

            m.url = "/api/Cart";
            if ( ids.length )
                m.save( { IDs: ids }, {
                    success: function () {
                        //Backbone.trigger("message:success", { title: Resources.added, message: Resources.objects + ": " + ids.length });
                        this.collection.fetch( { reset: true } );
                    }.bind( this )
                } );
        }

    });
});