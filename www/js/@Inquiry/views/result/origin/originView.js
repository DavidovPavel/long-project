define('result:origin', ['i18n!nls/resources.min', 'global.view.dropDown', 'global.files.attachFile', 'forms/1002Model', 'forms/1003Model'],

function (Resources, dropDown, Attach, PersonModel, CompanyModel) {

    var rolesCollection = Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: 'ID',
            defaults: {
                title: ''
            }
        }),
        url: '/api/InquiryRoles'
    });

    var relationsView = Mn.CollectionView.extend({
        childView: Mn.View.extend({
            className: 'item',
            template: _.template('<%- title %><span data-icon="icon-close-l"></span>'),

            events: {
                'click span[data-icon=icon-close-l]': function () {
                    this.model.collection.remove(this.model);
                }
            }
        }),

        collectionEvents: {
            remove: function (m) {
                $.ajax("/api/objectroles/" + m.id + "?oid=" + this.options.objModel.id, { type: "DELETE" }).done(function () {
                    delete this.options.objModel.get("RelationsDescriptionData").Roles[m.get('title')];
                }.bind(this));
            }
        }
    });

    var filesView = Mn.CollectionView.extend({
        childView: Mn.View.extend({
            tagName: 'span',
            template: _.template('<a href="<%- FilePath %>" target="_blank" class="view link"><span data-icon="icon-file"></span><%- FileName %></a><span class="clear-file" data-icon="icon-close-l"></span></span>'),
            events: {
                'click .clear-file': function () {
                    this.model.collection.remove(this.model);
                }
            }
        })
    });

    return Mn.View.extend({

        className: 'workbench--content',

        getTemplate: function () {

            if (this.model.get('typeid') === 10021)
                return templates['person-card-origin'];

            if (this.model.get('typeid') === 10022)
                return templates['company-card-origin'];
        },

        templateContext:{
            Resources: Resources
        },

        regions: {
            roles: '.sys-role-interface',
            relations: '.list-sources'
            //files: '.attached-files-list'
        },

        ui: {
            role: "#add-role"
            //files: '.amount-files'
        },

        events: {

            'click .add-btn': function () {

                if ($.trim(this.ui.role.val())) {

                    this.ui.role.css("border-color", "");

                    var role = this.ui.role.val(),
                        r = new Backbone.Model(this.model.get("RelationsDescriptionData")),
                        m = new Backbone.Model(this.model.get("RelationsDescriptionData").Roles);

                    m.set(role, 0);

                    r.set("Roles", m.toJSON());
                    r.url = "/api/ObjectRoles?mid=" + this.model.get("projectId") + "&oid=" + this.model.id;
                    r.save({}, {
                        success: function (m, o) {
                            this.model.set("RelationsDescriptionData", o);
                            this.ui.role.val("");
                        }.bind(this)
                    });

                } else {

                    this.ui.role.css("border-color", "red");

                    setTimeout(function () {
                        this.ui.role.val("").css("border-color", "");
                    }.bind(this), 3000);
                }
            },

            'click .extcode-block .link': function (e) {

                this.$(".extcode-block .code").slideDown();
                $.get("/api/Interactive/GetCodeForExternalSASys/" + this.model.id).done(function (data) {
                    this.$(".extcode-block textarea").text(data);
                    this.$("#linkGsearch").attr("href", ("abscp:lang-" + Resources.Lang + "/gs/search/" + window.btoa(encodeURIComponent(data))));
                    this.$("#linkEsearch").attr("href", ("abscp:lang-" + Resources.Lang + "/ts/search/" + window.btoa(encodeURIComponent(data))));
                }.bind(this));

            },

            'click .extcode-block .icon-close': function (e) {
                this.$(".extcode-block .code").slideUp();
            },

            'click .copy-to-clipboard': function () {
                var taExternalCode = this.$(".extcode-block textarea");
                taExternalCode.select();
                document.execCommand('copy');
            }

            //'click .show-attach-manage': function () {
            //    this.$(".attach-manage").slideDown();
            //},

            //'click .hide-attach-manage': function () {
            //    this.$(".attach-manage").slideUp();
            //}
        },

        initialize: function () {

            if (this.model.get('typeid') === 10021)
                this.model = new PersonModel({ id: this.model.id });

            if (this.model.get('typeid') === 10022)
                this.model = new CompanyModel({ id: this.model.id });            

            this.model.url = `/api/interestObjects/input/id${this.model.id}`;

        },

        onRender: function () {

            this.model.fetch();
        },

        modelEvents: {

            sync: function () {

                var roles = new rolesCollection;

                roles.on('reset', function (collection) {

                    collection.map(function (m) { m.set('title', m.get('ProjectRoleName')); });

                    this.showChildView('roles', new dropDown({ collection: collection }));

                    this.getChildView('roles').setCurrent(this.model.get("ProjectRole_ID"));

                }.bind(this));

                roles.fetch({ reset: true });

                var rpc = new Backbone.Collection(_.map(this.model.get("RelationsDescriptionData").Roles, function (v, k) { return { title: k, id: v }; }));
                this.showChildView('relations', new relationsView({ collection: rpc, objModel: this.model }));

                this.$("#" + this.model.get('selectedCountries')[0]).show();

                //var files = _.map(this.model.get('AttacheedFiles'), function (value, key) { return { "FileName": key, "FilePath": value }; });

                //var attach = new Attach({ el: this.$(".attach-manage") }).render();
                //this.listenTo(attach, "change:collection", function () {
                //    this.ui.files.text(attach.collection.length);
                //    attach.setModel();
                //    this.model.set('AttacheedFiles', attach.output);
                //    $.ajax({ type: "POST", url: "/api/InterestObj/SaveObjectData", contentType: 'application/json; charset=utf-8', data: JSON.stringify(this.model.toJSON()) });
                //});

                //attach.collection.reset(files);
                //this.showChildView('files', new filesView({ collection: attach.collection }));
                //this.ui.files.text(attach.collection.length);

                this.triggerMethod('render:tools', []);

            },

            'change:RelationsDescriptionData': function (m, v) {
                var rpc = _.map(v.Roles, function (a, k) { return { title: k, id: a }; });
                this.getChildView('relations').collection.reset(rpc);
            },

            'change:projectRoleId': function (m, v) {
                $.get("/Api/InquiryObjects/SetRole/" + v + "?oid=" + this.model.id);
            }
        },

        onChildviewDropdownSelect: function (m) {
            this.model.set("projectRoleId", m.id);               
        }


    });


});