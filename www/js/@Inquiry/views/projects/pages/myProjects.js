define('my',
    [
        'i18n!nls/resources.min',                 
        'projects'
    ],
function (Resources, projectsView) {

    return projectsView.extend({
        initialize: function () {
            this.collection.url = $.mergeUrlParam('/api/inquiry/', { me: 1, state: 0, page: 1 });
        }
    });

});