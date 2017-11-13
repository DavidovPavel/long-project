
define('settings.baseOptions', ['i18n!nls/resources.min', 'global.request.param'], function (Resources, paramView) {

    return Mn.CollectionView.extend({

        childView: Mn.View.extend({

            template: '#base-setting-template',

            regions: {
                params: { el: '#params', replaceElement: true }
            },

            onBeforeRender: function () {

                if (!this.model.has('type'))
                    this.model.set('type', '');
            },

            onRender: function () {

                //if (this.model.get('name') === 'MainEntity')
                //    this.showChildView('params', new paramView({
                //        attributes: {
                //            ParametrType: 'Object',
                //            Name: 'MainEntity',
                //            DisplayValue: this.model.get('value').DisplayValue,
                //            Value: this.model.get('value').Value,
                //            Caption: this.model.get('displayName')
                //        }}));

            }

        }),

        initialize: function () {

            this.collection = new Backbone.Collection([
                { displayName: Resources.title, name: 'title', value: this.model.get('title'), type: 'text' },
                { displayName: Resources.updatingContent, name: 'update', value: this.model.get('update'), type: 'checkbox' },
                { displayName: Resources.timeoutUpdate, name: 'timeUpdate', value: this.model.get('timeUpdate'), type: 'text' }
            ]);

            if (this.model.get('typeName') === 'WidgetSource') {

                let o = Backbone.Radio.channel('chW').request('get:param:model', this.model.get('Characteristics'), "WidgetSource.Options");

                if (!o.has('WidgetParamValue'))
                    o.set('WidgetParamValue', { hideRubrics: false });

                this.collection.add([
                    { displayName: Resources.hideRubrics, name: 'hideRubrics', value: !!o.get('WidgetParamValue').hideRubrics, type: 'checkbox' },
                    { displayName: Resources['contain-html'], name: 'isHtmlContent', value: !!this.model.get('isHtmlContent'), type: 'checkbox' },
                    { displayName: Resources.highlightMentionObj, name: 'highlightMentionObj', value: !!this.model.get('highlightMentionObj'), type: 'checkbox' },
                    {
                        displayName: Resources.contentProp, type: 'select', name: 'contentProp', value: [
                              { value: '', title: '...' },
                              { value: 'TextSource', title: 'TextSource', checked: this.model.get('contentProp') === 'TextSource' },
                              { value: 'WebFile', title: 'WebFile', checked: this.model.get('contentProp') === 'WebFile' }
                        ]
                    },
                    { displayName: Resources.emc, name: 'extractOnlyMedia', value: !!this.model.get('extractOnlyMedia'), type: 'checkbox' }
                ]);
            }

            if (this.model.get('typeName') === 'WidgetTable') {

                this.collection.add([
                    { displayName: Resources.markAfSel, name: 'isMarkSelectedItem', value: !!this.model.get('isMarkSelectedItem'), type: 'checkbox' }
                ]);

            }


            if (this.model.get('typeName') === 'WidgetRunning') {

            	let o = Backbone.Radio.channel('chW').request('get:param:model', this.model.get('Characteristics'), "WidgetRunDirection");

            	if (!o.has('WidgetParamValue'))
            		o.set('WidgetParamValue', { Right: false });

            	this.collection.add([
                    {
                    	displayName: `${Resources.dire} ( ${Resources.toright} )`,
                    	name: 'WidgetRunDirection',
                    	value: !!o.get('WidgetParamValue').Right,
                    	type: 'checkbox'
                    }
            	]);

            }

            if (this.model.get('typeName') === 'WidgetSemNet') {

                var value = Backbone.Radio.channel('chW').request('get:param:model', this.model.get('Characteristics'), "WidgetSource.Options").WidgetParamValue || { DisplayValue: '', Value: [] };

                this.collection.add([
                    { displayName: Resources.bsno, name: 'MainEntity', value: value }
                ]);

            }

        },      

        childViewOptions: function (m) {
            m.set('prefix', this.model.id);
        },

        onSave: function () {

            var data = $.GetData(this.$el);

            var o = Backbone.Radio.channel('chW').request('get:param:model', this.model.get('Characteristics'), "WidgetSource.Options");
            o.set('WidgetParamValue', { hideRubrics: data.hideRubrics });

            var a = Backbone.Radio.channel('chW').request('get:param:model', this.model.get('Characteristics'), "WidgetRunDirection");
            a.set('WidgetParamValue', { Right: data.WidgetRunDirection });

            var saveCollection = Backbone.Radio.channel('chW').request('get:params:collection', this.model.id);
            saveCollection.add([o, a]);

            saveCollection.fetch({
            	success: function (res) {

            		data.Characteristics = res.toJSON();
            		this.model.save(data);

                }.bind(this)

            });
            
        }
    });
});