define('services.library.libraryView', ['i18n!nls/resources.min', 'global.request.param', 'g/tree', 'global.grid.dataItemsView'],

function (Resources, ParamView, treeView, tableView) {

    var queryModel = new Backbone.Model;

    var query = Backbone.Collection.extend( {

        url: '/api/Request/ExecuteV2?page=1',
        sync: function (method, model, options) {
            var json = queryModel;
            json.set('page', this.url.split('?')[1].split('=')[1]);
            json.url = this.url;
            Backbone.Collection.prototype.sync.apply(this, ['create', json, options]);
        }

    });

    var parametersView = Mn.CollectionView.extend( {

        className: "params-container",

        childView: ParamView,

        childViewOptions:function(){
            return {
                rid: this.options.rid,
                dbase: this.options.dbase
            };
        },

        emptyView: Mn.View.extend({
            template: _.template(Resources.N),
            templateContext: { Resources: Resources }
        })

    });

    return Mn.View.extend({

        className: 'request-library',

        template: templates['services-request-library'],
        templateContext: { Resources:Resources },

        events: {

            "click .run:not([data-icon='icon-loader'])": function () {

                this.ui.run.attr('data-icon', 'icon-loader');
                var data = this.getChildView('params').collection.toJSON();

                queryModel.set({
                    id: parseInt(this.requestID),
                    pars: data
                });

                var collection = new query;

                this.showChildView('result', new tableView({ collection: collection, hideButton: true }));
                

                collection.fetch( {

                    reset: true,

                    success: function () {

                        this.ui.run.attr("data-icon", "icon-next");
                        this.getChildView('result').getChildView('table').getChildView('body').$('.btn-link').remove();

                    }.bind(this),

                    error: function (c, xhr) {

                        var m = xhr.responseJSON ? xhr.responseJSON.msg : null;

                        if (m) 
                            this.getChildView('result').$el.html('<i style="color:red">' + Resources.rer + ': <br/>{ ' + m + ' }</i>');
                        else
                            this.getChildView('result').$el.html('<i style="color:red">' + xhr.statusText + '</i>');

                        this.ui.run.attr("data-icon", "icon-next");

                    }.bind(this)

                });

            }
        },

        ui: {
            run: 'button.run',
            result: '.result',
            main: '.main'
        },

        regions: {
            tree: '.left',
            params: { el: '.params', replaceElement: true },
            result: { el: '@ui.result', replaceElement: true }
        },

        onRender: function () {

            this.ui.run.hide();            

            var collection = new Backbone.Collection;
            collection.url = '/api/request' + (this.options.widgetType ? '?widgetType=' + this.options.widgetType : '');

            this.showChildView('tree', new treeView({ collection: collection, node: { checkbox: false } }));

            collection.fetch({ reset: true });

            //if (this.options.isDemo) {
            //    this.$el.addClass("isDemo");
            //    this.getChildView('tree').$el.showIndicator();
            //    this.getChildView('tree').collection.fetch({ reset: true });
            //}
            //else {
            //    this.showChildView('authorise', new Authorise);
            //    this.getChildView('authorise').$el.show();
            //    this.ui.main.hide();
            //}

        },

        onChildviewContainerSelectItem: function (v) {

            var p = v.model.get('parameters') || [];

            if (this.getRegion('result').hasView())
                this.getChildView('result').$el.hide();


            if (v.model.get('isdoc')) {

                this.requestID = v.model.id;

                this.showChildView('params', new parametersView({ collection: new Backbone.Collection(p), dbase: this.options.dbase }));

                this.ui.run.show();
            }
            else {

                if (this.getRegion('params').hasView())
                    this.getChildView('params').collection.reset();

                this.ui.run.hide();

            }            

        },

        onChildviewAuthorizeEnd: function () {

            //this.getChildView('authorise').$el.hide();

            //if (this.getRegion('authorise').hasView())
            //    $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.url, { db: 'db' + this.getChildView('authorise').collection.at(0).id });

            //this.getChildView('tree').$el.showIndicator();
            //this.getChildView('tree').collection.fetch({ reset: true });
            //this.ui.main.show();

            //this.triggerMethod('authorise:end');

        }

    });
});