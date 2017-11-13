$(function(){
    $('.main-sidebar ul li i').click(function () {
        $(this).parent('li').toggleClass('active');
        $(this).toggleClass('expanded');
    });
    $('#left').click(function () {
        $(this).parent('.main-sidebar').toggleClass('hidden');
        $('.main').toggleClass('hassidebar');
    });
    $('#right').click(function () {
        $(this).parent('.main-sidebar').toggleClass('hidden');
        $('.main').toggleClass('hasrightsidebar');
    });
    $('#fs').click(function () {
        if ($('.analyst-worklist').hasClass('max')) {
            $('.analyst-worklist').removeClass('max');
            $('.analyst-workflow').addClass('max');
        }
        else {
            $('.analyst-worklist').addClass('max');
            $('.analyst-workflow').removeClass('max');
        }
    });
});