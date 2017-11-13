define(['global.view.headerView'], function (Header) {

    var init = function () {

        new Header().render();

    }

    return {
        init: init
    }
});