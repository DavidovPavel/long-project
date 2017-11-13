define('radio:fragments',
    [
    'i18n!nls/resources.min'
    ],
function (Resources) {

    var dm = {
        icon: 'icon-gear',
        title: Resources.ms,
        color: 'green',
        toolbar: [
                { id: 'add', icon: 'add', className: 'add disabled', tooltip: Resources.add },
                { id: 'rename', icon: 'rename', className: 'rename disabled', tooltip: Resources.editItem },
                { id: 'clear', icon: 'trash', className: 'trash disabled', tooltip: Resources.deleteItem },
                { id: 'search', className: 'search', template: '<span class="g-form--input input-data"><input type="text" name="search-name" value="" class="g-form--input" placeholder="Enter keyword"/><i class="search rtl-1" name="search"></i></span>' }
        ],
        footer: [
            { id: 'save', title: Resources.save, className: 'right' },
            {
                id: 'NeedCreateFact',
                title: Resources.addFact,
                className: 'left',
                template: '<input name="<%- id %>" type="checkbox" id="<%- viewid +\'_\'+ id %>" class="g-form--checkbox"><label for="<%- viewid +\'_\'+ id %>"><%- title %></label>'
            }
        ]
    };

    var channel = Mn.Object.extend({

        channelName: 'fM',

        radioEvents: {

            show: function (model) {

                this.collection = new Backbone.Collection(model.get('Sections'));

                dm.content = new editor({ width: 540, height: 508, value: model.get("Html") });

                dm.sidebar = new treeView({ collection: new Backbone.Collection, selected: this.collection.pluck('id') });
                dm.sidebar.collection.url = '/api/rubrics/notesections/oid' + model.get('checkID');
                dm.sidebar.collection.fetch({ reset: true });

                this.listenTo(dm.sidebar, 'click:select:input', function (v) {

                    if (!v.options.parent) return;

                    if (v.model.get('selected'))

                        this.collection.add({
                            id: v.model.id,
                            title: v.model.get('title'),
                            pid: v.options.model.get('parentid'),
                            parentТitle: v.options.parent ? v.options.parent.get('title') : ''
                        });

                    else {

                        var m = this.collection.get(v.model.id);
                        this.collection.remove(m);

                    }
                });


                var dialog = Backbone.Radio.channel('Notify').request('once:dialog', dm);

                this.listenTo(dialog, 'footer:button:click', function (v) {

                    if (v.model.id === 'save') {

                        model.set({
                            Sections: this.collection.toJSON(),
                            Html: dm.content.ejRTE.getHtml(),
                            NeedCreateFact: !!v.model.collection.get("NeedCreateFact").get('selected')
                        });

                        model.url = "/api/CheckNotes?oid=" + model.get('checkID');

                        if (model.isValid())
                            model.save({}, {

                                wait: true,
                                success: function (model, arr) {

                                    dialog.$el.hide();

                                    _.each(arr, function (o) {
                                        Backbone.Radio.channel('fM').trigger('add:new:fragment', new Backbone.Model(o));
                                    });

                                }.bind(this)
                            });
                        else
                            dialog.getChildView('notify').showNotify(model.validationError.join('<br/>'));
                    }
                });

            }
        }
    });

    var ch = new channel;

    return ch;

});