define('source:content', ['baseurl', 'app', 'i18n!nls/resources.min', 'global.view.dropDown', 'result/fragmentsView', 'dist/video-js/video'],

function (baseurl, App, Resources, dropDownView, fragmentsView) {

    //radialmenuTemplate = '<div id="apiradialmenu"><ul><li data-ej-imageurl="/images/ico_ap.svg"></li>' +
    //            '<li data-ej-imageurl="/images/ico_ao.svg"></li>' +
    //            '<li data-ej-imageurl="/images/ico_aa.svg"></li>' +
    //            '<li data-ej-imageurl="/images/ico_ac.svg"></li></ul></div>';


    var contentModel = Backbone.Model.extend({
        idAttribute: "uid",
        defaults: {
            uid: '',
            Object_ID: '',
            Display_Name: '',
            SystemTypeName: '',
            TextSource: '',
            Author: '',
            MassMedia: '',
            URL_источника: '',
            MediaUrl: '',
            PlayingAt: '',
            PlayingUntil: ''
        }
    });

    return Mn.CollectionView.extend( {

        childView: Mn.View.extend({

            template: templates['content-item-source'],

            ui: {
                rubrs: '#link-rubrics',
                title: 'h3',
                text: '.format'
            },

            initialize: function () {

                this.hideToolbar = this.options.hideToolbar || false;

                Backbone.Radio.channel('tools').reply('tools:click:item', function (o) {

                    if (typeof this[o.model.id] === 'function')
                        this[o.model.id](o.model.get('value'));

                }.bind(this));


                Backbone.Radio.channel('crumbs').request('add:new:crumb', [
                              {
                                  id: 3,
                                  path: 'path',
                                  title: this.model.get("display_name")
                              }
                ], { remove: false });

            },

            onRender: function () {

                var rubrics = this.model.get('contentcollection_rubrics');
                if ($.trim(rubrics))
                    this.ui.rubrs.html(`${Resources.linkToRubricTitle}: <span>${rubrics}</span>`);

                if (this.model.get('massmedia') && this.model.get('url_источника'))
                    this.$('.media')
                        .append(`<a class="link" href="${this.model.get('url_источника')}" target="_blank">${this.model.get('massmedia')}&nbsp;&raquo;</a>`);

                if ( !this.hideToolbar )
                    this._initTools();
            },

            modelEvents: {

                'change:textsource': function (m, v) {
                    this.ui.text.html(v);
                },

                'change:links': function () {
                    this._initTools();
                }
            },

            _initTools: function () {

                var tools = this.model.get('links'),
                    uid = this.model.get("uid"),
                    id = this.model.get("object_id");

                var dropDownCollection = new Backbone.Collection([

                     { id: 0, title: Resources.originaldoc },

                     {
                         id: id + "/original/" + uid, title: Resources.opennewtab, icon: 'open-link',
                         fn: function () {
                             window.open("#" + id + "/original/" + uid);
                         }
                     },

                     {
                         id: baseurl + "/files/OriginalDoc/" + id, title: Resources.savetodisc, icon: 'save-document',
                         fn: function () {
                             window.open(baseurl + "/files/OriginalDoc/" + id, '_self');
                         }
                     }
                ]);

                var classes = {
                    translate: { className: 'lang' },
                    toOriginal: { className: 'lang' },
                    showOriginalDoc: { className: 'doc', view: dropDownView, side: 'right', options: { collection: dropDownCollection } },
                    shortText: { className: 'doc' }
                };

                this.tools = tools
//                    .filter(o => o.id !== 'translate')
                    .map(o => {

                    var output = {
                        id: o.id,
                        title: o.prompt,
                        value: {
                            href: o.href,
                            verb: o.verb
                        }
                    };
                    return Object.assign(output, classes[o.id]);

                });
                /*
                this.tools.push({
                    id: 'fragments',
                    className: 'select-text',
                    title: Resources.ms2,
                    view: fragmentsView,
                    options: {
                        model: new Backbone.Model({
                            id: this.model.get('object_id'),
                            checkID: this.options.checkid,
                            title: this.model.get("display_name")
                        })
                    }
                });
                */

                Backbone.Radio.channel('tools').request('get:tools').collection.reset(this.tools);

            },

            translate: function (o) {
                this._send(o);
            },

            toOriginal: function (o) {
                this._send(o);
            },

            shortText: function (o) {
                this._send(o);
            },

            _send: function (o) {

                Backbone.Radio.channel('loader').trigger('show', this.ui.text);

                $.ajax({ url: o.href, method: o.verb }).done(function (item) {

                    if (_.has(item, 'version'))
                        item = item.items[0];

                    this.model.set({ links: item.links, textsource: _.findWhere(item.data, { systemName: 'textsource' }).value });

                    Backbone.Radio.channel('loader').trigger('hide');

                }.bind(this));
            }

        }),

        childViewOptions: function() {
            return {
                hideToolbar: this.options.hideToolbar,
                checkid: this.model.id
            };
        }

    });

});