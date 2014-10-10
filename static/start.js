

$(document).ready(function() {

	$("#nav_login").click(function() {
		$("#login_popup").slideToggle();
	});

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

});