$(document).ready(function() {
	
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

	refresh_chat_room_del_event(".admin_del")
	refresh_request_del_event(".req_del")

	//new request to chat submit
	$("#new_request_submit").click(function() {
		var new_request_name = $("#new_request_name").val();

		$.ajax({
			dataType: "json",
            type: "POST",
            url: "/request",
            data: {new_request_name: new_request_name},
            success: function(data){
	            if (data.errors) {
	            	var errors_html = "";
	            	$("#errors_request").html(data.errors);
	            	$("#success_request").html("");
		    	}
		    	else {
		    		if (!($("#pending_invites").text())) {
		    			$("#request_list").append("<div style=\"display:none;\" id=\"pending_invites\" class=\"room_title\">PENDING INVITES</div>"	);
		    			$("#pending_invites").slideDown("slow");
		    		}
			        $("#request_list").append("<div style=\"display:none;\" class=\"room_name\">" + data.new_request + "<div class=\"req_del\"><i class=\"icon ion-ios7-close-empty\"></i></div></div>");
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
});
