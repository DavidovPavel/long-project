define([
//'@/models/details/PropModel',
'@/views/details/semnet/WindowView'
],
function (PropertyModel,        WinPergola) {

        var semNet = Backbone.View.extend({
            el: $("#SemNet"),
            fitWin: function () {
                if (this.isInitWinPergola) {
                    this.$("#svg-cd128757-b0fa-4fdd-a005-05f74ac632c8").height(this.$el.height() - 10);
                    this.WinPergola.resize();
                }
            },
            initialize: function() {
                //Backbone.on("window:resizeend", this.fitWin, this);
            },
            getProps: function () {
                var data = { };
                if (this.model) {
                    var u = $.type(this.model.url) === "function" ? this.model.url() : this.model.url,
                        ou = u.split("?"),
                        param = "";

                    if (ou.length == 2) {
                        param = ou[1];
                        var a = param.split("&");
                        for (var i = 0; i < a.length; i++) {
                            var el = a[i].split("=");
                            data[el[0].replace("[]", "")] = el[1];
                        }
                        data.param = param;
                    }
                }
                return data;
            },
            render: function(itemId) {
                if (itemId) {
                    var data = this.getProps(), s = this;
                    data.id = itemId;
                    this.model = new PropertyModel(data);
                    this.model.url = function () { return ("/api/SemNet/UserSNMeta/" + itemId + (data.param ? ("?" + data.param) : "")); }
                    //this.model.on("sync", this.startPergola, this);
                    
                    this.model.fetch({ success: function (model) { s.startPergola(model);}});
                } 
                return this;
            },
            startPergola: function (model) {
                if (this.isInitWinPergola) {
                    this.WinPergola.model = model;
                    this.WinPergola.getWindow();
                } else {

                    var _h = this.$el.height() < $(document).height() / 2 ? $(document).height() - 80 : this.$el.height(),
                        $c = this.$("#svg-cd128757-b0fa-4fdd-a005-05f74ac632c8"),
                        container = $c.get(0);

                    $c.height(_h - 8);
                    this.WinPergola = new WinPergola({ model: model, container: container });
                    this.isInitWinPergola = true;
                }
            }
        });
        var sn = new semNet;
        return {
            get: function() {
                return sn;
            }
        }
    });