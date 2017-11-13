define('find',
    [
    'i18n!nls/resources.min',
    'projects',
    'global.behaviors.input',
    'global.request.param',
    'global.view.dropDown',
    'projects:statusCollection',
    'projects:resultCollection',
    'RU'
    ],
function (Resources, projectView, inputBehavior, ParamView, dropDown, statusCollection, resultCollection) {

    var searchModel = Backbone.Model.extend({

        /// <param name="onlyMeta">Флаг необходимости получить только мета-данные</param>
        /// <param name="typeID">Поиск проводится по заданому типу</param>
        /// <param name="paramID">Поиск проводится по заданному параметру</param>
        /// <param name="profileID"></param>
        /// <param name="inputText">Критерий поиска</param>
        /// <param name="page">Номер страницы</param>
        /// <param name="ds">Дата создания (от)</param>
        /// <param name="de">Дата создания (до)</param>
        /// <param name="state">Состояние: в работе, завершено и т.д</param>
        defaults: function () {
            return {
                inputText: '',
                onlyMeta: null,
                profileID: null,
                paramID: null,
                typeID: null,                
                ds: null,
                de: null,
                rubid: null,
                result: 0,       // результат проверки (негатив, позитив ...)
                state: 0,       // статус проверки (в работе, отложенно ...)
                page: 1,
                executor: ''    //добавить на форму поиска (фильтр по исполнителю строка)  
            };
        },

        validate: function (attr) {

            let output = Object.keys(attr).filter((a) => $.trim(attr[a]) && attr[a] !== 0 && a !== 'page');

            if (!output.length)
                return output;

        }
    });

    const findView = Mn.View.extend({

        className: 'form--search-inquiry',

        behaviors: {
            input: inputBehavior
        },

        template: templates['find-inquiry'],
        templateContext: {
            Resources: Resources
        },

        ui: {
            start: 'button[name="start-search"]',
            text: '#inputText',
            exec: '#input-exec'
        },

        regions: {
            rub: '.rubric-param',
            result: { el: '#results', replaceElement: true },
            status: { el: '#status', replaceElement: true }
        },

        events: {

            'input input': function (e) {
                $(e.target).removeClass('error');
            },

            "click button[name='clear-form']": function () {

                this.$('input').val('');

                this.getChildView('rub').model.set({ "DisplayValue": "", "Value": "" });
                this.getChildView('rub').collection.reset();

                this.$("#datepickerFrom").ejDateTimePicker({ value: null });
                this.$("#datepickerTo").ejDateTimePicker({ value: null });

                this.getChildView('status').setCurrent(0);
                this.getChildView('result').setCurrent(0);

                let params = this.model.defaults();
                this.model.set(params, { validate: false });

                this.triggerMethod('clear:find');
            },

            "click @ui.start": function () {

                this.model.set({

                    inputText: $.trim(this.ui.text.val()),
                    executor: $.trim(this.ui.exec.val()),

                    ds: this.$("#datepickerFrom").data("ejDateTimePicker").getValue() ?
                        this.$("#datepickerFrom").data("ejDateTimePicker")._datetimeValue.toISOString() : null,

                    de: this.$("#datepickerTo").data("ejDateTimePicker").getValue() ?
                        this.$("#datepickerTo").data("ejDateTimePicker")._datetimeValue.toISOString() : null,

                    rubid: this.getChildView('rub').collection.length ? this.getChildView('rub').collection.pluck("id") : null,

                });

                if (this.model.isValid())
                    this.triggerMethod('start:find', this.model);

                else
                    Backbone.trigger('message:warning', { message: Resources.isEmpty });
            }
        },

        onRender: function () {

            this.showChildView('rub', new ParamView({
                attributes: {
                    Caption: Resources.relRubrics,
                    Name: "rel-rubric",
                    ParametrType: "Rubric",
                    url: "/api/Rubric/ForProjects",
                    Params: { openLevel: 2 },
                    Value: []
                },
                collection: new Backbone.Collection()
            }));

            this.showChildView('status', new dropDown({ collection: statusCollection, current: 0, name: 'status' }));
            this.showChildView('result', new dropDown({ collection: resultCollection, current: 0, name: 'result' }));

            this.$("#datepickerFrom").ejDateTimePicker({
                locale: Resources.Lang,
                buttonText: Resources.Today
            });

            this.$("#datepickerTo").ejDateTimePicker({
                locale: Resources.Lang,
                buttonText: Resources.Today
            });

        },

        modelEvents: {

            invalid: function (model, error) {

                error.forEach((data) => { this.$(`[name='${data.name}']`).addClass("error"); });

            }
        },

        childViewEvents: {

            'dropdown:select': function (m, name) {

                if (name === 'result')
                    this.model.set('result', m.id);

                if (name === 'status')
                    this.model.set('state', m.id);
                

            }

        }

    });

    return projectView.extend({

        initialize: function () {

            this.collection.url = '/api/inquiry/search/';

            this.interceptLink = true;

        },

        onAttach: function () {

            let p = this.getChildView('list').options.menuCollection.findWhere({ icon: 'change' });

            p.set({
                cmd: function (m) {

                    //Backbone.history.navigate(`projects/all/${m[0].id}/origin`, { trigger: true });

                    window.open(`${location.pathname}#projects/all/${m[0].id}/origin`);

                }
            });

            this.showChildView('find', new findView({ model: new searchModel }));           

        }

    });
});