define( 'global.model.dialog', [], function () {

    return Backbone.Model.extend( {

        defaults: function () {
            return {

                title: '',
                autoOpen: true,
                modal: false,       // модальное окно  

                view: null,         // вложенная в контент вьюха (initialized)

                size: 'def',
                /*
                [
                    'def',
                    'max',          // max parent relative
                    'med',          // medium
                    'min',          // 
                    'big',
                    'full'          // fullscreen
                ]
                */

                color: 'default',
                /*
                [
                    'red',
                    'yellow',
                    'green',
                    'blue',
                    'default'
                ]
                */

                icon: 'icon-folder',

                zindex: 0,          // z-index prop css

                header: {
                    move: false,    // cursor: move
                    manage:         // иконки управления окном
                    [
                        { id: 'close' },
                        { id: 'size' }
                        //'menu'    // добавляется если context.length > 0
                    ]
                },

                sidebar: null,      // правая панель
                content: null,      // содержимое окна

                toolbar: new Backbone.Collection,           // панель инструментов

                context: new Backbone.Collection(),        // контекстное меню
                showContext: false,
                footer: new Backbone.Collection(),         // кнопки в нижней панели

                width: 'auto',
                height: 'auto',
                top: 0,
                left: 0
            };
        }

    } );

} );
