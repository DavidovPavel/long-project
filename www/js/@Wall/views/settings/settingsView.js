
define('settingsView', [
    'i18n!nls/resources.min',
    'settings.legendMap',
    'settings.reportingView',
    'settings.baseOptions',
    'settings.visualization.chart',
    'settings.decorationWidget',
    'settings.reqparams',
    'settings.chain',
    'settings.htmlEditor',
    'settings.subscribe',
    'settings.visualization.cloud',
    'settings.visualization.table',
    'settings.visualization.semnet',
    'global.view.dialog'
],
    function (
        Resources, legendView, reportingSettings, baseOptions, visualizationChart,
        decoration, reqparams, chain, htmlEditor, subscribe, cloudSettings,
        visualizationTable, semnetSettings, dialogView ) {

    return Mn.View.extend({

        className: "settings",

        template: _.template('<div></div>'),

        events: {

            "mousedown": function (e) {
                e.stopPropagation();
            }

        },

        regions: {
            dialog: { el: 'div', replaceElement: true }
        },

        initialize: function () {

            //var decoration = this.model.has("Decoration") ?
            //   this.model.get("Decoration") :
            //    {
            //        CaptionBackground: "rgba(200, 188, 162, 1)", CaptionForeground: "rgba(51, 51, 51, 1)",
            //        ContainerBackground: "rgba(255, 255, 255, 1)", ContainerForeground: "rgba(51, 51, 51, 1)",
            //        LinkBackground: "rgba(0, 0, 0, 0)", LinkForeground: "rgba(70, 127, 212, 1)",
            //        CaptionIsVisible: true, BorderIsVisible: true, ContainerIsTransparent: false
            //    };

            //if (!this.model.has("Decoration"))
            //    this.model.set("Decoration", decoration);

        },

        onRender: function () {

            this.showChildView('dialog', new dialogView({
                autoOpen: false,
                header:{ manage: [{ id: 'close' }]},
                footer: new Backbone.Collection([
                           { id: 'onSave', title: Resources.apply, className: 'blue right' },
                           { id: 'onReset', title: Resources.reset, className: 'right nest-left' }
                ])
            }));

        },

        modelEvents: {

            invalid: function (m, err) {

                this.getChildView('dialog').getChildView('notify').showNotify(Resources.error);

                _.each(err, function (o) {
                    this.currentView.$('[name=' + o.name + ']').addClass('error');
                }, this);

                setTimeout(function () {
                    this.currentView.$('.error').removeClass('error');
                }.bind(this), 3000);
            }

        },

        getMenu: function () {

            var typeName = this.model.get('typeName'),
                sm = [];

            var subscibeCollection = this.options.subscibeCollection;

            this.menu = {
                baseOptions: { id: "baseOptions", title: Resources.m1, icon: 'gear', content: baseOptions },
                visualizationTable: { id: 'visualizationTable', title: Resources.m2, icon: 'eye', content: visualizationTable },
                visualizationChart: { id: "visualizationChart", title: Resources.m2, icon: 'eye', content: visualizationChart },
                visualizationCloud: { id: 'visualizationCloud', title: Resources.m2, icon: 'eye', content: cloudSettings },
                visualizationLegendMap: { id: "visualizationLegendMap", title: Resources.m7, icon: 'legend', content: legendView },
                visualizationSemnet: { id: 'visualizationSemnet', title: Resources.m2, icon: 'eye', content: semnetSettings },
                requestParams: { id: 'requestParams', title: Resources.m12, icon: 'script-settings', content: reqparams },
                chainDependencies: { id: 'chainDependencies', title: Resources.m13, icon: 'anchor', content: chain },
                decoration: { id: "decoration", title: Resources.m3, icon: 'appearance', content: decoration },
                htmlEditor: { id: "htmlEditor", title: Resources.m6, icon: 'pen', content: htmlEditor, toolbar: [{ id: 'toolsButtonShowRequests', title: Resources.selectRequest, className: 'script-create' }] },
                subscribe: { id: "subscribe", title: Resources.m4, icon: 'new-mail', content: subscribe, args: { model: this.model, collection: subscibeCollection } },
                reportingSettings: { id: "reportingSettings", title: Resources.m10, icon: 'reports', content: reportingSettings, args: { wid: this.model.id, publishers: subscibeCollection } },
                clearWidget: { id: 'clearWidget', title: Resources.del, icon: 'trash' }
            };

            var menu = this.menu;

            switch (typeName) {

                case 'WidgetTable':
                    sm = [menu.baseOptions, menu.visualizationTable, menu.requestParams, menu.chainDependencies, menu.decoration, menu.clearWidget];
                    break;

                case 'WidgetRunning':
                    sm = [menu.baseOptions, menu.requestParams, menu.chainDependencies, menu.decoration, menu.clearWidget];
                    break;

                case 'WidgetGraph':
                    sm = [menu.baseOptions, menu.visualizationChart, menu.requestParams, menu.chainDependencies, menu.decoration, menu.clearWidget];
                    break;

                case 'WidgetCloud':
                    sm = [menu.baseOptions, menu.visualizationCloud, menu.requestParams, menu.chainDependencies, menu.decoration, menu.clearWidget];
                    break;

                case 'WidgetMap':
                    sm = [menu.baseOptions, menu.visualizationLegendMap, menu.requestParams, menu.chainDependencies, menu.decoration, menu.clearWidget];
                    break;

                case 'WidgetHtml':
                    sm = [menu.baseOptions, menu.htmlEditor, menu.requestParams, menu.chainDependencies, menu.decoration, menu.clearWidget];
                    break;

                case 'WidgetSource':
                    sm = [menu.baseOptions, menu.subscribe, menu.decoration, menu.clearWidget];
                    break;

                case 'WidgetReporting':
                    sm = [menu.baseOptions, menu.reportingSettings, menu.subscribe, menu.decoration, menu.clearWidget];
                    break;

                case 'WidgetSemNet':
                    sm = [menu.baseOptions, menu.visualizationSemnet, menu.subscribe, menu.decoration, menu.clearWidget];
                    break;

            } 

            return sm;
        },

        hide: function (fx) {

            if (this.getRegion('dialog') && this.getRegion('dialog').hasView())
                this.getChildView('dialog').close();

            //else if (fx)
            //    fx.call(this);

        },

        _setDialog: function (id) {

            var dm = this.getChildView('dialog').model,
                s = this.menu[id],
                c = s.content;

            if (c) {

                if (s.toolbar)
                    dm.get('toolbar').reset(s.toolbar);
                else
                    dm.get('toolbar').reset();

                // TODO: привести все аргументы к одному виду убрать это...
                var args = { model: this.model, collection: this.collection };

                if (s.args)
                    args = s.args;

                var view = new c(args);

                dm.set({
                    title: s.title,
                    icon: s.icon,
                    content: view
                });

                return view;

            }

            return null;
        },

        sideBarTrigger: function (m) {

            var actView = this._setDialog(m.id);

            if (actView) {

                if (actView.model.get('requestParameters') && actView.model.get('requestParameters').rid)
                    $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.headers.key, { RID: actView.model.get('requestParameters').rid });

                if (actView.onBeforeShow)
                    actView.onBeforeShow();

                var win = $('main'),
                    cv = this.getChildView('dialog').$el,
                    top = win.height() / 2 - cv.height() / 2;

                cv.css({
                    top: top < 90 ? 100 : top,
                    left: win.width() / 2 - cv.width() / 2
                });

                this.getChildView('dialog').$el.show(function () {

                    if (actView.onShow)
                        actView.onShow();

                });

            } else
                this[m.id].call(this);

        },

        clearWidget: function () {

            Backbone.trigger("message:confirm", {

                title: Resources.askyousure, message: $.Format(Resources.deltext, Resources.widget, this.model.get("title")),

                fx: function () {

                    this.model.destroy();

                },

                ctx: this
            });
        }
    });

});