define('result:reports', ['i18n!nls/resources.min', 'baseurl', 'c/SimpleTableView'], function (Resources, baseurl, tableView) {

    var postModel = Backbone.Model.extend({

        idAttribute: 'ObjID',

        defaults: function() {
            return {
                main: false,            // Сводные отчеты                        
                reports: {},            // Отчеты SqlReporting                        
                extracts: {},           // Выписки                        
                semSchema: false,       // Семантическая схема                        
                analystNote: false,     // Аналитическая записка                        
                Email: null,
                Action: 0,              // 0 - Сформировать архив, 1 - сформировать архив и отправить на E-mail (если заполнен)
            }
        },

        url: "/api/Report/UploadReportsArchived",

        sync: function (method, model, options) {
            Backbone.Model.prototype.sync.apply(this, ['create', model, options]);
        },

        validate: function (attr) {

            var output = [],
                email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (!attr.main && !Object.keys(attr.reports).length && !Object.keys(attr.extracts).length && !attr.semSchema && !attr.analystNote)
                output.push(Resources.noselect);

            if (attr.Action && (!$.trim(attr.Email) || !this.test(attr.Email, email)))
                output.push(Resources.errorEmail);

            if (output.length)
                return output.join("<br/>");
        },

        test: function (s, p) {
            return s === "" || new RegExp(p).test(s);
        }
    });

    return Mn.View.extend({

        className: 'workbench--content',

        template: templates['reports-template'],
        templateContext: {
            Resources: Resources
        },

        ui: {
            h5r: ".reports>h4",
            h5e: ".extracts>h4"
        },

        events: {

            'click .link': function (e) {

                let name = $(e.target).attr('data-module')
                this.triggerMethod('show:content', name);

                Backbone.history.navigate(`${this.path}/${name}`, { trigger: true });

            },

            'click input.check': function (e) {

                var $e = $(e.target),
                    id = $e.attr('id'),
                    f = $e.prop('checked');

                this.postModel.set(id, f);

            }
        },

        initialize: function () {

            this.path = Backbone.history.fragment;

            this.postModel = new postModel({ ObjID: this.model.id });

            //Backbone.Radio.channel('tools').reply('tools:click:item', function (o) {
            //    this[o.name](o);
            //}.bind(this));

        },

        regions: {
            reports: { el: '#list-reports', replaceElement: true },
            extracts: { el: '#list-extracts', replaceElement: true }
        },

        onBeforeRender: function () {

            //Backbone.Radio.channel('side').request('get:sidebar').setCurrent(['result', 'rep'], false);

        },

        onRender: function () {

        	let path = Backbone.history.fragment.replace('reports', 'proof/0/docs');

            this.showChildView('reports', new tableView({

                collection: new Backbone.Collection,
                rowOptions: { baseurl: baseurl, originoid: this.model.id },

                rowTemplate: `
                    <td>
                        <input type="checkbox" id="cbx<%- id %>" class ="g-form--checkbox" />
                        <label for="cbx<%- id %>">
                            <a href="<%- baseurl %>/SqlRepPage.aspx?rid=<%- id %>&pid=<%- originoid %>" target="_blank" class="link"><%= title %></a>
                        </label>
                    </td>`
            }));

            this.showChildView('extracts', new tableView({

            	collection: new Backbone.Collection,
            	rowOptions: { baseurl: baseurl, originoid: this.model.id },

            	rowTemplate: `
					<td>
						<input type="checkbox" id="cbx<%- id %>" class="g-form--checkbox" />
						<label for="cbx<%- id %>">
							<% if(size) { %>
								<a href="#${path}/<%- id %>" class ="link"> <%-title %> (<%-source %>) </a>
							<% }else{ %>
								<span> <%- title %> ( <%- source %> )</span>
							<% } %>
						</label>
					</td>`
            }));
           
            this.getChildView('reports').collection.url = `/api/report/${this.model.id}`;
            this.getChildView('extracts').collection.url = `/api/Docs/InfoDB/${this.model.id}?page=1&od=1`;

            this.getChildView('reports').collection.fetch({
                reset: true,
                success: function () {

                    if (this.getRegion('extracts').hasView())
                        this.getChildView('extracts').collection.fetch({
                            reset: true, success: function () {

                                this.triggerMethod('render:tools', [
                                     { id: '_download', className: 'doc', title: Resources.download, tooltip: { title: Resources.createReport, flow: "right" } },
                                     {
                                         id: '_sendMail',
                                         side: 'right',
                                         template: '<span class="g-form--input send-report"><label style="top:12px;left:-70px"><%= Resources.sendon %>:</label>&nbsp;<input type="text" value="" class="g-form--input" /><i class="rtl-1 send" data-icon="icon-send" title="<%= Resources.sendReport %>"></i></span>'
                                     }
                                ]);

                            }.bind(this)
                        });

                }.bind(this)
            });

        },

        onChildviewPageSelect: function (page, c) {

            c.url = $.mergeUrlParam(c.url, { page: page });
            c.fetch({ reset: true });

        },

        _download: function (o) {

            this.postModel.set({
                Action: 0,
                Email: null
            });

            this._sendToMadeArchive();
        },

        _sendMail: function (o) {

            let mail = o.$el.find("input").val();

            if ($.trim(mail)) {

                this.postModel.set({
                    Action: 1,
                    Email: mail
                });

                this._sendToMadeArchive();

                o.$el.find("input").val('');
            }
        },

        _sendToMadeArchive: function () {

            _.each({ reports: 'reports', extracts: 'extracts' }, function (v, k) {

                this.getChildView(k).getChildView('body').children.each(function (vw) {

                    if (vw.$('input[type=checkbox]').prop('checked'))
                        this.postModel.get(v)[vw.model.id] = vw.model.get('title');

                }, this);

            }, this);

            if (this.postModel.isValid())
                this.postModel.save({}, {

                    success: function (m, t) {

                        Backbone.trigger("message:success", { message: t });

                        this.postModel.set(this.postModel.defaults());

                        this.$('input.check').each(function () { $(this).prop('checked', false); });

                        _.each({ reports: 'reports', extracts: 'extracts' }, function (v, k) {

                            this.getChildView(k).getChildView('body').children.each(function (vw) {

                                vw.$('input[type=checkbox]').prop('checked', false);

                            }, this);

                        }, this);

                    }.bind(this)

                });
            else
                Backbone.trigger("message:warning", { message: this.postModel.validationError });
        }

    });

});