define('settings.visualization.chart',
[
    'i18n!nls/resources',
    'global.view.dropDown',
    'global.charts.settingsmodel',
    'global.behaviors.input',
    'settings.colorRow',
    'settings.visualisation.chart.choice',
    'radio.characteristic',
    'RU'
],
function (Resources, dropDown, subSettings, inputBehavior, colorRow, visualView) {

    var items = [
                { id: 1, name: Resources.gn1, title: "column" },
                { id: 3, name: Resources.gn2, title: "bar" },
                { id: 5, name: Resources.gn3, title: "stackingcolumn" },
                { id: 22, name: Resources.gn4, title: 'bubble' },
                { id: 6, name: Resources.gn5, title: "pie" },
                { id: 7, name: Resources.gn6, title: "line" },
                { id: 16, name: Resources.gn7, title: 'stackingcolumn100' },
                { id: 11, name: Resources.gn8, title: 'area' },
                { id: 15, name: Resources.gn9, title: 'stackingarea100' },
                { id: 4, name: Resources.gn10, title: "bar_d3" },
                { id: 9, name: Resources.gn11, title: 'area_d3' }
                //{ id: 0, name: Resources.tc, title: "tagCloud" },
                //{ id: 2, name: Resources.bar2, title: "bar3D" },
                //{ id: 8, name: Resources.area + " (" + Resources.detail + ")", title: 'spline' },
                //{ id: 10, name: 'stepline', title: 'stepline' },
                //{ id: 12, name: 'steparea', title: 'steparea' },
                //{ id: 13, name: 'splinearea', title: 'splinearea' },
                //{ id: 14, name: 'stackingarea', title: 'stackingarea' },          
                //{ id: 17, name: 'stackingbar', title: 'stackingbar' },
                //{ id: 18, name: 'doughnut', title: 'doughnut' },
                //{ id: 20, name: 'pyramid', title: 'pyramid' },
                //{ id: 21, name: 'funnel', title: 'funnel' },
                //{ id: 23, name: 'column3D', title: 'column3D' },
                //{ id: 24, name: 'stackingcolumn3D', title: 'stackingcolumn3D' },
                //{ id: 25, name: 'stackingcolumn1003D', title: 'stackingcolumn1003D' },
                //{ id: 26, name: 'stackingbar3D', title: 'stackingbar3D' },
                //{ id: 27, name: 'stackingbar1003D', title: 'stackingbar1003D' },
                //{ id: 28, name: 'pie3D', title: 'pie3D' },
                //{ id: 29, name: 'doughnut3D', title: 'doughnut3D' }
    ];

    //var listView = Mn.CollectionView.extend({

    //    tagName: 'ul',

    //    childView: Mn.View.extend({

    //        tagName: 'li',

    //        template: _.template('<input data-id="<%- title %>"  id="<%- prefix + "_" + title %>" name="<%- prefix + "_chartView" %>" class="g-form--radio gallery <%- title %>" type="radio" /><label for="<%- prefix + "_" + title %>" title="<%- name %>"></label>'),

    //        triggers: {
    //            'click label': {
    //                event: 'choose:type:chart',
    //                preventDefault: false
    //            }
    //        },

    //        onRender: function () {
    //            this.$el.addClass('gallery_' + this.model.get('title'));
    //            if (this.model.get('checked'))
    //                this.$('input').attr('checked', 'checked');
    //        }
    //    }),

    //    childViewOptions: function (m) {
    //        m.set({
    //            'checked': m.get('title') === (this.options.Visualization || "bar"),
    //            prefix: this.options.prefix
    //        });
    //    },

    //    onRender: function () {
    //        this.$el.width(this.collection.length * 245);
    //    },

    //    childViewTriggers: {
    //        'choose:type:chart': 'choose:type:chart'
    //    }
    //});

    var formView = Mn.View.extend({

        behaviors: {
            input: inputBehavior
        },

        template: '#visual-settings-template',
        templateContext: {
            Resources: Resources
        },

        ui: {
            colw: '#columnWidth',
            cols: '#columnSpacing',
            psize: '#pieSize'
        },

        regions: {
            legendPosition: { el: '#legendPosition', replaceElement: true },
            axesXlabelAction: { el: '#axesXlabelAction', replaceElement: true }
        },


        events: {

            'change @ui.colw': function () {

                this.ui.colw.next('label').find('span').text(this.ui.colw.val());

            },

            'change @ui.cols': function () {

                this.ui.cols.next('label').find('span').text(this.ui.cols.val());

            },

            'change @ui.psize': function () {

                this.ui.psize.next('label').find('span').text(this.ui.psize.val());

            }
        },

        onRender: function () {

            this.showChildView('legendPosition', new dropDown({
                collection: new Backbone.Collection([
                    { id: 'Left', title: Resources.vs33left },
                    { id: 'Top', title: Resources.vs33top },
                    { id: 'Right', title: Resources.vs33right },
                    { id: 'Bottom', title: Resources.vs33bottom }
                ])
            }));

            this.getChildView('legendPosition').setCurrent(this.model.get('legendPosition')).$el.css('display', 'block');

            if (this.model.get('chart') !== 'pie') {
                this.showChildView('axesXlabelAction', new dropDown({
                    collection: new Backbone.Collection([
                        { id: 'none', title: 'None - ' + Resources.lpa1 },
                        { id: 'rotate90', title: 'Rotate 90 - ' + Resources.lpa2 },
                        { id: 'rotate45', title: 'Rotate 45 - ' + Resources.lpa3 },
                        { id: 'wrap', title: 'Wrap - ' + Resources.lpa4 },
                        { id: 'wrapByWord', title: 'Wrap by word - ' + Resources.lpa5 },
                        { id: 'trim', title: 'Trim - ' + Resources.lpa6 },
                        { id: 'hide', title: 'Hide - ' + Resources.lpa7 },
                        { id: 'multipleRows', title: 'MultipleRows - ' + Resources.lpa8 },
                    ])
                }));

                this.getChildView('axesXlabelAction').setCurrent(this.model.get('primaryXAxislabelIntrsectAction')).$el.css('display', 'block');
            }


            this.$('#' + this.model.get('prefix') + '_legendBorderColor').ejColorPicker({
                locale: Resources.Lang,
                modelType: "palette",
                presetType: "webcolors",
                enableOpacity: false
            });

        },

        modelEvents: {

            'change:chart': function () {
                this.render();
            }

        }

    });

    return Mn.View.extend({

        template: _.template('<h3 class="link" id="change-face"><%- Resources.ctd %></h3><br/><div class="face-choose" style="display:none;"></div><div class="face-form"><div class="form"></div><h3><%- Resources.vs8 %></h3><div id="color-settings"></div></div>'),
        templateContext: {
            Resources: Resources
        },

        ui: {
            face: '#change-face',
            choose: '.face-choose',
            form: '.face-form'
        },

        regions: {
            //list: '.charts-gallery',
            form: { el: '.form', replaceElement: true },
            color: { el: '#color-settings', replaceElement: true },
            face: '.face-choose'
        },

        events: {

            'click @ui.face': function () {

                if (this.ui.choose.is(":hidden")) {

                    this.ui.face.text(Resources.back);
                    this.ui.form.hide();
                    this.ui.choose.show();

                    if (!this.getRegion('face').hasView()) {
                        this.showChildView('face', new visualView({ model: this.model, ruleCode: 'any' }));
                        this.getChildView('face').$el.removeClass('show').addClass('visualisation');
                    }

                } else {

                    this.ui.face.text(Resources.ctd);
                    this.ui.form.show();
                    this.ui.choose.hide();

                }

            }
        },

        onRender: function () {

            var p = _.findWhere(this.model.get('Characteristics'), { WidgetParamName: this.model.get('typeName') + ".GhaphSubSettings" });

            var model = new subSettings;
            if (p)
                model.set(p.WidgetParamValue);

            model.set({
                prefix: this.model.id,
                chart: this.model.get("Visualization")
            });

            this.showChildView('form', new formView({ model: model }));

            this.showChildView('color', new colorRow({ model: this.model, collection: this.collection }));
        },

        onShow: function () {
        },

        childViewEvents: {

            'chart:selected': function (v) {

                var name = v.model.get('type');
                this.model.set("Visualization", name);
                this.getChildView('form').model.set('chart', name);

            }
        },

        onSave: function () {

            var data = $.GetData(this.$el);

            if (this.getChildView('form').getRegion('axesXlabelAction').hasView())
                data.primaryXAxislabelIntrsectAction = this.getChildView('form').getChildView('axesXlabelAction').current.id;

            data.legendPosition = this.getChildView('form').getChildView('legendPosition').current.id;

            var ch = Backbone.Radio.channel('chW'),
                p1 = ch.request('get:param:model', this.model.get('Characteristics'), "WidgetGraph.GhaphSubSettings"),
                p2 = ch.request('get:param:model', this.model.get('Characteristics'), 'PaletteByChart');

            p1.set('WidgetParamValue', data);
            p2.set('WidgetParamValue', this.getChildView('color').getChildView('list').collection.toJSON());


            var saveCollection = Backbone.Radio.channel('chW').request('get:params:collection', this.model.id);
            saveCollection.add([p1, p2]);

            saveCollection.fetch({
                success: function (m) {
                    this.model.save({ Characteristics: m.toJSON() });
                }.bind(this)
            });

        }
    });
});
