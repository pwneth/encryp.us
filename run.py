
from tornado.ioloop import IOLoop
from tornado.web import RequestHandler, Application, url
import tornado.httputil

# class HelloHandler(RequestHandler):
#     def get(self):
#     	whatever = {'michael':'navarro','john':'doe','joe':'schmoe'}
#     	self.write(whatever)



# class MyFormHandler(RequestHandler):
# 	def get(self):
# 		self.write("""<html><body><form action="/form" method="POST">
# 			<input type="text" name="message">
# 			<input type="submit" value="submit">
# 			</form></body></html>""")

# 	def post(self):
# 		page_url = self.request.full_url()
# 		location = self.locale.name

# 		self.set_header("Content-Type", "text/plain")
# 		self.write("You wrote " + self.get_body_argument("message") + 
# 			" and the url is:" + page_url + 
# 			"\nYour locale: " + location)

allowed_users = {"michael":"password","admin":"whatever"}

class BaseHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        return self.get_secure_cookie("user")

class MainHandler(BaseHandler):
	@tornado.web.authenticated
	def get(self):
		# if not self.current_user:
		# 	self.redirect("/login")
		# 	return
		self.render("home.html", title="Home Page", 
			username=self.current_user)

class AccountHandler(BaseHandler):
	@tornado.web.authenticated
	def get(self):
		# if not self.current_user:
		# 	self.redirect("/login")
		# 	return
		self.render("account.html", title="Account Page", 
			username=self.current_user)

	# def post(self):
	# 	page_url = self.request.full_url()
	# 	location = self.locale.name

	# 	self.set_header("Content-Type", "text/plain")
	# 	self.write("You wrote " + self.get_body_argument("message") + 
	# 		" and the url is:" + page_url + 
	# 		"\nYour locale: " + location)
class ChatHandler(BaseHandler):
	@tornado.web.authenticated
	def get(self):
		# if not self.current_user:
		# 	self.redirect("/login")
		# 	return
		self.render("chat.html", title="Chat", username=self.current_user)

class LoginHandler(BaseHandler):
	def get(self):
		next_page = self.get_argument("next", default="/")

		if self.current_user:
			self.redirect(next_page)
		else:
			self.render("login.html", title="Login Page", 
				error=None, next_page=next_page)

	def post(self):
		get_pw = self.get_argument("password")
		get_un = self.get_argument("username")
		next_page = self.get_argument("next_page", default="/")
		if get_un in allowed_users and allowed_users[get_un] == get_pw:
			self.set_secure_cookie("user", get_un)
			self.redirect(next_page)
		else:
			self.render("login.html", title="Login Page", 
				error="username or pw wrong", next_page=next_page)

class LogoutHandler(BaseHandler):
	def get(self):
		self.clear_cookie("user")
		self.redirect("/")


def make_app():
    app = Application([
        url(r"/", MainHandler),
        url(r"/chat", ChatHandler),
        url(r"/account", AccountHandler),
        url(r"/login", LoginHandler),
        url(r"/logout", LogoutHandler)
        ], 
        template_path="templates",
        static_path="static",
        login_url="login",
        cookie_secret="ajfhafaj8r7w73d872")
    app.listen(8888)
    IOLoop.current().start()	

if __name__ == "__main__":
	make_app()