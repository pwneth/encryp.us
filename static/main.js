var session_password = false;

$(document).ready(function() {

	//decrypt all messages function
	function decrypt_messages() {
		$(".msg").each(function( index ) {
			var encrypted_content = $(this).data("msg");
			var decrypted_content = CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(encrypted_content, session_password));
			if (decrypted_content.substr(0,session_password.length) == session_password) {
				$(this).text(decrypted_content.substr(session_password.length)).linkify();
			} else {
				vex_prompt();
				return false;
			}
		});
	}

	//load messages into messages divs
	function load_messages(){
		session_room = sessionStorage.getItem("session_room");
		$("#messages").load("/message #messages_inner", {room: session_room}, function() {
			console.log(session_room);
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
		vex.dialog.prompt({
	  		message: 'Please enter your encryption key',
	 		placeholder: '',
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

	function getUrlVars() {
	    var vars = {};
	    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
	        vars[key] = value;
	    });
	    return vars;
	}

	//when user_del is clicked delete the user and do the following
	function delete_user() {
		$(".user_del").click(function() {
			var user = $(this).parent();
			var user_txt = user.text();
			vex.dialog.confirm({
				message: 'Are you sure you want to remove ' + user_txt + ' from the chat room?',
				callback: function(value) {
					if (value == true) {
						$.ajax({
				            type: "DELETE",
				            url: "/user",
				            data: {usertodelete: user_txt, room: session_room},
				            success: function(){		            
									user.slideUp("slow");
				            	}
				            });
						return false;
					}
				}
			});		
		});
	}

	session_password = sessionStorage.getItem("session_password");

	if ((sessionStorage.getItem("session_room") != getUrlVars()["room"] || !session_password) && 
		window.location.pathname == "/chat") {
		vex_prompt();
	} else {
		decrypt_messages();
	}

	var session_room = getUrlVars()["room"];
	sessionStorage.setItem("session_room", session_room);

	//shows hidden menu items when menu button is clicked
	$("#menu_btn").click(function() {
		$(".hidden_li").toggle();
	});

	//deletes chat room if user is admin
	$(".admin_del").click(function() {
		var chat = $(this).parent();
		var chat_text = chat.text();
		vex.dialog.confirm({
			message: 'Are you sure you want to delete ' + chat_text + '?',
			callback: function(value) {
				if (value == true) {
					$.ajax({
			            type: "DELETE",
			            url: "/deletechat",
			            data: {chattodel: chat_text},
			            success: function(){				            
								chat.slideUp("slow");
			            	}
			            });
					return false;
				}
			}
		});		
	});

	//check if scroll bar and scroll down if
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    };

    //focus on chat input when in chat window
	if ($("#chat_input")) {
		$("#chat_input").focus();
	}

	//load messages on page load into chat area
	setTimeout(load_messages, 0);

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
	            url: "/chat",
	            data: {message: encrypted_message, room: session_room},
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

	//on clicking add user show the add user form
	$("#add_user").click(function() {
		$("#add_user_form").slideToggle();
	});

	//add user form is submitted, do the following
	$("#new_user_submit").click(function() {
		var user_list = [];
		$(".user_to_del").each(function() {
			user_list.push($(this).text().trim());
		});

		var username = $("#new_username").val();
		var password = $("#new_password").val();

		if ($("#new_admin:checked").val()) {
			var admin = "yes"
		} else {
			var admin = "no"
		}
		if ((username == "" || password == "") || !($.inArray(username, user_list) == -1)) {
			$("#new_user_submit").effect( "highlight", {color: 'red'}, 1000 );
			$("#new_user_submit").attr("value", "invalid");
			return false;
		} else {
			$.ajax({
	            type: "POST",
	            url: "/user",
	            data: {username: username, password: password, admin: admin, room: session_room},
	            success: function(){
					$("#add_user_form").toggle();
		            $("#new_password").val("");
		            $("#new_username").val("");
		            $("#del_user_form").append("<div style=\"display: none;\" class=\"user_to_del\">" + username + "<div class=\"user_del\"><i class=\"fa fa-times-circle\"></i></div></div>");
		            $(".user_to_del:last-child").slideDown("slow");
		            delete_user()
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
			            data: {room: session_room},
			            success: function(){
				            $("#messages").html("");
			            	}
			            });
					return false;
				}
			}
		});		
	});

	delete_user()

	//shows user list
	$("#del_user").click(function() {
		if ($("#del_user_form").is(":visible")) {
	    	$("#del_user_form").hide();
	    	$("#add_user").hide();
		} else {	
			$("#del_user_form").show();
			$("#add_user").show();
	    } 
	});
});