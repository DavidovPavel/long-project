define('notesView',
    [
        'i18n!nls/resources.min',
        'g/ejRTEView',
        'global.view.dropDown',
        'projects:resultCollection'
    ],
 function (Resources, ejRTEView, dropDown, resultCollection) {

    const MIN = 600000000;

    const modelNotes = Backbone.Model.extend({

        defaults: {
            id: null,
            oid: null,      // project ID or object ID
            NoteHtml: '',
            State: 0,
            StateTitle: '',
            printUrl: '',
            pref: 'GetResume?oid='
        },

        url: function () { return `/Api/InquiryResume/${this.get('pref')}${this.get('oid')}`; }
    });

    const noteView = Mn.CollectionView.extend({

        childView: Mn.View.extend({

            className: 'note',

            template: templates['note-fragment'],

            ui: {
                text: '.note-text',
                ep: '.editing-note'
            },

            triggers: {
                'click .note-text': 'note:edit:show'
            },

            events: {

                'click i[data-icon]': function (e) {
                    var name = $(e.target).attr('data-icon').split('-')[1];
                    this[name]();
                }
            },

            modelEvents: {

                sync: function () {
                    this.triggerMethod('model:sync');
                },

                destroy: function () {
                    this.triggerMethod('model:sync');
                },

                'change:cdate': function (m, date) {
                    $.get('/api/CheckNotes/SetPos/' + this.options.oid + '/' + this.model.id + '/' + date).done(function () {
                        m.collection.sort();
                    });
                }
            },

            editor: function () {

                this.model.set('checkID', this.options.oid);
                Backbone.Radio.channel('fM').trigger('show', this.model);

            },

            anchor: function () {

            },

            up: function () {
                var i = this._index;
                if (i !== 0) {
                    var m = this.model.collection.at(i - 1);
                    this.model.set('cdate', m.get('cdate') - MIN);
                }
            },

            down: function () {
                var e = this.model.collection.length - 1,
                    i = this._index;
                if (i !== e) {
                    var m = this.model.collection.at(i + 1);
                    this.model.set('cdate', m.get('cdate') + MIN);
                }
            },

            first: function () {
                if (this._index !== 0) {
                    var m = this.model.collection.at(0);
                    this.model.set('cdate', m.get('cdate') - MIN);
                }
            },

            last: function () {
                var e = this.model.collection.length - 1;
                if (this._index !== e) {
                    var m = this.model.collection.at(e);
                    this.model.set('cdate', m.get('cdate') + MIN);
                }
            },

            trash: function () {
                this.model.url = "/api/CheckNotes/" + this.options.oid + "?uid=" + this.model.id;
                this.model.destroy();
            }
        }),

        childViewOptions: function () {
            return {
                oid: this.options.oid
            };
        },

        childViewTriggers: {
            'model:sync': 'note:model:sync',
            'note:edit:show': 'note:edit:show'
        }

    });

    const notesView = Mn.CollectionView.extend({

        childView: Mn.View.extend({

            template: templates['note-item'],
            templateContext: {
                Resources: Resources
            },

            regions: {
                notes: '.notes-container',
                child: '.child-container'
            },

            onRender: function () {

                var collection = new Backbone.Collection(this.model.get('collection'));
                collection.comparator = function (m) { return m.get("cdate"); };

                this.showChildView('notes', new noteView({ collection: collection, oid: this.options.oid }));

                if (this.model.get('Childs'))
                    this.showChildView('child', new notesView({ collection: new Backbone.Collection(this.model.get('Childs')), oid: this.options.oid }));

            },

            onChildvewiNoteEditShow: function () {

            },

            childViewTriggers: {
                'note:edit:show': 'note:edit:show',
                'note:model:sync': 'note:model:sync'
            }

        }),

        childViewOptions: function () {

            return {
                oid: this.options.oid
            };
        },

        childViewTriggers: {
            'note:edit:show': 'note:edit:show',
            'note:model:sync': 'note:model:sync'
        }
    });

    return Mn.View.extend({

        className: 'workbench--content',

        template: templates['notes-project'],
        templateContext: {
            Resources: Resources
        },

        regions: {
            notes: '.notes',
            editor: ".htmlEditor"
        },

        ui: {
            print: '.explan-note>h3>a',
            notes: '.explan-note'
        },

        initialize: function () {

            this.collection = new Backbone.Collection;

            if (this.model.has('title')) {

                this.options.isAnal= true;
                this.options.url = function () { return `/Api/CheckResume/${this.get('pref')}${this.get('oid')}`; }

            }

            const _id = this.model.id || this.model.get('projectId');

            this.model = new modelNotes({
                oid: _id,
                printUrl: `#/print/${_id}`
            });

            if (this.options.url)
                this.model.url = this.options.url;
        },

        onAttach: function () {

            this.showChildView('editor', new ejRTEView({ height: this.$el.height() * 0.8 }));

            this.model.fetch();

        },

        modelEvents: {

            'change:printUrl': function (m, v) {

                this.ui.print.attr('href', v);
            },

            sync: function (m, a) {

                if (a && a.length)
                    this.model.set(a[0]);

                if (!this.model.get('NoteHtml') && this.options.isAnal)
                    this.model.set('NoteHtml', Resources.noteTemplate);

                this.getChildView('editor').ejRTE.option('value', this.model.get('NoteHtml'));

                this.showChildView('notes', new notesView({ collection: this.collection, oid: this.model.get('oid') }));

                const tools = [
                    { id: '_saveNotes', className: 'save', title: Resources.save, side: 'left' },
                    { id: '_topChangeState', side: 'right', isView: true, view: dropDown, options: { collection: resultCollection, current: this.model.get('State') } }
                ];

                this.triggerMethod('render:tools', tools);

                this.collection.url = "/api/CheckNotes/" + this.model.get('oid');
                this.collection.fetch({ reset: true });

            }
        },

        collectionEvents: {

            reset: function () {

                if (this.collection.length)
                    this.ui.notes.show();
                else
                    this.ui.notes.hide();
            }

        },

        childViewEvents: {

            'note:model:sync': function () {

                this.collection.fetch({ reset: true });

            },

            'note:edit:show': function (r) {

                this.getChildView('notes').children.each(function (v) {

                    v.getChildView('notes').children.each(function (a) {
                        a.ui.ep.hide();
                        a.ui.text.removeClass("note-editing");
                    });

                    if (v.getRegion('child').hasView())
                        v.getChildView('child').children.each(function (b) {
                            b.getChildView('notes').children.each(function (c) {
                                c.ui.ep.hide();
                                c.ui.text.removeClass("note-editing");
                            });
                        });
                });

                r.ui.text.addClass("note-editing");
                r.ui.ep.show();
            }
        },

        _topChangeState: function (v) {

            let m = v.getChildView('vv').current;

            this.model.set({
                State: m.id,
                StateTitle: m.get('title'),
            });

        },

        _saveNotes: function (m) {

            this.model.set('pref', 'Add?oid=');

            this.model.save({                
                NoteHtml: this.getChildView('editor').ejRTE.getHtml()
            });
        },
    });

});