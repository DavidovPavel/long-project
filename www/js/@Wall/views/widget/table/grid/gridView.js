define('widgetTableGrid', ['i18n!nls/resources.min', 'widget.table.filter'], function (Resources, filterView) {

    var toolsView = Mn.CollectionView.extend({

        className: 'tools',

        events: {

            'mouseleave': function () {
                this.$el.hide();
            }
        },

        childView: Mn.View.extend({

            tagName: 'span',
            className: 'btn',

            events: {

                'mouseenter svg': function () {
                    this.$el.find(".anbr-tooltip").fadeIn();
                },

                'mouseleave svg': function () {
                    this.$el.find(".anbr-tooltip").fadeOut();
                }
            },

            triggers: {
                'touchstart': 'action',
                'click': 'action'
            },

            onAction: function (e) {

                if (this.model.get('render') === "action")
                    $.ajax({ method: this.model.get('verb'), url: this.model.get('href') })
                        .done(function () { Backbone.trigger("message:success", { title: Resources.alert, message: Resources.success }); })
                        .fail(function (m) { Backbone.trigger("message:warning", { title: Resources.error, message: m.status }); });

            },

            getTemplate: function () {
                if (this.model.get('render') === 'open')
                    return _.template('<a href="<%- href %>" target="_blank"><span class="anbr-tooltip"><span position="bottom"></span><%- prompt %></span><svg class="svg-icon"><use xlink:href="#<%- id %>" /></svg></a>');
                else
                    return _.template('<span class="anbr-tooltip"><span position="bottom"></span><%- prompt %></span><svg class="svg-icon"><use xlink:href="#<%- id %>" /></svg>');
            }
        }),

        onRenderChildren: function () {
            this.$el.width(this.collection.length * 52).delay(100).slideDown();
        }
    });

    var toolsTableView = Mn.View.extend({

        className: 'preblu',
        template: _.template('<div class="arrow"></div><div class="tools"></div>'),

        regions: {
            tools: { el: '.tools', replaceElement: true }
        },

        triggers: {
            'touchstart': 'prepare',
            'click': 'prepare',
        },

        onPrepare: function () {

            var data = _.groupBy(this.model.get('links'), 'rel').tools || [];
            this.showChildView('tools', new toolsView({ collection: new Backbone.Collection(data) }));

        },

        show: function (v) {
            this.model = v.model;
            this.$el.css("top", v.$el.position().top + v.$el.outerHeight() / 2 - 10);
            this.$el.show();
        }
    });

    var rowView = Mn.View.extend({

        tagName: 'tr',

        getTemplate: function () {
            return _.template(this.options.templ);
        },
        templateContext: function () {
            return {
                parse: this.parseType
            }
        },

        events: {

            'click a': function (e) {
                e.stopPropagation();
            },
            'touchstart a': function (e) {
                e.stopPropagation();
            },
        },

        triggers: {
            'mouseenter': 'mouse:enter:row',
            'mouseleave': 'mouse:leave:row',

            'touchstart': 'table:row:handler',
            'click': 'table:row:handler',
        },

        onRender: function () {

            if (this.model.has('links')) {

                var a = _.groupBy(this.model.get('links'), 'rel');

                if (_.has(a, 'rubric_id')) {
                    this.$('td[data-column="display_name"]').append('<div class="rubrics"></div>');
                    var vs = _.pluck(a.rubric_id, 'value');
                    this.$('.rubrics').append(vs.join('; '));
                }

                if (_.has(a, 'url_источника')) {
                    _.chain(a['url_источника']).map(function (o) {
                    	this.$('td[data-column="display_name"]')
							.append(
							`<a title="${o.prompt}" href="${o.href}" target="_blank">
								<span><svg class="link-icon"><use xlink: href="#link-icon" /></svg></span>
							</a>`);
                    }, this);

                }

            }
        },

        parseType: function (value, s) {
            if (!s) return '';
            var output;
            switch (s) {
                case 0: //целочисленный
                    output = parseInt(value);
                    break;
                case 2: // date-time
                    output = $.parseDate(value);
                    break;
                case 4: // вещественный
                    output = parseFloat(value);
                    break;
                case 7: // image                   
                case 1: // string
                case 3: // dictionary
                case 5: // file name
                case 6: // text              
                case 8: // html
                case 9: // giperlink
                case 10: // data
                case 11: // OLE document
                case 12: // uid
                case 13: // VarBinary
                case 14: // двоичный файл
                case 15: // денежный
                case 16: // bool
                case 17: // geo coordinates
                    output = "<span>" + value + "</span>";
            }

            return output;
        }

    });

    var bodyView = Mn.CollectionView.extend({

        tagName: 'tbody',

        childView: rowView,

        childViewOptions: function () {
            return {
                templ: this.options.templ,
                cols: this.options.cols
            };
        },

        emptyView: Mn.View.extend({
            tagName: 'tr',
            template: _.template('<td colspan="<%- colspan %>"><%- Resources.N %></td>'),
            templateContext: function () {
                return {
                    Resources: Resources,
                    colspan: this.options.cols
                };
            }
        }),

        onChildviewTableRowHandler: function (v) {

            var currentTr = this.$el.find('tr.current'),
                flag = this.options.isMarkSelectedItem;

            currentTr.removeClass('current').addClass('viewed');

            currentTr.find('td').each(function (i, e) {
                $(e).css({
                    color: flag ? this.options.decoration.ContainerForegroundVisited : this.options.decoration.ContainerForeground,
                    'background-color': flag ? this.options.decoration.ContainerBackgroundVisited : this.options.decoration.ContainerBackground
                });
            }.bind(this));

            v.$el.addClass('current').removeClass("new-post");

            v.$el.find('td').each(function (i, e) {
                $(e).css({
                    color: this.options.decoration.ContainerForegroundActive,
                    'background-color': this.options.decoration.ContainerBackgroundActive
                });
            }.bind(this));

        },

        childViewTriggers: {
            'mouse:enter:row': 'mouse:enter:row',
            'mouse:leave:row': 'mouse:leave:row',
            'table:row:handler': 'table:row:handler'
        }
    });

    var headView = Mn.CollectionView.extend({
        tagName: 'tr',
        childView: Mn.View.extend({
            tagName: 'th',
            template: _.template('<%- displayName %>')
        })
    });

    var tableView = Mn.View.extend({

        tagName: 'table',

        className: 'widget-table',

        template: _.template('<thead></thead><tbody></tbody><tfoot></tfoot>'),

        regions: {
            head: 'thead',
            body: { el: 'tbody', replaceElement: true }
        },

        initialize: function () {

            this.templ = '';

            var columns = this.model.get('ColumnCustomizations');
            if (columns) {

            	this.options.head = _.chain(columns)
					.filter(function (e) { return e.ColumnIsVisible; })
					.sortBy(function (e) { return e.SerialNum })
                    .map(function (e) {

                    	this.templ += `<td data-column="${e.ColumnSystemName.toLowerCase()}"><%= parse(${e.ColumnSystemName.toLowerCase()}, propType["${e.ColumnSystemName.toLowerCase()}"]) %></td>`;

                    	return { displayName: e.ColumnTitle };

                    }, this).value();

            } else
            	_.each(this.options.head, function (o) {

            		this.templ += (`<td data-column="${o.systemName}"><%= parse(${o.systemName}, propType["${o.systemName}"]) %></td>`);

                }, this);

        },

        onRender: function () {

            this.$el.css({ width: "100%", "table-layout": "auto" });
            this.$el.attr('dir', 'auto');

            //if (this.model.get('ts')) {

            //var items = $.prepare(this.options.feed.get('items'));

            //_.each(feed.data, function (a) {
            //    var id = _.findWhere(a.data, { systemName: "Object_ID" }).value;
            //    if (!_.find(items, function (b) { return id === b.Object_ID; }))
            //        this.feedItems.push(a);
            //}, this);

            //if (this.feedItems.length) {
            //    this.$(".number-update").css("display", "inline-block").text(this.feedItems.length);
            //    this.model.set("Items", this.model.get("Items").concat(this.feedItems));
            //}

            //} else {

            this.showChildView('head', new headView({ collection: new Backbone.Collection(this.options.head) }));

            this.showChildView('body', new bodyView({
                collection: this.collection,
                templ: this.templ,
                cols: this.options.head.length,
                isMarkSelectedItem: this.model.get('isMarkSelectedItem'),
                decoration: this.model.get('Decoration')
            }));

            //}

        },

        onAttach: function () {

            this.$('tbody').height(this.$el.closest('.anbr_list').height() - this.$('thead').height());

        },

        modelEvents:{

            'change:width': function () {
                this.$('tbody').height(this.$el.closest('.anbr_list').height() - this.$('thead').height());
            },

            'change:height': function () {
                this.$('tbody').height(this.$el.closest('.anbr_list').height() - this.$('thead').height());
            }

        },

        onChildviewTableRowHandler: function (v) {

            this.model.trigger('click:item', v.model);

        },

        childViewTriggers: {
            'mouse:enter:row': 'mouse:enter:row',
            'mouse:leave:row': 'mouse:leave:row',
            'table:row:handler': 'table:row:handler'
        }

    });

    return Mn.View.extend({

    	template: _.template('<div class="filter-panel"></div><span class="number-update"></span><div class="preblu"></div><table></table>'),

        ui: {            
            update: '.number-update'
        },

        regions: {
        	filter: { el: '.filter-panel', replaceElement: true },
            toolsTable: { el: '.preblu', replaceElement: true },            
            table: { el: 'table', replaceElement: true }
        },

        onRender: function () {

            // 21.09.2017 временно скрыто
            //this.showChildView('toolsTable', new toolsTableView);

        	this.showChildView('filter', new filterView({ model: this.model }));

            this.showChildView('table', new tableView({
                model: this.model,
                collection: this.collection,
                head: _.filter(this.model.get('feed').head, function (o) { return o.isVisible; })
            }));

            var c = [];

            this.collection.each(function (m) {

                var rels = _.groupBy(m.get('links'), "rel");

                _.each(rels.rubric_id, function (a) {
                    c.push(a);
                }, this);


            }, this);

            this.getChildView('filter').collection.add(c);

            if (c.length)
            	this.getChildView('filter').showRubrics();
            else
            	this.getChildView('filter').hideRubrics();

        },

        onAttach: function () {

        	this.getChildView('table').getChildView('body').$el.on('scroll', function (e) {

        		this.triggerMethod('scroll:grid');

        	}.bind(this));

        },

        collectionEvents: {

            update: function (c, a) {

                if (a.add) {

                    var c = [];

                    _.each(a.changes.added, function (m) {

                        var rels = _.groupBy(m.get('links'), "rel");

                        _.each(rels.rubric_id, function (a) {
                            c.push(a);
                        }, this);


                    }, this);

                    this.triggerMethod('table:add:rubrics:filter', c);
                }
            }

        },

        childViewEvents: {

            'mouse:enter:row': function (v) {
                //this.getChildView('toolsTable').show(v);
            },

            'mouse:leave:row': function (v) {
                //this.getChildView('toolsTable').hide(v);
            },

            'table:row:handler': function (v) {

                //this.triggerMethod( 'check:child', this.model, v.model );

            },

            'filter:search': function (text) {

            	this.$("tbody>tr>td[data-column='display_name'] .Mark").removeClass("Mark");

            	var s = new RegExp(text, "ig");

            	this.$("tbody>tr").each(function (i, e) {

            		var $a = $(e).find("td[data-column='display_name']"),
						check = $a.html(),
						searchIndex = check.search(s);

            		if (searchIndex === -1)
            			$(e).hide();

            		else {

            			var p = `<i class="Mark">${check.match(s)[0]}</i>`,
							start = check.substring(0, searchIndex),
							end = check.substring(searchIndex + text.length),
							out = start + p + end;

            			$a.html(out);
            			$(e).show();
            		}
            	});
            },

            'filter:apply': function () {

            	this.getChildView('table').getChildView('body').children.each(function (v) {

            		v.$el.show();

            		var a = _.groupBy(v.model.get('links'), 'rel');

            		var rubs = a.rubric_id;
            		if (rubs) {

            			_.each(rubs, function (r) {

            				var ex = this.getChildView('filter').collection.get(r.id);
            				if (ex.get('hide'))
            					v.$el.hide();

            			}, this);

            		}

            	}, this);

            	this.$("tbody>tr>td[data-column='display_name'] .Mark").removeClass("Mark");
            }
        }
    });

});