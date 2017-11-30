define('services.sources.mainView_new', ['i18n!nls/resources.min', 'filtersSourcesView', 'listSourcesView'], function (Resources, Filters, List) {

    return Mn.View.extend({

    	template: templates['new-search'],
        templateContext: {
            Resources: Resources
        },

        events: {
        },

        ui: {
        },

        initialize: function () {
        },

        regions: {
        },

        onBeforeRender: function () {

        },

        onRender: function () {


        },

        collectionEvents: {

        },

        childViewEvents: {
        },
    });
});