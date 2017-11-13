define('@SliderView', ['baseurl', 'i18n!nls/resources.min'], function (baseurl, Resources) {

    var VITRINA_ITEM_WIDTH = 273;

    var sliderList = Mn.CollectionView.extend({

        className: 'slider',

        childView: Mn.View.extend({

            className: "vitrina",

            template: '#slider-item-template',
            templateContext:{
                baseurl: baseurl                
            },

            events: {

                //'touchstart .panel-vitrin': 'setCurrent',
                'click .panel-vitrin': 'setCurrent',

                'click .delete-vitrina': function () {

                    Backbone.trigger("message:confirm", {
                        title: Resources.askyousure, message: $.Format(Resources.deltext, Resources.todashboard, this.model.get("title")),
                        fx: function () {

                            if (this.model.get('current'))
                                this.model.set('current', false);

                            this.model.destroy();
                            Backbone.history.navigate('', { trigger: true });
                        },
                        ctx: this
                    });
                }
            },

            setCurrent: function () {

                var c = this.model.collection.findWhere({ current: true });

                if (c) {

                    if (this.model.id !== c.id) {
                        c.set('current', false);
                        this.model.set('current', true);
                    }

                } else
                    this.model.set('current', true);

            },

            modelEvents: {

                'change:current': function (m, v) {

                    if (v) {

                        this.$el.addClass('current');
                        this.triggerMethod('slider:render', this.$el.index());
                    }
                    else
                        this.$el.removeClass('current');
                },

                'change:Screen': function (m, v) {

                    this.render();
                },

                'change:title': function (m, v) {
                    this.$('.name-vitrina').text(v);
                }

            },

            onDetach: function () {
                this.triggerMethod('slider:board:detached', this);
            }

        }),

        calcStep: function () {

            var dw = this.$el.closest('.items-wrap').width(),
                sw = this.collection.length * VITRINA_ITEM_WIDTH,
                flag = sw > dw;

            if (flag) 
                this.maxStep = Math.ceil((sw - dw) / VITRINA_ITEM_WIDTH);                
            else
                this.maxStep = 0;

            if (this.step >= this.maxStep)
                flag = false;

            this.triggerMethod('show:more', flag);

        },

        slideLine: function (p) {

            var flag = p >= this.maxStep;
            if (flag)
                this.step = this.maxStep;
            else
                this.step = p;

            if (this.step !== 0)
                this.step -= 1;

            this.$el.animate({ "left": '-' + this.step * VITRINA_ITEM_WIDTH });
            this.triggerMethod('show:more', !flag);
        },

        initialize: function () {

            this.step = 0;
            this.maxStep = 0;
            Backbone.on("window:resizeend", this.calcStep, this);

        },

        onRenderChildren: function () {

            var w = this.collection.length * VITRINA_ITEM_WIDTH;
            this.$el.width(w);

            this.calcStep();

            var cm = this.collection.findWhere({ current: true });
  
            if (cm) {
                var v = this.children.findByModel(cm);
                v.$el.addClass('current');
                this.slideLine(v.$el.index());
            }

        },

        onChildviewSliderRender: function (p) {
            this.slideLine(p);
        }
    });

    return Mn.View.extend({

        template: '#slider-template',
        templateContext: {
            Resources: Resources
        },

        triggers: {
            'click .show-add-vitrin': 'slider:new:dashboard'
        },

        events: {

            'click .bolt-lug': 'top',
            "click .le": 'left',
            "click .ri": 'right',            

            'touchstart .bolt-lug': 'top',
            "touchstart .le": 'left',
            "touchstart .ri": 'right'
        },

        ui: {
            more: '.continue'
        },

        regions: {
            list: '.items-wrap'
        },

        onRender: function () {

            this.$el.attr('id', 'vitrin-list');
            this.showChildView('list', new sliderList({ collection: this.collection }));

            
            
        },

        collectionEvents: {

            update: function (c, o) {

                this.getChildView('list').calcStep();
            },

            reset: function () {

                setTimeout(function () { this.top(); }.bind(this), 8000);

            }
        },

        top: function () {
            this.$el.toggleClass("abs").find(".arrow").toggleClass("nord");
        },

        left: function () {
            var list = this.getChildView('list');
            if (list.step > 0) {
                list.step--;
                list.$el.animate({ "left": "+=" + VITRINA_ITEM_WIDTH });
                this.ui.more.show();
            }
        },

        right: function () {
            var list = this.getChildView('list');
            if (list.step < list.maxStep) {
                list.step++;
                list.$el.animate({ "left": "-=" + VITRINA_ITEM_WIDTH });
                if (list.step === list.maxStep)
                    this.ui.more.hide();
            } else
                this.ui.more.hide();
        },

        onChildviewShowMore: function (flag) {
            if (flag)
                this.ui.more.show();
            else
                this.ui.more.hide();
        }

      
    });
})