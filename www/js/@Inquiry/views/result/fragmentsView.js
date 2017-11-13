define('result/fragmentsView', ['i18n!nls/resources.min', 'global.view.dropDown'], function (Resources, dropDown) {

    
    var modelNote = Backbone.Model.extend({

        defaults: {
            id: null,
            SourceObject_ID: null,
            Html: '',
            HtmlOrig: '',            
            Sections: [],
            NeedCreateFact: false,
            Url: $.ajaxSettings.url
        },

        validate: function (attr) {

            var output = [];

            if (!attr.SourceObject_ID)
                output.push('SourceObject_ID');

            if (!attr.Sections.length)
                output.push(Resources.rb + ' ' + Resources.notselected2 + '.');

            if (output.length)
                return output;
        }
    });

   
    // элемент управления фрагментами в тулбаре

    return Mn.View.extend({

        className: '',
        tagName: 'span',

        template: _.template('<i><%- Resources.ms2 %></i><div class="g-dropdown--menu"></div>'),
        templateContext: {
            Resources: Resources
        },

        regions: {
            dd: { el: '.g-dropdown--menu', replaceElement: true }
        },

        events: {


            'click div.g-dropdown--menu': function (e) {
                e.stopPropagation();
            },

            'click i': function () {

                var selectText = this.model.get('title');

                if ($.trim(document.getSelection().toString()))
                    selectText = '<b>' + selectText + '</b><p>' + $.trim(document.getSelection().toString()) + '</p>';

                var note = new modelNote({
                    Html: selectText,
                    HtmlOrig: selectText,
                    checkID: this.model.get('checkID'),
                    SourceObject_ID: this.model.id
                });

                note.collection = this.collection;

                Backbone.Radio.channel('fM').trigger('show', note);
            }
        },

        initialize: function () {

            this.collection = new Backbone.Collection([], { model: modelNote });

            //this.listenTo(Backbone.Radio.channel('fM'), 'saved', this.savedNote);

        },

        onChildviewDropdownClickCmd: function (v) {

            var e = $(event.target).attr('class'),
                uid = v.model.id,
                model = this.collection.get(uid);

            model.set({ 'checkID': this.model.get('checkID') });

            if (e === 'edit')
                Backbone.Radio.channel('fM').trigger('show', model);

            if (e === 'clear') {
                v.model.collection.remove(v.model);
                model.url = "/api/CheckNotes/" + this.model.get('checkID') + "?uid=" + uid;
                model.destroy();
            }
            
        },

        onBeforeRender: function () {

            this.$el.attr('toolbar-icon', 'gear');

            if (this.model.id && this.model.has('checkID')) {
                this.collection.url = '/api/CheckNotes/GetFor/' + this.model.get('checkID') + '?id=' + this.model.id;
                this.collection.fetch({ reset: true });
            }
        },

        modelEvents: {

            'change:id': function () {

                this.collection.url = '/api/CheckNotes/GetFor/' + this.model.get('checkID') + '?id=' + this.model.id;
                this.collection.fetch( { reset: true });

            }
        },

        collectionEvents: {

            add: function () {

                if (!this.getRegion('dd').hasView())
                    this.showChildView('dd', new dropDown({ collection: new Backbone.Collection(this.parse()) }));
                else
                    this.getChildView('dd').collection.reset(this.parse());
            },

            remove: function () {

                if (!this.collection.length) {
                    this.getRegion('dd').empty();
                    Backbone.Radio.channel('fM').trigger('remove:item', this.model.id);
                }
            },

            reset: function () {

                if (this.collection.length)
                    this.showChildView('dd', new dropDown({ collection: new Backbone.Collection(this.parse()) }));
                else
                    if (this.getRegion('dd').hasView())
                        this.getRegion('dd').empty();
            }
        },

        parse: function () {

            var output = this.collection.map(function (m) {
                return {
                    id: m.id,
                    title: _.chain(m.get('Sections')).map(function (a) { return a.title; }).value().join('-') + ' : ' + m.get("Html").substr(0, 10) + '...',
                    cmd: [ 'edit', 'clear' ]
                };
            });
            return output;

        }
    });
    
});