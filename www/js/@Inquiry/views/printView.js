define('print', [ 'i18n!nls/resources.min'], function (Resources) {

    var noteView = Mn.View.extend({

        template: _.template(`
<div class ="note-head">
        <% if(title.toLowerCase().indexOf(Resources.nt) !==-1) { %>
        <span data-icon="icon-attention" color-icon="red"></span>
        <% } %>
        <span><%-title %></span>
</div>
<div class ="child-container">
        <% _.each(collection, function(m) { %>
        <div class ="note"><div class ="note-text"><%= m.Html %></div></div>
        <% }) %>
</div>
<div class ="child"></div>`),

        templateContext: {
            Resources: Resources
        },
        regions: {
            child: { el: '.child', replaceElement: true }
        },
        onRender: function () {
            if (this.model.get('Childs'))
                this.showChildView('child', new notesView({ collection: new Backbone.Collection(this.model.get('Childs')) }));
        }
    });

    var notesView = Mn.CollectionView.extend({
        childView: noteView
    });

    var headView = Mn.View.extend({
        tagName: 'h3',
        template: _.template('<a href="javascript:print();"><span data-icon="icon-printer"></span><%- Resources.print %></a><%- Resources.ant %> "<%- title %>"'),
        templateContext: {
            Resources: Resources
        }
    });

    return Mn.View.extend({
        className: 'wrap preview',
        template:_.template('<h3></h3><div class="list"></div>'),

        regions: {
            head: { el: 'h3', replaceElement: true },
            list: { el: '.list', replaceElement: true }
        },

        modelEvents: {

            sync: function () {

                this.showChildView('head', new headView({ model: this.model }));

                $(document).find("head>title").text(this.model.get("title") + " :: " + Resources.expnote);
            }
        },

        onRender: function () {

            this.model.url = '/api/details/' + this.model.id + '?mode=1';
            this.model.fetch();

            this.collection = new Backbone.Collection();
            this.collection.url = "/api/CheckNotes/" + this.model.id;
            this.collection.fetch({ reset: true });

            this.showChildView('list', new notesView({ collection: this.collection }));
        }
    });
});