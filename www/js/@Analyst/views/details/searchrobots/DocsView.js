define([
'app',
'i18n!nls/resources.min',
"@/views/ListView",
'g/ContentView',
'@/views/details/furniture/ConditionsView',
'text!@/templates/details/docsTemplate.html',
'text!@/templates/details/docConditionsTemplate.html',
            'jqueryui'
],
    function (App, Resources, List, ContentView, ConditionsView, docsTemplate, docConditionsTemplate) {

        var listDocsTemplate = "<td data-id='<%= id %>'><input type='checkbox' />&nbsp;<span><%= title %></span></td><td><%= source %></td><td><%= size %></td><td><%= sel %></td>",
            listFactsTemplate = '<td data-id="<%= id %>"><%= title %></td><td><%= type %></td>';

        var docsView = Backbone.View.extend({
            el: $("#SearchBySource .Load"),
            selected: [],
            events: {
                "click #AutoSelectDocs": "AutoSelectDocs",
                "click button.paramsBtn": "viewParams",
                "mouseout button.paramsBtn": "hideParams",
                "mouseover #AutoSelectParams": "viewParams",
                "mouseout #AutoSelectParams": "hideParams",
                "click #param4": "selectParam",
                "click span.sst span": "check"
            },
            check: function (e) {
                var s = this;
                var val = parseInt($(e.target).attr("data-value"));
                switch (val) {
                    case 1:
                        this.list.$el.find("td>input[type=checkbox]").each(function () {
                            $(this).get(0).checked = true;
                            s.selected.push(parseInt($(this).closest("td").attr("data-id")));
                        });
                        break;
                    case 2:
                        this.list.$el.find("td>input[type=checkbox]").each(function () {
                            $(this).get(0).checked = false;
                        });
                        this.selected = [];
                        break;
                    case 3:
                        this.list.$el.find("td>input[type=checkbox]").each(function () {
                            var f = $(this).get(0).checked;
                            $(this).get(0).checked = !f;
                            var v = parseInt($(this).closest("td").attr("data-id"));
                            var p = s.selected.indexOf(v);
                            if (!f)
                                s.selected.push(v);
                            else if (p != -1)
                                s.selected.splice(p, 1);
                        });
                        break;
                }
                this.$("#AutoSelectDocs").button({ disabled: !this.selected.length });
            },
            selectParam: function () {
                var $e = $(arguments[0].target);
                var flag = $e.is(":checked");
                $e.closest("li").next("ul").children("li").each(function () {
                    $(this).children("input").prop("checked", flag);
                });
            },
            viewParams: function () {
                if (this.int) {
                    clearTimeout(this.int);
                }
                this.$("#AutoSelectParams").show("slide");
            },
            hideParams: function () {
                var s = this;
                if (this.int) {
                    clearTimeout(this.int);
                }
                this.int = setTimeout(function () { s.$("#AutoSelectParams").hide("slide") }, 300);
            },

            getData: function () {
                var output = {};
                $("#AutoSelectParams").find("input[type=checkbox]").each(function () {
                    var name = $(this).attr("name");
                    var value = $(this).is(":checked");
                    if (name) output[name] = value;
                });
                return output;
            },
            AutoSelectDocs: function () {
                this.$("#AutoSelectDocs").showIndicator();
                var s = this.$("#AutoSelectDocs");
                var data = this.getData();
                data.MainObject = parseInt(App.Select.get("detail"));
                data.Sources = this.selected;
                $.ajax({
                    type: "POST",
                    url: "/api/docs/StartAutoExtracting",
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(data)
                }).done(function () {
                    s.hideIndicator();
                }).fail(function () {
                    s.hideIndicator();
                    $.Error(arguments);
                });
            },
            initialize: function () {
                Backbone.on("smt:docs", this.render, this);
            },
            render: function (data) {
                var template = (data ? data.template : false) || docsTemplate,
                    listTemplate = (data ? data.listTemplate : false) || listDocsTemplate,
                    api = (data ? data.api : false) || ("/api/Docs/" + App.Select.get("detail"));

                this.$el.html(_.template(template)({ Resources: Resources }));
                var s = this;

                if (!this.isInitList) {
                    this.isInitList = true;

                    this.list = new List({
                        headerTemplate: "headDocTemplate",
                        el: this.$("#DocumentsList"),
                        api: api,
                        templ: listTemplate,
                        operation: function (m) {
                            s.initTabsForDoc(m, arguments[1] != undefined);
                        },
                        done: function () {
                            s.$(".Bts").show();
                            if (this.collection.length) {
                                s.$(".selectAll").prop("disabled", false);
                            }
                            s.selected = this.checked;
                        }
                    });
                } else {
                    this.list.$el = this.$("#DocumentsList");
                    this.list.collection.url = api;
                    this.list.collection.fetch({ reset: true });
                }
                this.$("button").button();
                return this;
            },
            initTabsForDoc: function (m, flag) {
                this.$("#AutoSelectDocs").button({ disabled: !this.list.selected.length });

                if (this.list.selected.length > 1) {
                    flag = true;
                    this.$(".List input[type='checkbox']").prop("checked", false);
                    _.each(this.list.selected, function (id) {
                        this.$(".List").find("td[data-id='" + id + "']").find("input[type='checkbox']").prop("checked", true);
                    }, this);
                }
                if (!flag)
                    this.getSelectedItems(m);
            },
            getSelectedItems: function (m) {
                this.currentid = m.id;
                ConditionsView.get().show({ code: this.forOne, cid: this.currentid });
            },

            forOne: function (eid) {
                this.$("#Load").html(_.template(docConditionsTemplate)({ Resources: Resources }));
                var s = this,
                   p = this.$("#Load>div");
                p.tabs({
                    active: false,
                    collapsible: true,
                    activate: function (event, ui) {
                        var id = ui.newPanel.attr("id");
                        switch (id) {
                            case "docsContent":
                                s.$("#docsContent").height(s.$el.height() - 120);
                                new ContentView({ objID: eid })
                                    .setElement(s.$("#docsContent"))
                                    .render();
                                break;
                            case "docsObjects":
                                if (!this.isInitDocs) {
                                    s.$("#docsObjects").height(s.$el.height() - 120);
                                    this.isInitDocs = true;
                                    this.docs = new List({
                                        el: ui.newPanel.find("#ObjList"),
                                        headerTemplate: "headFactTemplate",
                                        api: ("/api/Docs/LinkedFactsAndObjects/" + eid),
                                        templ: listFactsTemplate,
                                        operation: function () {
                                        }
                                    });
                                } else {
                                    this.docs.collection.url = ("/api/Docs/LinkedFactsAndObjects/" + eid);
                                    this.docs.collection.fetch({ reset: true });
                                }
                                break;
                        }
                    }
                });
                _.delay(function () { p.tabs("option", "active", 0) }, 1000);
            }
        });
        var p = new docsView;
        return {
            get: function () {
                return p;
            }
        }
    });