define('settings.htmlEditor',
	[
		'requestView',
		'g/ejRTEView'
	],
function (requestsList, ejRTEView) {

    return Mn.View.extend({

        template: _.template('<div class="list" style="display:none;height:196px;margin-bottom:10px;"></div><div class="editor"></div>'),

        regions: {
            reqArea: '.list',
            editor: '.editor'
        },

        onAttach: function () {

        	if (!this.getRegion('editor').hasView()) {

        		let p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: "WidgetRunDirection" }) || { WidgetParamValue: { Right: false } };

        		this.showChildView('editor', new ejRTEView({
        			value: this.model.get('contentHtml'),
        			enableRTL: p.WidgetParamValue.Right
        		}));

        	}

            this.getRegion('reqArea').show(new requestsList({ model: new Backbone.Model({ typeName: 'All', widgetID: this.model.id }) }));
            this.getChildView('reqArea').ui.description.hide();

            this.getChildView('reqArea').model.on('change:requestParameters', function (model) {

                var data = model.get('requestParameters');

                if (data.rid) {

                    this.model.set({ "requestParameters": data });

                    var text = this.getChildView('editor').ejRTE.getSelectedHtml();

                    if (!$.trim(text))
                        text = '<svg style="fill:#666666; width:24px; height:24px;"><path d="M15,0.279C14.704,0.106,14.365,0,14,0h-1H4C2.9,0,2,0.9,2,2v10c-0.735,0-1.373,0.406-1.721,1C0.106,13.296,0,13.635,0,14s0.106,0.704,0.279,1C0.627,15.594,1.265,16,2,16h1h6h1h1c1.1,0,2-0.9,2-2v-1v-2V6V4h2h1V3V2 C16,1.265,15.594,0.627,15,0.279z M7.279,15H7H3H2c-0.552,0-1-0.449-1-1s0.448-1,1-1h1h4h0.279C7.106,13.296,7,13.635,7,14 S7.106,14.704,7.279,15z M12,6v5v2v1c0,0.551-0.449,1-1,1h-1H9c-0.552,0-1-0.449-1-1s0.448-1,1-1h1v-1H9H3V2c0-0.551,0.448-1,1-1 h8.279C12.106,1.296,12,1.635,12,2v1v1V6z M13,3V2c0-0.551,0.449-1,1-1s1,0.449,1,1v1H13z"></path></svg>';

                    this.getChildView('editor').ejRTE.executeCommand("inserthtml", `<span data-oknd='4' data-oid='${data.rid}' title='${data.title}'>${text}</span>`);

                } else 
                    this.model.set({ "requestParameters": {} });


            }, this);

        },

        toolsButtonShowRequests: function () {
            //this.getRegion('reqArea').currentView.collection.fetch({ reset: true });
            this.getRegion('reqArea').$el.toggle();
        },

        onSave: function () {

            if (this.model.get('requestParameters') && this.model.get('requestParameters').rid)
                $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.headers.key, { RID: this.model.get('requestParameters').rid });

            this.model.save({ "contentHtml": this.getChildView('editor').ejRTE.getHtml() });
        },

        onReset: function () {

            if (this.getRegion('reqArea').collection)
                this.getRegion('reqArea').collection.fetch({ reset: true });

            this.model.set({ "requestParameters": {} });

        }

    });
});