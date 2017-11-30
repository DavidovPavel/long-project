define('widgetTableGrid', ['i18n!nls/resources.min'], function (Resources) {

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
                    return _.template('<a dir="auto" href="<%- href %>" target="_blank"><span class="anbr-tooltip"><span position="bottom"></span><%- prompt %></span><svg class="svg-icon"><use xlink:href="#<%- id %>" /></svg></a>');
                else
                    return _.template('<span dir="auto" class="anbr-tooltip"><span position="bottom"></span><%- prompt %></span><svg class="svg-icon"><use xlink:href="#<%- id %>" /></svg>');
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

        modelEvents: {

        	'set:current': function (m, f) {

        		this.$el.addClass('current').removeClass("new-post");

        		this.$el.find('td').each(function (i, e) {
        			$(e).css({
        				color: this.options.decoration.ContainerForegroundActive,
        				'background-color': this.options.decoration.ContainerBackgroundActive
        			});
        		}.bind(this));

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
                	output = `<span>${value}</span>`;
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
                cols: this.options.cols,
                decoration: this.options.decoration
            };
        },

        emptyView: Mn.View.extend({

        	tagName: 'tr',

        	template: _.template('<td dir="auto" colspan="<%- colspan %>"><%- Resources.N %></td>'),

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
            template: _.template('<%- displayName %>'),

            onRender: function () {

            	this.$el.attr('data-column', this.model.get('systemName'));
            	this.$el.attr('dir', 'auto');
            	this.$el.css('width', this.model.get('columnWidth') || 'auto');

            }

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
					.filter(e=> e.ColumnIsVisible)
					.sortBy(e=> e.SerialNum)
                    .map(function (e) {

                    	this.templ += `<td dir='auto' data-column="${e.ColumnSystemName.toLowerCase()}"><%= parse(${e.ColumnSystemName.toLowerCase()}, propType["${e.ColumnSystemName.toLowerCase()}"]) %></td>`;

                    	return {
                    		displayName: e.ColumnTitle,
                    		systemName: e.ColumnSystemName,
                    		columnWidth: e.ColumnWidth || 'auto'
                    	};

                    }, this).value();

            } else
            	_.each(this.options.head, function (o) {

            		this.templ += (`<td dir='auto' data-column="${o.systemName}"><%= parse(${o.systemName}, propType["${o.systemName}"]) %></td>`);

                }, this);

        },

        onRender: function () {

            //this.$el.css({ width: "100%", "table-layout": "auto" });
            this.$el.attr('dir', 'auto');

            this.showChildView('head', new headView({ collection: new Backbone.Collection(this.options.head) }));

            this.showChildView('body', new bodyView({
                collection: this.collection,
                templ: this.templ,
                cols: this.options.head.length,
                isMarkSelectedItem: this.model.get('isMarkSelectedItem'),
                decoration: this.model.get('Decoration')
            }));

        },

        onAttach: function () {

        	this._initColResizable(!this.options.editMode);

            //this.$('tbody').height(this.$el.closest('.anbr_list').height() - this.$('thead').height());

        },

        modelEvents: {

        	'change:ReadOnly': function (m, v) {

        		this._initColResizable(v);

        	},

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
        },

        _initColResizable: function (v) {

        	this.$el.colResizable({
        		disable: v,
        		liveDrag: true,
        		onResize: this._colResize.bind(this)
        	});

        },

        _colResize: function (e) {

        	let $e = $(e.currentTarget);

        	var columns = this.model.get('ColumnCustomizations');

        	if (!columns) {

        		var items = this.model.get('feed').head,
					rid = this.model.get("requestParameters");

        		columns = _.map(items, function (e, i) {

        			return {
        				QueryCustomizationUID: null,
        				QueryID: rid,
        				ColumnSystemName: e.systemName,
        				ColumnTitle: e.displayName,
        				ColumnIsVisible: e.isVisible,
        				SerialNum: i,
        				ColumnWidth: 'auto'
        			};

        		}, this);
        	}

        	$e.find('th').each(function (i, e) {

        		let name = e.getAttribute('data-column'),
					width = e.clientWidth;

        		_.findWhere(columns, { ColumnSystemName: name }).ColumnWidth = width;

        	}.bind(this));


        	$.ajax({

        		method: "POST",
        		contentType: 'application/json; charset=utf-8',
        		url: `/api/widget/${this.model.get("requestParameters").rid}/colscustomization`,
        		data: JSON.stringify(columns)

        	}).done(function (c) {

        		this.model.save({ ColumnCustomizations: c });

        	}.bind(this));

        }

    });

    return Mn.View.extend({

    	template: _.template('<span class="number-update"></span><div class="preblu"></div><table></table>'),

        ui: {            
            update: '.number-update'
        },

        regions: {        	
            toolsTable: { el: '.preblu', replaceElement: true },            
            table: { el: 'table', replaceElement: true }
        },

        onRender: function () {

            // 21.09.2017 временно скрыто
            //this.showChildView('toolsTable', new toolsTableView);

        	this.showChildView('table', new tableView({
        		model: this.model,
        		collection: this.collection,
        		head: _.filter(this.model.get('feed').head, o=> o.isVisible),
				editMode: this.options.editMode
        	}));

            var c = [];

            this.collection.each(function (m) {

                var rels = _.groupBy(m.get('links'), "rel");

                _.each(rels.rubric_id, function (a) {
                    c.push(a);
                }, this);


            }, this);

            this.triggerMethod('table:add:rubrics:filter', c);

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

            }
           
        }
    });

});