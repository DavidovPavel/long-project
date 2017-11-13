$(function () {
    // INPUT MAGIC GOES HERE
    (function (window) {

        'use strict';

        // class helper functions from bonzo https://github.com/ded/bonzo

        function classReg(className) {
            return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
        }
        var hasClass, addClass, removeClass;

        if ('classList' in document.documentElement) {
            hasClass = function (elem, c) {
                return elem.classList.contains(c);
            };
            addClass = function (elem, c) {
                elem.classList.add(c);
            };
            removeClass = function (elem, c) {
                elem.classList.remove(c);
            };
        }
        else {
            hasClass = function (elem, c) {
                return classReg(c).test(elem.className);
            };
            addClass = function (elem, c) {
                if (!hasClass(elem, c)) {
                    elem.className = elem.className + ' ' + c;
                }
            };
            removeClass = function (elem, c) {
                elem.className = elem.className.replace(classReg(c), ' ');
            };
        }

        function toggleClass(elem, c) {
            var fn = hasClass(elem, c) ? removeClass : addClass;
            fn(elem, c);
        }

        var classie = {
            // full names
            hasClass: hasClass,
            addClass: addClass,
            removeClass: removeClass,
            toggleClass: toggleClass,
            // short names
            has: hasClass,
            add: addClass,
            remove: removeClass,
            toggle: toggleClass
        };

        // transport
        if (typeof define === 'function' && define.amd) {
            // AMD
            define(classie);
        } else {
            // browser global
            window.classie = classie;
        }

    })(window);


    (function () {
        if (!String.prototype.trim) {
            (function () {
                var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
                String.prototype.trim = function () {
                    return this.replace(rtrim, '');
                };
            })();
        }
        [].slice.call(document.querySelectorAll('input.g-form--input')).forEach(function (inputEl) {
            if (inputEl.value.trim() !== '') {
                classie.add(inputEl, 'filled');
            }
            inputEl.addEventListener('focus', onInputFocus);
            inputEl.addEventListener('blur', onInputBlur);
        });
        function onInputFocus(ev) {
            classie.add(ev.target, 'filled');
        }
        function onInputBlur(ev) {
            if (ev.target.value.trim() === '') {
                classie.remove(ev.target, 'filled');
            }
        }
    })();
    $('.acc legend').click(function () {
        $('.acc').children('.row').slideUp(200);
        $('.acc').removeClass('current');
        $(this).parent('fieldset').toggleClass('current');
        $(this).parent('fieldset').children('.row').slideToggle(200);
    });
    $('.g-dropdown--placeholder').click(function () {
        $(this).siblings('.g-dropdown--container').slideToggle(100);
        $(this).toggleClass('expanded');
    });

    $('span[data-icon="icon-round-check"]').click(function () {
        $('.g-panel').removeClass('selected');
        console.log('clicked')
        $(this).parent().parent().parent().addClass('selected');
    });

    $('#add-collection').click(function () {
        var collection = '<div class="grid--1-3"><div class="g-panel"><h4 contenteditable="true">Введите название</h4><table class="blank"><tbody><tr><td>Выбрано источников</td><td>50</td></tr><tr><td>На сумму </td><td>1080 руб.</td></tr></tbody></table><div class="g-panel--options tac"><div class="grid--1-3"><span data-icon="icon-gear"></span></div><div class="grid--1-3"><span data-icon="icon-round-check"></span></div><div class="grid--1-3"><span data-icon="icon-trash"></span></div><div style="clear:both"></div></div></div></div>'
        $('#custom').append(collection);
    });

});
