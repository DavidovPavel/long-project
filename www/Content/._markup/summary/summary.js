$(function () {
    $('aside .control').click(function () {
        if ($(this).parent('aside').hasClass('expanded')) {
            $(this).parent('aside').removeClass('expanded').addClass('collapsed');
            if ($(this).parent('aside').hasClass('g-sidebar--left')) {
                $('body').removeClass('left-aside-on').addClass('left-aside-off');
            }
            else {
                $('body').removeClass('right-aside-on').addClass('right-aside-off');
            }
        }
        else {
            $(this).parent('aside').addClass('expanded').removeClass('collapsed')
            if ($(this).parent('aside').hasClass('g-sidebar--left')) {
                $('body').removeClass('left-aside-off').addClass('left-aside-on');
            }
            else {
                $('body').removeClass('right-aside-off').addClass('right-aside-on');
            }
        }
    });
    $('aside li i.toggler').click(function () {
        $(this).parent('li').toggleClass('expanded');
        console.log('KAKAKAK');
    });
});