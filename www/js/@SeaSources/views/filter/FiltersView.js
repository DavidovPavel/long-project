define('filtersSourcesView', ['i18n!nls/resources.min', 'global:collection:dictionary'], function (Resources, Dic) {

    var filtersView = Mn.CollectionView.extend({

        className: 'list-group',
        tagName: 'ul',

        childView: Mn.View.extend({

            tagName: 'li',
            className: 'btn-link-filter',
            template: _.template('<%- Title %>'),

            triggers: {
                'click': 'filter:send'
            },

            onFilterSend: function () {
                this.model.set('on', !this.model.get('on'));
                this.$el.toggleClass('active');
            },

            onRender: function () {
                if (this.model.get('on'))
                    this.$el.addClass('active');
                else
                    this.$el.removeClass('active');
            }
            
        }),

        childViewOptions: function (m) {

            m.set('on', this.options.current.indexOf(m.get('DicCodeItem')) !== -1);

            if (m.get('on'))
                this.triggerMethod('filter:send', { model: m });
        },

        childViewTriggers: {
            'filter:send': 'filter:send'
        }
    });

    var setView = Mn.CollectionView.extend({

        className: 'filter-list source-collection',
        tagName: 'ul',

        childView: Mn.View.extend({

            tagName: 'li',
            className: 'btn-link-coll',
            template: _.template('<% if(!IsSystem && SearchPackUID) {%><i data-icon="icon-close-xs"></i><% } %>' +
                        '<span class="radio-button <% if(active){%>checked<%}%>"><span></span></span><span class="title"><%- SearchPackName %></span>'),

            modelEvents: {
                'change:active': function () {                    
                    this.render();
                }
            },

            triggers:{
                'click i[data-icon="icon-close-xs"]': 'filter:destroy:set',
                'click': 'filter:change:set'
            },

            onFilterChangeSet: function () {
                var m = this.model.collection.findWhere({ active: true });
                if (m) m.set('active', false);
                this.model.set('active', true);
            },

            onFilterDestroySet: function () {
                Backbone.trigger('message:confirm', {
                    title: Resources.sure,
                    message: '',
                    fx: function () {
                        this.model.destroy();
                    },
                    ctx: this
                })
                
            },

            onRender: function () {
                if (this.model.get('active'))
                    this.$el.addClass('active');
                else
                    this.$el.removeClass('active');
            }

        }),

        childViewOptions: function (m) {
            if (m.id === this.model.id)
                m.set('active', true);
            else
                m.set('active', false);
        },

        childViewTriggers: {
            'filter:change:set': 'filter:change:set',
            'filter:destroy:set': 'filter:destroy:set'
        }
    });

    var setsView = Mn.View.extend({

        template: templates['filters-selections-sources'],
        templateContext:{
            R:Resources
        },

        regions: {
            system: { el: '.IsSystem', replaceElement: true },
            custom: { el: '.Custom', replaceElement: true }
        },

        onRender: function () {
            var set = this.model.collection.groupBy("IsSystem");
            if (set.true)
                this.showChildView('system', new setView({ collection: new Backbone.Collection(set.true), model: this.model }));
            if (set.false)
                this.showChildView('custom', new setView({ collection: new Backbone.Collection(set.false), model: this.model }));
        },

        childViewTriggers: {
            'filter:destroy:set':'filter:destroy:set',
            'filter:change:set': 'filter:change:set'
        }
    });

    return Mn.View.extend({

        template: templates['filter-sources'],
        templateContext: {
            R: Resources
        },

        regions: {
            selections: '#selections',
            ByPayment: { el: '#ByPayment', replaceElement: true },
            ByStatus: { el: '#ByStatus', replaceElement: true },
            ByCountry: { el: '#ByCountry', replaceElement: true },
            BySrcKind: { el: '#BySrcKind', replaceElement: true },
            ByInfo: { el: '#ByInfo', replaceElement: true }
        },

        events: {

            "click .btn-collapse": function (e) {

                var $p = $(e.target).next("div.collapse");

                if ($p.is(".on"))
                    $p.removeClass('on').slideUp();
                else
                    $p.addClass('on').slideDown();
            },

            "click .btn-link-clear": function () {

                var rs = this.getRegions();

                _.each(rs, function (r) {
                    var v = r.currentView;
                    if (v && v.collection)
                        v.collection.each(function (m) {
                            if (m.get('on')) {
                                m.set('on', false);
                                v.children.findByModel(m).render();
                            }
                        });
                });

                this.triggerMethod("filter:send", {});
            }

        },       

        onRender: function () {

            if (this.model.collection)
                this.showChildView('selections', new setsView({ model: this.model }));

            Dic.done(function (c) {
                c.each(function (m) {

                    if (this.hasRegion(m.get('DicCode')))
                        this.showChildView(m.get("DicCode"),
                            new filtersView({
                                collection: new Backbone.Collection(m.get("DicItems")),
                                current: this.model.get("SelectedCountries") || []
                            }));

                }, this);

            }, this);

        },

        childViewTriggers: {
            'filter:destroy:set': 'filter:destroy:set',
            'filter:change:set': 'filter:change:set',
            'filter:send': 'filter:send'
        }
    });

});