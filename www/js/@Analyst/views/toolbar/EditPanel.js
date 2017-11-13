define(function(require) {

    /*
    *   только для дерева Рубрики
    */

    var App = require('app'),
        Resources = require('i18n!nls/resources.min'),
        dialogView = require('@/views/DialogView'),
        FormView = require('@/views/FormView');

    var editPanel = Backbone.View.extend({
        className: "floatPanel",
        //className: "PanelWithEars",
        events: {
            "click .Add": "add",
            "click .Clear": "clear",
            "click .EditItem": "edit",
            "click .DeleteItem": "deleteItem"
        },
        // здесь получаем модель выделеного объекта для редактирования
        Select: function(model) {
            this.model = model;
            /*
            TODO:
            набор кнопок можно определять из свойств модели или из текущего контекста
            */
            this.$(".EditItem").show();
            this.$(".DeleteItem").show();
            this.$(".Clear").show();
            Backbone.trigger("editpanel:select", model.id);
        },
        add: function() {
            var model = new this.calledView.collection.model();
            if (!model.collection)
                model.collection = this.calledView.collection;
            var title = Resources.addObject;
            if (this.model) {
                title = Resources.addFolderIn + (this.model.get("title") ? (" [" + this.model.get("title") + "]") : "");
                model.set({ "parentid": this.model.id ? this.model.id : 0 });
            }
            var form = new FormView({ model: model }).render();
            var dialog = new dialogView({ title: title, height: 250 }).render();
            dialog.fill(form.$el);
        },
        edit: function() {
            var title = Resources.editItem + " [" + this.model.get("title") + "]";
            this.model.set({ "id": this.model.id });
            var form = new FormView({ model: this.model }).render();
            var dialog = new dialogView({ title: title, height: 250 }).render();
            dialog.fill(form.$el);
        },
        deleteItem: function() {
            if (confirm(Resources.askyousure + "\n" + Resources.warndeleteobj)) {
                this.model.destroy({
                    error: function() {
                        $.Error(arguments);
                    }
                });
                this.clear();
            }
        },
        disabled: function() {
            this.$(".EditItem").hide();
            this.$(".DeleteItem").hide();
            this.$(".Clear").hide();
            if (this.dialog) this.dialog.dialog("close");
        },
        clear: function() {
            this.disabled();
            this.calledView.trigger("clear");
            this.model = new this.calledView.collection.model();
            Backbone.trigger("editpanel:clear");
        },
        initialize: function() {
            this.calledView = this.options.view;
            this.className = this.className || this.options.className;
            this.render();
        },
        render: function() {
            this.$el.show();
            var b = [
                ["FB0AB23A-36D0-4A5C-8706-00A3DB9BCFAE", '<div class="Add btn" title="<%= Resources.add %>"></div>'],
                ["5A0C0FC1-E1A6-4E52-B784-0F98795FAD1A", '<div class="EditItem btn2" title="<%= Resources.editItem %>"></div>'],
                ["C90535CA-D9E3-445A-AF3D-066066484755", '<div class="DeleteItem btn2" title="<%= Resources.deleteItem %>"></div>'],
                ["5146D1D1-C2E2-445E-87B5-44FB73C6F7C2", '<div class="Clear btn" style="display:none;" title="<%= Resources.clear %>"></div>']
            ];
            for (var i = 0; i < b.length; i++) {
                if (App.check(b[i][0])) {
                    this.$el.append(_.template(b[i][1])( { Resources: Resources }));
                }
            }
        }
    });
    return editPanel;
});