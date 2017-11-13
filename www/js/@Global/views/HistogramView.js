define([App, c3], function(App, c3) {

    return Mn.View.extend({

        template: _.template('<div id="chart"></div>'),

        initialize: function () {

            this.flag = false;

            if (this.options.length)
                this.title = _.filter(this.options.items, function(a) {
                    return a.systemName == "YVal";
                })[0].displayName;

        },

        checkValue:function(v) {
            var val = new Date(v);
            if(val.toString() !== "Invalid Date") {
                this.flag = true;
                return val;
            }
            return v;
        },

        onBeforeRender:function(){
            this.$el.css({ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 });
        },

       onRender: function () {

           var columns = [],
               columnsX = [["x"]],
               n = this.options.items,
               obj = _.groupBy(n, "Object_ID"),
               gr = _.groupBy(n, "GroupID"),
               height = this.$el.height() - 50,
               width = this.$el.width() - 20;

           var preObj = true;

           var data = {
               columns: columns,
               type: this.options.chart || 'bar'
           },
               axis = {
                   //rotated: true,
                   y: {
                       label: this.title
                   }
               },
               groups = [[]];

           var flag = false;
           if (!(undefined in gr)) {
               flag = true;
               data.x = "x";
               axis.x = {
                   type: 'category',
                   tick: {
                       //fit: true,
                       rotate: _.size(gr)>3?30:0,
                       multiline: false,
                       //outer: false
                   },
                   //height: height/3
               };
               data.groups = groups;
               preObj = false;// _.size(obj) < _.size(gr);
           }
           

           if (preObj) {

               var j = 0;
               _.each(obj, function (el) {

                   if (flag) {

                       columnsX[0].push(el[0].Display_Name);
                       _.each(el, function (a, j) {
                           var c = columnsX[parseInt(j) + 1];
                           if (!c) {
                               c = [];
                               columnsX[parseInt(j) + 1] = c;
                           }
                           if (!c.length) {
                               groups[0].push(a.GroupName);
                               c.push(a.GroupName || a.Display_Name);
                           }
                           c.push(parseInt(a.YVal));
                       }, this);
                       data.columns = columnsX;
                   } else {
                       _.each(el, function (a) {
                           var c = [], val = this.checkValue(a.Display_Name);
                           if (this.flag) {
                               columnsX[0].push(val);

                               var c = columnsX[parseInt(j) + 1];
                               if (!c) {
                                   c = [this.title];
                                   columnsX[parseInt(j) + 1] = c;
                               }

                               c.push(a.YVal);
                           } else {
                               c.push(val);
                               c.push(a.YVal);
                               columns.push(c);
                           }
                       }, this);
                       if (this.flag)
                           data.columns = columnsX;
                   }
                   j++;
               }, this);
           } else {

               var j = 0;
               _.each(obj, function (el) {
                   j++;
                   columnsX[j] = [el[0].Display_Name];
                   groups[0].push(el[0].Display_Name);
               }, this);
               j = 0;
               _.each(gr, function (el) {
                   columnsX[0].push(el[0].GroupName);
                   j++;
                   _.each(columnsX, function (a) {
                       var name = a[0];
                       if (name != "x") {
                           var s = _.filter(el, function (a) { return a.Display_Name == name });
                           if (s.length)
                               a[j] = s[0].YVal;
                           else
                               a[j] = 0;
                       }
                   }, this);
               }, this);
               
               
               data.columns = columnsX;
           }

           if(this.flag) {
               data.x = "x";
               axis.x = {
                   type: 'timeseries',
                   tick: {
                       format: '%Y-%m-%d'
                   }
               };
           }

           c3.generate({
               bindto: this.$('#chart').get(0),
               data: data,
               legend: {
                   //position: "inset"
               },
               tooltip: {
                   grouped: false,
                   format: {
                   }
               },
               axis: axis,
               bar: {
                   width: {
                       ratio: 0.5 // this makes bar width 50% of length between ticks
                   }
               },
               size: {
                   height: height,
                   width: width
               }
           });
          
           return this;
       }
    });

});