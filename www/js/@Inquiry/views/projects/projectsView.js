define('projects',
    [
        'i18n!nls/resources.min',
        'projects:menuCollection',
        'projects:statusCollection',
        'global.view.dropDown',
        'forms.inquiryView',
        'global.grid.dataItemsView'
    ],
function (Resources, menuCollection, statusCollection, dropDown, inquiryForm, listView) {

    return Mn.View.extend({

        className: 'workbench--content',

        template: _.template('<div id="add"></div><div id="find"></div><div id="list"></div>'),

        regions: {
            add: { el: '#add', replaceElement: true },
            list: { el: '#list', replaceElement: true },
            find: { el: '#find', replaceElement: true }
        },

        onRender: function () {

            this.showChildView('add', new inquiryForm({ model: this.options.inquiry }));
            this.getChildView('add').$el.hide();

            this.showChildView('list', new listView({ collection: this.collection, menuCollection: menuCollection, interceptLink: this.interceptLink }));

        },

        onAttach: function () {

            this.triggerMethod('render:tools', [
                { id: '_topShowNewProject', className: 'new-inquiry', title: Resources.ni, side: 'left' },
                { id: '_topChangeState', side: 'right', isView: true, view: dropDown, options: { collection: statusCollection, current: 0 } }
            ]);

        },

        collectionEvents: {

            request: function () {
                Backbone.Radio.channel('loader').trigger('show', this.$el);
            },

            sync: function () {
                Backbone.Radio.channel('loader').trigger('hide');
            },

            error: function () {
                Backbone.Radio.channel('loader').trigger('hide');
            }

        },

        childViewEvents: {

            'back:list': function () {

                this.getChildView('add').$el.slideUp(350);

            },

            'row:col:trigger': function (v, e) {

                var $e = $(e.target).closest("td"),
                        m = v.model;

                if ($e.attr("data-name") === "status" && m.get("dossier"))
                    Backbone.Radio.channel('Notify')
                        .request('once:dialog', { title: Resources.info, content: m.get("dossier") });

                if ($e.attr("data-name") === "title" && this.options.interceptLink) {
                    e.preventDefault();
                    location.href = `${Backbone.history.fragment}/${m.id}`;
                }

            },

            'click:link': function (v, e) {

                if (this.interceptLink) {
                    e.preventDefault();
                    window.open($(e.target).attr('href'));
                }

            },

            'action:from:menu': function (m) {

                this.getChildView('add').model.set('projectId', parseInt(m.id));
                this.getChildView('add').$el.slideDown(350);

            },

            'update:project:success': function (m) {

                var listModel = this.getChildView('list').getChildView('table').getChildView('body').collection.get(m.id);

                listModel.set({
                    title: m.get('projectName'),
                    projectcode: m.get('projectCode'),
                    rubrics: m.get('rel-rubric')
                });

                this.getChildView('list').getChildView('table').getChildView('body').children.findByModel(listModel).render();

            },

            'change:collection': function () {

                this.getChildView('add')._clear();

                this.getChildView('add').$el.slideUp(350);

            },

            // find form
            'start:find': function (m) {

                this.collection.url = $.mergeUrlParam(this.collection.url, m.toJSON());
                this.collection.fetch({ reset: true });

            },

            'clear:find': function () {

                if (this.collection.length)
                    this.getChildView('list').getChildView('table').getChildView('body').collection.reset();

            }

        },

        _topShowNewProject: function () {

            this.getChildView('add').model.set({ 'projectId': null });
            this.getChildView('add').$el.slideToggle(350);

        },

        _topChangeState: function (v) {

            let val = v.getChildView('vv').current.id;

            this.collection.url = $.mergeUrlParam(this.collection.url, { state: val });
            this.collection.fetch({ reset: true });

        }


    });

});