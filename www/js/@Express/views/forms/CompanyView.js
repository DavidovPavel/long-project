define([
    'i18n!nls/resources.min',
    '@/models/forms/CompanyModel',
    '@/views/forms/FormView',
    'text!@/templates/forms/Company.html',
    'storage'
],
function (Resources, CompanyModel, Form, template, Storage) {
    "use strict";
    return Form.extend({
        el: $("#Company"),
        addEvents: {
            "click .checkUGRL": "checkEgrul",
            "blur input[name='title_INTERN']": "blur"
            //"mouseenter .egrul":"show"
        },
        show: function () {
            this.$(".dropdown-menu").show();
        },
        blur: function () {
            this.markError();
            this.model.set($.GetData(this.$el));
        },
        checkEgrul: function () {
            require(['signalR'], () => require(['/signalr/hubs'], () => require(['/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'],
                () => {
                    let wnd = SJ.iwc.WindowMonitor.getThisWindowId();
                    this.model.url = `/api/interestObjects/10022/addInfo/0?wnd=${wnd}`;
                    this.model.set("id", null);
                    this.model.set($.GetData(this.$el));
                    if (this.model.isValid()) {
                        if (this.model.id === 0)
                            this.model.set("id", null);
                        this.model.save();
                        console.log("Отправлен запрос на проверку ЕГРЮЛ", { model: this.model.toJSON() });
                        Backbone.trigger("message:modal", { title: Resources.wait2, message: Resources.send2, cancelBtn: true });
                        this.$(".egrul").removeClass("open");
                    }
                })));

            
        },
        synBeh: function (inp) {
            this.model.set({ "searchSin_INTERN": this.$("input[name='searchSin_INTERN']").get(0).checked }, { validate: true });
        },
        getSynonims: function () {
            if (this.model.isValid()) {
                this.markError();
                this.SinPanel.fetch();
                if (this.$("input[name='searchSin_INTERN']").get(0).checked)
                    this.SinPanel.show();
                else this.SinPanel.hide();
            } else {
                this.SinPanel.hide();
            }
        },
        fill: function (data) {
            Backbone.trigger("message:hide");
            data = JSON.parse(data);
            this.$("input[name='title_INTERN']").val(data.item.Name.replace("\\", ""));
            this.$("input[name='inn__ru_RU']").val(data.item.Inn);
            this.$("input[name='ogrn__ru_RU']").val(data.item.Ogrn);
            //this.$("input[name='okpo__ru_RU']").val();
        },
        initialize: function () {
            // data check egurl
            Backbone.on("transferdata:kind", this.fill, this);

            // ?
            Backbone.on("showalert:newmessage", function () {
                Backbone.trigger("message:hide");
            }, this);

            Backbone.on("alerts:send-egrul", function () {
                Backbone.trigger("message:modal", { title: Resources.wait2, message: Resources.send3, cancelBtn: true });
            }, this);

            this.model = new CompanyModel();
            this.model.on("invalid", this.markError, this);
            this.model.on("change:title_INTERN", this.getSynonims, this);
            this.model.on("change:searchSin_INTERN", this.getSynonims, this);
        },
        render: function () {
            if (Storage.Current) {
                this.model.set(Storage.Current, { silent: true });
                Storage.Current = null;
            }

            var data = this.model.toJSON();
            data.title_INTERN = this.model.escape("title_INTERN");
            data.Resources = Resources;
            this.$el.html(_.template(template)(data));

            this.addSyn().setElement(this.$("#sinManage")).render();

            this.getCountry();
            var ac = this.model.get("selectedCountries");
            Array.from(ac, code=> this.viewCountry(code.replace("_", "-")));


            this.getCollectionSource();
            this.initAttach();
            return this;
        }
    });
});