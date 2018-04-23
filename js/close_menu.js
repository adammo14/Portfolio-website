//Side menu functionality
$(document).ready(function(){
	$(".fa-times").click(function(){
		$(".sidebar_menu").removeClass("show_menu");
		$(".toggle_menu").removeClass("opacity_one");
	});

	$(".toggle_menu").click(function(){
		$(".sidebar_menu").addClass("show_menu");
		$(".toggle_menu").addClass("opacity_one");
	});

});
