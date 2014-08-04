$(document).ready(function() {
	$("#chat_input").focus();

	function load_messages(){
		$("#messages").load("/message #messages_inner", null, function() {
			setTimeout(load_messages, 0);
			$(".message:last-child").hide();
			$(".message:last-child").fadeIn("slow");
			if ($("#messages").hasScrollBar()) {
				messageDiv.scrollTop = messageDiv.scrollHeight;
			} else {
				$("#messages_inner").css({
					top: "auto",
					bottom: 0
				});
			}
		});
	}

	setTimeout(load_messages, 0);

	(function($) {
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    }
	})(jQuery);

	if (!($("#messages").hasScrollBar())) {
		$("#messages_inner").css({
			top: "auto",
			bottom: 0
		});
	}

	var messageDiv = document.getElementById("messages");
	messageDiv.scrollTop = messageDiv.scrollHeight;

	$("#chat_submit").click(function() {
		var message = $("#chat_input").val();
		if (message == "") {
			$("#chat_submit").effect( "highlight", {color: 'red'}, 1000 );
			$("#chat_submit").attr("value", "can't be empty");
			return false;
		} else {
			var submitted_string = "message=" + message;
			$.ajax({
	            type: "POST",
	            url: "/",
	            data: submitted_string,
	            success: function(){
	                	$("#chat_submit").effect( "highlight", {color: '#53ED6A'}, 500 );
						$("#chat_input").val("");
						$("#chat_submit").attr("value", "submit");
	            	}
	            });
			return false;
		}
	});

	// var d = $('#messages');
	// d.scrollTop(d.prop("scrollHeight"));

	// $("#chat_form").submit(function() {
	// 	$("#messages").load("/ #messages_inner");
	// });


	//$("#messages").animate({ scrollTop: $("#whatever").scrollTop()}, 1000);

	// $.getJSON( "static/data.json", function() {
	// 	console.log( "success" );
	// })
});