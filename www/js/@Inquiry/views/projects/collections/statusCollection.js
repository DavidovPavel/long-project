define('projects:statusCollection', ['i18n!nls/resources.min'], function (Resources) {

    return new Backbone.Collection([
                 { id: 0, icon: 'icon-all', title: Resources.fva },
                 { id: 1, icon: 'icon-inwork', title: Resources.working },
                 { id: 2, icon: 'icon-finished', title: Resources.ff },
                 { id: 3, icon: 'icon-clock', title: Resources.tm },
                 { id: 4, icon: 'icon-archive', title: Resources.ar }
    ]);

});