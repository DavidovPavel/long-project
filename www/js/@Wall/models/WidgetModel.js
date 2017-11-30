
define('WidgetModel', [], function () {

    return Backbone.Model.extend({

        defaults: function () {
            return {
                id: null,
                title: "",

                update: false,

                timeUpdate: 360000,

                // метка времени для получения новых данных после момента загрузки
                // конфликт при создании цепочек - sendModel не должна содержать св-во ts
                timeStampForUpdate:'',

                Characteristics: [],
                width: 400,
                height: 460,
                top: 100,
                left: 100,
                zIndex: 1,
                typeName: "",
                requestParameters: {},
                publishers: [],
                Decoration: {
                    CaptionBackground: 'rgba(200, 188, 162, 1)',
                    CaptionForeground: 'rgba(51, 51, 51, 1)',
                    ContainerBackground: 'rgba(255, 255, 255, 1)',
                    ContainerForeground: 'rgba(51, 51, 51, 1)',
					// по умолчанию ссылки имеют прозрачный фон
                    LinkBackground: 'rgba(255, 255, 255, 0)',
                    LinkForeground: 'rgba(55,141,218,1)',
                    CaptionIsVisible: true,
                    BorderIsVisible: true,
                    ContainerIsTransparent: false
                },
                Visualization: null,
                Legend: null,
                isMarkSelectedItem: false,

                // int?
                SNLevel: null,
                SNLayout: null,
                SNStruct: null,
                SNX: 0,
                SNY: 0,
                SNZoom: 0
            };
        },

        url: function() {
            return this.collection.url() + "/widget/" + (this.id || "");
        },

        validate: function (attr) {

            var output = [], dp = '^[\\d]+$';

            function test(s, p) {
                return s === "" || new RegExp(p).test(s);
            }

            if(!attr.title) {
                output.push({ name: "title" });
            }

            if (!attr.typeName) {
                output.push({ name: "typeName" });
            }

            // TODO: убрать костыли
            var types = ["WidgetSource", "WidgetHtml", "WidgetReporting", "WidgetSemNet"];

            if (types.indexOf(this.get("typeName")) === -1 && !attr.requestParameters.requestid)
                output.push({ name: "requestParameters" });

            if (!test(attr.timeUpdate, dp)) {
                output.push({ name: "timeUpdate" });
            }

            if (!test(attr.width, dp)) {
                output.push({ name: "width" });
            }

            if (!test(attr.height, dp)) {
                output.push({ name: "height" });
            }

            if (output.length)
                return output;
        }
    });

});