define('forms.inquiryView',
    [
        'i18n!nls/resources.min',
        'global.request.param',
        'global.behaviors.input'
    ],
function (Resources, ParamView, InputBehavior) {

    return Mn.View.extend({

        className: 'g-form--new-check',

        behaviors: {
            input: InputBehavior
        },

        template: templates['inquiry-form'],

        templateContext: {
            Resources: Resources
        },

        ui: {
            name: 'input[name="projectName"]',
            save: 'button[name="save"]'
        },

        regions: {
            rub: '.rubric-param'
        },

        triggers: {
            'click button[name="cancel"]': 'back:list'
        },

        events: {

            'input input': function (e) {
                $(e.target).removeClass('error');
            },

            "click @ui.save": function () {

                this.model.set($.GetData(this.$el));

                this.model.set('Rubrics', this.getChildView('rub').collection.toJSON());

                var flag = !this.model.id;

                if (this.model.isValid()) {

                    this.$('input').removeClass('error');

                    this.model.save({}, {
                        wait: true,
                        success: function (m, data) {

                            if (flag)
                                Backbone.history.navigate(`#projects/my/${m.id}`, { trigger: true });
                            else
                                this.triggerMethod('update:project:success', this.model);

                        }.bind(this)
                    });
                }
            },


            "click .clear-form": function () {

                this._clear();

            }
        },

        onRender: function () {

            if (this.options.readOnly) {
                this.$el.addClass('readonly');
                this.$('.inquiry-form--options span').hide();
                this.$('.inquiry-form--controls .row div').hide();
            }

            if (this.options.hideCancel)
                this.$('button[name=cancel]').hide();

            this.showChildView('rub', new ParamView({

                attributes: {
                    Caption: Resources.relRubrics,
                    Name: "rel-rubric",
                    ParametrType: "Rubric",
                    url: "/api/Rubric/ForProjects",
                    Params: { openLevel: 2 },
                    DisplayValue: _.pluck(this.model.get('Rubrics'), 'title').join(','),
                    Value: _.pluck(this.model.get('Rubrics'), 'id')
                },

                collection: new Backbone.Collection(this.model.get('Rubrics'))

            }));

        },

        modelEvents: {

            'change:projectId': function (m, id) {

                //if (id)
                //    this.model.fetch();

            },

            'change:projectName': function (m, name) {

                if ($.trim(name))
                    this.ui.name.val(name).addClass('filled');
            },

            invalid: function (model, error) {

                if (error)
                    error.forEach((data) => { this.$(`[name='${data.name}']`).addClass('error'); });
            },

            sync: 'render'
        },

        _clear: function () {

            this.model.set(this.model.defaults());

            this.$("input[name='projectCode']").removeClass('filled').val('');

            this.getChildView('rub').collection.reset();
            this.getChildView('rub').model.set({ "DisplayValue": "", "Value": [] });
        }

    });
});