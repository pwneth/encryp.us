$(document).ready(function() {

	$("#login_submit").click(function() {
		var username = $("#username").val();
		var password = $("#password").val();
		var next = getUrlVars()["next"]

		$.ajax({
			dataType: "json",
            type: "POST",
            url: "/login",
            data: {username: username, password: password, next:next},
            success: function(data){
	            if (data.errors) {
	            	console.log(data.errors);
		            $("#errors").html(data.errors);
		    	} else if (data.redirect) {
		    		decoded_url = decodeURIComponent(data.redirect);
		    		window.location.pathname = decoded_url;
		    	}
            }
        });
		return false;
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
});