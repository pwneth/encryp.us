import base64
import json
from datetime import datetime, date
import redis
import tornadoredis
import tornadoredis.pubsub
import tornado.httputil
import tornado.autoreload
from tornado.ioloop import IOLoop
from tornado.concurrent import Future
from tornado.web import RequestHandler, Application, url
from passlib.apps import custom_app_context as pwd_context
from wtforms import Form, StringField, validators, PasswordField

redis_server = redis.Redis(host="localhost", decode_responses=True)
c = tornadoredis.Client()
c.connect()
message_futures = []


#create user validation
class CreateUser(Form):
    username = StringField('Username', [
        validators.DataRequired(message="Username required"), 
        validators.Regexp('^\w+$', message="Username must contain only letters, numbers, or underscores"),
        validators.Length(min=5, max=25, message="Username must be betwen 5 & 25 characters")
    ])

    password = PasswordField('New Password', [
        validators.DataRequired(message="Password required"), 
        validators.EqualTo('confirm', message='Passwords must match')
    ])

    confirm  = PasswordField('Repeat Password')


#create chat validation
class CreateChat(Form):
    chatname = StringField('Chat Name', [
        validators.Regexp('^\w+$', message="Chat name must contain only letters numbers or underscore"),
        validators.Length(min=5, max=25, message="Chat name must be betwen 5 & 25 characters")
    ])

# message object
class message(object):

    def __init__(self, msg):
        self.name = msg['name']
        self.time = msg['time']
        self.msg = msg['message']


#subscribe user to channel with pubsub and get message when sent
class MessageSubscriber(tornadoredis.pubsub.BaseSubscriber):

    def on_message(self, msg):
        if not msg:
            return
        if msg.kind == 'message' and msg.body:
            # Get the list of subscribers for this channel
            subscribers = list(self.subscribers[msg.channel].keys())
            if subscribers:
                # Use the first active subscriber/client connection
                # for broadcasting. Thanks to Jonas Hagstedt
                for s in subscribers:
                    s.render_now()
        super(MessageSubscriber, self).on_message(msg)

subscriber = MessageSubscriber(c)


# loads json data and append decrypted information to an array and return
# it for the templates to use
def append_messages(room):
    messages = []
    message_data = redis_server.lrange("chat-messages-" + room, "0", "-1")

    for f in message_data:
        messages.append(message(json.loads(f)))

    return messages

#function gets userlist and admin status of current_user
def user_list(room):
    user_list = []
    redis_user_list = redis_server.lrange("chat-users-" + room, "0", "-1")
    for user in redis_user_list:
        username = redis_server.hget("user-" + user, "username")
        user_list.append(username)

    return user_list

#check if someone is admin
def is_admin(current_user, room):
    admin_list = redis_server.lrange("user-admin-" + current_user, "0", "-1")
    if room in admin_list:
        return True
    else:
        return False

#this decorates a function allowing only admins
def only_admin(func):
    def wrapper(self, *args, **kwargs):
        if not is_admin(self.current_user.decode("utf-8"), self.get_argument("room")):
            return "404"
        return func(self, *args, **kwargs)
    return wrapper

#check if user is allowed in chat room
def is_allowed_in_chat(current_user, room):
    allowed_rooms = redis_server.lrange("user-rooms-" + current_user, "0", "-1")
    if room in allowed_rooms:
        return True
    else:
        return False

#this decorates functions allowing only approved users
def only_allowed_user(func):
    def wrapper(self, *args, **kwargs):
        if not is_allowed_in_chat(self.current_user.decode("utf-8"), self.get_argument("room")):
            return self.redirect("/")
        return func(self, *args, **kwargs)
    return wrapper



class BaseHandler(tornado.web.RequestHandler):

    '''BaseHandler checks that user cookie is set'''

    def get_current_user(self):
        return self.get_secure_cookie("user")

class StartHandler(BaseHandler):

    '''StartHandler lets you choose "Join Chat" or "Start a New Chat"'''

    def get(self):
        if self.current_user:
            self.render("start.html", title="Index", username=self.current_user)
        else:
            self.render("start.html", title="Index", username=None)

class MessageHandler(BaseHandler):

    '''MessageHandler handles each message'''
    @tornado.web.authenticated
    @tornado.web.asynchronous
    def post(self):
        self.room = self.get_argument("room")
        subscriber.subscribe("new-messages-" + self.room, self)

    def render_now(self):
        admin = is_admin(self.current_user.decode("utf-8"), self.room)
        users = user_list(self.room)
        self.render("home.html", 
                    title="Home Page",
                    username=self.current_user.decode("utf-8"), 
                    messages=append_messages(self.room), 
                    admin=admin, 
                    room=self.room, 
                    error=None,
                    users=users)
        subscriber.unsubscribe("new-messages-" + self.room, self)


