define('global.request.param', ['i18n!nls/resources.min',  'global.behaviors.input', 'global.view.dropDown', 'global.view.dialog', 'c/searchPanel', 'g/tree', 'RU'],

function (Resources, InputBehavior, DropDownList, dialogView, searchPanel, treeView) {

    /***/
    /*
          TODO: если в параметрах выбора объекта не задан rid or dbase, в окне выбора необходимо показать интерфейс выбора базы
    */
    /***/

    var paramTemplateDate = '<input type="text" value="" name="<%- Name %>" /><label><%- Caption %></label><svg class="svg-icon--big"><use xlink:href="#calendar-icon"></use></svg><i class="help rtl-1"></i><span class="g-tip bottom"><kbd></kbd><span><%- Description %></span></span>',

        paramTemplate = '<input type="text" class="g-form--input <%- DisplayValue?\'filled\':\'\' %>" placeholder="<%- Caption %>" value="<%- DisplayValue?DisplayValue:Value.join(",") %>" name="<%- Name %>" /><label><%- Caption %></label><i class="help rtl-1"></i><span class="g-tip bottom"><kbd></kbd><span><%- Description %></span></span>',

        paramTemplateChoose = '<div class="dialog"></div><input type="text" class="g-form--input <%- DisplayValue?\'filled\':\'\' %>" placeholder="<%- Caption %>" value="<%- DisplayValue?DisplayValue:Value.join(",") %>" name="<%- Name %>" disabled="disabled" /><label><%- Caption %></label><i class="rtl-2 more add"></i><i class="rtl-3 clear"></i><i class="help rtl-1"></i><span class="g-tip bottom"><kbd></kbd><span><%- Description %></span></span>',

        paramTemplateText = '<label><%- Caption %></label><i class="help rtl-1 textarea"></i><span class="g-tip bottom textarea"><kbd></kbd><span><%- Description %></span></span><textarea class="g-form--textarea <%- DisplayValue?\'filled\':\'\' %>" name="<%- Name %>" placeholder="<%- Caption %>"><%- DisplayValue?DisplayValue:Value.join(",") %></textarea>',

        paramTemplateBool = '<input type="checkbox" id="id<%- Name %>" class="g-form--checkbox" name="<%- Name %>" <% if(Value[0]==="True"){ %>checked="checked"<% } %> /><label for="id<%- Name %>" class="bool-type-label"><%- Caption %></label><i class="help rtl-1"></i><span class="g-tip bottom"><kbd></kbd><span><%- Description %></span></span>',
            
        paramTemplateDic = '<label><%- Caption %></label><i class="help rtl-1"></i><span class="g-tip bottom"><kbd></kbd><span><%- Description %></span></span><div></div>';

    var paramModel = Backbone.Model.extend({
        defaults: function () {
            return {
                Name: '',
                DisplayValue:'',
                ParametrType: '',
                Caption: '',
                Description: '',
                Value: [],
               
                MetaEntity: '',             // параметр для получения справочников

                IsMultiValues: false,       // множественный выбор IsMultiValues = true;
                
                StickUrl: '',
                NoCash: false
            };
        },

        validate: function (attr) {
            var output = [], dp = '^[\\d]+$';

            function test(s, p) {
                return s === "" || new RegExp(p).test(s);
            };

            if (this.get('ParametrType').toLowerCase() === 'int' && !test(attr.Value[0], dp))
                output.push(attr);

            if (output.length)
                return output;
            else
                this.trigger('valid');

        }
    });

    return Mn.View.extend({

        behaviors:{
            input: InputBehavior
        },

        tagName: 'span',
        className: 'g-form--input',

        getTemplate: function () {

            var paramType = this.model.get("ParametrType") ? this.model.get("ParametrType").toLowerCase() : '';

            if (["idlist", "type", "rubric", "object"].indexOf(paramType) !== -1)
                return _.template(paramTemplateChoose);

            else if (paramType === 'bool')
                return _.template(paramTemplateBool);

            else if (paramType === 'text')
                return _.template(paramTemplateText);

            else if (paramType === 'datetime')
                return _.template(paramTemplateDate);

            else if(paramType === 'dictionary')
                return _.template(paramTemplateDic);

            else
                return _.template(paramTemplate);
        },

        ui: {
            text: 'textarea',
            input: 'input',
            clear: 'i.clear'
        },

        collectionEvents: {

            update: function (c, o) {

                if (o.add) {

                    var val = c.pluck('id');

                    if (!val.length)
                        val = this.model.get('Value');

                    this.model.set({ "DisplayValue": c.pluck('title').join('; '), "Value": val });
                    
                }
                
            }
        },

        modelEvents: {

            invalid: function () {
                this.ui.text.addClass('error');
                this.ui.input.addClass('error');
            },

            valid: function () {
                this.ui.text.removeClass('error');
                this.ui.input.removeClass('error');
            },

            'change:DisplayValue': function (m, v) {

                this.ui.input.val(v);

            },

            'change:Value': function (m, v) {

                this.ui.clear.show();

            }

        },

        events: {

            'click label.bool-type-label': function () {

                if (!this.$('input').is(':checked'))
                    this.model.set('Value', ['True']);
                else
                    this.model.set('Value', ['False']);

            },

            'keyup input[type=text], textarea, input[class!=ejdatepicker]': function (e) {

                this.model.set('Value', [$.trim($(e.target).val())], { validate: true });

            },

            "click .more": function () {

                this._setKeyHeader();

                if (['Object', 'IdList'].indexOf(this.model.get("ParametrType")) === -1) {      // дерево

                    var winType = {
                        RequestSelected: Resources.selectRequest,
                        Request: Resources.selectRequest,
                        Rubric: Resources.selectRubric,
                        RubricTools: [
                            { id: 'add', caption: Resources.add },
                            { id: 'rename', caption: Resources.rename },
                            { id: 'clear', caption: Resources.deleteItem },
                            {
                                id: 'searchObj',
                                className: 'search',
                                template: '<span class="g-form--input input-data"><input type="text" name="search-name" value="" class="g-form--input" placeholder="Enter keyword"/><i class="search rtl-1" name="search"></i></span>'
                            }
                        ],

                        Type: Resources.selectTree
                    };

                    var tree = new treeView({ collection: new Backbone.Collection, selected: this.model.get('Value'), node: { checkbox: false } });

                    var dialog = new dialogView({
                        title: winType[this.model.get("ParametrType")],
                        header: { manage: [{ id: 'close' }] },
                        color: 'blue',
                        controls: [],
                        tools: winType[this.model.get("ParametrType") + 'Tools'],
                        content: tree
                    });

                    tree.collection.url = this.model.get('url') || `/api/${this.model.get("ParametrType")}`;
                    tree.collection.fetch( { reset: true } );

                    this.listenTo( tree, 'container:select:item', function ( v ) {

                        if (parseInt(v.model.id) >= 0) {

                            if (this.model.get('IsMultiValues')) {

                                this.collection.add(v.model);

                            } else {

                                this.collection.reset();
                                this.collection.add(v.model);
                                dialog.close();

                            }
                        }
                    });

                } else {                            // выбор объекта(ов)

                    dialog = new dialogView({
                        title: Resources.selObj,
                        icon: 'gear',
                        color: 'blue',
                        size: 'med',
                        header: { manage: [{ id: 'close' }] },
                        toolbar: new Backbone.Collection([
                            { id: 'filterByType', className: 'filter' },
                            {
                                id: 'searchObj',
                                className: 'search',
                                template: '<span class="g-form--input input-data"><input type="text" name="search-name" value="" class="g-form--input" placeholder="Enter keyword"/><i class="search rtl-1" name="search"></i></span>'
                            }
                            
                        ]),
                        content: new searchPanel({ rid: this.options.rid, collection: this.collection, IsMultiValues: this.model.get("ParametrType") === 'IdList' }),
                        footer: new Backbone.Collection([
                            { id: 'close', title: Resources.apply, className: 'blue right' }
                        ])
                    });

                    this.listenTo(dialog, 'footer:button:click', function (v) {
                        dialog.close();
                    });

                }

                if (!this.hasRegion())
                    this.addRegion('dialog', '.dialog');

                this.getRegion('dialog').show(dialog);

            },

            "click @ui.clear": function (e) {

                e.stopPropagation();
                              
                this.collection.reset();
                this.model.set({ "DisplayValue": "", "Value": [] });
            }

        },

        initialize: function () {

            if (!this.collection)
                this.collection = new Backbone.Collection();

            if (!this.model)
                this.model = new paramModel(this.options.attributes);
        },

        onBeforeRender: function () {

            if (this.model.get("Name").indexOf("#") !== -1)
                this.model.set("Name", this.model.get("Name").replace(/#/g, ""));

            if (!this.model.has("ParametrType"))
                this.model.set("ParametrType", '');

        },

        onRender: function () {

            this._setKeyHeader();
            
            var paramType = this.model.get("ParametrType").toLowerCase();
            if (this['_' + paramType])
                this['_' + paramType]();

        },

        onChildviewDropdownSelect: function (m, n) {

            this.model.set('Value', [m.id]);

        },

        _setKeyHeader: function () {

            if (this.options.rid || this.options.dbase) {

                let o = {};

                if (this.options.rid)
                    o.RID = this.options.rid;
                else
                    o.db = 'db' + this.options.dbase;

                $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.headers.key, o);
            }
            else {

                require(['bdid'], function (dbase) {

                    if (dbase)
                        $.ajaxSettings.headers.key = $.mergeUrlParam($.ajaxSettings.headers.key, { db: 'db' + dbase });
                    else
                        return;

                    // TODO: если в параметрах выбора объекта не задан rid, в окне выбора необходимо показать интерфейс выбора базы

                });

            }

        },

        _dictionary: function () {

            this.addRegion('ddm', 'div');
            var collection = new Backbone.Collection();
            this.showChildView('ddm', new DropDownList({ collection: collection }));

            collection.url = `/api/ModelDicItems?dic=${this.model.get('MetaEntity')}`;
            collection.fetch({
                reset: true,
                success: function () {

                    this.getChildView('ddm').setCurrent(this.model.get("Value")[0]);

                }.bind(this)
            });

            this.listenTo(this.getChildView('ddm'), 'dropdown:select', function (m) {
                this.model.set({ Value: [m.id] });
            });
        },
         
        _datetime: function () {

            this.$el.addClass('date-position');

            //var value = $.parseDate(this.model.get("Value")[0]); //Volkov 2017-10-26 - локализовывать дату не требуется
            //Volkov 2017-10-26 - в модели дата всегда представлена в ISO-формате
            //this.model.set({ Value: [$.ToISO(value)] });

            var dateObj = this.$("input").ejDatePicker({

                width: "100%",
                //width: "80%",
                height: "36px",
                //Volkov 2017-10-26 важно использовать Date - при создании полуаем в UTC, поскольку она пришла нам в UTC 
                value: new Date(this.model.get("Value")[0]),  
                locale: Resources.Lang,
                buttonText: Resources.Today,
                showPopupButton: false,
                watermarkText: this.model.get('Caption'), //Resources.formatDate,

                focusOut: function (args) {

                    this.$("input").data("ejDatePicker").hide();

                }.bind(this),

                select: function (args) {
                    //Volkov 2017-10-26 Важно убрать фактор времени, здесь он не требуется (параметр принимает только Дату)
                    var dateLocal = args.date;
                    this.model.set({ Value: [$.ToISODateOnly(dateLocal)] });

                }.bind(this)

            });


            this.$("input").addClass("ejdatepicker");

            this.$('.svg-icon--big').on('click', function () {

                this.$("input").ejDatePicker("show");

            }.bind(this));

        }

    });    
});