$(function () {
    var tools = $('section.tools');
    var toolsControl = tools.children('i');
    var dossier = $('.g-dosier');

    toolsControl.on('click', function () {
        tools.toggleClass('disabled');
    })

    $('#c1').on('click', function () {
        dossier.toggleClass('hls');
    });
    $('.section-title').on('click', function () {
        $(this).parent('section').toggleClass('expanded')
    });

});