define('create.searchSources.robots', ['i18n!nls/resources.min', 'global.view.dialog', 'services.sources.mainView'],
    function (Resources, dialogView, sourcesManager) {

    var setView = Mn.CollectionView.extend({

        className: 'row',

        emptyView: Mn.View.extend({
            template: _.template(Resources.N),
            templateContext: { Resources: Resources }
        }),

        childViewOptions: function (m) {
            if (!m.has('selected'))
                m.set('selected', false);

            return { DicID: this.options.DicID };
        },

        childView: Mn.View.extend({

            className: 'grid--1-3',

            template: templates['set-types-robots'],
            templateContext: {
                Resources: Resources
            },

            triggers: {
                'click': 'click:item',
                'click span[data-icon=icon-eye]': 'list:item:view',
                'click span[data-icon=icon-trash]': 'list:item:clear'
            },

            events: {

                'click h4': function (e) {
                    e.stopPropagation();
                    $(e.target).prop('contenteditable', true);
                },

                'click span[data-icon=icon-round-check]': function (e) {
                    e.stopPropagation();

                    if ($.trim(this.$('h4').text())) {
                        if (this.model.get('SearchPackUID'))
                            this.model.save('SearchPackName', this.$('h4').text());
                        else {
                            this.model.set('SearchPackName', this.$('h4').text());
                            // что бы показалась одна модель this.model.collection - удалить все лишнее

                            //Backbone.Radio.channel('oM').request('show:module', 'robots/sourcesView', this.model, this.options.DicID);

                            this.triggerMethod('list:item:view', this);

                        }

                        this.$('h4').prop('contenteditable', false);
                    }
                }
            },

            modelEvents: {

                'change:selected': function () {
                    this.render();
                },

                'change:SourcesCount': function () {
                    this.render();
                }
            }
        }),

        childViewTriggers: {
            'click:item': 'click:item',
            'list:item:view': 'list:item:view',
            'list:item:clear': 'list:item:clear'
        }
    });

    return Mn.View.extend({

        className: 'g-form--wizard',
        template: templates['robots-collection'],
        templateContext: {
            Resources: Resources
        },

        events: {

            'click #add-collection': function () {

                var m = new Backbone.Model({
                    SearchPackName: '',
                    SearchPackUID: null,
                    BySaType: this.options.DicID,
                    SelectedCountries: this.model.get('selectedCountries'),
                    Sum: 0,
                    SourcesCount: 0,
                    IsSystem: false
                });

                this.getChildView('custom').collection.add(m);

                m.on('change:SearchPackUID', function (model, uid) {
                    this.current = model;
                    $.cookie('anbr.check.' + this.model.get("typeid") + '.sourceid', uid);
                    this.collection.fetch({ reset: true });
                }, this);
            }
        },

        regions: {
            system: { el: '#system', replaceElement: true },
            custom: { el: '#custom', replaceElement: true },
            dialog: '.dialog'
        },

        onRender: function () {

            Backbone.Radio.channel('loader').trigger('show', this.$el);
            this.collection.fetch({ reset: true });
        },

        collectionEvents: {

            sync: function () {

                Backbone.Radio.channel('loader').trigger('hide');

                var set = this.collection.groupBy("IsSystem");

                this.showChildView('system', new setView({ collection: new Backbone.Collection(set.true || []) }));
                this.showChildView('custom', new setView({ DicID: this.options.DicID, collection: new Backbone.Collection(set.false || []) }));

                var currentId = $.cookie('anbr.check.' + this.model.get("typeid") + '.sourceid');

                this.current = currentId ?
                    this.collection.get(currentId) ? this.collection.get(currentId) : this.collection.at(0)
                    : this.collection.at(0);

                if (this.current) {
                    this.current.set('selected', true);
                    this.triggerMethod('collections:robors:selected', this.current);
                }

            }
        },

        childViewEvents: {

            'click:item': function (v) {

                if (v.model.get('SearchPackUID')) {

                    if (this.current)
                        this.current.set('selected', false);

                    v.model.set('selected', true);
                    this.current = v.model;

                    $.cookie('anbr.check.' + this.model.get("typeid") + '.sourceid', v.model.id);

                    this.triggerMethod('collections:robors:selected', this.current);
                }

            },

            'list:item:view': function (v) {

                if (!v.model.has('SelectedCountries'))
                    v.model.set('SelectedCountries', this.model.get('selectedCountries'));

                //if (v.model.get('SearchPackUID')) {

                    let dialog = new dialogView({
                        size: 'full',
                        header: { manage: [{ id: 'close' }] },
                        content: new sourcesManager({ model: v.model, DicID: this.options.DicID }),
                        title: Resources.selSourcesTitle,
                        footer: new Backbone.Collection([
                                        { id: 'back', title: Resources.toform },
                                        { id: 'start', title: Resources.saveCollRobots, className: 'next right' }
                        ])
                    });

                    this.listenTo(dialog, 'footer:button:click', function (v) {

                        var name = v.model.id;
                        switch (name) {
                            case 'back':
                                dialog.close();
                                break;
                            case 'start':
                                this._saveCollection(dialog);
                                break;
                        }

                    });

                    this.showChildView('dialog', dialog);
                //}
                    //var robots = Backbone.Radio.channel('oM').request('show:module', 'robots/sourcesView', v.model, this.options.DicID);

            },

            'list:item:clear': function (v) {

                Backbone.trigger('message:confirm', {

                    title: Resources.askyousure,
                    message: $.Format(Resources.wdostr, ' [' + v.model.get('SearchPackName') + '] '),

                    fx: function () {
                        v.model.destroy();
                        if (this.current && this.current.get('SearchPackUID') === v.model.get('SearchPackUID')) {
                            $.cookie('anbr.check.' + this.model.get("typeid") + '.sourceid', null);
                            this.current = null;
                        }
                    },

                    ctx: this
                });
            }
        },

        _saveCollection (dialog) {

            var r = [], sum = 0,
                list = dialog.getChildView('content').collection;

            list.each(function (m) {
                r.push(m.id);
                sum += m.get('price');
            });


            var m = dialog.getChildView('content').model,

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

                dialog.close();

            }.bind(this));
        }
    });
});