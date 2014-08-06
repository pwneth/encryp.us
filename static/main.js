$(document).ready(function() {

	if ($("#chat_input")) {
		$("#chat_input").focus();
	}

	var session_password = sessionStorage.getItem("session_password");

	function decrypt_messages() {
		$(".msg").each(function( index ) {
			var encrypted_content = $(this).html().trim();
			var decrypted_content = CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(encrypted_content, session_password));
			$(this).text(decrypted_content);
		});
	}
	decrypt_messages();


	// if (sessionStorage.getItem("session_password")) {
	// 	session_password = sessionStorage.getItem("session_password");
	// 	$('#aes_password').hide();
	// 	$('#chat').show();
	// 	$("#chat_input").focus();
	// 	decrypt_messages();
	// } else {
	// 	var session_password = "";
	// }

	$("#login_submit").click(function() {
		var password = $("#enc_key").val();
		sessionStorage.setItem("session_password", password);
		// if (password == "") {
		// 	$("#aes_submit").effect( "highlight", {color: 'red'}, 1000 );
		// 	$("#aes_submit").attr("value", "can't be empty");
		// } else {
		// 	session_password = sessionStorage.getItem("session_password");
		// 	$('#aes_password').hide();
		// 	$('#chat').show();
		// 	$("#chat_input").focus();
		// 	decrypt_messages();
		// }
		// return false;
	});

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
			var encrypted_message = CryptoJS.AES.encrypt(message, session_password);

			$.ajax({
	            type: "POST",
	            url: "/",
	            data: {message: encrypted_message.toString()},
	            success: function(){
	                	$("#chat_submit").effect( "highlight", {color: '#53ED6A'}, 500 );
						$("#chat_input").val("");
						$("#chat_submit").attr("value", "submit");
						$('#aes_password').hide();
						$('#chat').show();
						$("#chat_input").focus();
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