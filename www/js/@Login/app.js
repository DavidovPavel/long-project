/***

	www/Views/Account/LoginW.cshtml  -  html template
	/js/@global/connectdb/  - вьюкомпонент для конекта к базе через Backbone.Marionette

*/

define(['global.view.headerView'], function (Header) {

    var init = function () {

    	new Header().render();

    	var app = Backbone.View.extend({

    		el: '.SelectForm',

    		events: {

    			'click .btn': function () {

    				$.cookie('Connects', this.$('#DatabaseID').val(), { expires: 30, path: "/" });

    			}

    		},

    		render: function () {

    			var WorkGroups = $.cookie('WorkGroups'),
					DatabaseID = $.cookie('Connects');

    			// еще есть Projects см. /js/@global/connectdb/ он тоже может быть в куках

    			this.$('#DatabaseID').val(DatabaseID);


    		}
    		

    	});

    	new app().render();

    }

    return {
        init: init
    }
});