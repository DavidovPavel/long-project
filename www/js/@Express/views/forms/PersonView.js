define([
    'i18n!nls/resources',
    '@/models/forms/PersonModel',
    '@/views/forms/FormView',
    'text!@Express/templates/forms/Person.html',
    'storage'
],
function (Resources, PersonModel, Form, template, Storage) {
        "use strict";
    return Form.extend({
        el: $("#Person"),
        addEvents: {
            "click .checkExternalDB": "checkExtDB",
            "click .checkINN": "checkInn",
            "blur input[name='lname_INTERN']": "blur",
            "blur input[name='fname_INTERN']": "blur",
            "blur input[name='mname_INTERN']": "blur",
            "blur input[name='age_INTERN']": "blurDate",
            "blur input[name='ageFromTo_INTERN']": "blurDate",
            "blur input[name='birthDateFrom_INTERN']": "blurDate",
            "blur input[name='birthDateTo_INTERN']": "blurDate"
        },
        checkExtDB: function (e) {
            Backbone.trigger("message:success", { title: Resources.information, message: Resources.under });
        },
        blurDate:function (e) {
            var $i = $(e.target).closest("div"),
                name = $i.attr("role"),
                flag = false;
            $i.find("input[type='text']").each(function() {
                if ($.trim($(this).val()))
                    flag = true;
            });
            this.chooseDateKind(flag, name);
        },
        chooseDateKind: function (value, name) {
            if (value) {
                this.$(".row-mini").find(".field-group[role!='" + name + "']").each(function () {
                    $(this).closest("div.form-group").addClass("disabled");
                    $(this).find("input[type='text']").attr("disabled", "disabled");
                });
                var v = ["", "a", "b", "c"];
                this.model.set("birthDateUsingKind_INTERN", v.indexOf(name));
            } else {
                this.$(".row-mini").find(".field-group[role!='" + name + "']").each(function () {
                    $(this).closest("div.form-group").removeClass("disabled");
                    $(this).find("input[type='text']").removeAttr("disabled");
                });
                
            }
        },
        blur:function () {
            //var val = this.$("input[name='lname_INTERN']").val();
            //if ($.trim(val))
            this.model.set($.GetData(this.$el));
            var t = $.trim(this.model.get("lname_INTERN") + " " + this.model.get("fname_INTERN") + " " +this.model.get("mname_INTERN"));
            this.model.set("title_INTERN", t);
            if (this.model.isValid())
                this.$("button[name=start]").removeClass("disabled");
        },
        synBeh:function () {
            this.model.set({ "searchSin_INTERN": this.$("input[name='searchSin_INTERN']").get(0).checked });
        },
        getSynonims: function () {
            if (this.model.isValid()) {
                this.markError();
                if (this.model.get("searchSin_INTERN")) {
                    this.SinPanel.fetch();
                }
                if (this.$("input[name='searchSin_INTERN']").get(0).checked)
                    this.SinPanel.show();
                else this.SinPanel.hide();
            } else {
                this.SinPanel.hide();
            }
        },

        checkInn:function() {
            //this.model.set($.GetData(this.$el), { validate: true });
        },
        initialize:function() {
            this.model = new PersonModel();
            this.model.on("invalid", this.markError, this);
            this.model.on("change:title_INTERN", this.getSynonims, this);
            this.model.on("change:searchSin_INTERN", this.getSynonims, this);
            //this.model.on("change:searchByInitials_INTERN", this.getSynonims, this);
        },
        
        render: function () {

            if (Storage.Current) {
                this.model.set(Storage.Current, { silent: true });
                Storage.Current = null;
            }

            var data = this.model.toJSON(),
                ac = this.model.get("selectedCountries");

            data.Resources = Resources;
            this.$el.html(_.template(template)( data));
            this.addSyn().setElement(this.$("#sinManage")).render();
            this.getCountry();
            Array.from(ac, code=> this.viewCountry(code.replace("_","-")));

            require(['RU'], ()=> {
                let d1 = Storage.Current?Storage.Current.birthDateExact_INTERN?new Date(Storage.Current.birthDateExact_INTERN):"":"";
                this.$("input[name='birthDateExact_INTERN']").ejDatePicker({
                    value: d1,
                    locale: Resources.Lang,
                    buttonText: Resources.Today,
                    showPopupButton: false,
                    watermarkText: Resources.formatDate,
                    focusOut: arg=> this.chooseDateKind.call(this, arg.model.value, "a")
                });

                let d2 = Storage.Current ? Storage.Current.pasDate__ru_RU ? new Date(Storage.Current.pasDate__ru_RU) : "" : "";
                this.$("input[name='pasDate__ru_RU']").ejDatePicker({
                    value: d2,
                    locale: Resources.Lang,
                    buttonText: Resources.Today,
                    showPopupButton: false,
                    watermarkText: Resources.formatDate,
                    startLevel: ej.DatePicker.Level.Decade,
                    width:168
                });

                let d3 = Storage.Current ? Storage.Current.pasDate__uk_UA ? new Date(Storage.Current.pasDate__uk_UA) : "" : "";
                this.$("input[name='pasDate__uk_UA']").ejDatePicker({
                    value: d3,
                    locale: Resources.Lang,
                    buttonText: Resources.Today,
                    showPopupButton: false,
                    watermarkText: Resources.formatDate,
                    startLevel: ej.DatePicker.Level.Decade
                });

                let d4 = Storage.Current ? Storage.Current.pasDate__kk_KZ ? new Date(Storage.Current.pasDate__kk_KZ) : "" : "";
                this.$("input[name='pasDate__kk_KZ']").ejDatePicker({
                    value: d4,
                    locale: Resources.Lang,
                    buttonText: Resources.Today,
                    showPopupButton: false,
                    watermarkText: Resources.formatDate,
                    startLevel: ej.DatePicker.Level.Decade
                });

            });
            this.getCollectionSource();
            this.initAttach();
            return this;
        }
    });
});