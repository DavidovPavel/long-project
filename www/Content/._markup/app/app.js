$(function () {
    if ($('aside.g-sidebar--left').length > 0) {
        $('body').addClass('hls');
        if (localStorage.getItem('ls') === '1') {
            $('aside.g-sidebar--left').addClass('expanded');
            $('body').addClass('ls-on');
        }
    }
    if ($('aside.g-sidebar--right').length > 0) {
        $('body').addClass('hrs');
        if (localStorage.getItem('rs') === '1') {
            $('aside.g-sidebar--right').addClass('expanded');
            $('body').addClass('rs-on');
        }
    }
    //SIDEBAR
    $('aside .control').click(function () {
        if ($(this).parent('aside').hasClass('g-sidebar--left')) {
            if ($(this).parent('aside').hasClass('expanded')) {
                $(this).parent('aside').removeClass('expanded');
                $('body').removeClass('ls-on');
                localStorage.setItem('ls', '0')
            }
            else {
                $(this).parent('aside').addClass('expanded');
                $('body').addClass('ls-on');
                localStorage.setItem('ls','1')
            }
        }
        else {
            if ($(this).parent('aside').hasClass('expanded')) {
                $(this).parent('aside').removeClass('expanded');
                $('body').removeClass('rs-on');
                localStorage.setItem('rs', '0')
            }
            else {
                $(this).parent('aside').addClass('expanded');
                $('body').addClass('rs-on');
                localStorage.setItem('rs', '1')
            }
        }
    });
    //SIDEBAR NAV EXPANDER
    $('aside li i.toggler').click(function () {
        if ($(this).parent('li').hasClass('expanded')) {
            $(this).parent('li').removeClass('expanded');
        }
        else {
            $(this).parent('li').addClass('expanded');
        }
    });
    //TOOLBAR FILTER
    $('.g-dropdown--placeholder').click(function () {
        $(this).next('.g-dropdown--container').slideToggle(200);
    });
    //SIDEBAR 
    $('aside li span').click(function () {
        $('aside li span').removeClass('active');
        $(this).toggleClass('active');
    });
    //NEW INQUIRY BUTTON
    $('#new').click(function () {
        $(this).parent('li').toggleClass('active');
        $('#new-inquiry').slideToggle(150);
    });
    $('#srch').click(function () {
        $('.list, #search-area').slideToggle(100);
    });
    $('.alert').click(function () {
        $(this).toggleClass('active');
        $('.alert--container').toggleClass('active');
    });
    $('.alert--list i.erase').click(function () {
        $(this).parent('li').slideUp(300).delay(200).remove();
    });
    $('.alert--container i.close').click(function () {
        $(this).parent('.alert--header').parent('.alert--container').removeClass('active');
        $('.tray--item.alert-block .alert').removeClass('active');
    });
    $('#global-settings').click(function () {
        $(this).next('.g-notification').toggleClass('active');
        $(this).toggleClass('active');
    });
});