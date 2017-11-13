define('project:resume', ['i18n!nls/resources.min', 'global.view.dropDown', 'notesView'], function (Resources, dropDown, notesView) {

    var modelNotes = Backbone.Model.extend({

        defaults: {
            id: null,
            oid: null,
            NoteHtml: '',
            State: 0,
            StateTitle: '',
            printUrl: '',
            pref: 'GetResume?oid='
        },

        url: function () {
            return "/Api/InquiryResume/" + this.get('pref') + this.get('oid');
        }
    });

    var dropDownCollection = new Backbone.Collection([
                  { id: 0, icon: "", title: Resources.stateResult },
                  { id: 1, icon: "icon-status--green", title: Resources.positive },
                  { id: 2, icon: "icon-status--yellow", title: Resources.doubts },
                  { id: 3, icon: "icon-status--red", title: Resources.negative },
                  { id: 4, icon: "icon-status--grey", title: Resources.di }
    ]);

    return Mn.View.extend({

        className: 'project-resume',

        template: _.template('<div id="notes"></div>'),

        regions: {
            notes: { el: '#notes', replaceElement: true }
        },

        onRender: function () {

            this.showChildView('notes', new notesView({ model: new modelNotes, collection: new Backbone.Collection() }));

            if (this.model.id)
                this.getChildView('notes').model.set('oid', this.model.id);

            
        },

        modelEvents: {

            sync: function () {

                this.getChildView('notes').model.set('oid', this.model.id);
            }
        }

        //initTools: function () {

        //    Backbone.Radio.channel('tools').request('get:tools').collection.reset([
        //                   { id: 'saveNotes', className: 'save blue', title: Resources.save, side: 'left' },
        //                   {
        //                       id: 'ddresult', className: '', title: '', side: 'right',
        //                       view: dropDown,
        //                       options: { collection: dropDownCollection },
        //                       current: this.getChildView('notes').model.get('State')
        //                   }
        //    ]);
        //}
    });

});