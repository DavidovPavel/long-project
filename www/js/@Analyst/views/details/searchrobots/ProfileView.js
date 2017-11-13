define([
'i18n!nls/resources.min',
'@/views/toolbar/EditPanel',
'jqueryui'
],
function (Resources, EditPanel) {
    var profileModel = Backbone.Model.extend({
        idAttribute: "ProfileID",
        defaults: function () {
            return {
                title: "Новый профиль",
                ProfileID: null,
                MBFTaskTypes: [],
                IsDefault: true,
                isCommon: false
            };
        }
    });

    var profileView = Backbone.View.extend({
        events: {
            "click #linkToProfile": "linkToProfile"
        },
        selectTasck: [],
        selectProfile: null,
        linkToProfile: function () {
            if (this.selectProfile) {
                var flag = true;
                if (!this.selectTasck.length) {
                    flag = confirm(Resources.confirmLinkToProfile);
                }
                if (flag) {
                    var r = $.grep(this.selectTasck, function (val) { return $.type(val) === "string"; });

                    this.selectProfile.set("MBFTaskTypes", r);
                    var s = this;
                    s.$el.showIndicator();
                    this.selectProfile.save({}, {
                        success: function () {
                            s.$el.hideIndicator();
                            s.$(".info").text(Resources.done);
                        },
                        error: function () { $.Error(arguments); }
                    });
                }
            }
        },
        initialize: function () {
            this.proid = this.options.profileid;
            this.render();
        },
        getList: function () {
            var self = this;
            require(['text!@/templates/list/searchtasklistItemTemplate.html', "@/views/ListView"], function (searchtasklistItemTemplate, List) {
                this.list = new List({
                    el: this.$("#ProfList"),
                    api: function () { return "/api/profile" },
                    templ: searchtasklistItemTemplate,
                    headerTemplate: "headsearchListItemTemplate",
                    collectionmodel: profileModel,
                    done: function () {
                        this.getTree();
                    }.bind(this),
                    tools: false
                });
                // add model
                this.list.model = new profileModel;

                this.editpanel = new EditPanel({ view: this.list, className: " " });
                this.$(".editPanel").append(this.editpanel.$el);

                this.list.operation = function (model) {
                    if (!model.get("isCommon")) {
                        self.editpanel.Select(model);
                    } else {
                        self.editpanel.disabled();
                    }
                    self.listOperation(model);
                }
                this.list.callback = function () {
                    this.refresh();
                    self.editpanel.clear();
                }
                this.list.on("clear", this.clear, this);

            }.bind(this));
        },
        getTree: function () {
            require(['text!@/templates/tree/searchtaskItemTemplate.html', "@/views/Tree/TreeView"], function (searchtaskItemTemplate, Tree) {
                this.tree = new Tree({
                    el: this.$("#treeTasks"),
                    api: "/api/profile/alltasktypes",
                    itemtemplate: searchtaskItemTemplate,
                    branch: { parentid: null },
                    openLevel: 0,
                    operation: function () {
                    }
                }).done(function (tree) {
                    this.fillTasks(tree.collection.models);
                    //s.list.goToCurrent(s.proid);
                }.bind(this));
                this.tree.select = function (selected) {
                    if (this.selectProfile && !this.selectProfile.get("isCommon")) {
                        this.$("#linkToProfile").button({ disabled: this.selectProfile == null });
                        this.selectTasck = selected;
                    }
                }.bind(this);
            });
        },
        listOperation: function (model) {
            this.$(".info").text("");
            this.selectProfile = model;
            this.selectTasck = [];
            this.tree.selected = [];
            var $b = this.tree.Container;
            $b.find(".Chbx").removeClass("Sel").removeClass("Sel2");
            var flag = model.get("isCommon");
            if (model.get("MBFTaskTypes").length) {
                var arr = model.get("MBFTaskTypes");
                this.tree.selected = [];
                for (var i = 0; i < arr.length; i++) {
                    var tid = arr[i];
                    var ttree = this.tree.collection.get(tid);
                    if (ttree) {
                        var pid = ttree.get("parentid");
                        this.tree.collection.get(pid).view.$el.find(".Chbx").addClass("Sel" + (flag ? "2" : ""));
                        if ($.type(tid) === "string") {
                            $b.find("span[data-taskid=" + tid + "]").next(".Chbx").addClass("Sel" + (flag ? "2" : ""));
                            this.tree.selected.push(tid);
                        }
                    } else {
                        //this.list.clearselect();
                        //break;
                    }
                }
            }
        },

        fillTasks: function (mls) {
            _.each(mls, function (m) {
                var tasks = m.get("TaskTypes");
                _.each(tasks, function (a) {
                    a.isdoc = true;
                    a.parentid = m.id;
                });
                m.collection.add(tasks);
            });
            //_.each(mls, function(m) {
            //    var tasks = m.get("TaskTypes");

            //    for (var i = 0; i < tasks.length; i++) {
            //        var data = tasks[i];
            //        data.isset = false;
            //        data.isdoc = true;
            //        data.isopen = false;
            //        data.parentid = m.id;
            //        var model = new Backbone.Model(data);
            //        m.collection.add(model);
            //    }
            //});
        },
        render: function () {
            var self = this;
            require(['text!@/templates/details/menageprofilesTemplate.html'], function (menageprofilesTemplate) {
                this.$el.html(_.template(menageprofilesTemplate)({ Resources: Resources }));

                this.$el.dialog({
                    modal: true,
                    width: $(window).width() - 100,
                    height: $(window).height() - 100,
                    title: Resources.MenageProfiles,
                    close: function () {
                        require(['@/views/details/TaskView'], function (TaskView) {
                            TaskView.get()
                                .render(self.selectProfile ? self.selectProfile.id : self.selectProfile);
                        });
                    }
                });

                self.$(".info").text("");

                this.getList();

            }.bind(this));
            return this;
        },
        clear: function () {
            this.list.clearselect();
            this.selectProfile = null;
            this.$("#linkToProfile").button({ disabled: true });
            this.tree.Container.find(".Chbx").removeClass("Sel");
            this.$(".info").text("");
        }
    });
    return profileView;
});