class DeleteMessagesHandler(BaseHandler):

    '''DeleteMessagesHandler deletes all messages in the chat room'''
    @tornado.web.authenticated
    def post(self):
        room = self.get_argument("room")
        redis_server.ltrim("chat-messages-" + room, 1, 0)

class DeleteChatHandler(BaseHandler):

    '''DeleteChatHandler deletes a chat room if user is admin'''
    @tornado.web.authenticated
    def delete(self):
        room_to_delete = self.get_argument("chattodel")
        users_in_room = redis_server.lrange("chat-users-" + room_to_delete, "0", "-1")
        for user in users_in_room:
            redis_server.lrem("user-rooms-" + user, room_to_delete, "0")
            redis_server.lrem("user-admin-" + user, room_to_delete, "0")
        redis_server.delete("chat-messages-" + room_to_delete)
        redis_server.delete("chat-users-" + room_to_delete)


class JoinChatHandler(BaseHandler):

    '''JoinChatHandler is called when user wants a join a chat they are already invited to'''
    @tornado.web.authenticated
    def get(self):
        allowed_rooms = redis_server.lrange("user-rooms-" + self.current_user.decode("utf-8"), "0", "-1")
        admin_rooms = redis_server.lrange("user-admin-" + self.current_user.decode("utf-8"), "0", "-1")
        self.render("joinchat.html", 
                    title="Join Chat Room",
                    username=self.current_user, 
                    room_list=allowed_rooms,
                    admin_list=admin_rooms)

class StartChatHandler(BaseHandler):

    '''StartChatHandler is called when user wants to create a new chat room'''
    @tornado.web.authenticated
    def get(self):
        allowed_rooms = redis_server.lrange("user-rooms-" + self.current_user.decode("utf-8"), "0", "-1")
        admin_rooms = redis_server.lrange("user-admin-" + self.current_user.decode("utf-8"), "0", "-1")
        self.render("startchat.html", 
                    title="Start Chat Room",
                    username=self.current_user, 
                    room_list=allowed_rooms, 
                    error=None,
                    admin_list=admin_rooms)

    @tornado.web.authenticated
    def post(self):
        form = CreateChat()
        get_un = self.current_user
        form.chatname.data = self.get_argument("new_chat")
        existing_rooms = redis_server.keys("chat-messages-*")
        admin_rooms = redis_server.lrange("user-admin-" + self.current_user.decode("utf-8"), "0", "-1")

        if "chat-messages-" + form.chatname.data in existing_rooms:
            self.write(json.dumps({'errors': 'Room already exists'}))
        elif form.validate() == False:
            self.write(json.dumps({'errors': form.errors}))
        else:
            redis_server.rpush("user-rooms-" + get_un.decode("utf-8"), form.chatname.data)
            redis_server.rpush("user-admin-" + get_un.decode("utf-8"), form.chatname.data)
            redis_server.rpush("chat-users-" + form.chatname.data, get_un.decode("utf-8"))
            self.write(json.dumps({'new_chat': form.chatname.data, 'success': 'Chat Added to Your List!'}))


class ChatHandler(BaseHandler):

    '''ChatHandler shows the chat application @ home.html'''
    @tornado.web.authenticated
    @only_allowed_user
    def get(self):
        room = self.get_argument("room")
        admin = is_admin(self.current_user.decode("utf-8"), room)
        users = user_list(room)
        self.render("home.html", 
                    title="Home Page",
                    username=self.current_user.decode("utf-8"), 
                    messages=append_messages(room), 
                    admin=admin, 
                    room=room, 
                    error=None,
                    users=users)

    @tornado.web.authenticated
    @only_allowed_user
    def post(self):
        msg = self.get_argument("message")
        room = self.get_argument("room")
        time = datetime.now().strftime("%-I:%M %p")

        json_message = json.dumps({'name':self.current_user.decode("utf-8"), 'message':msg, 'time':time})
        redis_server.rpush("chat-messages-" + room, json_message)

        redis_server.publish("new-messages-" + room, msg)


class AccountHandler(BaseHandler):

    '''AccountHandler allows user to edit their user info / password'''
    @tornado.web.authenticated
    def post(self):
        self.render("test.html", 
                    title="Account Page", 
                    username=username, 
                    whatever=messages)


