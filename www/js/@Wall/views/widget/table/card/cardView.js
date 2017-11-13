define('widgetTableCard', ['i18n!nls/resources.min'], function (Resources) {

    var list = Mn.CollectionView.extend({

        className: 'card-newsblock',

        childView: Mn.View.extend({

            tagName: 'article',

            className: 'card-vertical',

            ///*getTemplate: function () {*/
            //    return '#card-vertical-view-template';
            //},
            getTemplate: function () {
                if (this.options.vis === 'card2') {
                    return '#card-horizontal-view-template';
                }

                return '#card-vertical-view-template';
            },

            templateContext: {
                Resources: Resources
            },

            events: {

                'click a': function (e) {
                    e.stopPropagation();
                }

            },

            triggers: {
                'touchstart': 'table:row:handler',
                'click': 'table:row:handler',
            },

            onBeforeRender: function () {

                if (this.options.vis === 'card2')
                    this.$el.removeClass('card-vertical').addClass('card-horizontal');

                var item = this.model.toJSON(),
                    pdate = Date.parse(item.дата_публикации) ? new Date(item.дата_публикации).toLocaleString(Resources.Lang) : '';

                this.model.set({
                    display_name: this.model.get('display_name')|| '',
                    image: item.image || '',
                    url: item.url_источника || '',
                    pdate: pdate,
                    annotation: item.аннотация,
                    massmedia: item.massmedia,
                    rubrics: ''
                });

                if (this.model.has('links')) {

                    var a = _.groupBy(this.model.get('links'), 'rel');

                    if (_.has(a, 'rubric_id')) {
                        var vs = _.pluck(a.rubric_id, 'value');
                        this.model.set('rubrics', vs.join(' | '));
                    }

                    if (_.has(a, 'url_источника')) {
                        var href = a.url_источника[0].href;
                        this.model.set({ url: href, massmedia: this.model.get('massmedia') ? this.model.get('massmedia') : href });
                    }

                }
            }
        }),

        onBeforeRender:function(){
            if (this.options.vis === 'card2')
                this.$el.addClass('horizontal');
        },

        childViewOptions: function () {
            return {
                vis: this.options.vis
            }
        },

        childViewTriggers: {
            'table:row:handler': 'table:row:handler'
        }

    });

    return Mn.View.extend({

        template: _.template('<div></div>'),
        templateContext: {
            Resources:Resources
        },

        regions: {
            list: { el: 'div', replaceElement: true }
        },

        onRender: function () {

            this.showChildView('list', new list({ collection: this.collection, vis: this.model.get('Visualization') }));

        },

        onChildviewTableRowHandler: function (v) {

            this.model.trigger('click:item', v.model);

        },

    });


});