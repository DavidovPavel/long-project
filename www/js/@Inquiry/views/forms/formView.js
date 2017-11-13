define('forms/FormView',
    [
        'i18n!nls/resources.min',
        'global.behaviors.input'
        //'g/files/UploadFileView', 'c/EditListView', 
    ],
    function (Resources, inputBehavior /*UploadFileView, EditListView*/) {

    // управление списком прикрепленных файлов
    var manageCollection = Mn.View.extend({
        className: 'grid--1-1',
        template: _.template('<div class="inputData"></div><div class="list-edit"></div>'),

        regions: {
            input: { el: '.inputData', replaceElement: true },
            list: { el: '.list-edit', replaceElement: true }
        },

        onRender: function () {
            this.showChildView('input', this.options.inputForm);
            this.showChildView('list', this.options.listView);
        }
    });

    return Mn.View.extend({

        tagName: 'main',
        className: 'wizzard',

        template: templates['form-container'],

        templateContext: {
            Resources: Resources
        },

        behaviors: {
            input: inputBehavior
        },

        ui: {
            create: 'button[name=create]',
            next: 'button[name=next]',
            back: 'button[name=back]'
        },

        regions: {
            content: { el: 'div', replaceElement: true }
        },

        addEvents: {},
        events: function () {
            return _.extend({}, this.originalEvents, this.addEvents);
        },

        originalEvents: {

            'click .acc>legend': function (e) {
                $(e.target).parent('fieldset').toggleClass('current').children('.row').slideToggle(200);
            },

            "input .check-key": function (e) {

                var data = $.GetData(this.getChildView('content').$el);
                this.model.set(data);

                this.getChildView('content').getChildView('synonims').collection.reset();
            },

            "blur .check-blur": function (e) {

                var data = $.GetData(this.getChildView('content').$el);
                this.model.set(data, { validate: true });

            },

            'click @ui.create:not(.disabled)': function (e) {

                this.model.url = `/api/startTaskExpress/${this.model.get("typeid")}?start=0&sp=`;

                if (!this.model.id)
                    this._send(false);
            },

            'click @ui.next:not(.disabled)': function () {

                let step = this.master.get('step');
                step++;

                // костыль
                if (this.model.get('typeSystemName') === 'Organization' && ['ru-RU', 'kk-KZ'].indexOf(this.model.get('selectedCountries')[0]) === -1 && step === 1)
                    step = 2;

                this.master.set('step', step);

            },

            'click @ui.back:not(.disabled)': function () {

                let step = this.master.get('step');
                step--;

                // костыль
                if (this.model.get('typeSystemName') === 'Organization' && ['ru-RU', 'kk-KZ'].indexOf(this.model.get('selectedCountries')[0]) === -1 && step === 1)
                    step = 0;

                if (step >= 0)
                    this.master.set('step', step);

            },

            'click button[name=cancel]': function () {
                this.destroy();
                Backbone.history.history.back();
            }
        },

        onRender: function () {

            this._getPage();

            if (this.model.id) {
                this.ui.create.attr('style', 'display:none!important');
                this.ui.next.removeClass('disabled');
            }

        },

        modelEvents: {

            'change': function () {

                if (this.model.isValid() && typeof this.ui.create !== 'string') {
                    this.ui.create.removeClass("disabled");
                    this.ui.next.removeClass("disabled");
                }
            },

            invalid: function (model, error) {

                this._resetError();

                this.ui.create.addClass("disabled");
                this.ui.next.addClass("disabled");

                _.each(error, function (data) {

                    if (data.name === 'selectedCountries')
                        this.getChildView('content').getChildView('countries').$('select').addClass('error');
                    else
                        this.$("[name='" + data.name + "']").addClass("error");

                }, this);

                setTimeout(this._resetError.bind(this), 3000);
            }

        },

        childViewEvents: {

            'collections:robors:selected': function (m) {
                this.model.url = `/api/startTaskExpress/${this.model.get("typeid")}?start=1&sp=${m.get('SearchPackUID')}`;
                this.ui.next.removeClass('disabled');
            }

        },

        _getPage: function () {

            let step = this.master.get('step'),
                pages = this.master.get('pages'),
                page = pages[step];

            if (step > pages.length - 1) {
                this._send(true);
                return;
            }

            if (step === 0 || this.model.isValid())
                this.showChildView('content', new page({ model: this.model, DicID: this.options.DicID }));

            if (step === 0)
                this.ui.back.addClass('disabled')
            else
                this.ui.back.removeClass('disabled');

            if (step === pages.length - 1)
                this.ui.next.text(this.model.id ? Resources.startSearch : Resources.c2s).addClass('disabled');
            else
                this.ui.next.text(Resources.next);

        },

        _send: function (flag) {

            if (flag && !this.getChildView('content').getChildView('robots').current) {

                Backbone.trigger("message:warning", { message: Resources.errorselsources });
                return;
            }

            if (this.model.isValid()) {

                Backbone.trigger("message:modal", { title: Resources.wait2, message: flag ? Resources.message2 : '' });

                this.model.save({}, {

                    wait: true,

                    success: function (m, data) {

                        Backbone.trigger("message:hide");

                        if (!this.model.id)
                            this.model.set('id', m.get('objectId'));

                        if (flag) {

                            m.set('searchTasksInfo', data);

                            Backbone.Radio.channel('app').trigger('start:check', m);

                            Backbone.history.navigate(`projects/my/${m.get('Project_ID')}/objects/${m.id}/proof`, { trigger: true });

                        }
                        //else
                        //    Backbone.Radio.channel('oM').trigger('object:created', m);


                    }.bind(this),

                    error: function () {
                        Backbone.trigger("message:hide");
                    }
                });

                this.destroy();
            }
        },

        _resetError: function () {
            this.$("input").removeClass("error");
            this.$("textarea").removeClass("error");
            this.$("select").removeClass("error");
        },

        /* module менеджер фалов */
        initAttach: function () {

            var files = _.map(this.model.get("AttacheedFiles"), function (value, key) { return { "FileName": key, "FilePath": value }; });

            var filesCollection = new Backbone.Collection(files),
                uploadFile = new UploadFileView({ collection: filesCollection }),
                listFiles = new EditListView({ collection: filesCollection, titleAttribute: 'FileName' }),
                manageFiles = new manageCollection({ inputForm: uploadFile, listView: listFiles });

            this.listenTo(listFiles.collection, "update", function () {

                this.$(".amount-files").text(listFiles.collection.length);

                this._saveFiles(filesCollection);

            });

            this.listenTo(listFiles, 'list:item:save', function (v) {

                this._saveFiles(filesCollection);

            });

            this.listenTo(listFiles, 'list:item:clear', function (v) {

                Backbone.trigger('message:confirm', {
                    title: Resources.askyousure,
                    message: '',
                    fx: function () {

                        v.model.collection.remove(v.model);
                        this._saveFiles(filesCollection);

                    },
                    ctx: this
                });

            });

            this.listenTo(listFiles, 'list:item:view', function (v) {
                window.open(v.model.get('FilePath'));
            });

            this.$(".amount-files").text(files.length);

            this.showChildView('filesArea', manageFiles);
        },

        _saveFiles: function (collection) {

            var output = {};

            collection.each(function (m) {
                output[m.get('FileName')] = m.get('FilePath');
            });

            this.model.set("AttacheedFiles", output);
        }
    });
});
