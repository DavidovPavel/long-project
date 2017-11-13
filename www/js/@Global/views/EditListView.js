define('c/EditListView', [], function () {

    var listItemTemplate = "<span><%= title %></span><span class='cmd'><button type='button' class='view' data-icon='icon-eye'></button>" +
    "<% if(!IsSystem){ %><button type='button' class='edit' data-icon='icon-pen'></button><button type='button' class='clear' data-icon='icon-close-l'></button><% } %></span>";

    var listItemEditTemplate = "<input type='text' value='<%- title %>' /><span class='cmd edit-view'><button type='button' class='cancel' data-icon='icon-round-del'></button><button type='button' class='save' data-icon='icon-round-check'></button></span>";

    var listView = Mn.CollectionView.extend({

        className: 'list-cmd-panel',

        childView: Mn.View.extend({

            className: 'item',
            template: _.template(listItemTemplate),

            triggers: {
                'click': 'click:item',
                'click .view': 'list:item:view',
                'click .clear': 'list:item:clear',
                'click .save': 'list:item:save'
            },

            events: {

                'click .edit': function (e) {
                    e.stopPropagation();
                    this.template = _.template(listItemEditTemplate);
                    this.render();
                },

                'click .cancel': function (e) {
                    e.stopPropagation();
                    this.template = _.template(listItemTemplate);
                    this.render();
                },

                "click input": function (e) {
                    e.stopPropagation();
                }

            },

            onListItemSave: function () {

                if ( $.trim( this.$( 'input' ).val() ) ) {

                    var f = {
                        'title': this.$( 'input' ).val()
                    };

                    f[this.options.titleAttribute] = this.$( 'input' ).val();

                    this.model.set( f );

                    this.template = _.template( listItemTemplate );
                    this.render();
                }
                else
                    this.$( 'input' ).val( this.model.get( 'title' ) );
            }
        }),

        childViewOptions: function (m) {

            if (!m.has('IsSystem'))
                m.set('IsSystem', false);

            if (this.options.titleAttribute) {
                m.set('title', m.get(this.options.titleAttribute));

                m.on('change:' + this.options.titleAttribute, function () {
                    m.set('title', m.get(this.options.titleAttribute));
                }, this);
            }

            return {
                titleAttribute: this.options.titleAttribute
            };
        },

        childViewTriggers: {
            'click:item': 'click:item',
            'list:item:view': 'list:item:view',
            'list:item:clear': 'list:item:clear',
            'list:item:save': 'list:item:save'
        }

    });

    return Mn.View.extend({

        template: _.template('<div></div>'),

        regions: {
            list: { el: 'div', replaceElement: true }
        },

        childViewTriggers: {
            'click:item': 'click:item',
            'list:item:view': 'list:item:view',
            'list:item:clear': 'list:item:clear',
            'list:item:save': 'list:item:save'
        },

        events: {

            "click .add-btn": function (e) {

                e.stopPropagation();

                this.$("#add-collection").css({ "border-color": "" });

                var Name = $.trim(this.$("#add-collection").val());

                if (Name) {
                    this.$("#add-collection").val('');
                    this.triggerMethod('list:add', Name);
                }
                else
                    this.$("#add-collection").css({ "border-color": "red" });
            }

        },

        onRender: function () {

            this.getRegion('list').show(new listView({ collection: this.collection, titleAttribute: this.options.titleAttribute }));
        }

    });

});