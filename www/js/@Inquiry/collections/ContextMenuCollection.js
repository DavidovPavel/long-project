define('ContextMenuCollection', ['i18n!nls/resources.min', 'baseurl'], function (Resources, baseurl) {

    var changeStatus = function (models, m) {
        _.each(models, function (model) {
            model.set("State", m.get("title"));
            $.get("/api/inquiry/SetState/" + model.id + "?state=" + m.id + "&title=" + m.get("title"));
        }, this);
    };

    return new Backbone.Collection([
        {
            id: 0,
            title: Resources.runagain, icon: 'next', 'data-id': "EA932373-3647-471A-87C1-DDB56657FEBC",
            cmd: function (models) {
                $.get('/api/interestObjects/input/id' + models[0].id).done(function (data) {
                    Backbone.trigger("start:check", data);
                });
            }
        },
        {
            id: 1,
            title: Resources.addbasket, icon: 'case', 'data-id': "B7787886-AF0E-4B5A-9061-49B182200B8C",
            cmd: function (models, m) {
                Backbone.trigger("basket:add", _.pluck(models, 'id'));
            }
        },
        {
            id: 2,
            title: Resources.import, icon: 'import', 'data-id': "",
            cmd: function (models) {

                _.each(models, function (m) {
                    $.get('/api/object/import/' + m.id).done(function (text) {
                        Backbone.trigger('message:success', { message: text });
                    });
                });

                Backbone.Radio.channel('oM').trigger('hide:form');
            }
        },
        {
            id: 3,
            title: Resources.chsta, icon: 'status', 'data-id': "7460E56F-62BD-4C9D-A8E5-5B64373C5131",
            child: [
                { id: 1, icon: 'inwork', title: Resources.working, cmd: changeStatus },
                { id: 2, icon: 'finished', title: Resources.ff, cmd: changeStatus },
                { id: 3, icon: 'clock', title: Resources.tm, cmd: changeStatus },
                { id: 4, icon: 'archive', title: Resources.ar, cmd: changeStatus }
            ]
        },
         {
             id: 4,
             title: Resources.deleteItem, icon: 'trash', 'data-id': "86056534-0DCB-48CF-B06D-3E8D23FD5001",
             cmd: function (models, m) {
                 Backbone.trigger('message:confirm', {
                     title: Resources.alert,
                     message: Resources.askyousure + '<br/>' + Resources.warndeleteobj,
                     fx: function () {
                         _.each(models, function (model) {
                             model.url = "/api/inquiry/" + model.id;
                             model.destroy();
                         }, this);
                     },
                     ctx: this
                 });
             }
         }
          //{
          //    id: 5,
          //    title: Resources.toanal, icon: 'analyst', 'data-id': "", classButton: "external",
          //    cmd: function (models) {
          //        var link = baseurl + "#3|Tree/0/1/" + models[0].id + "/0/0";
          //        window.open(link);
          //    }
          //}
          //{ id: 6, title: Resources.togs, icon: 'global', 'data-id': "", status: "disabled" },
          // {
          //     id: 7,
          //     title: 'Открыть в SA Analyst', icon: 'analyst', cmd: function () {
          //         location.href = 'abscp:lang-' + Resources.Lang + '/analyst/object/' + window.btoa(encodeURIComponent(location.href));
          //     }
          // },
          //{
          //    id: 8,
          //    title: 'Открыть в SA TextMiner', icon: 'import', cmd: function () {
          //        location.href = 'abscp:lang-' + Resources.Lang + '/textminer/object/' + window.btoa(encodeURIComponent(location.href));
          //    }
          //}
    ]);

});