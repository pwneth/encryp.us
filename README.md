Encrypted Chat with Python Tornado and Redis
=

Nice to haves:
--------------
 - emoji
 - add sounds

Planned Enhancements:
----------
 - add better encryption - multi-layer
 - add encryption to everything i.e. username, password, timestamp
 - add expiration to messages -- TTL
 - personal question to ask user upon entering for the first time --
   validated
 - change routing of urls
 - add otr with user to user chat

Necessary:
----------
 - ssl
 - nginx
 - docker?

Bugs:
-----
 - chrome window.pathname
 - messages not sending when live - memory issue?
  
Requirements:
-------------
 - Markdown==2.4.1
 - WTForms==2.0.1
 - certifi==14.05.14
 - heroku==0.1.4
 - livereload==2.2.1
 - passlib==1.6.2
 - pycrypto==2.6.1
 - python-dateutil==1.5
 - redis==2.10.1
 - requests==2.3.0
 - tornado==4.0
 - tornado-redis==2.4.18
 - torndb==0.2
 - wtforms-tornado==0.0.1
