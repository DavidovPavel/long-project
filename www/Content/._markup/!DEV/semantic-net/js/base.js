$(function(){
  if (localStorage.getItem('semantic-sidebar') === '1'){
    $('.semantic-sidebar').addClass('active');
    $('.hamburger').addClass('active');
  }
  if (localStorage.getItem('semantic-tabs') === '1'){
    $('.semantic-tabs').addClass('active');
  }
  $('#tools-hamburger').click(function(){
    $(this).parent('.semantic-sidebar').toggleClass('active');
    $(this).toggleClass('active');
    if ($('.semantic-sidebar').hasClass('active')){
      localStorage.setItem('semantic-sidebar', '1')
    } else {
      localStorage.setItem('semantic-sidebar', '0')
    }
  });
  $('.control').click(function(){
    $(this).parent('.semantic-tabs').toggleClass('active');
    if ($('.semantic-tabs').hasClass('active')){
      localStorage.setItem('semantic-tabs', '1')
    } else {
      localStorage.setItem('semantic-tabs', '0')
    }
  });
  $('.semTab').click(function(){
    $('.semantic-tabs ul li').removeClass('active');
    $(this).parent('li').addClass('active');
  });
  $('.semantic-tabs--settings').click(function(){
    $('.semantic-tabs').toggleClass('edit-mode');
  });
  $('.semTab div').click(function(){
    alert('Are you sure?');
    $(this).parent('span').parent('li').remove();
  });
  $('.settings-tab').click(function(){
    $(this).siblings('.settings-tab').removeClass('active');
    $(this).addClass('active');
    $('.sidebar--mode-wrpapper>div').toggle();
  });
  $('#editmode').click(function(){
    $(this).toggleClass('enabled');
    $('.semantic-net').toggleClass('edit-mode');
  });
  $('.semantic-tools span').click(function() {
    $('.semantic-tools span').removeClass('active');
    $(this).toggleClass('active');
  });

  //кастомный селект
  /*НУЖНО ДОРАБОТАТЬ МЕХАНИЗМ АВТОМАТИЧЕСКОГО СКРЫВАНИ ПО КЛИКУ НА ОБЪЕКТЫ ЗА ПРЕДЕЛАМИ СЕЛЕКТОРА*/
  $('.g-select--placeholder').click(function(){
    $(this).toggleClass('expanded');
    $(this).siblings('.g-select--options').slideToggle(100);
  });
  $('.g-select--option').click(function(){
    var value = $(this).children().text();
    $(this).parent().siblings('.g-select--placeholder').text(value);
    $(this).parent().siblings('.g-select--placeholder').toggleClass('expanded');
    $(this).parent().slideToggle(100);
  });
});
