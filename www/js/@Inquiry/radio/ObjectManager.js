define('radio:objectManager', ['i18n!nls/resources.min', 'global.view.dialog'], function (Resources, dialog) {

    // способ показать модуль из Application
    // Backbone.Radio.channel('oM').request('show:module', 'g/sources/SourcesView', m);

    var om = Mn.Object.extend({
        channelName: 'oM',

        radioEvents: {

            'hide:form': function () {
                if (this.form)
                    this.form.destroy();
            }
        },

        radioRequests: {

            // новая модель
            //'init:form': function (model) {

            //    if (model.get('disabled')) return;

            //    var dicid = model.get('ID');

            //    require([ 'forms/' + dicid + 'View', 'forms/' + dicid + 'Model'],
            //    function (view, objmodel) {

            //        this.form = new view({ model: new objmodel, DicID: dicid }).render();
            //        this.getChannel().trigger('show:form:view', this.form);

            //    }.bind(this));

            //},

            //// данные из списков (существующая модель)
            //'load:form': function (data) {
            //    if (data) {
            //        var sat = { 10021: 1002, 10022: 1003, 10023: 1004 },
            //            dicid = sat[data.typeid];

            //        require(['forms/' + dicid + 'View', 'forms/' + dicid + 'Model'],
            //        function (view, model) {
            //                this.form = new view({ model: new model(data), DicID: dicid }).render();
            //                this.getChannel().trigger('show:form:view', this.form);
            //            }.bind(this));
            //    } else
            //        console.log('no data for semnet');
            //}
        }

    });
    return new om;
});