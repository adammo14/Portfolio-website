//1.SCROLL ON BUTTONS
$(".button_1").click(function() {
    $('html, body').animate({
        scrollTop: $("#section2").offset().top
    }, 1200);
});

$(".down").click(function() {
    $('html, body').animate({
        scrollTop: $("#section3").offset().top
    }, 1200);
});


//2.SCROLL ON MOUSE WHEEL
$(function(){
    $(".panel").css({
        "height":$(window).height()
    });

    $.scrollify({
        section: ".panel",
        scrollSpeed: 1500,
        offset: 0,
        scrollbars: true
    });
});

//3.COMMENT DELETE
$(document).ready(function(){
  $('.delete').on('click', function(e){
    $target = $(e.target);
    const id = $target.attr('data-id');
    $.ajax({
      type: 'DELETE',
      url: '/web/'+id,
      success: function(response){
        windown.loation.href='/web';
      },
      error: function(err){
        console.log(err);
      }
    });
  });
});

//4. USER DELETE
$(document).ready(function(){
  $('.delete-user').on('click', function(e){
    $target = $(e.target);
    const id =$target.attr('data-id');
    $.ajax({
      type: 'DELETE',
      url: '/dashboard/'+id,
      success: function(response){
        alert('User deleted');
        window.location.href='/#1';
      },
      error: function(err){
        console.log(err);
      }
    });
  });
});
