define('c/EditPanelView', ['i18n!nls/resources.min'], function (Resources) {

    return Mn.View.extend({
        className: "edit-panel",
        template: '#edit-panel-template',
        templateContext:{
            Resources:Resources
        },

        events: {

            "click span:not(.search)": function (e) {
                e.stopPropagation();
                this.trigger("edit-panel:action", $(e.target).closest("li"));
            },

            "keyup input[name='rubric-name']": function (e) {
                e.stopPropagation();
                if (e.keyCode === 13 || !$.trim(this.$("input[name='rubric-name']").val()))
                    this.trigger("edit-panel:action", this.$("i[name=search]"));
            },

            'click i.search': function (e) {
                e.stopPropagation();
                this.trigger("edit-panel:action", this.$("i[name=search]"));
            }

        },

        rere:function(){
            this.$("li:not([name='add'])").attr("disabled", "disabled");
        },

        setCurrent: function (model) {
            this.selectmodel = model;
            if (this.selectmodel.id !== "-1")
                this.$("li").removeAttr("disabled");
            else
                this.$("li:not([name='add'])").attr("disabled", "disabled");

            if (this.selectmodel.has("isdoc") && this.selectmodel.get("isdoc"))
                this.$("li[name='add']").attr("disabled", "disabled");
        },

        onRender: function () {

            var spl = this.options.unvisible ? this.options.unvisible.split(",") : [];

            _.each(spl, function (a) {
                if ($.trim(a))
                    this.$("." + $.trim(a)).hide();
            }, this);

            return this;
        }
    });
});