class UserHandler(BaseHandler):

    '''This is the handler that handles user creation and deletion'''
    @tornado.web.authenticated
    @only_admin
    def get(self):
        room = self.get_argument("room")
        users = user_list(room)
        self.write(json.dumps(users))

    @tornado.web.authenticated
    @only_admin 
    def post(self):
        get_un = self.get_argument("username")
        get_admin = self.get_argument("admin")
        room = self.get_argument("room")

        user_exists = redis_server.hget("user-" + get_un, "username")
        already_in_chat = redis_server.lrange("user-rooms-" + get_un, "0", "-1")

        if user_exists:
            if room in already_in_chat:
                self.write(json.dumps({'error': 'User already in chat'}))
            else:
                redis_server.rpush("user-rooms-" + get_un, room)
                redis_server.rpush("chat-users-" + room , get_un)
                if get_admin == "yes":
                    redis_server.rpush("user-admin-" + get_un , room)
                self.write(json.dumps({'user': get_un}))    

        else:
            self.write(json.dumps({'error': 'User does not exist'}))

    @tornado.web.authenticated
    @only_admin
    def delete(self):
        get_un = self.get_argument("usertodelete")
        room = self.get_argument("room")

        redis_server.lrem("user-rooms-" + get_un, room, num=0)
        redis_server.lrem("chat-users-" + room, get_un, num=0)


class LoginHandler(BaseHandler):

    '''This handler shows the login page if user is not logged in'''

    def get(self):
        next_page = self.get_argument("next", default="/")
        if self.current_user:
            self.redirect(next_page)
        else:
            self.render("login.html", 
                        title="Login Page",
                        error=None, 
                        next_page=next_page)

    # post will make sure that user and password combination are valid
    def post(self):
        get_pw = self.get_argument("password")
        get_un = self.get_argument("username")
        next_page = self.get_argument("next_page", default="/")

        if redis_server.hget("user-" + get_un, "password") is None:
            self.render("login.html", 
                        title="Login Page",
                        error="user does not exist", 
                        next_page=next_page)
        else:
            expected_pw_hashed = redis_server.hget("user-" + get_un, "password")
            verified_pw = pwd_context.verify(get_pw, expected_pw_hashed)
            if verified_pw:
                self.set_secure_cookie("user", get_un)
                self.redirect(next_page)
            else: 
                self.render("login.html", 
                            title="Login Page",
                            error="password is wrong", 
                            next_page=next_page)


class LogoutHandler(BaseHandler):

    '''This handler clears the user cookie'''
    @tornado.web.authenticated
    def get(self):
        self.clear_cookie("user")
        self.redirect("/")


class TestHandler(BaseHandler):

    def get(self):
        self.render("test.html", title="whatever", errors=None)

    def post(self):
        form = UsernameForm()
        form.username.data = self.get_argument("username")
        form.email.data = self.get_argument("email")
        if form.validate():
            self.render("test.html", title="whatever", errors="no errors!")
        else:
            self.render("test.html", title="whatever", errors=form.errors)


class CreateAccountHandler(BaseHandler):

    '''This handler allows users to be created'''
    def get(self):
        self.render("createaccount.html", title="Create Account", errors=None)

    def post(self):
        form = CreateUser()
        form.username.data = self.get_argument("username")
        form.password.data = self.get_argument("password")
        form.confirm.data = self.get_argument("confirm")

        if redis_server.hget("user-" + form.username.data, "password"):
            self.write(json.dumps({'errors': 'User name already taken'}))
        elif form.validate() == False: 
            errors = form.errors
            self.write(json.dumps({'errors': form.errors}))
        else:
            hashed_pw = pwd_context.encrypt(form.password.data)
            redis_server.hmset("user-" + form.username.data, {"username":form.username.data, "password":hashed_pw})
            self.set_secure_cookie("user", form.username.data)
            self.write(json.dumps({'redirect': '/startchat'}))


def make_app():
    '''this is the main application function'''
    app = Application([
        url(r"/", StartHandler),
        url(r"/chat", ChatHandler),
        url(r"/joinchat", JoinChatHandler),
        url(r"/deletechat", DeleteChatHandler),
        url(r"/startchat", StartChatHandler),
        url(r"/test", TestHandler),
        url(r"/message", MessageHandler),
        url(r"/deletemessages", DeleteMessagesHandler),
        url(r"/user", UserHandler),
        url(r"/createaccount", CreateAccountHandler),
        url(r"/login", LoginHandler),
        url(r"/logout", LogoutHandler)
    ],
        template_path="templates",
        static_path="static",
        login_url="login",
        cookie_secret="ajfhafaj8r7w73d872",
        debug=True)
    app.listen(8888)
    IOLoop.current().start()
    tornado.autoreload.start()


if __name__ == "__main__":
    make_app()
