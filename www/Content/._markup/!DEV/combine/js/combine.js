$(function () {
    //BEGIN
    console.log('Initialization');


    function display(item) {
        var $e = $('<li><span class="'+item.class+'" id="' + item.id + '">' + item.title + '</span></li>');
        $('#sidebar').append($e);
        $e.on('click', function (e) {
            var $crumb = $(this).text();
            var $crumbs = $('#crumbs li').length;
            $('#sidebar li span').removeClass('active');
            $(e.target).addClass('active');
            if ($crumbs > 1) {
                $("#crumbs li:last-child").remove();
            }
            $('#crumbs').append("<li><span>" + $crumb + "</span></li>");
            //console.log($(e.target).attr('id'));

        });
    }


    //GENERATION OF SIDEBAR NAVIGATION
    $.get('config/config.json').done(function (data) {
        
        for (var i = 0; i < data.items.length; i++) {
            var item = data.items[i];
            display(item);
        }

    });

   
    var editor = ace.edit("editor");
    editor.setOption("enableEmmet", true);
    editor.setTheme("ace/theme/eclipse");
    editor.getSession().setMode("ace/mode/html");
});