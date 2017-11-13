define('forms/1003Model',
    ['access', 'i18n!nls/resources.min'], function (acc, Resources) {

    return Backbone.Model.extend({
        url: function() {
            return "/api/object/";
        },
        defaults: function() {
            return {
                id: null,
                AutoExtractionIsActive:false,
                typeid: acc.data.Meta.SaTypes['Organization'],
                typeSystemName: 'Organization',
                RelationsDescriptionData: { Kind: 0, Roles: {} },
                Rubrics: [],
                ProjectRole_ID: 4,
                selectedCountries: [],
                searchSin_INTERN: true,
                synonyms_INTERN:[],
                title_INTERN: "",
                Robots: [],
                AttacheedFiles: {},
                inn__ru_RU: "",
                ogrn__ru_RU: "",
                okpo__ru_RU: "",

                address_INTERN: '',
                address__ru_RU: '',
                
                edrpou__uk_UA:"",

                inn__kk_KZ: "",
                rnn__kk_KZ: "",
                bin__kk_KZ: "",
                
                unp__bl_BL: "",
                
                inn__vi_VN: "",
                ogrn__vi_VN: "",

                RegistrationNumber__zh_CN: '',
                TaxID__zh_TW: '',
                RegistrationNumber__zh_TW: '',
                RegistrationNumber__zh_HK: ''
            }
        },
        validate: function (attr, o) {
            var output = [],
                dp = '^[\\d]+$';
            
            if (!$.trim(attr.ProjectRole_ID))
                output.push({ name: "ProjectRole_ID" });

            if (!attr.selectedCountries)
                output.push({ name: "selectedCountries" });
            else if (_.isString(attr.selectedCountries))
                this.set("selectedCountries", _.flatten([attr.selectedCountries]));
            else if (!attr.selectedCountries.length)
                output.push({ name: "selectedCountries" });
                
            
            if (!$.trim(attr.title_INTERN))
                output.push({ name: "title_INTERN" });
            
            if (!this.test(attr.inn__ru_RU, dp))
                output.push({ name: "inn__ru_RU" });
            
            if (!this.test(attr.ogrn__ru_RU, dp))
                output.push({ name: "ogrn__ru_RU" });
            else if (attr.ogrn__ru_RU) {
                var v = attr.ogrn__ru_RU;
                var exp = v.length === 13 && (v.slice(12, 13)=== ((v.slice(0, -1)) % 11 + '').slice(-1));
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
            return s === "" || new RegExp(p).test(s);
        }
    });
});