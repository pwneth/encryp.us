var session_password = false;

function imgError(image) {
    image.onerror = "";
    image.src = "/static/broken.jpg";
    return true;
}

var is_img = new RegExp("((?:(?:https?|ftp|file)://|www\.|ftp\.)[-A-Z0-9+&@#/%=~_|$?!:,.]*[A-Z0-9+&@#/%=~_|$]+.(jpg|png|gif|jpeg|bmp))(?!([^<]+)?>)" , "i");
var is_link = new RegExp("https?://(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}([-a-zA-Z0-9@:%_+.~#?&//=]*)" , "i");

//check if scroll bar and scroll down if
$.fn.hasScrollBar = function() {
    return this.get(0).scrollHeight > this.height();
};

$(document).ready(function() {

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

	// //decrypt all messages function
	// function decrypt_messages() {
	// 	$(".msg").each(function( index ) {
	// 		var encrypted_content = $(this).data("msg");
	// 		var decrypted_content = CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(encrypted_content, session_password));
	// 		if (decrypted_content.substr(0,session_password.length) == session_password) {
	// 			var msg_data = decrypted_content.substr(session_password.length);
	// 			if (msg_data.match(is_img)) {
	// 				$(this).html("<a href=\"" + msg_data + "\"><img class=\"chat_img\" onerror=\"imgError(this);\" src=\"" + msg_data + "\"></a>");
	// 			} else {
	// 				$(this).text(msg_data).linkify();
	// 			}
	// 			if ($("#messages").hasScrollBar()) {
	// 				messageDiv.scrollTop = messageDiv.scrollHeight;
	// 			} else {
	// 				$("#messages_inner").css({
	// 					top: "auto",
	// 					bottom: 0
	// 				});
	// 			}
	// 		} else {
	// 			vex_prompt();
	// 			return false;
	// 		}
	// 	});
	// }

	// //load messages into messages divs
	// function load_messages(){
	// 	session_room = sessionStorage.getItem("session_room");
	// 	$("#messages").load("/message #messages_inner", {room: session_room}, function(response, status, xhr) {
	// 		if (xhr.status == 401) {
	// 			$("#chat").hide();
	// 			$("#nav").hide();
	// 			vex.dialog.alert({
	// 		  		message: 'You have been booted from ' + session_room,
	// 		  		showCloseButton: false,
	// 		  		overlayClosesOnClick: false,
	// 		  		callback: function() {
	// 		  			window.location.href = "/home";
	// 					$("body").hide();
	// 		 		}
	// 			});
	// 			return false;
	// 		} else if (xhr.status == 403) {
	// 			$("#chat").hide();
	// 			$("#nav").hide();
	// 			vex.dialog.alert({
	// 		  		message: 'You have logged out',
	// 		  		showCloseButton: false,
	// 		  		overlayClosesOnClick: false,
	// 		  		callback: function() {
	// 		  			window.location.href = "/login";
	// 					$("body").hide();
	// 		 		}
	// 			});
	// 			return false;
	// 		} else {
	// 			decrypt_messages();
	// 			setTimeout(load_messages, 0);
	// 		}
	// 	});
	// }

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
			vex.dialog.alert({
		  		message: 'Incorrect password for ' + session_room,
		  		showCloseButton: false,
		  		overlayClosesOnClick: false,
		  		callback: function() {
		  			window.location.href = "/home";
					$("body").hide();
		 		}
			});
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
		var xhReq = jQuery.ajaxSetup( {}, {}).xhr(),
			readPos = 0,
			timer;


		xhReq.onreadystatechange = function(){	
			if (xhReq.readyState !== 4) return;
				clearInterval(timer);
			if (xhReq.status == 401) {
				console.log("401 error!!!");
				$("#chat").hide();
				$("#nav").hide();
				return false;
			} else if (xhReq.status == 403) {
				$("#chat").hide();
				$("#nav").hide();
				vex.dialog.alert({
			  		message: 'You have logged out',
			  		showCloseButton: false,
			  		overlayClosesOnClick: false,
			  		callback: function() {
			  			window.location.href = "/login";
						$("body").hide();
			 		}
				});
				return false;
			} else {
					setTimeout(load_messages, 0);
				}
			};

		function readData(){
			var new_data = xhReq.responseText.slice(readPos),
				data,
				html_message = "",
				classname = "";

			if (!new_data) return;

			console.log(new_data);

			readPos += new_data.length;
			data = jQuery.parseJSON(new_data);

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
		}

		xhReq.open("POST", "/message", true);
		xhReq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
		xhReq.send("room=" + session_room);

		timer = setInterval(readData, 100);
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


	function request_accept(selector) {
			//add user form is submitted, do the following
		$(selector).click(function() {
			var username_box = $(this).parent();
			var username = username_box.text();
			var admin = "no";

			$.ajax({
				dataType: "json",
	            type: "POST",
	            url: "/invite",
	            data: {username: username, admin: admin, room: session_room},
	            success: function(data){
		            if (data.error) {
		            	$("#errors").html(data.error);
			    	}
			    	else {
				        $("#allowed_users").append("<div style=\"display: none;\" class=\"user_to_del\">" + data.user + "<div class=\"user_del\"><i class=\"icon ion-ios7-close-empty\"></i></div></div>");
				        $(".user_to_del:last-child").slideDown("slow");
		            	refresh_delete_user_click_event(".user_to_del:last-child>.user_del");
		            	$("#add_user_form").slideUp("slow");
		            	$("#errors").html("");
		            	$("#new_username").val("");
		            	username_box.slideUp("slow");
			    	}
	            }
	        });
			return false;
		});
	}

	function request_reject(selector) {
		$(selector).click(function() {
			var username_box = $(this).parent();
			var username = username_box.text();

			vex.dialog.confirm({
				message: 'Are you sure you want to reject ' + username + '\'s invite request?',
				callback: function(value) {
					if (value == true) {
						$.ajax({
				            type: "DELETE",
				            url: "/invite",
				            data: {username: username, room: session_room},
				            success: function(){				            
									username_box.slideUp("slow");
				            	}
				            });
						return false;
					}
				}
			});
		});
	}

	//scroll message div to bottom when message is received 
	$("#messages").scrollTop = messageDiv.scrollHeight;

	session_password = sessionStorage.getItem("session_password");

	if ((sessionStorage.getItem("session_room") != getUrlVars()["room"] || !session_password) && 
		window.location.pathname == "/chat") {
		vex_prompt();
	} else {
		$("#chat, #nav").show();
		decrypt_messages();
	}

	var session_room = getUrlVars()["room"];
	sessionStorage.setItem("session_room", session_room);

    //focus on chat input when in chat window
	$("#chat_input").focus();

	//load messages on page load into chat area
	setTimeout(load_messages, 0);

	//if messages div has a scroll bar position the div accordingly
	if (!$("#messages").hasScrollBar()) {
		$("#messages_inner").css({
			top: "auto",
			bottom: 0
		});
	}

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
			        $("#allowed_users").append("<div style=\"display: none;\" class=\"user_to_del\">" + data.user + "<div class=\"user_del\"><i class=\"icon ion-ios7-close-empty\"></i></div></div>");
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

	//on submitting a message do the following
	$("#chat_submit").click(function() {
		var message = session_password + $("#chat_input").val();
		if (message == session_password) {
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
		$("#new_username").focus();
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
	request_accept(".req_accept");
	request_reject(".req_deny")

	//shows user list
	$("#del_user").click(function() {

		if (window.outerWidth > 480) {
			if ($("#users").is(":visible")) {
		    	$("#users").hide();
		    	$("#add_user").hide();
				$("#messages").css("width", "100%");
			} else {	
				$("#messages").css("width", "70%");
				$("#users").show();
				$("#add_user").show();
		    } 
		} else {
			if ($("#users").is(":visible")) {
		    	$("#users").hide();
		    	$("#add_user").hide();
				$("#messages").show();
			} else {	
				$("#messages").hide();
				$("#users").show().css("width", "100%");
				$("#add_user").show();
		    } 
		}
	});
});