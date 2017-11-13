define(['i18n!nls/resources.min'], function (Resources) {
    'use strict';
    return Backbone.Model.extend({
        url: function() {
            return "/api/object/";
        },
        defaults: function() {
            return {
                id: null,
                typeid: 10022,
                selectedCountries: [],
                searchSin_INTERN: false,
                synonyms_INTERN:[],
                title_INTERN: "",
                Robots: [],
                AttacheedFiles: {},
                inn__ru_RU: "",
                ogrn__ru_RU: "",
                okpo__ru_RU: "",
                
                edrpou__uk_UA:"",

                inn__kk_KZ: "",
                rnn__kk_KZ: "",
                bin__kk_KZ: "",
                
                unp__bl_BL: "",
                
                inn__vi_VN: "",
                ogrn__vi_VN:""
            }
        },
        validate: function (attr, o) {
            var output = [],
                dp = '^[\\d]+$';
            
            this.set("selectedCountries", _.flatten([attr.selectedCountries]));
            
            if (!attr.selectedCountries)
                output.push({ name: "selectedCountries" });
            
            if (!$.trim(attr.title_INTERN))
                output.push({ name: "title_INTERN" });
            
            if (!this.test(attr.inn__ru_RU, dp))
                output.push({ name: "inn__ru_RU" });
            
            if (!this.test(attr.ogrn__ru_RU, dp))
                output.push({ name: "ogrn__ru_RU" });
            else if (attr.ogrn__ru_RU) {
                var v = attr.ogrn__ru_RU;
                var exp = v.length == 13 && (v.slice(12, 13) == ((v.slice(0, -1)) % 11 + '').slice(-1));
                if (!exp) {
                    output.push({ text: Resources.errorOgrn, name: "ogrn__ru_RU" });
                }
            }

            if (!this.test(attr.okpo__ru_RU, dp))
                output.push({ name: "okpo__ru_RU" });

            if (output.length)
                return output;
        },
        test: function(s, p) {
            return s == "" || new RegExp(p).test(s);
        }
    });
});