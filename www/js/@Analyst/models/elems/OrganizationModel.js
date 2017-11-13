define(function(require) {
  
    return Backbone.Model.extend({
        url: function() {
            return "/api/object/";
        },
        defaults: function() {
            return {
                id: null,
                typeid: 10022,
                title: "",
                inn: "",
                ogrn: "",
                okpo: ""
            }
        },
        validate: function(attr, o) {
            var output = [], dp = '^[\\d]+$';
            if (!$.trim(attr.title))
                output.push({ name: "title" });
            if (!this.test(attr.inn, dp))
                output.push({ name: "inn" });
            if (!this.test(attr.ogrn, dp))
                output.push({ name: "ogrn" });
            //else if (attr.ogrn) {
                //var v = attr.ogrn;
                //var exp = v.length == 13 && (v.slice(12, 13) == ((v.slice(0, -1)) % 11 + '').slice(-1));
                //if (!exp) {
                //    output.push({ text: "Введенный ОГРН не корректен", name: "ogrn" });
                //}
            //}
            if (!this.test(attr.okpo, dp))
                output.push({ name: "okpo" });
            
            if (output.length)
                return output;
        },
        test: function(s, p) {
            return s == "" || new RegExp(p).test(s);
        }
    });
});