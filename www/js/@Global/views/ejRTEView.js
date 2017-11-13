define('g/ejRTEView', ['i18n!nls/resources.min', 'g/ImageGalleryView', 'RU', 'syncfusion'], function (Resources, Gallery) {

    return Mn.View.extend({

        tagName: 'textarea',
        template: false,

        onAttach: function () {

            this.ejRTE = this.$el.ejRTE({
                value: this.options.value,
                maxLength: Number.MAX_VALUE,
                locale:Resources.Lang,
                width: this.options.width || "100%",
                height: this.options.height || "450px",
                minHeight: "200px",
                showFooter: true,
                showHtmlSource: true,
                //isResponsive: true,
                autoFocus: true,
                toolsList: [/*"view",*/"font", "style", "alignment", "customTools", "links", "clipboard", "doAction", /*"indenting",*/  "lists",  "media", "tables", "casing", "clear"],
                tools: {
                    //formatStyle: ["format"],
                    //edit:["findAndReplace"],
                    font: ["fontSize", "fontColor", "backgroundColor"],
                    style: ["bold", "italic", "underline", "strikethrough"],
                    alignment: ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"],
                    lists: ["unorderedList", "orderedList"],
                    clipboard: ["cut", "copy", "paste"],
                    doAction: ["undo", "redo"],
                    //indenting: ["outdent", "indent"],
                    clear: ["clearFormat", "clearAll"],
                    links: ["createLink", "removeLink"],
                    //images: ["image"],
                    media: ["video"],
                    tables: ["createTable", "addRowAbove", "addRowBelow", "addColumnLeft", "addColumnRight", "deleteRow", "deleteColumn", "deleteTable"],
                    //effects: ["superscript", "subscript"],
                    casing: ["upperCase", "lowerCase"],
                    //view: ["fullScreen"],
                    customTools: [
                        {
                            name: "galleryWindow",
                            tooltip: Resources.gallery,
                            text: '',
                            css: "e-rte-toolbar-icon image",
                            action: function () {

                                var dm = {
                                    id: 'gallery-window',
                                    icon: 'icon-source',
                                    title: Resources.gallery,
                                    toolbar: [],
                                    footer: [],
                                    content: new Gallery
                                };

                                Backbone.Radio.channel('Notify').request('once:dialog', dm);

                                this.listenTo( dm.content, 'change:item', function ( model ) {

                                    var img = '<img src="' + model.get('FileUrl') + '" alt="' + model.get('OriginalFileName') + '" />';
                                    this.ejRTE.executeCommand("inserthtml", img);

                                }.bind(this));


                            }.bind(this)
                        }
                       
                        //{
                        //    name: 'object',
                        //    tooltip: Resources.addObject,
                        //    css: 'e-rte-toolbar-icon link-object',
                        //    action: function () {
                        //        var text = this.ejRTE.getText();
                        //        var model = new Backbone.Model({ ParametrType: "Object" });
                        //        Backbone.trigger("choice:view", model);
                        //        model.on("choice:close", function (c) {
                        //            var o = c.at(0);
                        //            if (o) {
                        //                var oid = o.id;
                        //                this.ejRTE.executeCommand("inserthtml", "<span data-oknd='3' data-oid='" + oid + "' class='Mark' title='" + o.get("title") + "'>" + text + "</span>");
                        //            }
                        //        }.bind(this));
                        //    }.bind(this)
                        //}

                    ]
                }
            }).data("ejRTE");

        },

        fix: function () {
            // костыль для ejRTE - редактор не правильно вычисляет размеры области редактирования при инициализации
            // работает когда редактор виден
            $(window).trigger('resize');
            return this;
        }
    });
});