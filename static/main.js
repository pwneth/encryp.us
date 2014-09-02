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
					$("#chat").show();
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
	function refresh_delete_user_click_event(selector) {
		$(selector).click(function() {
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


	//deletes chat room if user is admin
	function refresh_chat_room_del_event(selector) {
		$(selector).click(function() {
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
	}

	
	//removes invite request for room
	function refresh_request_del_event(selector) {
		$(selector).click(function() {
			var chat = $(this).parent();
			var chat_text = chat.text();
			vex.dialog.confirm({
				message: 'Are you sure you want to remove the invite request for ' + chat_text + '?',
				callback: function(value) {
					if (value == true) {
						$.ajax({
				            type: "DELETE",
				            url: "/request",
				            data: {reqtodel: chat_text},
				            success: function(){				            
									chat.slideUp("slow");
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
		$("#chat").show();
	}

	var session_room = getUrlVars()["room"];
	sessionStorage.setItem("session_room", session_room);

	refresh_chat_room_del_event(".admin_del")
	refresh_request_del_event(".req_del")


	$("#new_chat_submit").click(function() {
		var new_chat_name = $("#new_chat_name").val();

		$.ajax({
			dataType: "json",
            type: "POST",
            url: "/startchat",
            data: {new_chat: new_chat_name},
            success: function(data){
	            if (data.errors) {
	            	var errors_html = "";
	            	if (data.errors.chatname) {
		            	for (var i = 0; i < data.errors.chatname.length; i++) {
		            		errors_html += data.errors.chatname[i] + "<br>";
		            	}
		            	$("#errors").html(errors_html);
		            	$("#success").html("");
	            	} else {
	            		$("#errors").html(data.errors);
	            		$("#success").html("");
	            	}
		    	}
		    	else {
			        $("#room_list").append("<div style=\"display: none;\" class=\"room_name\"><a href=\"/chat?room=" + data.new_chat + "\">" + data.new_chat + "</a><div class=\"admin_del\"><i class=\"icon ion-ios7-close-empty\"></i></div></div>");
			        $("#room_list .room_name:last-child").slideDown("slow");
			        $("#new_chat_name").val("");
			        $("#errors").html("");
	            	$("#success").html(data.success);
	            	refresh_chat_room_del_event(".room_name:last-child>.admin_del");
		    	}
            }
        });
		return false;
	});

	//new request to chat submit
	$("#new_request_submit").click(function() {
		var new_request_name = $("#new_request_name").val();

		$.ajax({
			dataType: "json",
            type: "POST",
            url: "/request",
            data: {new_request: new_request_name},
            success: function(data){
	            if (data.errors) {
	            	var errors_html = "";
	            	$("#errors_request").html(data.errors);
	            	$("#success_request").html("");
		    	}
		    	else {
			        $("#request_list").append("<div style=\"display: none;\" class=\"room_name\">" + data.new_request + "<div class=\"req_del\"><i class=\"icon ion-ios7-close-empty\"></i></div></div>");
			        $("#request_list .room_name:last-child").slideDown("slow");
			        $("#new_request_name").val("");
			        $("#errors_request").html("");
	            	$("#success_request").html(data.success);
	            	refresh_request_del_event(".room_name:last-child>.req_del");
		    	}
            }
        });
		return false;
	});

	//shows hidden menu items when menu button is clicked
	$("#menu_btn").click(function() {
		$(".hidden_li").toggle();
	});

	$("#account_submit").click(function() {
		var new_user_name = $("#account_username").val();
		var new_account_pw = $("#account_password").val();
		var reentered_new_account_pw = $("#account_reenter_password").val();

		// if 	(reentered_new_account_pw != new_account_pw) {
		// 	$("#errors").html("Passwords must match.");
		// }

		$.ajax({
			dataType: "json",
            type: "POST",
            url: "/createaccount",
            data: {username: new_user_name, password: new_account_pw, confirm: reentered_new_account_pw},
            success: function(data){
	            if (data.errors) {
	            	console.log(data.errors);

	            	var errors_html="";

	            	if (typeof data.errors === "string") {
	            		errors_html += data.errors + "<br>";
		            } else {
		            	for (var key in data.errors) {
		            		for (var j = 0; j < data.errors[key].length; j++) {
		            			errors_html += data.errors[key][j] + "<br>";
		            		}
		            	}
	            	}

		            $("#errors_new").html(errors_html);
		    	} else if (data.redirect) {
		    		window.location.href = data.redirect;
		    	}
            }
        });
		return false;
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

		if ($("#new_admin:checked").val()) {
			var admin = "yes"
		} else {
			var admin = "no"
		}

		$.ajax({
			dataType: "json",
            type: "POST",
            url: "/user",
            data: {username: username, admin: admin, room: session_room},
            success: function(data){
	            if (data.error) {
	            	$("#errors").html(data.error);
		    	}
		    	else {
			        $("#del_user_form").append("<div style=\"display: none;\" class=\"user_to_del\">" + data.user + "<div class=\"user_del\"><i class=\"icon ion-ios7-close-empty\"></i></div></div>");
			        $(".user_to_del:last-child").slideDown("slow");
	            	refresh_delete_user_click_event(".user_to_del:last-child>.user_del");
	            	$("#add_user_form").slideUp("slow");
	            	$("#errors").html("");
	            	$("#new_username").val("");
		    	}
            }
        });
		return false;
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

	refresh_delete_user_click_event(".user_del");

	//shows user list
	$("#del_user").click(function() {
		if ($("#users").is(":visible")) {
	    	$("#users").hide();
	    	$("#add_user").hide();
			$("#messages").css("width", "100%");
		} else {	
			$("#messages").css("width", "70%");
			$("#users").show();
			$("#add_user").show();
	    } 
	});
});