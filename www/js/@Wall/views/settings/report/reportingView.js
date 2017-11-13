define('settings.reportingView', ['i18n!nls/resources.min', 'g/tree'],

function (Resources, treeView) {
    
    var modelReport = Backbone.Model.extend({
        idAttribute: "UID",
        defaults: {
            UID: null,
            ReportSysName: "",
            TypeSysName: ""
        }
    });

    var listReports = Mn.CollectionView.extend({
        className: 'list-report',
        tagName: 'section',

        childView: Mn.View.extend( {

            className: 'item',
            template: '#item-report-template',

            templateContext: {
                Resources: Resources
            },

            triggers: {
                "click .font-icon-delete": 'report:clear'
            }
        }),

        childViewTriggers: {
            'report:clear': 'report:clear'
        }

    });

    var optionView = Mn.View.extend( {

        tagName: 'option',
        template: _.template( '<%- title %>' ),

        onRender: function () {
            this.$el.attr('value', this.model.id);
        }

    });

    var selectView = Mn.CollectionView.extend( {

        tagName: 'select',

        childView: optionView,

        onRender: function () {

            this.addChildView(new optionView({ model: new Backbone.Model({ id: '0', title: '...' }) }), 0);
            this.$el.val('0');

        },

        triggers: {
            'change': 'change:publish'
        }
    });

    return Mn.View.extend( {

        className: 'type-reporting anbr-tabs',
        template: '#type-reporting-settings',
        templateContext: {
            Resources:Resources
        },

        events: {
            "click nav>span": function (e) {
                this.activeTab($(e.target).closest("span[data-name]").attr("data-name"));
            }
        },

        onChildviewChangePublish: function (v) {

            var wid = v.$el.val();

            if (wid !== '0') {

                if (v.options.name === 'publishers') {

                    this.getChildView('rep').collection.reset();

                    var w = v.collection.get(wid);

                    if (w.has("requestParameters")) {

                        var queryid = w.get("requestParameters").rid;

                        this.$(".load-tree").show();

                        var col = new Backbone.Collection();
                        col.url = '/api/Tree/ByWidgetQ/' + queryid;

                        this.showChildView('tree', new treeView({ collection: col, node: { checkbox: false } }));
                        col.fetch({ reset: true });

                        this.listenTo(this.getChildView('tree'), 'container:select:item', function (v) {

                            this.model.set('TypeSysName', v.model.get("sysName"));

                            $.get('/api/Reporting/ByWidgetQ/' + queryid + '/' + v.model.id)
                                .done(function (a) {

                                    this.getChildView('rep')
                                        .collection
                                        .reset(_.map(a, function (b) { return { id: b.ReportSysName, title: b.ReportDescription } }));

                                }.bind(this));


                        });

                    } else
                        this.getRegion('tree').empty();

                } else if (v.options.name === 'reports')
                    this.model.set('ReportSysName', wid);

            } else
                this.getRegion('tree').empty();
        },

        childViewEvents: {

            

        },

        onChildviewReportClear: function ( v ) {

            this.triggerMethod('show:message:confirm', {
                text: Resources.sure,
                fx: function () {
                    v.model.destroy();
                },
                ctx: this
            });
        },

        activeTab: function (name) {

            this.$("nav>span").removeClass("active");
            this.$("nav>span[data-name='" + name + "']").addClass("active");
            this.$("section").hide();
            this.$("." + name).show();

        },

        regions:{
            list: { el: '.list-report', replaceElement: true },
            publ: { el: '.list-publishers', replaceElement: true },
            rep: { el: '.type-rep', replaceElement: true },
            tree: {el: '.load-tree', replaceElement:true }
        },

        onRender: function () {

            this.showChildView('publ', new selectView({ collection: new Backbone.Collection(), name: 'publishers' }));
            this.showChildView('rep', new selectView({ collection: new Backbone.Collection(), name: 'reports' }));

            var listCollection = new Backbone.Collection();
            listCollection.model = modelReport;
            listCollection.url = '/api/widget/' + this.options.wid + '/reportitems';

            this.model = new modelReport;
            this.model.collection = listCollection;

            this.showChildView('list', new listReports({ collection: listCollection }));

            this.activeTab("list-report");

        },

        onBeforeShow: function () {

            if (!this.options.publishers.length) {

                this.options.publishers.fetch({
                    reset: true,
                    success: function (collection) {

                        if (collection.length) {
                            this.$('.notice').empty();
                            this.getChildView('publ').collection.reset(this.options.publishers.models);
                            this.getChildView('list').collection.fetch({ reset: true });
                        } else
                            this.$('.notice').html(Resources.subscrNote);

                    }.bind(this)
                });

            }
            else {

                this.$('.notice').empty();
                this.getChildView('publ').collection.reset(this.options.publishers.models);
                this.getChildView('list').collection.fetch({ reset: true });

            }
        },

        onSave: function () {

            this.model.save({}, {

                success: function (model) {
                    this.getChildView('list').collection.add(model);
                }.bind(this)

            });
        }

    });
});