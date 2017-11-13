"use strict";
define( ['app', 'i18n!nls/resources.min'],
    function ( App, Resources ) {

        var listBottomTemplate = '<div class="tabs" style="height:210px;"><ul><li class="Searchparam"><span></span><a href="#Search"><%= Resources.find %></a></li><li class="Treetypes"><span></span><a href="#Tree"><%= Resources.Filterbytype %></a></li></ul><div id="Tree"></div><div id="Search"><p><%= Resources.title %>:<br /><input name="title" class="title" type="text" /></p><p><%= Resources.phrase %>:<br /><textarea name="phrase" class="phrase"></textarea></p><button type="button"><%= Resources.find %></button></div></div>';

        var queryBottom = Backbone.View.extend( {
            el: $( "#ListBottomPanel" ),
            events: {
                "click #Search button": "search",
                "keyup .phrase": "checkValue",
                "keyup .title": "checkValue"
            },
            checkValue: function ( e ) {
                var $e = $( e.target ), n = $e.attr( "name" ), v = $e.val(), r = {};
                r[n] = v;
            },
            init: false,
            state: null,
            currentrubricid: -1,
            search: function () {
                var title = this.$( "#Search input[name=title]" ).val(), phrase = this.$( "#Search textarea[name=phrase]" ).val(), rubricid = this.currentrubricid;
                if ( !this.state ) this.state = {};
                this.state.title = title; this.state.phrase = phrase;

                var flag = ( title || phrase );

                App.Select.set( "list", App.addParams( { "title": title, "phrase": phrase, "rubricid": flag ? "-1" : rubricid, "id": rubricid }, App.Select.get( "list" ) ) );
                App.navigate( App.Select.fullpath() );
                Backbone.trigger( ":P", { cmd: "c" } );
            },
            initialize: function () {
                Backbone.on( "editpanel:select", function ( id ) {
                    this.currentrubricid = id;
                }, this );
                Backbone.on( "editpanel:clear", function () {
                    this.currentrubricid = -1;
                    this.search();
                }, this );
                this.on( "main:list", this.filterInit, this );
            },
            render: function () {
                var data = arguments[0];
                // нижняя панель в результатх
                var dh = $( window ).height() - $( "#Query_Buttons" ).height() - 160;
                if ( data && data.name ) {
                    // 250 height #ViewParametrs
                    $( ".Present" ).height( dh - 228 );
                    this.name = data.name;
                    this.$el.empty();
                    this.$el.append( _.template( listBottomTemplate )( { Resources: Resources } ) );
                    this.$( "button" ).button();
                    var p = App.Select.get( "params" );
                    if ( p ) {
                        this.$( "#Search input[name=title]" ).val( p.title );
                        this.$( "#Search textarea[name=phrase]" ).val( p.phrase );
                    }

                    var s = this;
                    var tabs = this.$( "div.tabs" ).tabs( {
                        activate: function ( event, ui ) {
                            if ( !s.state ) s.state = {};
                            s.state.ind = ui.newTab.index();
                        }
                    } );

                    this.$el.show();
                    this.init = true;

                    if ( this.state ) {
                        this.$( ".phrase" ).val( this.state.phrase );
                        this.$( ".title" ).val( this.state.title );
                        tabs.tabs( "option", "active", this.state.ind );
                    }

                } else {
                    $( ".Present" ).height( dh );
                    this.$el.hide();
                }
                return this;
            },
            filterInit: function ( obj ) {
                if ( this.name && App.baseType != "DeepInternet" ) {
                    this.$( ".Treetypes" ).show();
                    var types = obj.collection.pluck( "typeid" );
                    require( ["@/views/Tree/TreeView"], function ( Tree ) {
                        var st = new Tree( { modelName: this.name, api: ( "/api/" + this.name ), filter: types, openLevel: 3 } ).setElement( this.$( "#Tree" ) );
                        st.operation = function () {
                            var typeid = this.model.id;
                            App.Select.set( "list", App.addParams( { typeid: typeid }, App.Select.get( "list" ) ) );
                            App.navigate( App.Select.fullpath() );
                            obj.refresh();
                        };
                    }.bind( this ) );
                } else {
                    this.$( ".Treetypes" ).hide();
                }
            }
        } );

        var b = new queryBottom;

        return {
            get: function () {
                return b;
            }
        }

    } );