define(function(require) {

    var Add = require('@/views/add/AddView'),
        Resources = require('i18n!nls/resources.min');

    return Add.extend({
        el: $("#NextPage .Person"),
        addEvents:  {
            "click .search": "search",
            "click .checkInn": "checkInn"
        },
        checkInn:function() {
            this.model.set($.GetData(this.$el), { validate: true });
        },
        search: function () {
            this.model.set($.GetData(this.$el));
            if (this.model.isValid()) {
                var str = { "typeid": this.model.get("typeid"), "text": (this.model.get("lname") + " " + this.model.get("fname") + " " + this.model.get("mname")) };
                var templ = require('text!@/templates/search/listPersonTemplate.html');
                this.getlist({ $el: this.$("#SearchResult"), param: $.param(str), templ:templ });
            }
        },
        render: function() {
            var template = require("text!@/templates/add/person.html"),
                data = this.model.toJSON();
            data.Resources = Resources;
            this.$el.html(_.template(template)( data));
            //Resources.setlocal();
            //this.$(".datepicker").datepicker({
            //    changeYear: true,
            //    yearRange: 'c-80:c+0',
            //    changeMonth: true,
            //    onSelect: function () {
            //    }
            //});

            require(['RU'], () => {
                this.$("input[name='bdate']").ejDatePicker({
                    locale: Resources.Lang,
                    buttonText: Resources.Today,
                    showPopupButton: false,
                    watermarkText: Resources.formatDate,
                    //focusOut: arg=> this.chooseDateKind.call(this, arg.model.value, "a")
                }); 

                this.$("input[name='pasDate']").ejDatePicker({
                    locale: Resources.Lang,
                    buttonText: Resources.Today,
                    showPopupButton: false,
                    watermarkText: Resources.formatDate,
                    //focusOut: arg=> this.chooseDateKind.call(this, arg.model.value, "a")
                });
            });

            return this;
        }
    });
});