define('project', ['i18n!nls/resources.min', 'model:project', 'project:objects', 'project:origin', 'project:resume'],

    function (Resources, inquiryModel, projectObjectsView, projectOriginView, projectResumeView) {

        return Mn.View.extend({

            className: 'workbench--content',

            template: _.template('<div id="content"></div>'),

            regions: {
                content: {el:'#content', replaceElement:true}
            },

            initialize: function () {

                this.model = new inquiryModel;

                this.points = [];
                this.menu = {
                    'project:objects': projectObjectsView,
                    'project:origin': projectOriginView,
                    'project:resume': projectResumeView
                };

                Backbone.Radio.channel('side').reply('sidebar:click:item', function (o) {

                    var name = o.get('name');
                    if (!this.points[name]) {
                        var v = this.menu[name];
                        this.points[name] = new v({ model: this.model });
                    }

                    this.getRegion('content').detachView();
                    this.getRegion('content').show(this.points[name]);
                    this.points[name].initTools();

                }.bind(this));
            },

            onRender: function () {              

                this.model.fetch();
            },

            modelEvents: {

                sync: function () {

                    //$.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { prjid: this.model.id });

                    //Backbone.Radio.channel('crumbs').request('reset:crumb', [
                    //    { id: 0, title: Resources.ile },
                    //    { id: 1, path: this.model.id, title: this.model.get('ProjectName') }
                    //]);

                    //this.triggerMethod('render:crumbs', { path: `${}/this.model.id`, title: this.model.get('ProjectName') });

                    //Backbone.Radio.channel('side').request('get:sidebar').setCurrent(['inuiry-objects']);

                }

            }

           
        });

    });