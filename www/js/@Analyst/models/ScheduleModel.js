define(function (require) {
    
    return Backbone.Model.extend({
        idAttribute: "UID",
        defaults: {
            UID: null,
            Title: "",
            TimeStartExecution: null,
            PointDateForSelection:null,
            Periodicity: null,
            WhichDaysOfWeek: [],
            Subscribers: "",
            SchedulingTaskType: 0,
            State: 1,
            EmailTopic: "",
            EmailBody: ""
        },
        
        validate: function(attr) {
            var output = [];

            if (!$.trim(attr.Title))
                output.push("Title");

            if (!$.trim(attr.TimeStartExecution))
                output.push("TimeStartExecution");

            if (!$.trim(attr.Subscribers))
                output.push("Subscribers");

            if (attr.Periodicity == "3") {
                var arr = [];
                for (var p in attr) {
                    if (p.indexOf("Day_") != -1 && attr[p]) {
                        arr.push(parseInt(p.split("_")[1]));
                    }
                }
                this.set("WhichDaysOfWeek", arr);
            }
            this.set("Periodicity", parseInt(attr.Periodicity));
            if (output.length)
                return output;
        }
    });
});