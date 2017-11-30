define('@widget.WidgetView',
    [
        'i18n!nls/resources.min',
        'sendModel',
        'settingsView',
        'widget.reportView',
        'widget.content.contentView',
        'widget.semnet.semnetView',
		'widget.table.filter'
    ],
function (Resources, sendModel, settingView, reportLoad, contentView, semnetView, filterView) {


        // settings.subscribe.subscribeList 
        var include = ["WidgetTable", "WidgetMap", "WidgetGraph", "WidgetRunning", "WidgetHtml", 'WidgetCloud'];

        var positionModel = Backbone.Model.extend({
            idAttribute: 'WidgetUid',
            defaults: {
                WidgetUid: null,
                PlacementWidth: 0,
                PlacementHeight: 0,
                PlacementTop: 0,
                PlacementLeft: 0,
                ZIndex: 0
            },
            url: function () {
                return `/api/widget/${this.id}/position`;
            }
        });

        var subscibeObject = Mn.Object.extend( {

            initialize: function () {

                this.collection = new Backbone.Collection();
                this.collection.url = '/api/widget/' + this.options.widgetID + '/subscribed';
            }
        })

        return Mn.View.extend( {

            className: 'anbr-widget',

            template: templates['widget-template'],

            ui: {
                head: '.anbr_head',
                container: '.widget-container',
                title: '.widget-title',
                load: '.anbr_list',
                loader: '.anbr_head .Preloader',
                settings: '.settings',
                trash: '.icon-trash',
                filter: '.font-icon-filter'                
            },

            regions: {
                load: '@ui.load', // { el: '@ui.load', replaceElement: true },
                settings: { el: '@ui.settings', replaceElement: true },
                filter: { el: '.filter-panel', replaceElement: true }
            },

            events: {

            	"click .font-icon-filter": function () {

            		var fp = this.getChildView('filter'),
            			dh = this.ui.container.height() - fp.$el.height() + 20;

            		if (fp.$el.is(':hidden'))
            			this.ui.container.css({
            				height: dh
            			});
            		else
            			this.ui.container.css({
            				height: this.ui.load.height() + 20
            			});

            		fp.$el.toggle();

            	},

                'click .anbr_head @ui.trash': function () {

                    Backbone.trigger('message:confirm', {
                        title: Resources.sure,
                        message: $.Format(Resources.deltext, Resources.widget, this.model.get('title')),
                        fx: function () {
                            this.model.destroy();
                        },
                        ctx: this
                    });

                },

                "mousedown": function ( e ) {

                    if (this.Mode) {

                        this._addSettings();

                        Backbone.Radio.channel('sidebar')
							.request('open', {
								nameView: this.model.get('title'),
								view: this.getChildView('settings'),
								title: Resources.wst
							},
							this.getChildView('settings').getMenu());

                        if ( e.shiftKey || e.ctrlKey )
                            this.triggerMethod( 'select:more', this.model );
                        else
                            this.triggerMethod( 'select:one', this.model );

                       
                    }

                }
            },

            _addSettings: function () {

                if (!this.getRegion('settings').hasView())
                    this.showChildView('settings', new settingView({
                        model: this.model,
                        collection: this.collection,
                        subscibeCollection: this.subscibeObject.collection
                    }));

            },

            initialize: function () {

            	this.scrollTop = 0;

                this.model.set('ReadOnly', true);

                this.collection = new Backbone.Collection( [], { model: Backbone.Model.extend( { idAttribute: 'object_id' } ) } );

                this.subscibeObject = new subscibeObject( { widgetID: this.model.id } );

                var pa = this.model.get('requestParameters');

                this.sendModel = new sendModel( {
                    id: pa.rid,
                    pars: pa.parameters
                });

                this.sendModel.on('change:ts', function (m, ts) {
                    if (ts)
                        this.model.set('timeStampForUpdate', ts);
                }, this);

                this.position = new positionModel({
                    WidgetUid: this.model.id,
                    PlacementTop: parseInt(this.model.get("top")) < 0 ? 5 : parseInt(this.model.get("top")),
                    PlacementLeft: parseInt(this.model.get("left")) < 0 ? 5 : parseInt(this.model.get("left")),
                    PlacementWidth: parseInt(this.model.get("width")),
                    PlacementHeight: parseInt(this.model.get("height")),
                    ZIndex: parseInt(this.model.get("zIndex"))
                });

                this.listenTo( this.position, 'request', this._sizeAndPosition.bind( this ) );

                //this.listenTo(this.model, "visual:update", this._successLoad);

            },

            onBeforeRender: function () {

                if ( this.model.get( "Decoration" ) && !this.model.get( "Decoration" ).BorderIsVisible )
                    this.$el.addClass( "noshadow" );

                this._sizeAndPosition();

            },

            onRender: function () {

                this._decoration();

                if (this.model.get("typeName") !== 'WidgetTable')
                	this.ui.filter.hide();
                else
                	this.showChildView('filter', new filterView({ model: this.model }));

            },

            onAttach: function () {

                var flag = this.model.get( 'Decoration' ).CaptionIsVisible;

                this.ui.container.css( {
                    height: this.model.get( "height" ) - ( flag ? this.ui.head.outerHeight() : 0 )
                });

                //this.ui.trash.css('fill', this.model.get('Decoration').CaptionForeground);

                this.ui.load.css("height", this.ui.container.height());

                this.triggerMethod('fix:size', this.model);

                this.ui.container.on('scroll', function (e) {

                	// TODO: use Promise mzfka!

                    //#5240 volkov 2017-11-16 Были проблемы при прокрутки (декоративного виджета)
                    if (this.sendModel.get('feed') && this.sendModel.get('feed').pagination) {
                        var pon = this.sendModel.get('feed').pagination;
                        let isDown = e.target.scrollTop - this.scrollTop > 0;

                        if (!isDown) return;

                        if (this.stopScroll) return;

                        this.scrollTop = e.target.scrollTop;

                        if (pon.totalItems > pon.pageSize * pon.currentPage - pon.pageSize) {

                            if (e.target.scrollTop >= e.target.scrollHeight - e.target.offsetHeight - 100) {

                                this.stopScroll = true;

                                this.sendModel.set({
                                    ts: this.model.get('timeStampForUpdate'),
                                    page: ++pon.currentPage
                                });

                                this.onLoad({ add: true });

                                console.log('scrolling table');
                            }
                        }
                    }

                }.bind(this));
            },

            modelEvents: {

                sync: function () {

                    this.sendModel.set('ts', '');
                    this._decoration();
                    this.onLoad();
                },

                'click:item': function ( itemModel ) {

                	Backbone.Radio.channel('matrixChain').trigger('start:chain', this.model);

                    this.model.collection.each( function ( m ) {

                        if ( this.model.id !== m.id ) {

							// дергаем подписчиков
                            m.trigger( 'check:subscribers',
                                this.model.id,
                                itemModel.get('requestID') || this.model.get('requestParameters').rid,
                                itemModel.get( 'object_id' ) );


							// цепочки зависимостей
                            this._startChain(m, itemModel);

                        }

                    }, this );

                },

                'check:subscribers': function ( subscriberID, requestID, objectID ) {

                    var c = this.subscibeObject.collection;

                    if ( c.length )
                        this._callSubscribers( subscriberID, objectID, requestID );
                    
                    else if (include.indexOf(this.model.get('typeName')) === -1 && !this.subscibeObject.isFetch)
                        c.fetch( {
                            reset: true,
                            success: function (coll) {
                                this.subscibeObject.isFetch = true;
                                this._callSubscribers( subscriberID, objectID, requestID );
                            }.bind( this )
                        } );
                },

                'load:chain': function () {                    
                	this._loadChain();
                },

                //
                'visual:update': function (feed) {

                    this._successLoad( feed );
                },

                'change:ColumnCustomizations': function () {
                    this._successLoad();
                },

                'change:Decoration': function () {

                    this._decoration();

                    this.ui.container.css( {
                        height: this.model.get("height") - (this.model.get('Decoration').CaptionIsVisible ? this.ui.head.outerHeight() : 0)
                    });

                    this.ui.load.css( "height", this.ui.container.height() );
                },

                'change:title': function ( m, v ) {
                    this.ui.title.text( v );
                },

                'change:left': function ( m, v ) {
                    this.position.set( 'PlacementLeft', v );
                    this._sizeAndPosition();
                },

                'change:top': function ( m, v ) {
                    this.position.set( 'PlacementTop', v );
                    this._sizeAndPosition();
                },

                'change:width': function ( m, v ) {
                    this.position.set( 'PlacementWidth', v );
                    this._sizeAndPosition();
                },

                'change:height': function ( m, v ) {
                    this.ui.container.css( { height: v - this.ui.head.outerHeight() } );
                    this.position.set( 'PlacementHeight', v );
                    this._sizeAndPosition();
                },

                'change:zIndex': function ( m, v ) {
                    this.position.set( 'ZIndex', v );
                    this._sizeAndPosition();
                }

            },

            onLoad: function ( o ) {

                this.loadOptions = o || {};

                var typeName = this.model.get("typeName"),
					pa = this.model.get('requestParameters');

				// TODO: переделать все под Promise
                return new Promise(function (resolve, reject) {

                	if (pa && pa.rid) {

                		if (!pa.useDefParams)
                			this.loadOptions.notUseDefParams = true;

                		this.sendModel.set({
                			widget: {
                				uid: this.model.id,
                				name: this.model.get('title'),
                				type: this.model.get('typeName'),
                				Visualization: this.model.get('Visualization')
                			},
                			id: pa.rid,
                			pars: pa.parameters,
                			useDefParams: !this.loadOptions.notUseDefParams
                		});

                		this.ui.loader.show();
                		this.sendModel.fetch({

                			success: function () {
                				
                				this._successLoad();
                				resolve();

                			}.bind(this),

                			error: function () {

                				
                				this._endload.bind(this);
                				resolve();

                			}.bind(this)
                		});

                		if (this.model.get('update'))

                			setInterval(
								function () {

									this.ui.loader.show();
									this.sendModel.fetch({

										success: function () {
											
											this._successLoad();
											resolve();


										}.bind(this),

										error: function () {
											
											this._endload.bind(this);
											resolve();

										}.bind(this)
									});

								}.bind(this),

								this.model.get('timeUpdate'));

                	} else {                                            // виджеты не имеющие своих запросов

                		if (typeName === "WidgetHtml")
                			this.ui.load.html(this.model.get("contentHtml"));

                		if (this.objectID && this.requestID) {

                			switch (this.model.get("typeName")) {

                				case "WidgetSource":

                					this.showChildView('load', new contentView({
                						model: this.model,
                						requestID: this.requestID,
                						objectID: this.objectID
                					}));

                					break;

                				case "WidgetSemNet":

                					this.showChildView('load', new semnetView({
                						objectID: this.objectID,
                						RID: this.requestID,
                						container: this.ui.container,
                						widget: this.model
                					}));

                					break;

                				case "WidgetReporting":

                					Backbone.Radio.channel('loader').trigger('show', this.ui.load, { speed: 'fast' });

                					$.get(`/api/widget/listen/${this.requestID}/reporting/${this.model.id}/${this.objectID}`)

										.done(function (url) {

											this.showChildView('load', new reportLoad({ url: url, model: this.model }));

										}.bind(this))

										.always(function () {

											Backbone.Radio.channel('loader').trigger('hide');
											this.ui.loader.hide();
											this.loadSourceProc = false;

										}.bind(this));

                					break;

                				case "WidgetHtml":

                					Backbone.Radio.channel('loader').trigger('show', this.ui.load, { speed: 'fast' });

                					$.get(`/api/widget/listen/${this.requestID}/uiwidget/${this.model.id}/${this.objectID}`)

										.done(function (source) {

											if (source) {
												this.model.set('contentHtml', source);
												this.ui.load.html(this.model.get("contentHtml"));
											}

										}.bind(this))

										.always(function () {

											Backbone.Radio.channel('loader').trigger('hide');
											this.ui.loader.hide();
											this.loadSourceProc = false;

										}.bind(this));

                					break;

                			}

                		}

                		this._endload();
                		resolve();

                	}

                }.bind(this));
            },

        	/***
				этот метод инициализирует перезагрузку связанного виджета по цепочке дергая его модель
			*/
            _startChain: function (m, itemModel) {

            	_.each(m.get('publishersSubscriberMap'), function (v, k) {

            		if (k === this.model.id) {

            			_.each(v, function (p) {

            				if (p.QueryID === this.model.get('requestParameters').rid) {

            					var par = _.findWhere(m.get('requestParameters').parameters, { id: p.QueryParamID });

            					_.each(itemModel.attributes, function (v, k) {

            						if (k.toLowerCase() === p.ColumnSystemName.toLowerCase())
            							par.Value = [v];

            					});

            					m.trigger('load:chain');

            				}

            			}, this);
            		}
            	}, this);

            },

        	/***

			ВАЖНО! этот метод выполняется не в текущем виджете
					контекст связанного виджета по цепочке

			*/
            _loadChain:function(){

            	// цепочки не должны содержать метку времени для обновления
            	// значение должно бытьб в this.model.get('timeStampForUpdate')
            	this.sendModel.set('ts', '');


            	if (Backbone.Radio.channel('matrixChain').request('check:chain', this.model))
            		this.onLoad({ notUseDefParams: true })
						.then(function () {

							Backbone.Radio.channel('matrixChain').trigger('add:chain', this.model);

							// после этой загрузки нужно взять первый элемент (если он есть)
							if (this.collection.length) {

								// и инициализировать загрузку следующего связанного виджета (если он есть)
								var item = this.collection.at(0);

								this.model.collection.each(function (m) {

									if (this.model.id !== m.id) {

										// цепочки зависимостей
										this._startChain(m, item);
										setTimeout(() =>item.trigger('set:current', true), 1);

									}

								}, this);

							}

						}.bind(this));

            	// по идее это лишнее - send вернет новый ts и он сохранится в timeStampForUpdate
            	if (this.model.get('timeStampForUpdate'))
            		this.sendModel.set('ts', this.model.get('timeStampForUpdate'));

            },

            _callSubscribers: function ( subscriberID, objectID, requestID ) {

                this.subscibeObject.collection.each( function ( m ) {

                    if ( m.id === subscriberID )
                        this._loadSource( objectID, requestID );

                }, this );
            },

            _loadSource: function (oID, rID) {

                this.objectID = parseInt(oID);
                this.requestID = parseInt(rID);

                if ( !this.loadSourceProc ) {

                    this.ui.loader.show();
                    this.loadSourceProc = true;

                    this.onLoad();

                }
            },

            _successLoad: function ( feed ) {

                if ( this.sendModel.get( 'msg' ) )
                    Backbone.trigger( 'message:warning', {
                        message: this.sendModel.get( 'msg' )
                    } );

                this.model.set('feed', this.sendModel.get('feed') || this.sendModel.get('data'));

                var typeName = this.model.get( "typeName" );

                if (!this.loadOptions.add)
                	require(['@widget.' + typeName], function (typeWidget) {

                		this.showChildView('load', new typeWidget({
                			model: this.model,
                			collection: this.collection,
                			load: this.loadOptions,
                			editMode: this.Mode
                		}));

                		this._endload();

                	}.bind(this));

                else
                	this._endload();

                var items = this.model.get('feed') ?
                    this.model.get('feed').items ? $.prepare(this.model.get('feed').items) :                    
                    this.model.get('feed').variations[0].flow :                                 // diagrams data
                    [];

                if (this.loadOptions.add) {
                	this.collection.add(items);
                }
                else
                	this.collection.reset(items);

                this.stopScroll = false;

            },

            _endload: function () {

                //this.getChildView( 'settings' ).loadProcess = false;

                this.ui.loader.hide();

                if (this.model.get('typeName') === 'WidgetTable')              
                    this.ui.filter.show();

                this.loadSourceProc = false;
                this.trigger( 'load:end' );

                if ( !this.model.has( 'feed' ) )
                    this.model.set( 'feed', {} );

                var Decoration = this.model.get( 'Decoration' ),
                    flag = this.model.get( 'isMarkSelectedItem' );

                this.$('table.widget-table td').css({
                    color: Decoration.ContainerForeground,
                    'background-color': Decoration.ContainerBackground
                });

                this.$('.rubrics').css('opacity', '0.5');

                this.$( 'table.widget-table tr' ).hover(

                    function () {
                        $( this ).find( 'td' ).css( {
                            color: Decoration.ContainerForegroundHover,
                            'background-color': Decoration.ContainerBackgroundHover
                        } );
                    },

                    function () {

                        var isVisited = $( this ).hasClass( 'viewed' ),
                            isActive = $( this ).hasClass( 'current' );

                        $( this ).find( 'td' ).css( {

                            color: isActive ? Decoration.ContainerForegroundActive
                                : flag && isVisited ? Decoration.ContainerForegroundVisited : Decoration.ContainerForeground,

                            'background-color': isActive ? Decoration.ContainerBackgroundActive
                                : flag && isVisited ? Decoration.ContainerBackgroundVisited : Decoration.ContainerBackground

                        } );

                    } );

                this.$el.find( "a" ).css( { "background-color": Decoration.LinkBackground, "color": Decoration.LinkForeground } );

            },

            _sizeAndPosition: function () {

                this.$el.css({
                    width: this.position.get("PlacementWidth"),
                    height: this.position.get("PlacementHeight"),
                    top: this.position.get("PlacementTop"),
                    left: this.position.get("PlacementLeft"),
                    "z-index": this.position.get("ZIndex")
                });

            },

            _decoration: function () {

                var Decoration = this.model.get('Decoration'),
                    defaultBg = "",
                    tcss = "padding:10px 10px 0;font-size: 18px;",
                    mtcss = "font-size:1em;cursor:default;text-decoration:none;",
                    lcss = 'font-size:13px;overflow:auto;clear:both;' + (this.model.get('typeName') !== "WidgetTable" ? "padding:20px;" : "");

                if ( Decoration ) {

                    if ( Decoration.CaptionIsVisible ) {

                        if (Decoration.CaptionBackground)
                            tcss += "background:" + Decoration.CaptionBackground + ";";

                        if ( Decoration.BorderIsVisible )
                            tcss += 'border:solid 1px ' + Decoration.CaptionBackground + ';border-bottom:0;';


                        if (Decoration.CaptionForeground) 
                            mtcss += 'color:' + Decoration.CaptionForeground + ';';

                    } else 
                        tcss += "display:none;";


                    if ( Decoration.ContainerIsTransparent ) {

                        //defaultBg = "background:transparent;";

                        this.$el.addClass('transparent');

                    }
                    else if (Decoration.ContainerBackground) {

                        this.$el.removeClass('transparent');

                        defaultBg = 'background:' + Decoration.ContainerBackground + ';';
                    }

                    if (Decoration.ContainerForeground)
                        lcss += 'color:' + Decoration.ContainerForeground + ';';

                    if ( Decoration.BorderIsVisible )
                        lcss += 'border:solid 10px ' + Decoration.CaptionBackground + ';';
                    else
                        tcss += "padding-bottom:10px;";


                }

                this.ui.head.attr( "style", tcss );

                this.ui.container.attr( "style", lcss + defaultBg );

                this.ui.title.attr("style", mtcss);

                this.ui.trash.css('fill', this.model.get('Decoration').CaptionForeground);
                this.ui.filter.css('color', this.model.get('Decoration').CaptionForeground);
            },

            switchMode: function (flag) {

                if (flag) {

                    this.ui.head.css({ cursor: "move" });

                    this.$el.draggable({
                        //helper: "original",
                        handle: this.ui.head,
                        cancel: this.ui.settings,

                        drag: function (el, ui) {

                            this.triggerMethod('widget:drag',
                                this.model,
                                ui.position.left - this.$el.position().left,
                                ui.position.top - this.$el.position().top);

                        }.bind(this),

                        stop: function (el, ui) {

                            var top = parseInt(ui.position.top),
                                left = parseInt(ui.position.left);

                            if (top < 0) top = 3;
                            if (left < 0) left = 3;

                            this.model.set({ top: top, left: left });

                            this.position.save();

                            this.triggerMethod('widget:drag',
                                this.model,
                                left - this.$el.position().left,
                                top - this.$el.position().top,
                                true);

                        }.bind(this)
                    });

                    this.$el.resizable({

                        resize: function (e, ui) {

                            this.ui.container.css({
                                height: ui.size.height - this.ui.head.outerHeight()
                            });

                        }.bind(this),

                        stop: function (e, ui) {

                            this.ui.load.css("height", this.ui.container.height());

                            this.model.set({
                                width: parseInt(ui.size.width),
                                height: parseInt(ui.size.height)
                            });

                            this.position.save();

                            this.triggerMethod('select:one', this.model);

                        }.bind(this)
                    });


                } else {

                    this.ui.head.css({ cursor: 'default' });

                    this.$el
                        .draggable().draggable("destroy")
                        .resizable().resizable("destroy")
                        .removeClass("widget-editing");
                }

                this.Mode = flag;

                this.model.set('ReadOnly', !flag);

                return this;
            },

            childViewEvents: {

                'content:loaded': function () {
                    this._endload();
                },

                'subscribers:reflect': function (m) {

                    this.model.trigger('click:item', m);
                },

                'table:add:rubrics:filter': function (c) {

                	this.getChildView('filter').collection.add(c);

                	if (c.length)
                		this.getChildView('filter').showRubrics();
                	else
                		this.getChildView('filter').hideRubrics();
                },

                'filter:search': function (text) {

                	this.$("tbody>tr>td .Mark").removeClass("Mark");

                	var s = new RegExp(text, "ig");

                	this.$("tbody>tr").each(function (i, e) {

                		var $a = $(e).find("td:first"),
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

                'filter:apply': function (v) {

                	//if (v.options.prefix === this.model.id) {

                		this.getChildView('load').getChildView('wrap').getChildView('table').getChildView('body').children.each(function (w) {

                			w.$el.show();

                			var a = _.groupBy(w.model.get('links'), 'rel');

                			var rubs = a.rubric_id;
                			if (rubs) {

                				_.each(rubs, function (r) {

                					var ex = this.getChildView('filter').collection.get(r.id);
                					if (ex.get('hide'))
                						w.$el.hide();

                				}, this);

                			}

                		}, this);

                		this.$("tbody>tr>td .Mark").removeClass("Mark");
                	}
                //}

            },

            childViewTriggers: {

                'table:row:handler': 'table:row:handler'
            }

        });

    });