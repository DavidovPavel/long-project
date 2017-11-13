define('settings.visualization.table', ['i18n!nls/resources.min', 'settings.visualisation.table.column', 'settings.visualisation.table.fields', 'global.behaviors.input'],

    function (Resources, columnsOrg, fieldOrg, input) {

        var content = {
            table: columnsOrg,
            card: fieldOrg,
            card2: fieldOrg
        }

        return Mn.View.extend({

            behaviors: [input],

            template: '#table-visualisation-template',
            templateContext: function () {
                return {
                    Resources: Resources,
                    prefix: this.model.id
                };
            },

            regions: {
                content: { el: '#content', replaceElement: true }
            },

            events: {

                'click input': function (m, v) {

                    var name = this.$('input[name="Visualization"]:checked').attr('id').split('_')[1];

                    this.model.set('Visualization', name);

                    this.getRegion('content').show(new content[name]({ model: this.model }));
                }

            },

            onShow: function () {

                var name = this.model.get('Visualization') || 'table';
                this.$('#' + this.model.id + '_' + name).prop('checked', true);

                this.getRegion('content').show(new content[name]({ model: this.model }));

            },

            onSave: function () {

                this.getChildView('content').onSave(function (c) {

                    this.model.save({ ColumnCustomizations: c });

                });

            },

            onReset: function () {

                this.getChildView('content').onReset(function () {

                    this.model.set("ColumnCustomizations", null);

                });              
                
            },

            modelEvents: {

                'change:feed': function (m, feed) {

                    var name = this.model.get('Visualization') || 'table';
                    this.getRegion('content').show(new content[name]({ model: this.model }));

                }
            }


        });

    });