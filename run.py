
from tornado.ioloop import IOLoop
from tornado.web import RequestHandler, Application, url
import tornado.httputil
import base64
import json

#this is temporary -- will take users from a JSON db later on
#will also allow for user/pw creation by admin
allowed_users = {"michael":"password","admin":"whatever"}

#this is also temportary -- posts to display




posts = []


class BaseHandler(tornado.web.RequestHandler):
    '''BaseHandler checks that user cookie is set'''
    def get_current_user(self):
        return self.get_secure_cookie("user")


class MainHandler(BaseHandler):
	'''MainHandler shows the chat application @ home.html'''
	@tornado.web.authenticated
	def get(self):
		# if not self.current_user:
		# 	self.redirect("/login")
		# 	return
			# with open('templates/data.json') as f:
			# 	data = f.read()
			# 	jsondata = json.loads(data)

			# print(jsondata)
		self.render("home.html", title="Home Page", 
			username=self.current_user, messages=posts)

	def post(self):
		# msg = self.get_argument("message")
		# new_message = {'name':self.current_user.decode("utf-8"),
		# 	'message':msg,
		# 	'time':'3:00pm'}

		# with open('templates/data.json') as f:
		# 	data = json.load(f)

		# data.update(new_message)

		# with open('templates/data.json', 'w') as f:
		# 	json.dump(data, f)

		msg = self.get_argument("message")
		posts.append(self.current_user.decode("utf-8") + ": " + msg)
		self.render("home.html", title="Home Page", 
			username=self.current_user, messages=posts)




class AccountHandler(BaseHandler):
	'''This handler shows account information and will allow user to modify'''
	@tornado.web.authenticated
	def get(self):
		self.render("account.html", title="Account Page", 
			username=self.current_user)


class LoginHandler(BaseHandler):
	'''This handler shows the login page if user is not logged in'''
	def get(self):
		next_page = self.get_argument("next", default="/")
		if self.current_user:
			self.redirect(next_page)
		else:
			self.render("login.html", title="Login Page", 
				error=None, next_page=next_page)

	#post will make sure that user and password combination are valid
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
	'''This handler clears the user cookie'''
	def get(self):
		self.clear_cookie("user")
		self.redirect("/")


def make_app():
    '''this is the main application function'''
    app = Application([
        url(r"/", MainHandler),
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