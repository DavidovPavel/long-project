define('result:proof', ['i18n!nls/resources.min', 'c/SimpleTableView'], function (Resources, tableView) {

    return Mn.View.extend({

        isProof: true,

        className: 'workbench--content',

        template: _.template('<div></div>'),

        regions: {
            content: { el: 'div', replaceElement: true }
        },

        _showRobotsInfo: function (point) {

            const m = this.collection.get(point);

            if (m) {

                this.showChildView('content', new tableView({

                    collection: new Backbone.Collection(m.get('data')),

                    rowTemplate:
                        `<td><%- title %></td>
                     <td>
                        <span class="font-icon font-icon-<%- status %>"></span>
                     </td>
                     <td>
                        <%-state %>
                        <%= details?'<br/>[<i>'+details+'</i>]': '' %>
                     </td>`,

                    head: new Backbone.Collection([
                        { id: 0, title: Resources.title, width: '65%' },
                        { id: 1, title: Resources.status, width: '10%' },
                        { id: 2, title: Resources.execution, width: '25%' }
                    ])
                }));
            }
        },

        _updateStatistic: function (robot) {

            if (this.model.id === robot.objID) {

                if (!this.getRegion('content').hasView()) return;

                var m = this.getChildView('content').collection.get(robot.id);

                if (m) {

                    m.set(robot);

                    var all = this.collection.length,
                        error = this.collection.where({ status: "invalid" }).length,
                        final = this.collection.where({ status: "complited" }).length,
                        working = all - (final + error);

                    //console.log('Ticker::updated search tasks >> ', { all, error, final, working });

                }
            }
        }

    });

});