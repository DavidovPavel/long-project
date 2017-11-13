define('proof:statistic', ['i18n!nls/resources.min', 'c/SimpleTableView'], function (Resources, tableView) {

    return Mn.View.extend({

        template: _.template('<div class="content-table"></div>'),

        regions: {
            list: '.content-table'
        },

        initialize: function () {

            var side = Backbone.Radio.channel('side').request('get:sidebar'),
           m = side.collection.get('check'),
           childChecks = side.getChildView('children').children.findByModel(m).getChildView('children'),
           cm = childChecks.collection.get(this.options.checkId),
           cv = childChecks.children.findByModel(cm);

            $.get('/api/InterestObj/TotalCheck/' + this.model.id).done(function (ar) {

                cv.getChildView('children').children.each(function (v, i) {
                    if (v.model.id !== 'statistic')
                        v.model.set('count', ' (' + ar[i - 1] + ')');
                });

            }.bind(this));

            Backbone.Radio.channel('side').request('get:sidebar').setCurrent(['check', this.options.checkId, 'statistic']);

            this.checkID = parseInt( this.model.id );

            this.model = new Backbone.Model;

            //var app = om.request('get:app');

            //if (app.currentChecks.length && app.currentChecks.get(this.model.id)) {

            //var objID = this.model.id;
            //this.chcInt = setInterval(function () {

            //    $.get('/api/checkready/' + objID + '?kind=0')

            //        .done(function (status) {

            //            // status = 102 - началось автоизвлечение фактов

            //            if (status === 200) {
            //                clearInterval(this.chcInt);                           

            //            }

            //        }.bind(this))

            //        .fail(function () {

            //            clearInterval(this.chcInt);

            //        });

            //}.bind(this), 3000);

        },

        onBeforeRender: function () {

            //Backbone.Radio.channel('tools').request('get:tools').collection.reset();

        },

        onRender: function () {

            var headCollection = new Backbone.Collection([
                { id: 0, title: Resources.title, width: '65%' },
                { id: 1, title: Resources.status, width: '10%' },
                { id: 2, title: Resources.execution, width: '25%' }
            ]);

            var rowTemplate = '<td><%- title %></td><td><span class="font-icon font-icon-<%- status %>"></span></td><td><%- state %><%= details?"<br/>[<i> "+details+" </i>]":"" %></td>';

            this.showChildView('list', new tableView({ collection: this.collection, rowTemplate: rowTemplate, head: headCollection }));

            //this.collection.fetch({ reset: true });

        },

        // from MainView.initHub
        updateStatistic: function (robot) {

            if (this.checkID === robot.objID) {

                var m = this.collection.get(robot.id);

                if ( m ) {

                    m.set( robot );

                    var all = this.collection.length,
                        error = this.collection.where( { status: "invalid" }).length,
                        final = this.collection.where( { status: "complited" }).length;

                    this.model.set( {
                        all: all,
                        error: error,
                        final: final,
                        working: all - ( final + error )
                    });
                    
                }
            }
        },

        modelEvents: {

            'change': function (m) {
                console.log( 'SR > UpdateRobots', { all: m.get( 'all' ), error: m.get( 'error' ), finish: m.get( 'final' ), works: m.get( 'working' ) });
            }

        },

        childViewTriggers: {
            'click:table:row:imput': 'click:table:row:imput'
        }
    });

});