
define('result:card', ['i18n!nls/resources.min', 'global.grid.dataItemsView', 'syncfusion', 'RU'], function (Resources, dataTable) {

    var blockModel = Backbone.Model.extend({
        idAttribute: 'num',
        defaults: {
            num: 0,
            data: [],
            href: '',
            links: [],
            caption: '',
            render: ''           
        }
    });

    var itemView = Mn.View.extend({

        getTemplate: function () {

            var template = _.template('');

            switch (this.model.get('propType')) {
                case 1:
                    template = _.template('<div class="g-form--input"><input type="text" value="<%- value %>" class="g-form--input filled" readonly="readonly"><label class="g-form--label"><%- displayName %></label></div>');
                    break;
                case 2:
                    template = _.template('<div class="g-form--input"><input type="text" value="<%- value %>" class="g-form--input filled"><label class="g-form--label"><%- displayName %></label></div>');
                    break;
                case 3:
                    template = _.template('<div class="g-form--input"><select name="<%- systemName %>" class="g-form--select" disabled=""></select><label class="g-form--label"><%- displayName %></label></div>');
                    break;
            }

            return template;
        },

        initialize: function () {

            this.collection = new Backbone.Collection;           

        },

        onBeforeRender: function () {

            this.$el.addClass(this.model.get('render'));

            if (this.model.get('propType') === 3) {
                this.collection.url = '/api/ModelDicItems?dic=' + this.model.get('dicID');
                this.collection.fetch({ reset: true });
            }

        },

        collectionEvents: {

            reset: function () {

                if (this.model.get('propType') === 3) {

                    this.collection.each(function (m) {
                        this.$('select').append($('<option value="' + m.id + '">' + m.get('title') + '</option>'));
                    }, this);


                    this.$('select').val(this.model.get('value'));

                }
            }

        },

        onRender: function () {

            if (this.model.get('propType') === 2) {

                this.$("input").ejDatePicker({
                    width: "100%",
                    height: "38px",
                    value: !isNaN(Date.parse(this.model.get("value"))) ? new Date(this.model.get("value")) : "",
                    locale: Resources.Lang,
                    buttonText: Resources.Today,
                    showPopupButton: false,
                    watermarkText: Resources.formatDate,
                    enabled: false,
                    focusOut: function (args) {
                        this.$("input").data("ejDatePicker").hide();
                    }.bind(this),

                    select: function (args) {
                        this.model.set({ value: $.ToISO(args.value) });
                    }.bind(this)

                });
                this.$("input").addClass("ejdatepicker");

            }
        }

    });

    var itemsView = Mn.CollectionView.extend({
        className: 'row',
        childView: itemView
    });

    var blockView = Mn.View.extend({

        className: 'summary--plate',
        
        template: _.template('<h3 class="summary--plate-title"><%- caption %></h3><div class="row"></div>'),

        regions: {
            row: { el: '.row', replaceElement: true }
        },

        initialize: function () {

            this.collection = new Backbone.Collection(this.model.get('data'));

        },

        collectionEvents: {

            reset: function () {

            }

        },

        onRender: function () {

            var map = [];

            if (this.model.get('render') === 'commonInfo') {
                map = [ 3, 3, 3, 3, 3, 3, 1 ]
            }

            this.collection.each(function (m,i) {
                m.set('render', map[i] ? ('grid--1-' + map[i]) : this.model.get('render'));
            }, this);

            if (this.model.has('href')) {
                this.collection.url = this.model.get('href');
                this.showChildView('row', new dataTable({ collection: this.collection }));
                this.collection.fetch({ reset: true });
            } else
                this.showChildView('row', new itemsView({ collection: this.collection }));
        }

    });

    var headerView = Mn.View.extend({
        className: 'summary--header',
        template: _.template('<div class="summary--logo"><img src="<%- img_src %>" alt=""></div><div class="summary--title"><%- title %></div><div class="clearfix"></div>')
    });

    var blocksView = Mn.CollectionView.extend({
        className: 'summary--content readonly',
        childView: blockView
    });

    return Mn.View.extend({

        className: 'workbench--content summary--wrapper',

        template: _.template('<div id="header"></div><div id="content"></div>'),

        regions: {
            header: { el: '#header', replaceElement: true },
            content: { el: '#content', replaceElement: true }
        },

        initialize: function () {

            Backbone.Radio.channel('side').request('get:sidebar').setCurrent(['card', 'card'], false);

            this.collection = new Backbone.Collection;
            this.collection.url = '/api/object/card/' + this.model.id;
            this.collection.fetch({ reset: true });
        },

        collectionEvents: {

            reset: function () {

                //Backbone.Radio.channel('loader').trigger('hide');

                var m = this.collection.at(0),

                   cardRender = m.get('render'),

                   items = m.get('items'),

                   coll = new Backbone.Collection(items, { model: blockModel, comparator: 'num' }),

                   hm = coll.findWhere({ render: 'header' }),
                       
                   hmd = hm.get('data');

                coll.remove(hm);

                this.showChildView('header', new headerView({ model: new Backbone.Model({ img_src: hmd[0].value, title: hmd[1].value }) }));

                this.showChildView('content', new blocksView({ collection: coll }));

                const tools = [
                    { id: 'edit', template: '<span class="switch"><button class="g-form--switch" mode="off"></button><label>' + Resources.edit + '</label></span>' },
                    { id: 'save', className: 'save', title: Resources.save }
                ];

                this.triggerMethod('render:tools', tools);

            }

        },

        edit: function (o) {

            var $e = o.$el.find('.g-form--switch'),
                mode = $e.attr('mode'),
                cont = this.getChildView('content');

            if (mode === 'off') {
                $e.attr('mode', 'on');
                cont.$el.removeClass('readonly');
                cont.$('input:not(.e-datepicker)').removeAttr('readonly');
                cont.$('input.e-datepicker').ejDatePicker({ enabled: true });
                cont.$('select').removeAttr('disabled');
            }
            else {
                $e.attr('mode', 'off');
                cont.$el.addClass('readonly');
                cont.$('input:not(.e-datepicker)').attr('readonly', 'readonly');
                cont.$('input.e-datepicker').ejDatePicker({ enabled: false });
                cont.$('select').attr('disabled', 'disabled');
            }

        },

        save: function () {

            Backbone.trigger('message:warning', { message: 'What?' });

        }


    });

});