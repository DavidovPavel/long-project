define(function (require) {

    return Backbone.Model.extend({
        url: function() {
            return "/api/object/";
        },
        defaults: function() {
            return {
                id: null,
                typeid: 10021,
                title: "",
                lname: "",
                fname: "",
                mname: "",
                pname: "",
                searchSin: false,
                bdate: "",
                bdate1: "",
                bdate2: "",
                ageFrom: 0,
                ageTo: 0,
                pass: "",
                pasSerial: "",
                pasNumber: "",
                pasDate: "",
                inn: "",
                ogrnip: ""
            };
        },
        validate: function(attr) {
            var output = [], dp = '^[\\d]+$';
            if(!$.trim(attr.lname))
                output.push({ name: "lname" });
            else {
                this.set("title", $.trim(attr.lname + " " + attr.fname + " " + attr.mname));
            }
            
            if (!this.test(attr.ageFrom, dp) || !this.test(attr.ageTo, dp)) {
                output.push({ name: "ageFrom" });
                output.push({ name: "ageTo" });
            } else if ($.trim(attr.ageFrom) && $.trim(attr.ageTo) && parseInt(attr.ageFrom) > parseInt(attr.ageTo)) {
                output.push({ name: "ageFrom" });
                output.push({ name: "ageTo" });
            }

            if(attr.ageFrom) {
                var d = new Date();
                d.setFullYear(d.getFullYear() - parseInt(attr.ageFrom));
                var day = d.getDate();
                var month = d.getMonth() + 1;
                var year = d.getFullYear();
                var o = year + "-" + month + "-" + day;
                this.set("bdate1", o);
            }
            if(attr.ageTo) {
                var d = new Date();
                d.setFullYear(d.getFullYear() - parseInt(attr.ageTo));
                var day = d.getDate();
                var month = d.getMonth() + 1;
                var year = d.getFullYear();
                var o = year + "-" + month + "-" + day;
                this.set("bdate2", o);
            }

            if (!this.test(attr.pasSerial, dp))
                output.push({ name: "pasSerial" });
            
            if (!this.test(attr.pasNumber, dp))
                output.push({ name: "pasNumber" });
            
            if (attr.pasSerial && attr.pasNumber)
                this.set("pass", (attr.pasSerial + " " + pasNumber));
            
            if (!this.test(attr.inn, dp))
                output.push({ name: "inn" });
            else {
                if (attr.inn.length === 10) {
                    var aval = attr.inn.split("");
                    var am = [2, 4, 10, 3, 5, 9, 4, 6, 8];
                    var pr = 0;
                    for (var i = 0; i < am.length; i++) {
                        pr += am[i] * aval[i];
                    }
                    var del = parseInt(pr / 11) * 11;
                    var r = pr - del;
                    if (r === 10) r = 0;
                    if (r != aval[9]) {
                        output.push({ text: "Введенный ИНН не корректен", name: "inn" });
                    }
                }
            }
            
            if (!this.test(attr.ogrnip, dp))
                output.push({ name: "ogrnip" });
            else if ($.trim(attr.ogrnip)) {
                var s = parseInt(attr.ogrnip.substr(0, 1));
                if (s === 3 || s === 4) {
                } else {
                    output.push({ text: "Введенный ОГРНИП не корректен", name: "ogrnip" });
                }
            }

            if (output.length)
                return output;
        },
        test: function (s, p) {
            return s == "" || new RegExp(p).test(s);
        }
    });
});