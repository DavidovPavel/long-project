define(['i18n!nls/resources.min', 'g/Tree/TreeView', 'c/SimpleTableView'],

function (Resources, Tree, gridView) {


    var listView = Mn.CollectionView.extend({

        childView: Mn.View.extend({

            template: _.template('<input type="radio" name="mychoice" />&nbsp;<label for="mychoice"><%- title %></label>'),

            events: {
                'click input[type=radio]': function () {
                    this.triggerMethod('click:link', this.model.id);
                }
            }
        }),

        onRender: function () {

            if (this.collection.length) {

                var v = this.children.findByIndex(this.collection.length - 1);
                v.$('input[type="radio"]').get(0).checked = true;
                this.triggerMethod('click:link', v.model.id);
            }
        },

        collectionEvents: {

            request: function () {
                Backbone.Radio.channel('loader').trigger('show', this.$el);
            },

            reset: function () {
                Backbone.Radio.channel('loader').trigger('hide');
            }
        }
    });

    return Mn.View.extend({

        template: '#global-dialog-creating',
        templateContext: {
            Resources: Resources
        },

        regions: {
            links: '.link-list',
            list: '.search-result'
        },

        modelEvents: {

            sync: function () {
                this.clear();
                this.trigger('fact:created');
            }
        },

        save: function (v) {

            this.model.set({ title: this.$("input[name='title']").val() });

            var p = this.model.toJSON();

            if (!this.$("#link2obj").is(":checked")) {
                delete p.linkid;
                delete p.linktoid;
            }

            if (this.model.isValid()) {

                v.$el.addClass('disabled');

                this.model.save(p);


            }
            else this.mark();


        },

        search:function(){

            this.model.set({ title: this.$("input[name='title']").val() });

            if (this.model.isValid()) {

                var o = {
                    text: this.$("input[name='title']").val(),
                    typeid: this.model.get("typeid")
                };

                this.getChildView('list').collection.url = ("/api/List/?" + $.param(o));

                Backbone.Radio.channel('loader').trigger('show', this.getChildView('list').$el);
                this.getChildView('list').collection.fetch({
                    reset: true,
                    success: function () {
                        Backbone.Radio.channel('loader').trigger('hide');
                    }
                });

            }
            else this.mark();

        },

        mark: function () {
            _.each(this.model.validationError, function (o) {
                this.$('input[name="' + o.name + '"]').css({ 'border-color': 'red' });
            }, this);
        },

        clear: function () {
            this.$("input[name='title']").val();
            this.$('input').css({ 'border-color': '' });
            this.getChildView('list').collection.reset();
        },

        onRender: function () {

            var st = new Tree({
                el: this.$(".load-tree"),
                modelName: "Tree",
                api: "/api/Tree",
                branch: this.model.get("branch"),
                markCurrent: true,
                currentid: this.model.get("typeid").toString()
            }).done(function (v) {
                var model = v.selectedModel;
                if (model) 
                    this.getLinksType(model);
            }.bind(this)).operation = function (m) {
                this.getLinksType(m);
            }.bind(this);

            this.showChildView('links', new listView({ collection: new Backbone.Collection() }));

            this.showChildView('list', new gridView({
                collection: new Backbone.Collection(),
                rowTemplate: '<td><%- title %></td><td><%- type %></td>',
                head: new Backbone.Collection([
                    { id: 0, title: Resources.title, width: '70%' },
                    { id: 1, title: Resources.type }
                ])
            }));
        },

        getLinksType: function (model) {

            this.model.set({ typeid: model.id, linkid: null });

            this.$(".titleType").text(model.get("title"));

            this.getChildView('links').collection.url = ("/api/Links/fortype/?typeid=" + model.id + "&objid=" + this.model.get('linktoid'));
            this.getChildView('links').collection.fetch({ reset: true });

        },

        onChildviewClickLink: function (linkid) {
            this.model.set('linkid', linkid);
        }
    });

});