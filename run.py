from tornado.ioloop import IOLoop
from tornado.concurrent import Future
from tornado.web import RequestHandler, Application, url
import tornado.httputil
import base64
import json
from datetime import datetime, date
import tornado.autoreload
import redis

redis_server = redis.Redis("localhost")
message_futures = []


# class decrypts the message object contents
class decrypt_msg(object):

	def __init__(self, msg):
		self.name = msg['name']
		self.time = msg['time']
		self.msg = msg['message']


# loads json data and append decrypted information to an array and return
# it for the templates to use
def append_messages():
	messages = []
	message_data = redis_server.lrange("messages", "0", "-1")

	for f in message_data:
		messages.append(decrypt_msg(json.loads(f.decode("utf-8"))))

	return messages

#function gets userlist and admin status of current_user
def user_list():
	user_list = []
	redis_user_list = redis_server.keys("user-*")
	for user in redis_user_list:
		username = redis_server.hget(user, "username")
		decoded_user = username.decode("utf-8")
		user_list.append(decoded_user)

	return user_list

#check if someone is admin
def is_admin(current_user):
	return redis_server.hget(b"user-" + current_user, "admin") == b"yes"


#check if admin decorator
def only_admin(func):
	def wrapper(self, *args, **kwargs):
		if not is_admin(self.current_user):
			return "404"
		return func(self, *args, **kwargs)
	return wrapper


class BaseHandler(tornado.web.RequestHandler):

	'''BaseHandler checks that user cookie is set'''

	def get_current_user(self):
		return self.get_secure_cookie("user")


class MessageHandler(BaseHandler):

	'''MessageHandler handles each message'''
	@tornado.web.authenticated
	@tornado.web.asynchronous
	def get(self):
		future = Future()
		future.add_done_callback(self.render_now)
		message_futures.append(future)

	def render_now(self, future):
		admin = is_admin(self.current_user)
		self.render("home.html", title="Home Page",
					username=self.current_user, messages=append_messages(), admin=admin)


class DeleteMessagesHandler(BaseHandler):

	'''MessageHandler handles each message'''
	@tornado.web.authenticated
	def post(self):
		redis_server.ltrim("messages", 1, 0)

class MainHandler(BaseHandler):

    '''MainHandler shows the chat application @ home.html'''
    @tornado.web.authenticated
    def get(self):
        admin = is_admin(self.current_user)
        self.render("home.html", title="Home Page",
                    username=self.current_user, messages=append_messages(), admin=admin)

    @tornado.web.authenticated
    def post(self):
        msg = self.get_argument("message")
        time = datetime.now().strftime("%-I:%M %p")

        json_message = json.dumps({'name':self.current_user.decode("utf-8"), 'message':msg, 'time':time})
        redis_server.rpush("messages", json_message)

        for f in message_futures:
            f.set_result(None)

        message_futures[:] = []


class AccountHandler(BaseHandler):

	'''AccountHandler allows user to edit their user info / password'''
	@tornado.web.authenticated
	def post(self):
		self.render("test.html", title="Account Page", username=username, whatever=messages)


class TestHandler(BaseHandler):
	def get(self):
		whatever = redis_server.keys("user-*")

		messages = []
		for f in whatever:
			messages.append(f.decode("utf-8"))

		self.render("test.html", title="Account Page", whatever=messages)


class UserHandler(BaseHandler):

	'''This is the handler that handles user creation and deletion'''
	@tornado.web.authenticated
	@only_admin
	def get(self):
		users = user_list()
		self.write(json.dumps(users))

	@tornado.web.authenticated
	@only_admin	
	def post(self):
		get_un = self.get_argument("username")
		get_pw = self.get_argument("password")
		get_admin = self.get_argument("admin")

		redis_server.hmset("user-" + get_un, {"username":get_un, "password":get_pw, "admin":get_admin})

	@tornado.web.authenticated
	@only_admin
	def delete(self):
		get_un = self.get_argument("usertodelete")

		redis_server.delete("user-" + get_un)


class LoginHandler(BaseHandler):

	'''This handler shows the login page if user is not logged in'''

	def get(self):
		next_page = self.get_argument("next", default="/")
		if self.current_user:
			self.redirect(next_page)
		else:
			self.render("login.html", title="Login Page",
						error=None, next_page=next_page)

    # post will make sure that user and password combination are valid
	def post(self):
		get_pw = self.get_argument("password")
		get_un = self.get_argument("username")
		next_page = self.get_argument("next_page", default="/")

		if redis_server.hget("user-" + get_un, "password") is None:
			self.render("login.html", title="Login Page",
						error="user does not exist", next_page=next_page)
		else:
			expected_pw = redis_server.hget("user-" + get_un, "password").decode("utf-8")
			if get_pw == expected_pw:
				self.set_secure_cookie("user", get_un)
				self.redirect(next_page)
			else: 
				self.render("login.html", title="Login Page",
							error="password is wrong", next_page=next_page)


class LogoutHandler(BaseHandler):

    '''This handler clears the user cookie'''
    @tornado.web.authenticated
    def get(self):
        self.clear_cookie("user")
        self.redirect("/")


def make_app():
    '''this is the main application function'''
    app = Application([
        url(r"/", MainHandler),
        url(r"/test", TestHandler),
        url(r"/message", MessageHandler),
        url(r"/deletemessages", DeleteMessagesHandler),
        url(r"/user", UserHandler),
        url(r"/login", LoginHandler),
        url(r"/logout", LogoutHandler)
    ],
        template_path="templates",
        static_path="static",
        login_url="login",
        cookie_secret="ajfhafaj8r7w73d872")
    app.listen(8888)
    tornado.autoreload.start()
    tornado.autoreload.watch("static/main.js")	
    tornado.autoreload.watch("static/main.css")
    tornado.autoreload.watch("templates/")
    IOLoop.current().start()


if __name__ == "__main__":
    make_app()
