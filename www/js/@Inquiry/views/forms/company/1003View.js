define('forms/1003View',
    [
        'i18n!nls/resources.min',
        'forms/FormView',
        'forms/rolesView',
        'forms/sinonimView',
        'c/forms/countriesView',
        'create.check.checkView',
        'create.searchSources.robots'
    ],
    function (Resources, Form, rolesView, sinView, countriesView, checkView, robotsView) {

    var pageA = Mn.View.extend({

        className: 'main-container',

        template: templates['company-page-a'],
        templateContext: {
            Resources: Resources
        },

        ui:{
            any: '.any-info'
        },

        regions:{
            countries: { el: '#select-countries', replaceElement: true },
            synonims: { el: '#synonimus-panel', replaceElement: true },
            roles: { el: '#projectRoleID', replaceElement: true }
        },

        events: {

            'input @ui.any': function (e) {

                let a = this.ui.any.val().split(","),
                    b = {};

                Array.from(a, function (c) { b[$.trim(c)] = 0; });
                this.model.set("RelationsDescriptionData", { Kind: 0, Roles: b });

            }

        },

        onRender: function () {

            this.showChildView('countries', new countriesView({ model: this.model }));

            this.showChildView('synonims', new sinView({ model: this.model }));

            this.showChildView('roles', new rolesView({ model: this.model }));

            this.ui.any.val(_.keys(this.model.get("RelationsDescriptionData").Roles).join(","));

        },

        onBeforeDestroy: function () {

            this.model.set($.GetData(this.$el));

        },

        modelEvents: {

            'change:ProjectRole_ID': function changeProjectRole_ID(m, role) {

                if (role)
                    m.isValid();
                else
                    this.model.trigger('invalid', this.model, [{ name: 'ProjectRole_ID' }]);

            },

            'change:selectedCountries': function changeSelectedCountries(m, c) {

                if (c) {

                    if (_.isString(c)) m.set('selectedCountries', [c]);

                    if (c.length)
                        m.isValid();
                    else
                        this.model.trigger('invalid', this.model, [{ name: 'selectedCountries' }]);

                } else
                    this.model.trigger('invalid', this.model, [{ name: 'selectedCountries' }]);
            }            

        },

    });

    var pageB = Mn.View.extend({

        className: 'main-container',

        template: templates['company-page-b'],
        templateContext: {
            Resources: Resources
        },

        ui: {
            loader: '#egrul-process-loader'
        },

        regions: {
            egrulResult: { el: '#egrul-result', replaceElement: true },
        },

        events: {

            "click #check-UGRL": function () {

                var wnd = SJ.iwc.WindowMonitor.getThisWindowId();

                this.model.url = "/api/interestObjects/10022/addInfo/0?wnd=" + wnd;

                this.model.set($.GetData(this.$el));

                if (this.model.isValid()) {

                    this.ui.loader.show();

                    this.model.save({}, {

                        success: function (m, o) {

                            //window.sessionStorage["TaskUID"] = o.taskUID;

                            var app = Backbone.Radio.channel('oM').request('get:app');
                            app.Tasks.push(o.taskUID);

                        },

                        error: function () {
                            this.ui.loader.hide();
                        }.bind(this)

                    });

                }

            },

            'click .accept': function () {

                this.getChildView('egrulResult').collection.each(function (m) {

                    this.$("input[name='" + m.get('title') + "']").val(m.get('value'));

                    if (this.model.has(m.get('title')))
                        this.model.set(m.get('title'), m.get('value'));

                }, this);

            }

        },

        initialize: function () {

            // data check egurl
            Backbone.Radio.channel('Ale').reply('get:transfer:data', function (o) {

                var data = o.data;               

                if (o.kind === -1) {
                    // message invalid about
                    this.showChildView('egrulResult', new dataTable({ collection: new Backbone.Collection([{ id: -1, value: data }]) }));

                } else {

                    var raw = JSON.parse(data),
                        m = raw.item,
                        map = raw.map,
                        aliases = raw.aliases;

                    var output = _.map(_.keys(map), function (k) {
                        return {
                            id: aliases[k],
                            title: map[k],
                            value: m[k]
                        };
                    });

                    this.showChildView('egrulResult', new dataTable({ collection: new Backbone.Collection(output) }));

                    this.$('.accept').show();
                    this.$('#egrul-check').addClass('current').children('.row').slideDown(200);
                }

                this.ui.loader.hide();

            }, this);

        },

        onRender: function () {

            let co = this.model.get('selectedCountries')[0];

            this.$("#check-UGRL").prop('disabled', ['ru-RU', 'kk-KZ'].indexOf(co) === -1);

            //this.$('.data-company').show().html(this.$(`#${co}`).html());

        }

    });

    var pageD = Mn.View.extend({

        className: 'main-container',

        template: templates['robots-page-d'],
        templateContext: {
            Resources: Resources
        },

        regions:{
            robots: { el: '#robots', replaceElement: true },
        },

        initialize: function () {

            this.collection = new Backbone.Collection();
            this.collection.model = Backbone.Model.extend({ idAttribute: "SearchPackUID" });
            this.collection.url = "/api/sources/searchpacks/" + this.options.DicID;

        },

        onRender: function () {            

            this.showChildView('robots', new robotsView({ collection: this.collection, model: this.model, DicID: this.options.DicID }));

        },

        childViewTriggers: {
            'collections:robors:selected': 'collections:robors:selected'
        }

    });

    var dataTable = Mn.CollectionView.extend({

        tagName: 'table',

        childView: Mn.View.extend({
            tagName: 'tr',
            template: _.template('<td><%- id %></td><td><%- value %></td>')
        })

    });

    return Form.extend({
      
        initialize: function (o) {

            this.master = new Backbone.Model({
                step: 0,
                pages: [pageA, pageB, checkView, pageD]
            });

            this.master.on("change", this._getPage, this);

        }

    });
});