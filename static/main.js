$(document).ready(function() {
	$("#chat_input").focus();

	$("#chat_submit").click(function() {
		var message = $("#chat_input").val();
		var submitted_string = "message=" + message;
		$.ajax({
            type: "POST",
            url: "/",
            data: submitted_string,
            success: function(){
                return "submitted to post!";}
            });
		$("#chat_input").val("");
		return false;
	});

	// var d = $('#messages');
	// d.scrollTop(d.prop("scrollHeight"));

	// $("#chat_form").submit(function() {
	// 	$("#messages").load("/ #messages_inner");
	// });

	// setInterval(function(){
	// 	$("#messages").load("/ #messages_inner");
	// }, 100);


	//$("#messages").animate({ scrollTop: $("#whatever").scrollTop()}, 1000);

	// $.getJSON( "static/data.json", function() {
	// 	console.log( "success" );
	// })
});