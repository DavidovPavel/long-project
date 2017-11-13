$(function () {
    var tempUser = "ISafronov";
    if ($('#InfoUser:contains(tempUser)')) {
        $('.services').hide();
        $('.main h3').hide();
        $('.dashboard').addClass('onlyYou');

    }
    else {
        console.log('Скрипт не нашел соответствие по пользователю');
        console.log(tempUser)
    }
});