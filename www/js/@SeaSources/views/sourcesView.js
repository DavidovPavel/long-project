define('services.sources.sourcesView', ['i18n!nls/resources.min', 'global.view.dialog', 'robots.mainView'], function (Resources, dialog, sourcesManager) {

    return Mn.View.extend({

        template: _.template('<div></div>'),

        regions: {
            d: {el: 'div', replaceElement: true}
        },

        onRender() {

            this.showChildView('d', new dialog({
                className: 'full',
                content: new sourcesManager({ model: this.model, DicID: this.options.DicID }),
                title: Resources.selSourcesTitle,
                footer: new Backbone.Collection([
                                { id: 'back', title: Resources.toform },
                                { id: 'start', title: Resources.saveCollRobots, className: 'next right' }
                ])
            }));


        },

        onChildviewControlsButtonClick: function (v) {
            var name = v.model.id;
            switch (name) {
                case 'back':
                    this.remove();
                    break;
                case 'start':
                    this.saveCollection();
                    break;
            }
        },

        saveCollection: function () {

            var r = [], sum = 0,
                list = this.getChildView('container').collection;

            list.each(function (m) {
                r.push(m.id);
                sum += m.get('price');
            });


            var m = this.model.get('view').model,
                par = {
                    method: "POST",
                    url: "/api/sources/persisted",
                    data: {
                        Sources: r,
                        BySATypeSelectedValue: m.get("BySaType"),
                        SearchPackUID: m.get('SearchPackUID'),
                        SearchPackName: m.get("SearchPackName")
                    }
                };

            if (!r.length) {
                Backbone.trigger("message:warning", { title: Resources.alert, message: Resources.errorsavecoll });
                return null;
            }

            $.ajax(par).done(function (uid) {
                if (!m.get('SearchPackUID'))
                    m.set("SearchPackUID", uid);

                m.set({ SourcesCount: list.length, Sum: sum });

                this.triggerMethod('save:robots:collection', par);

                this.remove();

            }.bind(this));
        }

    });

});