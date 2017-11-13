define('forms/1002View',
    [
        'i18n!nls/resources.min',
        'forms/FormView',
        'forms/rolesView',
        'forms/sinonimView',
        'c/forms/countriesView',
        'create.check.checkView',
        'create.searchSources.robots',
        'RU'
    ],
    function (Resources, Form, rolesView, sinView, countriesView, checkView, robotsView) {

    var pageA = Mn.View.extend({

        className: 'main-container',

        template: templates['person-page-a'],
        templateContext: {
            Resources: Resources
        },

        ui: {
            any: '.any-info'
        },

        regions: {
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

        onBeforeDestroy: function () {

            this.model.set($.GetData(this.$el));

        },

        onRender: function () {

            this.showChildView('countries', new countriesView({ model: this.model }));

            this.showChildView('synonims', new sinView({ model: this.model }));

            this.showChildView('roles', new rolesView({ model: this.model }));

            this.ui.any.val(_.keys(this.model.get("RelationsDescriptionData").Roles).join(","));

            var d1 = this.model.get("birthDateExact_INTERN") ? new Date(this.model.get("birthDateExact_INTERN")) : "";
            this.$("input[name='birthDateExact_INTERN']").ejDatePicker({
                value: d1,
                height: 36,
                locale: Resources.Lang,
                buttonText: Resources.Today,
                showPopupButton: false,
                watermarkText: Resources.formatDate,
                startLevel: ej.DatePicker.Level.Decade,
                focusOut: function (arg) {
                    //this.chooseDateKind.call(this, arg.model.value, "a");
                }.bind(this)
            });

            var d11 = this.model.get("birthDateFrom_INTERN") ? new Date(this.model.get("birthDateFrom_INTERN")) : "";
            this.$("input[name='birthDateFrom_INTERN']").ejDatePicker({
                value: d11,
                htmlAttributes: { style: 'display:inline-block; height:36px; width:100px' },
                locale: Resources.Lang,
                buttonText: Resources.Today,
                showPopupButton: false,
                watermarkText: Resources.formatDate,
                startLevel: ej.DatePicker.Level.Decade,
                focusOut: function (arg) {
                    //this.chooseDateKind.call(this, arg.model.value, "a");
                }.bind(this)
            });

            var d12 = this.model.get("birthDateTo_INTERN") ? new Date(this.model.get("birthDateTo_INTERN")) : "";
            this.$("input[name='birthDateTo_INTERN']").ejDatePicker({
                value: d12,
                htmlAttributes: { style: 'display:inline-block; height:36px; width:100px' },
                locale: Resources.Lang,
                buttonText: Resources.Today,
                showPopupButton: false,
                watermarkText: Resources.formatDate,
                startLevel: ej.DatePicker.Level.Decade,
                focusOut: function (arg) {
                    //this.chooseDateKind.call(this, arg.model.value, "a");
                }.bind(this)
            });

            var d2 = this.model.get("pasDate__ru_RU") ? new Date(this.model.get("pasDate__ru_RU")) : "";
            this.$("input[name='pasDate__ru_RU']").ejDatePicker({
                value: d2,
                height: 36,
                locale: Resources.Lang,
                buttonText: Resources.Today,
                showPopupButton: false,
                watermarkText: Resources.formatDate,
                startLevel: ej.DatePicker.Level.Decade,
                width: 168
            });

            var d3 = this.model.get("pasDate__uk_UA") ? new Date(this.model.get("pasDate__uk_UA")) : "";
            this.$("input[name='pasDate__uk_UA']").ejDatePicker({
                value: d3,
                height: 36,
                locale: Resources.Lang,
                buttonText: Resources.Today,
                showPopupButton: false,
                watermarkText: Resources.formatDate,
                startLevel: ej.DatePicker.Level.Decade
            });

            var d4 = this.model.get("pasDate__kk_KZ") ? new Date(this.model.get("pasDate__kk_KZ")) : "";
            this.$("input[name='pasDate__kk_KZ']").ejDatePicker({
                value: d4,
                height: 36,
                locale: Resources.Lang,
                buttonText: Resources.Today,
                showPopupButton: false,
                watermarkText: Resources.formatDate,
                startLevel: ej.DatePicker.Level.Decade
            });

        },

        modelEvents: {

            'change:lname_INTERN': '_setTitle',

            'change:fname_INTERN': '_setTitle',

            'change:mname_INTERN': '_setTitle',

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

        _setTitle: function () {

            this.model.set("title_INTERN", $.trim(this.model.get("lname_INTERN") + " " + this.model.get("fname_INTERN") + " " + this.model.get("mname_INTERN")));

        }

        //_chooseDateKind: function (value, name) {

        //    if (value) {

        //        this.$(".row-mini").find(".field-group[role!='" + name + "']").each(function () {

        //            $(this).closest("div.form-group").addClass("disabled");
        //            $(this).find("input[type='text']").attr("disabled", "disabled");

        //        });

        //        var v = ["", "a", "b", "c"];
        //        this.model.set("birthDateUsingKind_INTERN", v.indexOf(name));

        //    } else {

        //        this.$(".row-mini").find(".field-group[role!='" + name + "']").each(function () {

        //            $(this).closest("div.form-group").removeClass("disabled");
        //            $(this).find("input[type='text']").removeAttr("disabled");

        //        });

        //    }
        //}
    });

    var pageC = Mn.View.extend({

        className: 'main-container',

        template: templates['robots-page-d'],
        templateContext: {
            Resources: Resources
        },

        regions: {
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

    return Form.extend({

        initialize: function () {

            this.master = new Backbone.Model({
                step: 0,
                pages: [pageA, checkView, pageC]
            });

            this.master.on("change", this._getPage, this);
        }

    });
});