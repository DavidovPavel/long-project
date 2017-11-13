define('projects:menuCollection', ['i18n!nls/resources.min'], function (Resources) {

    const changeStatus = function (models, m) {

        _.each(models, function (model) {

            model.set("State", m.get("title"));

            $.get(`/api/inquiry/SetState/${model.id}?state=${m.id}&title=${m.get("title")}`);

        }, this);

    };

    return new Backbone.Collection([
           {
               icon: 'change',
               title: Resources.editItem,
               cmd: function (models) {
                   this.triggerMethod('action:from:menu', models[0]);
               }
           },
          {
              icon: 'status',
              title: Resources.chsta,
              'data-id': "7460E56F-62BD-4C9D-A8E5-5B64373C5131",
              child: [
                 { id: 1, icon: 'inwork', title: Resources.working, cmd: changeStatus },
                 { id: 2, icon: 'finished', title: Resources.ff, cmd: changeStatus },
                 { id: 3, icon: 'clock', title: Resources.tm, cmd: changeStatus },
                 { id: 4, icon: 'archive', title: Resources.ar, cmd: changeStatus }
              ]
          },
          {
              icon: 'trash',
              title: Resources.deleteItem,
              'data-id': "86056534-0DCB-48CF-B06D-3E8D23FD5001",
              cmd: function (models) {

                  Backbone.trigger('message:confirm', {
                      title: Resources.alert,
                      message: `${Resources.askyousure}<br/>${Resources.warndeleteobj}`,
                      fx: function () {

                          _.each(models, function (model) {

                              model.url = `/api/inquiry/${model.id}`;
                              model.destroy();

                          }, this);
                      },
                      ctx: this
                  });
              }
          }
    ]);

});