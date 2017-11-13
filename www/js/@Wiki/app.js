require.config({
    paths: {
        '@': "@Wiki",
        d3: '../js/libs/d3/d3.v3.min'
    }
});

define(function (require) {
    
    var $ = require('jquery'),
       App = require('app'),
       Main = require("@/MainView"),
       Left = require("@/LeftView"),
       Right = require("@/RightView"),
       EdgeView = require('g/edge/EdgeView'),
       dom = require("g/Dom");

    var init = function () {

        $.ajaxSetup({
            headers: {
                'key': location.href
            }
        });

        var AppRouter = Backbone.Router.extend({
            routes: {
                ":objid": "todo",
                "": "default"
            }
        });

        var app_router = new AppRouter;
        App.router = app_router;

        var main = new Main,
            left = new Left;

        app_router.on("route:default", function() {

        });

        app_router.on("route:todo", function(objid) {
            main.callback = function() {
                var m = this.collection.get(objid);
                if (m) {
                    main.setMain(m);
                } else {
                    //left.getItem({ id: objid });
                    //main.hide();
                }
            }
        });

        $(".MainMenu .Item .Home").click(function() {
            main.show();
        });
        $(".MainMenu .Item .Document").click(function() {
            main.hide();
        });

        new EdgeView;
        new Right;

        Backbone.history.start();
    }
    return {
        init: init
    }
});