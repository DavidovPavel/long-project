define('settings.reqparams', ['i18n!nls/resources.min', 'global.request.param'], function (Resources, ParamView) {

    var listView = Mn.CollectionView.extend({

        className: 'list',

        childView: ParamView,

        childViewOptions: function () {

            return {
                rid: this.options.rid,
                dbase: this.options.dbase
            };
        }
    });

    return Mn.View.extend({

        template: _.template(
            `<span class="request-title"><%- Resources.settingsView_reqparams_requestTitle %></span><span class="request-data"><%- reqTitle %></span><br>
            <span class="request-title"><%- Resources.settingsView_reqparams_dbTitle %></span><span class="request-data"><%- dbTitle %></span><br>
            <span class="g-form--input">
                <input class="g-form--checkbox" type="checkbox" name="useDefParams" id="<%- prefix %>_useDefParams" />
                <label for="<%- prefix %>_useDefParams"><%- Resources.default %></label>
            </span>
            <div class="list"></div>`),

        id: "request-params-container",

        templateContext: function () {
            return {
                Resources: Resources,
                prefix: this.model.id,
                reqTitle: this.model.get('requestParameters').requestTitle,
                dbTitle: this.model.get('requestParameters').dbTitle
            };
        },

        regions: {
            area: { el: '.list', replaceElement: true }
        },

        ui: {
            use: 'input[name=useDefParams]'
        },

        events: {

            'change @ui.use': function (e) {
                if (this.ui.use.is(":checked")) 
                    this.getChildView('area').$el.hide();
                 else 
                    this.getChildView('area').$el.show();
            }
        },

        onRender: function () {

            this.showChildView('area', new listView({
                collection: new Backbone.Collection(this.model.get('requestParameters').parameters),
                rid: this.model.get('requestParameters').rid,
                dbase: this.model.get('requestParameters').dbase,
                use: this.model.get('requestParameters').useDefParams
            }));

            var useDefault = this.model.get('requestParameters').useDefParams;
            this.ui.use.prop('checked', useDefault);

            if (useDefault) {
                this.getChildView('area').$el.hide();
            }
        },

        onSave: function () {

            var data = this.model.get('requestParameters');

            var result = [];
            this.getChildView('area').children.each(function (v) {

                result.push(v.model.toJSON());

            });

            var check = result.filter(function (a) {
                return !a.Value.length || !$.trim(a.Value[0]);
            });

            data.parameters = result;
            data.useDefParams = this.ui.use.is(":checked");

            this.model.set({ requestParameters: data });

            /*  *** проблема с сериализацией данных строка типа ISO трансформируется в дату в зависимости от локали клиента *** */

            $.ajax({ url: this.model.url(), method: 'PUT', data: JSON.stringify(this.model.toJSON()), contentType: 'application/json; charset=utf-8' })
                .always(function () {
                    this.model.trigger('sync');
                }.bind(this));

        }

    });

});