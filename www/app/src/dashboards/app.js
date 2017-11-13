
$.ajaxSetup( {
    headers: {
        'key': $.ajaxSettings.url
    }
});

document.addEventListener('DOMContentLoaded', () => {

    var appRouter = Mn.AppRouter.extend({

        routes: {

            '': function () {
                //dashboards.getView().showFirst('my');
            },

            'demo': function () {
                dashboards.getView().showFirst('shared');
            },

            'new': function () {
                dashboards.getView().options.uid = null;
                dashboards.getView().onShow();
            },

            ':uid': function (uid) {
                dashboards.getView().options.uid = uid;
                dashboards.getView().onShow();
            }

        }
    });

    const app = Mn.Application.extend({

        region: { el: 'main', replaceElement: true },

        onStart () {

            this.showView(new mainView);

            //new Header().render();

            Backbone.history.start();

        }

    });


    new appRouter;
    var dashboards = new app;
    dashboards.start();

});