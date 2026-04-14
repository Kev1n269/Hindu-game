from flask import Flask, render_template, redirect, url_for, request
from flask_socketio import SocketIO, emit, join_room, leave_room 
from threading import Lock
from itertools import count 

import os

app=Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')
#worksites
ids_lock={}
players=[]
game_started=False
buildings=[]
structures_rates={
    'farm': {'food': 3},
    'lumber': {'wood': 2},
    'quarry': {'stone': 3}, 
    'goldmine': {'gold': 1},
    'temple': {'devotion': 2},
}
building_costs = {
    'farm': {'wood': 50},
    'lumber': {'wood': 40, 'stone': 30},
    'quarry': {'wood': 70, 'stone': 20},
    'goldmine': {'gold': 100, 'stone': 40},
    'temple': {'stone': 100, 'wood': 150, 'gold': 50}
}

max_workers= {
    'farm': 5,
    'lumber': 5,
    'quarry':  5, 
    'goldmine': 5,
}

def get_id_lock(id):
    ids_lock.setdefault(id,Lock())
    return ids_lock[id]

def make_player(
    sid=None, 
    resources=None, 
    workers= 5, 
    worksites=None,
    is_ready=False, 
):
    if resources is None:
        resources={'wood': 100, 'stone': 20, 'food': 50, 'gold': 10}
    if worksites is None:
        worksites=[]

    return {
        'resources': resources,
        'workers': workers, 
        'worksites': worksites,
        'is_ready': is_ready, 
        'sid': sid
    }

def resource_loop():
    while True:
        socketio.sleep(1)
        if not game_started:
            continue

        for pid, player in enumerate(players):
            with get_id_lock(pid):
                changed = False
                for bid, exp in player['worksites']:
                    btype   = exp['type']
                    workers = exp['workers']
                    rates   = structures_rates.get(btype, {})

                    for resource, rate in rates.items():
                        gain = rate * workers
                        player['resources'][resource] = player['resources'].get(resource, 0) + gain
                        changed = True

                if changed and player['sid']:
                    socketio.emit(
                        'resource_update',
                        {'resources': player['resources']},
                        to=player['sid']
                    )

socketio.start_background_task(resource_loop)

@socketio.on('join_room')
def handle_join():
    join_room(1)
    id=len(players)
    with get_id_lock(id): 
        players.append(make_player(request.sid)) 
    emit('initialData', {'id': id, **players[id], 'buildings': buildings}, room=1)


@socketio.on('to_ready')
def handle_ready(id):
    global game_started
    players[id]['is_ready']=True
    if all(player['is_ready'] for player in players) :
        game_started=True
        emit('startGame', room=1)
        
@socketio.on('build')
def build(data):
    #data={id, type, tx, ty}
    btype=data['type'] 
    id=data['id']
    x=data['x']
    y=data['y']
    player=players[id]
    cost=building_costs.get(btype, {}) 
    with get_id_lock(id):
        for res, amount in cost.items():
            if player['resources'].get(res, 0) < amount:
                emit('build_error', {'reason': 'insufficient-resources'})
                return 
        for res, amount in cost.items():
            player['resources'][res]-=amount
    bid=len(buildings)
    building={'id': bid, 'type': btype, 'x': x, 'y':y, 'owner': id}
    buildings.append(building)
    emit('new-build', building, room=1)

@socketio.on('start_expetidion')
def handle_start_expetidion(data): 
    pid        = data['id']
    build_type = data['build_type']
    workers    = data['workers']

    if build_type not in structures_rates:
        emit('invalid-construction', {'reason': 'unknown type'})
        return

    player = players[pid]

    with get_id_lock(pid):
        # Procura worksite existente do mesmo tipo
        existing = next(
            (ws for ws in player['worksites'] if ws['type'] == build_type),
            None
        )

        if existing:
            existing['workers'] += workers          # soma nos workers existentes
        else:
            player['worksites'].append({
                'type':    build_type,
                'workers': workers,
            })

        player['workers'] -= workers

    emit('expedition-update', {'worksites': player['worksites']})
    
@app.route("/")
def index():
    return render_template("main.html") 

if __name__ ==  '__main__':
    socketio.run(app, debug=True, port=8080)