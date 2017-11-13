﻿$(function () {
    var dialog = $('.g-dialog--wrapper');
    var overlay = $('.g-dialog--overlay');
    var blocker = $('.g-dialog--blocker');
    var promt = $('.g-dialog--promt');
    var container = $('.g-dialog--container');

    overlay.on('click', function () {
        promt.slideToggle(100);
        blocker.toggle();
    });

    $('#promt').on('click', function () {
        promt.slideToggle(100);
        blocker.toggle();
    });
    $('#blocker').on('click', function () {
        blocker.toggle();
    });


    $('.g-dialog--manage .close').on('click', function () {
        dialog.hide();
        overlay.hide();
    });
    $('.g-dialog--manage .size').on('click', function () {
        if (dialog.attr('size') == 'max') {
            dialog.attr('size', 'default');
        }
        else {
            dialog.attr('size', 'max');
        }
    });
    $('.g-dialog--manage .menu, #context').on('click', function () {
        if (dialog.attr('context') == 'true') {
            dialog.attr('context', 'false');
        }
        else {
            dialog.attr('context', 'true');
        }
    });

    $('#restore').on('click', function () {
        location.reload();
    });

    $('#sidebar').click(function () {
        if (container.attr('sidebar') == 'true') {
            container.attr('sidebar', 'false')
        }

        else {
            container.attr('sidebar', 'true');
        }

    });
    $('#toolbar').click(function () {
        if (dialog.attr('toolbar') == 'true') {
            dialog.attr('toolbar', 'false')
        }

        else {
            dialog.attr('toolbar', 'true');
        }

    });
    $('#action-modal').click(function () {
        if (dialog.attr('modal') == 'true') {
            console.log('Modal was true');
            dialog.attr('modal', 'false')
        }

        else {
            console.log('Modal was not true');
            dialog.attr('modal', 'true');
        }

    });


    //TREE

    $('.expander').on('click', function () {
        $(this).parent('div').toggleClass('expanded');
    });
    $('span').on('dblclick', function () {
        $(this).attr('contenteditable', 'true');
    });
    $('button').on('click', function () {
        $(this).prev('span').attr('contenteditable', 'false');
    });

});