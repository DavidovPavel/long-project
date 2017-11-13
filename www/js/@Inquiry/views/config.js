define('config', ['i18n!nls/resources.min'], function (Resources) {

    var o = Mn.Object.extend({

        initialize: function () {

            this.pages = {

                //project: {

                //    sidebar: function (path) {

                //        return [
                //                { id: 'objects', className: 'inuiry-objects', title: Resources.a },
                //                { id: 'origin', className: 'origin4', title: Resources.b },
                //                { id: 'resume', className: 'result', title: Resources.c }
                //            ]
                //            .map((a) => {

                //                a.path = `${path}/${a.id}`;
                //                return a;

                //            });
                //    }
                //},

                result: {

                    sidebar: function (path) {

                        return [
                            //{
                            //    id: 'card', title: Resources.cm, className: 'maininfo', inDev: true,
                            //    children: [
                            //        { id: 'card', title: Resources.cm1, className: 'card-inq' }
                            //    ]
                            //},
                            //{ id: 'origin', title: Resources.b, active: false, className: 'origin4' },
                            { id: 'reports', title: Resources.c, className: 'result'

                                // #4375 2017-10-04
                                //id: 'result', title: Resources.c, name: 'reports',
                                //,children: [
                                // { id: 'report-dissier', title: Resources.pd, name: 'reportDossier'},
                                // {
                                //     id: 'rep', title: Resources.reports, active: false, name: 'reports',
                                //     children: [
                                //         { id: 'rep1', title: Resources.titleSdata, name: 'reports' },
                                //         { id: 'rep2', title: Resources.all, name: 'sqlreports' }
                                //     ]
                                // },
                                // //{ id: 'extr', title: Resources.titleExtract, name: 'extracts' },
                                // { id: 'sem', title: Resources.ss, name: 'semnet' },
                                // { id: 'note', title: Resources.an, name: 'notes' }
                                //]
                            },
                            { id: 'proof', title: Resources.gp, className: 'check' }
                        ]
                            .map(a=> {
                                a.path = `${path}/${a.id}`;
                                return a;
                            });
                    }
                },

                source: {

                    sidebar: function () {
                        return [
                            { id: 'content', title: Resources.content, name: 'content', children: [] },
                            { id: 'links', title: Resources.titleLinks, name: 'source:links' }
                        ];
                    }
                }

            };
        }
    });


    return new o;
});
