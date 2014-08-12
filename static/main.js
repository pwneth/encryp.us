var session_password = false;

$(document).ready(function() {
	//decrypt all messages function
	function decrypt_messages() {
		$(".msg").each(function( index ) {
			var encrypted_content = $(this).data("msg");
			var decrypted_content = CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(encrypted_content, session_password));
			if (decrypted_content.substr(0,session_password.length) == session_password) {
				$(this).text(decrypted_content.substr(session_password.length));
			} else {
				vex_prompt();
				return false;
			}
		});
	}

	//load messages into messages div
	function load_messages(){
		$("#messages").load("/message #messages_inner", null, function() {
			decrypt_messages();
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

	//prompt user for encryption password
	function vex_prompt() {
		vex.dialog.prompt({
	  		message: 'Please enter your encryption key',
	 		placeholder: 'Try to use weird characters and numbers',
	  		showCloseButton: false,
	  		overlayClosesOnClick: false,
	  		callback: function(value) {
	  			if (value == "") {
					vex_prompt();
				} else {
					sessionStorage.setItem("session_password", value);
					session_password = sessionStorage.getItem("session_password");
					decrypt_messages();
					$("#chat_input").focus();
				}
	 		}
		});
	}

	//check if scroll bar and scroll down if
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    };

	if (sessionStorage.getItem("session_password")) {
		session_password = sessionStorage.getItem("session_password");
	}

	if ($("#chat_input")) {
		$("#chat_input").focus();
	}

	setTimeout(load_messages, 0);

	if (!session_password && !(window.location.pathname == "/login")) {
		vex_prompt();
	} else {
		decrypt_messages();
	}

	$("#re_enc").click(function() {
		vex_prompt();
	});

	if (!($("#messages").hasScrollBar())) {
		$("#messages_inner").css({
			top: "auto",
			bottom: 0
		});
	}

	var messageDiv = document.getElementById("messages");
	messageDiv.scrollTop = messageDiv.scrollHeight;

	$("#chat_submit").click(function() {
		var message = session_password + $("#chat_input").val();
		if (message == "") {
			$("#chat_submit").effect( "highlight", {color: 'red'}, 1000 );
			$("#chat_submit").attr("value", "can't be empty");
			return false;
		} else {
			var encrypted_message = CryptoJS.AES.encrypt(message, session_password);
			encrypted_message = encrypted_message.toString();

			$.ajax({
	            type: "POST",
	            url: "/",
	            data: {message: encrypted_message},
	            success: function(){
	                	$("#chat_submit").effect( "highlight", {color: '#53ED6A'}, 500 );
						$("#chat_input").val("");
						$("#chat_submit").attr("value", "submit");
						$("#chat_input").focus();
	            	}
	            });
			return false;
		}
	});

	$("#add_user").click(function() {
		$("#add_user_form").slideToggle();
	});

	$("#new_user_submit").click(function() {
		var username = $("#new_username").val();
		var password = $("#new_password").val();
		if ($("#new_admin:checked").val()) {
			var admin = "yes"
		} else {
			var admin = "no"
		}
		if (username == "" || password == "") {
			$("#new_user_submit").effect( "highlight", {color: 'red'}, 1000 );
			$("#new_user_submit").attr("value", "can't be empty");
			return false;
		} else {
			$.ajax({
	            type: "POST",
	            url: "/createuser",
	            data: {username: username, password: password, admin: admin},
	            success: function(){
					$("#add_user_form").slideToggle();
		            $("#add_user").effect( "highlight", {color: '#53ED6A'}, 500 );
		            $("#new_password").val("");
		            $("#new_username").val("");
	            	}
	            });
			return false;
		}
	});

	$("#delete_messages").click(function() {
		vex.dialog.confirm({
			message: 'Are you sure you want to delete the messages?',
			callback: function(value) {
				if (value == true) {
					$.ajax({
			            type: "POST",
			            url: "/deletemessages",
			            success: function(){
				            $("#delete_messages").effect( "highlight", {color: '#53ED6A'}, 500 );
				            $("#messages").html("");
			            	}
			            });
					return false;
				}
			}
		});		
	});
});