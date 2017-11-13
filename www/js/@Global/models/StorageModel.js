define('storage', ['i18n!nls/resources.min'], function (Resources) {
        
    var s = Backbone.Model.extend({
        defaults: {
            Trees: {},
            Players: [],
            ConnectUrl: ''
        },
        initialize: function () {
            this.Current = null;

            Backbone.on("storage:addTree", this.addTree, this);

            Backbone.on("storage:addPlayer", this.addPlayer, this);
            Backbone.on("storage:clearPlayers", this.clearPlayers, this);

            Backbone.on("storage:check-add", this.addChecking, this);
            Backbone.on("storage:check-clear", this.clearChecking, this);

            Backbone.on("storage:temp-object", this.setCurrent, this);
        },

        setCurrent: function (data) {
            this.Current = data;
        },

        // check
        clearChecking: function (id) {
            var m = this.checkCollection.get(id);
            this.checkCollection.remove(m);
        },
        addChecking: function (o) {
            if (!this.checkCollection)
                this.checkCollection = new Backbone.Collection();
            this.checkCollection.add(o);
        },

        getTree: function (id, noCash, surl, o) {

            return new Promise(function (resolve, reject) {

                var ts = this.get("Trees");

                if (!ts[id] || noCash) {

                    var model = this.getModelForTree(id);
                    require(['g/tree/TreeView'], function (TreeView) {
                        var options = o || {};
                        options.model = model;
                        options.api = function () { return '/api/' + id + (surl ? surl : "") };
                        options.markCurrent = true;

                        ts[id] = new TreeView(options);
                        this.set("Trees", ts);
                        resolve(ts[id]);
                    }.bind(this));

                } else {

                    ts[id].operation = this.getModelForTree(id).get("present").operation;
                    resolve(ts[id]);

                }
            }.bind(this));
        },
        getModelForTree: function (name) {
            if ($.trim(name)) {
                if (!this.buts)
                    this.getButs();
                return new Backbone.Model(_.findWhere(this.buts, { id: name }));
            }
        },
        getButs: function () {
            var data = Resources.QueryButtonsData, bs = [];
            _.each(data, function (a) {
                bs.push(a);
                var b = a.addButtons;
                if (b)
                    bs = _.union(bs, b);
            }, this);
            this.buts = bs;
            return bs;
        },

        addPlayer:function(p, id) {
            var ps = this.get("Players");
            //_.each(ps, function (player) {
            //    player.pause();
            //    player.src = "";
            //    player.load();
            //    player = "";
            //}, this);
            ps.push(p);
        },
        clearPlayers: function () {
            var ps = this.get("Players");
            _.each(ps, function (player) {
                player.pause();
                player.src = "";
                player.load();
                player = {};
            }, this);
        }
    });
    var st = new s;
    return st;
});