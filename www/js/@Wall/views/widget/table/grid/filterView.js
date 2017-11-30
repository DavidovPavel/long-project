define('widget.table.filter', ['i18n!nls/resources.min'], function (Resources) {

    var listRubrics = Mn.CollectionView.extend({

        emptyView: Mn.View.extend({
            template: _.template('<p><%- Resources.norubric %></p>'),
            templateContext: { Resources: Resources }
        }),

        childView: Mn.View.extend({

            tagName: 'span',
            className: 'g-form--input',

            template: _.template('<input class="g-form--checkbox" type="checkbox" checked id="<%- prefix %><%- value.replace(/ /g, \'\') %>" name="<%- prefix %><%- value.replace(/ /g, \'\') %>" /><label for="<%- prefix %><%- value.replace(/ /g, \'\') %>"><%- value %></label>'),
            templateContext: function() {
            	return {
            		prefix: this.options.prefix
            	}
            },

            ui: {
                chbx: 'input'
            },

            //events: {
            //	'click': function(e) {

            //		if (e.target.nodeName.toLowerCase() === 'input') {

            //			this.triggerMethod('click:item', this);

            //		}
            //    }
            //},


            triggers: {
            	'click input': {
            		event: 'click:item',
            		preventDefault: false,
            		stopPropagation: true
            	}
            }

        }),

        childViewOptions: function () {

        	return {
        		prefix: this.options.prefix
        	}

        },

        childViewTriggers: {
            'click:item': 'filter:apply'
        }
    });

    return Mn.View.extend({

        className: 'filter-panel anbr-tabs',

        template: templates['filter-panel'],
        templateContext: { Resources: Resources },

        ui: {
            input: 'input[name="searchInWidget"]',
            rTab: 'span[data-name="rubrics-panel"]',
            sTab: 'span[data-name="search-panel"]',
            rPan: '#rubrics-panel',
            sPan: '#search-panel'
        },

        regions: {
            list: '.list-area'
        },

        initialize: function () {
            this.collection = new Backbone.Collection;
        },

        onRender: function () {

        	this.showChildView('list', new listRubrics({ collection: this.collection, prefix: this.model.id }));
        },

        childViewEvents: {

            'filter:apply': function (v) {

                v.model.set("hide", !v.ui.chbx.prop('checked'));

            }

        },

        childViewTriggers: {

        	'filter:apply': 'filter:apply'
        },

        events: {

        	"click nav span:not(.right)": function (e) {

                var $p = $(e.target).closest("span");
                this.$("nav span").removeClass("active");
                this.$("section").hide();

                $p.addClass("active");
                this.$("section#" + $p.attr("data-name")).show();

            },

        	"click nav span.right": function () {

        		this.$el.slideToggle();

            },

            "click button.search": function () {

                var val = this.ui.input.val();
                if ($.trim(val))
                    this.triggerMethod("filter:search", val);
                else
                	this.triggerMethod("filter:apply");

            },

            'click button.cancel': function () {

            	this.ui.input.val('');

            	this.triggerMethod("filter:apply");

            	//this.$el.slideToggle();

            }
        },

        hideRubrics: function () {

            this.ui.rTab.hide();
            this.ui.rPan.hide();
            this.ui.sTab.addClass('active');
            this.ui.sPan.show();

        },

        showRubrics: function () {

            this.ui.rTab.addClass('active');
            this.ui.rPan.show();

        }

    });


});