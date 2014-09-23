var session_password = false;
var private_key = false;

function imgError(image) {
    image.onerror = "";
    image.src = "/static/broken.jpg";
    return true;
}

var is_img = new RegExp("((?:(?:https?|ftp|file)://|www\.|ftp\.)[-A-Z0-9+&@#/%=~_|$?!:,.]*[A-Z0-9+&@#/%=~_|$]+.(jpg|png|gif|jpeg|bmp))(?!([^<]+)?>)" , "i");
var is_link = new RegExp("https?://(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}([-a-zA-Z0-9@:%_+.~#?&//=]*)" , "i");


$(document).ready(function() {

	var usersort = $("#users_txt").text();
	var messageDiv = document.getElementById("messages");

	if (window.innerWidth > 480) {
		$(window).on('mousemove', function (e) {
			if (e.pageY <= 10) {
				$('#nav').slideDown('fast');
			}
			if (e.pageY >= 61) {
				$('#nav').slideUp('fast');
			}
		});
	}

	function generate_key() {
		var g = 433;
		var n = 55;

		if (private_key == false) {		
			// set my private key
			private_key = Math.floor(Math.random()*50);
		}

		console.log("My private key: " + private_key);
		// sent an un reversible version of my private key to server
		var sent_key = Math.pow(g, private_key, n)
		console.log("Key sent to server: " + sent_key);
		var partner = getUrlVars()["user"];

		$.ajax({
			type: "POST",
			dataType: "JSON",
			url: "/initOTR",
			data: {sent_key: sent_key, users: usersort, partner: partner},
			success: function(data) {
				// get the unreversible version of my partner's key
				var received_key = data.partner_key;
				console.log("Key received from server: " + received_key);

				if (received_key == null) {
					setTimeout(generate_key, 3000);
				} else {
					// set the session key by combining my secret key with the recieved key
					var session_key = Math.pow(received_key, private_key)%n;
					console.log("Session key: " + session_key);

					sessionStorage.setItem("session_password", session_key);
					session_password = sessionStorage.getItem("session_password");
					decrypt_messages();
					$("#loading").hide();
					$("#chat, #nav").show();
					$("#chat_input").focus();
				}
			}
		});
	}

	function decrypt_message(message) {
		var encrypted_content = message;
		var decrypted_content = CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(encrypted_content, session_password));
		
		if (decrypted_content.substr(0,session_password.length) == session_password) {
			var msg_data = decrypted_content.substr(session_password.length);
			if (msg_data.match(is_img)) {
				return "<a href=\"" + msg_data + "\"><img class=\"chat_img\" onerror=\"imgError(this);\" src=\"" + msg_data + "\"></a>";
			} else if (msg_data.match(is_link)) {
				return "<a href=\"" + msg_data + "\">" + msg_data + "</a>";
			} else {
				return msg_data;
			}
		} else {
			$("#loading").show();
			return false;
		}	
	}

	//decrypt all messages function
	function decrypt_messages() {
		$(".msg").each(function( index ) {
			$(this).html(decrypt_message($(this).text()));
		});
	}

	//load messages into messages divs
	function load_messages(){
		$.ajax({
			type: "POST",
            dataType: "json",
            url: "/otrmessage",
            data: {users: usersort},
            success: function(data){
                	console.log(data);
                	var html_message = "";
                	var classname = "";
                	if (data.username != data.message.name) {
                		classname = "notme";
                	}
                	html_message = "<div class=\"message\"><div class=\"name " + classname + "\">" + data.message.name + "</div><div class=\"msg\">" + decrypt_message(data.message.message) + "</div><div class=\"time\">" + data.message.time + "</div></div>";
                	$("#messages_inner").append(html_message);
					if ($("#messages").hasScrollBar()) {
						messageDiv.scrollTop = messageDiv.scrollHeight;
					} else {
						$("#messages_inner").css({
							top: "auto",
							bottom: 0
						});
					}
                	setTimeout(load_messages, 0);
            	}
            });
	}

	// //prompt user for encryption password
	// function vex_prompt() {
	// 	sessionStorage.removeItem("session_password");
	// 	$("#chat, #nav").hide();
	// 	vex.dialog.prompt({
	//   		message: 'Please enter your encryption key',
	//  		placeholder: '',
	//   		showCloseButton: false,
	//   		overlayClosesOnClick: false,
	//   		callback: function(value) {
	//   			if (value == "") {
	// 		  		window.location.href = "/home";
	// 			} else {
	// 				sessionStorage.setItem("session_password", value);
	// 				session_password = sessionStorage.getItem("session_password");
	// 				decrypt_messages();
	// 				$("#chat, #nav").show();
	// 				$("#chat_input").focus();
	// 			}
	//  		}
	// 	});
	// }

	//load messages on page load into chat area
	setTimeout(load_messages, 0);

	//check if scroll bar and scroll down if
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    };

	session_password = sessionStorage.getItem("session_password");

	if (!session_password) {
		generate_key();
	} else {
		$("#loading").hide();
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

	// //when delete messages is clicked, do the following
	// $("#delete_messages").click(function() {
	// 	vex.dialog.confirm({
	// 		message: 'Are you sure you want to delete the messages?',
	// 		callback: function(value) {
	// 			if (value == true) {
	// 				$.ajax({
	// 		            type: "POST",
	// 		            url: "/deletemessages",
	// 		            data: {users: usersort},
	// 		            success: function(){
	// 			            $("#messages").html("");
	// 		            	}
	// 		            });
	// 				return false;
	// 			}
	// 		}
	// 	});		
	// });
});