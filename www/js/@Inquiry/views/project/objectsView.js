define('project:objects', ['i18n!nls/resources.min', 'baseurl', 'global.grid.dataItemsView', 'global.view.dropDown'], function (Resources, baseurl, ListView, dropDown) {

    var changeStatus = function (models, m) {
        _.each(models, function (model) {
            model.set("State", m.get("title"));
            $.get("/api/InterestObj/SetState/" + model.id + "?state=" + m.id + "&title=" + m.get("title"));
        }, this);
    };

    var menuCollection = new Backbone.Collection([
      {
          title: Resources.runagain, icon: 'next', 'data-id': "EA932373-3647-471A-87C1-DDB56657FEBC",
          cmd: function (models) {
              Backbone.history.navigate(`project/${this.options.projectId}/edit/${models[0].id}`, { trigger: true });
          }
      },
      {
          title: Resources.addbasket, icon: 'case', 'data-id': "B7787886-AF0E-4B5A-9061-49B182200B8C",
          cmd: function (models, m) {
              Backbone.trigger("basket:add", _.pluck(models, 'id'));
          }
      },
      {
          title: Resources.chsta, icon: 'status', 'data-id': "7460E56F-62BD-4C9D-A8E5-5B64373C5131",
          child: [
              { id: 1, icon: 'inwork', title: Resources.working, cmd: changeStatus },
              { id: 2, icon: 'finished', title: Resources.ff, cmd: changeStatus },
              { id: 3, icon: 'clock', title: Resources.tm, cmd: changeStatus },
              { id: 4, icon: 'archive', title: Resources.ar, cmd: changeStatus }
          ]
      },
       {
           title: Resources.deleteItem, icon: 'trash', 'data-id': "86056534-0DCB-48CF-B06D-3E8D23FD5001",
           cmd: function (models, m) {
               Backbone.trigger('message:confirm', {
                   title: Resources.alert,
                   message: Resources.askyousure + '<br/>' + Resources.warndeleteobj,
                   fx: function () {
                       _.each(models, function (model) {
                           model.url = "/api/object/" + model.id;
                           model.destroy();
                       }, this);
                   },
                   ctx: this
               });
           }
       }
        //{
        //    title: Resources.toanal, icon: 'analyst', 'data-id': "", classButton: "external",
        //    cmd: function (models) {
        //        var link = baseurl + "#3|Tree/0/1/" + models[0].id + "/0/0";
        //        window.open(link);
        //    }
        //},
        //{ title: Resources.togs, icon: 'global', 'data-id': "", status: "disabled" },
        //{
        //    title: 'Открыть в SA Analyst', icon: 'analyst', cmd: function () {
        //        location.href = 'abscp:lang-' + Resources.Lang + '/analyst/object/' + window.btoa(encodeURIComponent(location.href));
        //    }
        //},
        //{
        //    title: 'Открыть в SA TextMiner', icon: 'import', cmd: function () {
        //        location.href = 'abscp:lang-' + Resources.Lang + '/textminer/object/' + window.btoa(encodeURIComponent(location.href));
        //    }
        //}
    ]);

    var statusCollection = new Backbone.Collection([
            { id: 0, icon: 'icon-all', title: Resources.fva },
            { id: 1, icon: 'icon-inwork', title: Resources.working },
            { id: 2, icon: 'icon-finished', title: Resources.ff },
            { id: 3, icon: 'icon-clock', title: Resources.tm },
            { id: 4, icon: 'icon-archive', title: Resources.ar }
    ]);

    return Mn.View.extend({

        className: 'workbench--content',

        template: _.template('<div></div>'),

        regions: {
            list: { el: 'div', replaceElement: true }
        },

        initialize: function () {

            this.collection = new Backbone.Collection;
            this.collection.url = $.mergeUrlParam("/api/interestObjects", { onlyMeta: '', profileID: '', paramID: '', typeID: '', inputText: '', page: 1 });

            // add new object from form
            //this.listenTo(Backbone.Radio.channel('oM'), 'object:created', function (m) {

            //    var id = m.id,
            //        p = this.getChildView('list').getChildView('table').getChildView('body'),
            //        ml = p.collection.get(id);

            //    if (ml)
            //        p.children.findByModel(ml).$el.find("td[data-name='Status']").html($progress.clone());
            //    else 
            //        this.getChildView('list').collection.fetch({ reset: true });

            //});
        },

        onRender: function () {

            this.showChildView('list', new ListView({ collection: this.collection, menuCollection: menuCollection, projectId: this.model.get('projectId') }));

        },

        onAttach: function () {

            const tools = [
                     { id: '_addPerson', className: 'new-person', title: Resources.addPERSON },
                     { id: '_addCompany', className: 'new-org', title: Resources.addCOMPANY },
                     { id: '_topChangeState', side: 'right', isView: true, view: dropDown, options: { collection: statusCollection, current: 0 } }
            ];

            this.triggerMethod('render:tools', tools);

        },

        collectionEvents: {

            request: function () {

                Backbone.Radio.channel('loader').trigger('show', this.$el);

            },

            sync: function () {

                Backbone.Radio.channel('loader').trigger('hide');

            }

        },

        childViewEvents: {

            'row:col:trigger': function (v, e) {

                var $e = $(e.target).closest("td"),
                    m = v.model;

                if ($e.attr("data-name") === "status" && m.get("dossier"))
                    Backbone.Radio.channel('Notify')
                        .request('once:dialog', { title: Resources.info, content: m.get("dossier") });

            }

        },

        _addIcon: function (a) {

            if (!this.getChildView('list').getChildView('table').getChildView('body')) return;

            const vs = this.getChildView('list').getChildView('table').getChildView('body').children;

            const $progress = $("<span class='icon-progress'><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span>");

            vs.each(function (v) {

                if (a.indexOf(parseInt(v.model.id)) === -1)
                    v.$el.find(".icon-progress").remove();
                else
                    v.$el.find("td[data-name='status']").html($progress.clone());

            }, this);
        },

        _addPerson: function () {

            Backbone.history.navigate(`project/${this.model.get('projectId')}/add/person`, { trigger: true });

        },

        _addCompany: function () {

            Backbone.history.navigate(`project/${this.model.get('projectId')}/add/company`, { trigger: true });
        },

        _topChangeState: function (v) {

            let val = v.getChildView('vv').current.id;

            this.collection.url = $.mergeUrlParam(this.collection.url, { state: val });

            Backbone.Radio.channel('loader').trigger('show', this.$el, { speed: 'fast', overlay: true });
            this.collection.fetch({ reset: true });

        }
    });
});