define('block:project',
    [
        'i18n!nls/resources.min',
        'model:project'
    ],
function (Resources, projectModel) {

    return Mn.Object.extend({

        initialize: function () {

            this.model = new projectModel;

            this._getName();

            this.model.on('change:projectId', function (m, id) {

                if (!id)
                    this._getName();
                else
                    m.set('projectName', null);

            }, this);

        },

        _getName: function () {

            $.get('/api/Inquiry/SeqNumber/0').done((num) => { this.model.set('projectName', `${Resources.inquiry} № ${num}`); });

        },

        getModel: function(){

            return new Promise(resolve=> {

                if (this.model.get('projectName'))
                    resolve();
                else
                    this.model.fetch({ success: () => { resolve(); } });

            });

        },

        setModules: function (a) {

            this._tools();

            this._sidebar(a);

            this._crumbs();

        },

        resetModules: function () {

            this.options.app.getView().getChildView('tools').collection.reset();
            this.options.app.getView().getChildView('crumbs').collection.reset();
            this.options.app.sidebar.collection.reset();

        },

        _sidebar: function (a) {

            this.options.app.sidebar.collection.reset([
                        { id: 'my', path: 'projects/my', className: 'my-inquiry', title: Resources.myinq },
                        { id: 'all', path: 'projects/all', className: 'all-inquiry', title: Resources.allinq },
                        { id: 'find', path: 'projects/find', className: 'find-inquiry', title: Resources.serinq }
            ]);

            this.options.app.sidebar.setCurrent([a]);

        },

        _crumbs: function () {

            this.options.app.getView().getChildView('crumbs').collection.set([
                { path: 'projects/my', title: Resources.ile }
            ]);

        },

        _tools: function () {

            this.options.app.getView().getChildView('tools').collection.reset();

        }

    });
});