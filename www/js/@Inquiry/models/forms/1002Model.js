define('forms/1002Model', ['access', 'i18n!nls/resources.min'], function (acc, Resources) {

    return Backbone.Model.extend({
        url: function() {
            return "/api/object/";
        },
        defaults: function() {
            return {
                id: null,
                AutoExtractionIsActive:false,
                typeid: acc.data.Meta.SaTypes['Person'],
                typeSystemName: 'Person',
                RelationsDescriptionData: { Kind: 0, Roles: {} },
                Rubrics: [],
                ProjectRole_ID: 4,
                universalname_INTERN:"",
                selectedCountries:[],
                lname_INTERN: "",
                fname_INTERN: "",
                mname_INTERN: "",
                pname_INTERN: "",
                title_INTERN: "",
                searchSin_INTERN: true,
                searchByInitials_INTERN: true,

                birthDateUsingKind_INTERN: 0,

                birthDateExact_INTERN: "",

                birthDateFrom_INTERN: "",
                birthDateTo_INTERN: "",

                age_INTERN: null,
                ageFromTo_INTERN: null,

                synonyms_INTERN: [],
                Robots: [],
                AttacheedFiles: {},

                pasSerial__ru_RU: "",
                pasNumber__ru_RU: "",
                pasDate__ru_RU: "",
                inn__ru_RU: "",
                ogrnip__ru_RU: "",
                
                inn__uk_UA: "",
                pasSerial__uk_UA: "",
                pasNumber__uk_UA:"",
                pasDate__uk_UA: "",
                
                pasSerial__kk_KZ: "",
                pasNumber__kk_KZ: "",
                pasDate__kk_KZ: "",
                inn__kk_KZ: "",
                
                inn__vi_VN: "",
                
                IdentityCard__ms_MY: "",
                Police__ms_MY: "",
                Army__ms_MY: "",
                PassportNo__ms_MY: "",

                TaxNumber__zh_CN: '',
                TaxNumber__zh_HK: '',
                TaxNumber__zh_TW: ''
                
            };
        },
        validate: function(attr, o) {
            var output = [], dp = '^[\\d]+$';

            if (!$.trim(attr.lname_INTERN))
                output.push({ name: "lname_INTERN" });
           
            this.set( "birthDateExact_INTERN", $.ToISO( attr.birthDateExact_INTERN ) );
            this.set( "birthDateFrom_INTERN", $.ToISO( attr.birthDateFrom_INTERN ) );
            this.set( "birthDateTo_INTERN", $.ToISO( attr.birthDateTo_INTERN ) );
            this.set("pasDate__ru_RU", $.ToISO(attr.pasDate__ru_RU));
            this.set("pasDate__uk_UA", $.ToISO(attr.pasDate__uk_UA));
            this.set("pasDate__kk_KZ", $.ToISO(attr.pasDate__kk_KZ));

            if (!$.trim(attr.ProjectRole_ID))
                output.push({ name: "ProjectRole_ID" });

            if (!attr.selectedCountries)
                output.push({ name: "selectedCountries" });
            else
                this.set("selectedCountries", _.flatten([attr.selectedCountries]));
            
            if (attr.ageFromTo_INTERN && !attr.age_INTERN)
                output.push({ name: "age_INTERN" });           

            if ( !this.test( attr.age_INTERN, dp ))
                this.set("age_INTERN", '');

            if ( !this.test( attr.ageFromTo_INTERN, dp ) )
                this.set( "ageFromTo_INTERN", '' );

            //if(attr.ageFrom) {
            //    var d = new Date();
            //    d.setFullYear(d.getFullYear() - parseInt(attr.ageFrom));
            //    var day = d.getDate();
            //    var month = d.getMonth() + 1;
            //    var year = d.getFullYear();
            //    var o = year + "-" + month + "-" + day;
            //    this.set("bdate1", o);
            //}
            //if(attr.ageTo) {
            //    var d = new Date();
            //    d.setFullYear(d.getFullYear() - parseInt(attr.ageTo));
            //    var day = d.getDate();
            //    var month = d.getMonth() + 1;
            //    var year = d.getFullYear();
            //    var o = year + "-" + month + "-" + day;
            //    this.set("bdate2", o);
            //}

            if (!this.test(attr.pasSerial__ru_RU, dp))
                output.push({ name: "pasSerial__ru_RU" });
            
            if (!this.test(attr.pasNumber__ru_RU, dp))
                output.push({ name: "pasNumber__ru_RU" });
            
            if (attr.pasSerial__ru_RU && attr.pasNumber__ru_RU)
                this.set("pass", (attr.pasSerial__ru_RU + " " + attr.pasNumber__ru_RU));
            
            if (!this.test(attr.inn__ru_RU, dp))
                output.push({ name: "inn__ru_RU" });
            else {
                if (attr.inn__ru_RU.length === 10) {
                    var aval = attr.inn__ru_RU.split("");
                    var am = [2, 4, 10, 3, 5, 9, 4, 6, 8];
                    var pr = 0;
                    for (var i = 0; i < am.length; i++) {
                        pr += am[i] * aval[i];
                    }
                    var del = parseInt(pr / 11) * 11;
                    var r = pr - del;
                    if (r === 10) r = 0;
                    if (r !== aval[9]) {
                        output.push({ text: Resources.errorInn, name: "inn__ru_RU" });
                    }
                }
            }
            
            if (!this.test(attr.ogrnip__ru_RU, dp))
                output.push({ name: "ogrnip__ru_RU" });
            else if ($.trim(attr.ogrnip__ru_RU)) {
                var s = parseInt(attr.ogrnip__ru_RU.substr(0, 1));
                if (s === 3 || s === 4) {
                } else {
                    output.push({ text: Resources.errorIgrul, name: "ogrnip__ru_RU" });
                }
            }

            var t = $.trim(attr.lname_INTERN + " " + attr.fname_INTERN + " " + attr.mname_INTERN);
            if (t)
                this.set("title_INTERN", t );

            if (output.length)
                return output;
        },
        test: function (s, p) {
            return s === "" || new RegExp(p).test(s);
        }
    });
});