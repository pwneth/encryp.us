function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

$(document).ready(function() {

	if ((window.location.pathname != "/")) {
		$(window).on('mousemove', function (e) {
			if (e.pageY <= "10") {
				$('#nav').slideDown('fast');
			}
			if (e.pageY >= "61") {
				$('#nav').slideUp('fast');
			}
		});
	}
});