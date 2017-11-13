define('chartsRepository', ['i18n!nls/resources.min'], function (Resources) {

    return [
               { id: 1,      name: Resources.gn1,    type: "column",             family: 'Syncfusion_G' },
               { id: 3,      name: Resources.gn2,    type: "bar",                family: 'Syncfusion_G' },
               { id: 5,      name: Resources.gn3,    type: "stackingcolumn",     family: 'Syncfusion_G' },
               { id: 7,      name: Resources.gn6,    type: "line",               family: 'Syncfusion_G' },
               { id: 16,     name: Resources.gn7,    type: 'stackingcolumn100',  family: 'Syncfusion_G' },
               { id: 11,     name: Resources.gn8,    type: 'area',               family: 'Syncfusion_G' },
               { id: 15,     name: Resources.gn9,    type: 'stackingarea100',    family: 'Syncfusion_G' },
               { id: 6,      name: Resources.gn5,    type: "pie",                family: 'Syncfusion_P' },
               { id: 22,     name: Resources.gn4,    type: 'bubble',             family: 'Syncfusion_W' },
               { id: 4,      name: Resources.gn10,   type: "bar_d3",             family: 'C3' },
               { id: 9,      name: Resources.gn11,   type: 'area_d3',            family: 'C3' }               
    ];

});