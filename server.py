from flask import Flask, render_template, redirect, url_for, request
from flask_socketio import SocketIO, emit, join_room, leave_room 
from threading import Lock
import os

app=Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

ids_lock={}

        
@app.route("/")
def index():
    return render_template("index.html") 

if __name__ ==  '__main__':
    socketio.run(app, debug=True, port=8080)