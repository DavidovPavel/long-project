define('c/TabsView', [], function () {

    var tabsView = Mn.CollectionView.extend({
        tagName: 'ul',
        className: 'nav nav-tabs',
        childView: Mn.View.extend({
            tagName: 'li',
            template: _.template('<a href="#<%- id %>"><%- title %>&nbsp;<span style="display: inline-block; min-width: 22px;"><%- total?"("+total+")":"" %></span></a>'),
            triggers: {
                'click': 'click:item'
            },
            onRender: function () {
                if (this.model.has('active') && this.model.get('active'))
                    this.$el.addClass('active');
                else this.$el.removeClass('active');
            },
            modelEvents: {
                'change:active': function () {
                    this.render();
                }
            }
        }),
        childViewOptions: function (m) {
            if (!m.has('total')) m.set('total', null);
        }
    });

    return Mn.View.extend({
        template: _.template('<ul></ul><div></div>'),
        regions: {
            tabs: { el: 'ul', replaceElement: true },
            content: { el: 'div', replaceElement: true }
        },
        
        onChildviewClickItem: function (v) {

            var o = v.model.collection.findWhere({ active: true });
            if (o) o.set('active', false);

            if (!v.model.has('active') || !v.model.get('acitve')) {
                v.model.set('active', true);
                this.showContent(v.model);
            }
        },

        showContent: function (m) {
            var v = m.get('view');
            this.showChildView('content', new v(m.get('options')));
            this.finishLoadContent();
        },

        finishLoadContent:function(){
            // 
        },

        onRender: function () {
            this.showChildView('tabs', new tabsView({ collection: this.collection }));
            var a = this.collection.findWhere({ active: true });
            if (a)
                this.showContent(a);
        }
    });

});