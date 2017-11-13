$(function () {
    if (localStorage.getItem('check-sidebar') === '1') {
        $('aside').addClass('expanded');
        $('body').addClass('sidebar-expanded');
    }
    $('aside .control').click(function () {
        if ($(this).parent('aside').hasClass('expanded')) {
            $(this).parent('aside').removeClass('expanded');
            $('body').removeClass('sidebar-expanded');
            localStorage.setItem('check-sidebar', '0')
        }
        else {
            $(this).parent('aside').addClass('expanded');
            $('body').addClass('sidebar-expanded');
            localStorage.setItem('check-sidebar', '1')
        }
    })
    $('.g-dropdown--placeholder').click(function () {
        $(this).siblings('.g-dropdown--container').slideToggle(100);
        $(this).toggleClass('expanded');
    });
    $('#new').click(function () {
        $('#new-check').slideToggle(350);
        $(this).toggleClass('active');
        $('footer .step:first-child').toggleClass('current');
    })
    $('#new-chk').click(function () {
        $('#new-check').slideToggle(350);
        $(this).toggleClass('active');
        $('footer .step:nth-child(2)').toggleClass('current');
    })
    $('#cancel').click(function () {
        $('#new-check').slideToggle(350);
    })
    //$('.step').click(function () {
    //    $('.step').removeClass('current');
    //    $(this).addClass('current');
    //});
});