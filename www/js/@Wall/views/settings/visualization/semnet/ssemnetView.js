define('settings.visualization.semnet', ['i18n!nls/resources.min', 'global.view.dropDown'], function (Resources, DropDownView) {

    return Mn.View.extend({

        template: '#semnet-settings-template',
        templateContext: {
            Resources:Resources
        },

        regions: {
            ddlevel: '#level',
            ddtree: '#astree',
            ddlayout: '#layout'
        },

        onRender: function () {

            this.showChildView('ddlayout', new DropDownView({
                collection: new Backbone.Collection([
                  { title: Resources.snl1, id: 0 },
                  { title: Resources.snl2, id: 1 },
                  { title: Resources.snl3, id: 2 },
                  { title: Resources.snl4, id: 3 },
                  { title: Resources.snl5, id: 4 },
                  { title: Resources.snl6, id: 5 },
                  { title: Resources.snl7, id: 6 }
                ]),
                current: this.model.get('layout'), name: 'layout'
            }));

            this.showChildView('ddtree', new DropDownView({
                collection: new Backbone.Collection([
                  { title: Resources.ss1, id: 0 },
                  { title: Resources.ss2, id: 1 },
                  { title: Resources.ss3, id: 2 }
                ]),
                current: this.model.get('astree'), name: 'astree'
            }));


            this.showChildView('ddlevel', new DropDownView({
                collection: new Backbone.Collection([
                      { title: 'level 1', id: 1 },
                      { title: 'level 2', id: 2 },
                      { title: 'level 3', id: 3 }
                ]),
                current: this.model.get('level'), name: 'level'
            }));

            if (this.model.has('SNLevel'))
                this.getChildView('ddlevel').setCurrent(this.model.get('SNLevel'));

            if (this.model.has('SNLayout'))
                this.getChildView('ddlayout').setCurrent(this.model.get('SNLayout'));

            if (this.model.has('SNStruct'))
                this.getChildView('ddtree').setCurrent(this.model.get('SNStruct'));

        },

        onSave: function () {

            this.model.set($.GetData(this.$el));

            this.model.save({
                SNLevel: this.getChildView('ddlevel').current.id,
                SNLayout: this.getChildView('ddlayout').current.id,
                SNStruct: this.getChildView('ddtree').current.id
            });

        },

        onReset: function () {

        }

    });

});