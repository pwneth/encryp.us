var session_password = false;

function imgError(image) {
    image.onerror = "";
    image.src = "/static/broken.jpg";
    return true;
}

var is_img = new RegExp("((?:(?:https?|ftp|file)://|www\.|ftp\.)[-A-Z0-9+&@#/%=~_|$?!:,.]*[A-Z0-9+&@#/%=~_|$]+.(jpg|png|gif|jpeg|bmp))(?!([^<]+)?>)" , "i");


$(document).ready(function() {
	
	var usersort = $("#users_txt").text();
	var messageDiv = document.getElementById("messages");

	$(window).on('mousemove', function (e) {
		if (e.pageY <= 10) {
			$('#nav').slideDown('fast');
		}
		if (e.pageY >= 61) {
			$('#nav').slideUp('fast');
		}
	});

	//decrypt all messages function
	function decrypt_messages() {
		$(".msg").each(function( index ) {
			var encrypted_content = $(this).data("msg");
			var decrypted_content = CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(encrypted_content, session_password));
			if (decrypted_content.substr(0,session_password.length) == session_password) {
				var msg_data = decrypted_content.substr(session_password.length);
				if (msg_data.match(is_img)) {
					$(this).html("<a href=\"" + msg_data + "\"><img class=\"chat_img\" onerror=\"imgError(this);\" src=\"" + msg_data + "\"></a>");
				} else {
					$(this).text(msg_data).linkify();
				}
			} else {
				vex_prompt();
				return false;
			}
		});
	}

	//load messages into messages divs
	function load_messages(){
		$("#messages").load("/otrmessage #messages_inner", {users: usersort, user: usersort}, function(response, status, xhr) {
			decrypt_messages();
			setTimeout(load_messages, 0);
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
		sessionStorage.removeItem("session_password");
		$("#chat, #nav").hide();
		vex.dialog.prompt({
	  		message: 'Please enter your encryption key',
	 		placeholder: '',
	  		showCloseButton: false,
	  		overlayClosesOnClick: false,
	  		callback: function(value) {
	  			if (value == "") {
			  		window.location.href = "/home";
				} else {
					sessionStorage.setItem("session_password", value);
					session_password = sessionStorage.getItem("session_password");
					decrypt_messages();
					$("#chat, #nav").show();
					$("#chat_input").focus();
				}
	 		}
		});
	}

	//load messages on page load into chat area
	setTimeout(load_messages, 0);

	//check if scroll bar and scroll down if
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    };

	session_password = sessionStorage.getItem("session_password");

	if (!session_password) {
		vex_prompt();
	} else {
		$("#chat, #nav").show();
		decrypt_messages();
	}


    //focus on chat input when in chat window
	$("#chat_input").focus();

	//if messages div has a scroll bar position the div accordingly
	if (!($("#messages").hasScrollBar())) {
		$("#messages_inner").css({
			top: "auto",
			bottom: 0
		});
	}

	//scroll message div to bottom when message is received 
	var messageDiv = document.getElementById("messages");
	messageDiv.scrollTop = messageDiv.scrollHeight;

	//on submitting a message do the following
	$("#chat_submit").click(function() {
		console.log(usersort);
		var message = session_password + $("#chat_input").val();
		if (message == session_password) {
			$("#chat_submit").effect( "highlight", {color: 'red'}, 1000 );
			$("#chat_submit").attr("value", "can't be empty");
			return false;
		} else {
			var encrypted_message = CryptoJS.AES.encrypt(message, session_password);
			encrypted_message = encrypted_message.toString();
			$.ajax({
	            type: "POST",
	            url: "/otrchat",
	            data: {message: encrypted_message, users: usersort},
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

	//when delete messages is clicked, do the following
	$("#delete_messages").click(function() {
		vex.dialog.confirm({
			message: 'Are you sure you want to delete the messages?',
			callback: function(value) {
				if (value == true) {
					$.ajax({
			            type: "POST",
			            url: "/deletemessages",
			            data: {users: usersort},
			            success: function(){
				            $("#messages").html("");
			            	}
			            });
					return false;
				}
			}
		});		
	});
});