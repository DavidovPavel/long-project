define('main',
    [
    'i18n!nls/resources.min',
    'tools:crumbs',
    'tools:top',    
    'g/ejRTEView',
    'g/tree',
    'radio:fragments'
    ],
function (Resources, crumbsView, toolsView, editor, treeView) {

    return Mn.View.extend({

        className: 'workbench',

        template: _.template('<div class="crumbs"></div><div class="g-toolbar"></div><div id="need"></div><div id="content"></div>'),

        regions: {
            crumbs: '.crumbs',
            tools: '.g-toolbar',
            content: { el: '#content', replaceElement: true },
            need: { el: '#need', replaceElement: true }
        },

        initialize: function () {

            // диалог
            Backbone.Radio.channel('Notify').reply('add:dialog', function (dialog) {

                this.showChildView('need', dialog);

            }.bind(this));

        },

        onRender: function () {

            this.showChildView('crumbs', new crumbsView);

            this.showChildView('tools', new toolsView);

        },

        childViewEvents: {

            'render:tools': function (a) {

                this.getChildView('tools').collection.reset(a);

            },

            'render:crumbs': function (a) {

                this.getChildView('crumbs').collection.set(a);

            },

            'tools:click:item': function (v) {

                if (this.getChildView('content')[v.model.id])
                    this.getChildView('content')[v.model.id](v);

                if (this.getChildView('content').hasRegion('content') && this.getChildView('content').getChildView('content')[v.model.id])
                    this.getChildView('content').getChildView('content')[v.model.id](v);

            }

        }

    });

});