define('forms/rolesView', [], function () {

    return Mn.CollectionView.extend({

        tagName: 'select',

        childView: Mn.View.extend({

            tagName: 'option',

            template: _.template('<%- ProjectRoleName %>'),

        }),

        initialize:function(){

            this.collection = new Backbone.Collection();
            this.collection.url = '/api/InquiryRoles';
            this.collection.fetch({ reset: true });

        },

        triggers: {
            'change': 'change:role'
        },

        onRender: function () {

            let RoleID = this.model.get("ProjectRole_ID");

            this.children.each(function (v) {

                if (v.model.get('ID') === RoleID)
                    v.$el.prop('selected', true);

            });

            //$.get("/api/InquiryRoles").done(function (data) {

            //    Array.from(data, function (a) {

            //        a.RoleID = RoleID;
            //        this.ui.roles.append(_.template('<option value="<%= ID %>" <%= ID===RoleID?"selected":"" %>><%= ProjectRoleName %></option>')(a));
            //        if (a.ID === RoleID)
            //            this.model.trigger('change:ProjectRole_ID', this.model, RoleID);

            //    }, this);

            //}.bind(this));


        }


    });

});