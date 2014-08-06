$(document).ready(function() {

	$("#chat_input").focus();

	function decrypt_messages() {
		$(".msg").each(function( index ) {
			var encrypted_content = $(this).html().trim();
			var decrypted_content = CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(encrypted_content, "1234"));
			console.log(encrypted_content);
			$(this).text(decrypted_content);
		});
	}
	decrypt_messages()

	function load_messages(){
		$("#messages").load("/message #messages_inner", null, function() {
			decrypt_messages()
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
			var encrypted_message = CryptoJS.AES.encrypt(message, "1234");

			$.ajax({
	            type: "POST",
	            url: "/",
	            data: {message: encrypted_message.toString()},
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