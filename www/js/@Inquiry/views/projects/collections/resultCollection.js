define('projects:resultCollection', ['i18n!nls/resources.min'], function (Resources) {

    return new Backbone.Collection([
                  { id: 0, icon: "", title: Resources.stateResult },
                  { id: 1, icon: "icon-status--green", title: Resources.positive },
                  { id: 2, icon: "icon-status--yellow", title: Resources.doubts },
                  { id: 3, icon: "icon-status--red", title: Resources.negative },
                  { id: 4, icon: "icon-status--grey", title: Resources.di }
    ]);

});