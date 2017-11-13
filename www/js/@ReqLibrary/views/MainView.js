define('library.mainView', ['services.library.libraryView'], function (RequestLibrary) {

    return Mn.View.extend({

        className: 'workbench',

        template: _.template('<div id="need"></div><div id="content"></div>'),

        regions: {
            need: { el: '#need', replaceElement: true },
            content: { el: '#content', replaceElement: true }
        },

        initialize: function () {

            // диалог
            Backbone.Radio.channel('Notify').reply('add:dialog', function (dialog) {
                this.showChildView('need', dialog);
            }.bind(this));

        },

        onRender: function () {

            this.showChildView('content', new RequestLibrary({ isDemo: true }));

        }
    });

});