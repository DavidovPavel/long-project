define(['jqueryui'],function() {


    var m = Backbone.Model.extend({
        idAttribute: "ID",
        defaults: {
            ID: null,
            Title: "",
            Url: "",
            Description: "",
            XY: [],
            WH: [],
            Cubs: [],
            Theme: { BackgroundImageUrl: null, BackgroundColor: null, FontColor: null, BorderColor: null }
        },
        url: function () {
            return "/api/edge";
        },
        validate: function (attr) {
            var output = [];
            if (!$.trim(attr.Title))
                output.push("Title");
            if (!$.trim(attr.Url))
                output.push("Url");
            if (output.length)
                return output;
        }
    }),

    co = Backbone.Collection.extend({
        model: m
    });

    

    var Cub = Backbone.View.extend({
        className: "Cub",
        events: {
            "blur input": "full",
            "click .ui-icon-wrench": "wrench"
        },
        wrench: function(e) {
            if (this.$(".addons").is(":visible")) {
                $(e.target).removeClass("ui-icon-close");
                this.$(".addons").hide();
            } else {
                $(e.target).addClass("ui-icon-close");
                this.$(".addons").show();
            }
        },
        full: function(e) {
            var $el = $(e.target);
            if ($.trim($el.val())) {
                if ($el.closest("div").hasClass("addons")) {
                    var d = this.model.get("Theme");
                    d[$el.attr("name")] = $el.val();
                    this.model.set("Theme", d);
                    this.addTheme();
                } else
                    this.model.set($el.attr("name"), $el.val());
            }
        },
        addTheme: function() {
            var theme = this.model.get("Theme");
            if (theme.BackgroundColor)
                this.$el.css("background-color", theme.BackgroundColor);
            if (theme.BorderColor)
                this.$el.css("border-color", theme.BorderColor);
        },
        initialize: function() {
            this.model.view = this;
        },
        render: function() {
            this.$el.html("<div class='addons'><label>BackgroundColor:</label>&nbsp;<input type='text' name='BackgroundColor' /><br/><label>FontColor:</label>&nbsp;<input type='text' name='FontColor' /><br/><label>BorderColor:</label>&nbsp;<input type='text' name='BorderColor' /><br/><label>BackgroundImageUrl:</label>&nbsp;<input type='text' name='BackgroundImageUrl' /><br/></div><span class='ui-icon ui-icon-wrench'></span><input name='Title' type='text' placeholder='Введите название' /><br/><input name='Url' type='text' placeholder='Введите url' /><br/><textarea name='Description' placeholder='Описание'></textarea>");
            var dC = 100,
                left = parseInt(this.model.get("XY")[0]) * dC,
                top = parseInt(this.model.get("XY")[1] * dC),
                width = (parseInt(this.model.get("WH")[0]) + 1) * dC,
                height = (parseInt(this.model.get("WH")[1]) + 1) * dC,
                d = 23;
            this.$el.css({ "left": left, "top": top, "width": width - d, "height": height - d });
            this.addTheme();
            return this;
        }
    });

    return Backbone.View.extend({
        el: $("#Main"),
        events: {
            "click #save": "save",
            "click #last": "last",
            "click #clearall": "clear"
        },
        save: function() {
            var data = [];
            this.collection.each(function(m) {
                data.push(m.toJSON());
            });
            $.ajax({
                type: "POST",
                url: "/api/edge",
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(data)
            }).done(function() { location.reload(); });
        },
        last: function() {
            var last = this.collection.at(this.collection.models.length - 1);
            _.each(last.get("Cubs"), function(a) {
                this.$("#" + a).removeClass("added");
            }, this);
            last.view.remove();
            this.collection.remove(last);
            this.$(".editor .ui-selected").removeClass("ui-selected");
        },
        clear: function() {
            this.collection.reset();
            this.$(".Cubs").empty();
            this.$(".editor .ui-selected").removeClass("ui-selected");
            this.$(".editor .added").removeClass("added");
        },
        check: function(id) {
            var ms = this.collection.models;
            for (var i = 0; i < ms.length; i++) {
                var m = this.collection.models[i], arr = m.get("Cubs");
                for (var j = 0; j < arr.length; j++) {
                    var a = arr[j];
                    if (a == id)
                        return false;
                }
            }
            return true;
        },
        add: function(m) {
            var cub = new Cub({ model: m }).render();
            this.$(".Cubs").append(cub.$el);
            _.each(m.get("Cubs"), function(id) {
                this.$("#" + id).addClass("added");
            }, this);
        },
        initialize: function() {
            this.collection = new co;
            this.collection.on("add", this.add, this);
            this.render();
        },
        render: function() {
            this.$el.html('<p><button id="clearall">очистить все</button>&nbsp;<button id="last">очистить последний</button>&nbsp;<button id="save">сохранить</button></p>' +
                '<div class="Cubs"></div>' +
                '<div style="width: 800px;height: 600px;" class="editor"></div>');

            var cel = 0, row = 0;
            for (var i = 0; i < 48; i++) {
                this.$(".editor").append("<div id='" + cel + "-" + row + "'></div>");
                if ((i + 1) % 8 == 0) {
                    row++;
                    cel = 0;
                } else cel++;
            }
            var s = this;
            this.$(".editor").selectable({
                stop: function() {
                    var raw = { Cubs: [] }, i = 0;
                    $(".ui-selected", this).each(function() {
                        var _id = $(this).attr("id");
                        raw.Cubs.push(_id);
                        var dc = _id.split("-");
                        if (i === 0) {
                            raw.ID = _id;
                            raw.XY = dc;
                            raw.WH = [0, 0];
                        } else {
                            raw.WH = [dc[0] - raw.XY[0], dc[1] - raw.XY[1]];
                        }
                        i++;
                    });
                    if (s.check(raw.ID))
                        s.collection.add(raw);
                }
            });

            return this;
        }
    });
});