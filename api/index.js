const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

let rooms = {}; // { roomId: {players:[pid1,pid2], game, status} }

function genRoomId(){ return Math.random().toString(36).substring(2,7).toUpperCase(); }

function shuffle(a){ for(let i=a.length-1;i>0;i--){ let j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function createGameData(){
  const TYPES=['sha','dem','spd','cob'];
  const RANKS=[{id:1,power:7},{id:2,power:6},{id:3,power:5},{id:4,power:4},{id:5,power:3},{id:6,power:2},{id:7,power:1}];
  let deck=[];
  for(let t of TYPES) for(let r of RANKS) deck.push({type:t, rank:r.id, power:r.power, id:t+r.id, typeOrder:TYPES.indexOf(t)});
  shuffle(deck);
  let players=[[],[],[],[]];
  for(let i=0;i<28;i++) players[i%4].push(deck[i]);
  return {players, turn:0};
}

app.get('/', (req,res)=> res.send('EKASH Server Running'));

app.all('*', (req,res)=>{
  const {action, pid, roomId, code} = {...req.query, ...req.body};
  const id = roomId || code;

  // ===== النظام الجديد اللي يطلبه ملفك =====
  if(action==='findRoom'){
    if(!pid) return res.json({error:'no pid'});
    // هل اللاعب موجود من قبل؟
    for(let rid in rooms){
      if(rooms[rid].players.includes(pid)){
        return res.json({roomId: rid, count: rooms[rid].players.length, status: rooms[rid].status});
      }
    }
    // هل فيه غرفة منتظرة؟
    for(let rid in rooms){
      if(rooms[rid].status==='waiting' && rooms[rid].players.length < 2){
        rooms[rid].players.push(pid);
        if(rooms[rid].players.length >= 2){
          rooms[rid].status='start';
          rooms[rid].game = createGameData();
        }
        return res.json({roomId: rid, count: rooms[rid].players.length, status: rooms[rid].status});
      }
    }
    // انشئ غرفة جديدة
    let newId = genRoomId();
    rooms[newId] = {players:[pid], status:'waiting', game:null, created: Date.now()};
    return res.json({roomId: newId, count:1, status:'waiting'});
  }

  if(action==='checkRoom'){
    let room = rooms[id];
    if(!room) return res.json({count:0, status:'notfound'});
    if(room.players.length>=2 && !room.game){
      room.status='start';
      room.game = createGameData();
    }
    let mySeat = room.players.indexOf(pid);
    if(mySeat===-1) mySeat=0;
    return res.json({
      count: room.players.length,
      status: room.players.length>=2 ? 'start' : 'waiting',
      mySeat: mySeat,
      game: room.game
    });
  }

  // ===== النظام القديم للتوافق =====
  if(action==='create'){
    let c = genRoomId();
    rooms[c]={players:[pid||'p1'], status:'waiting', game:null};
    return res.json({ok:true, code:c, roomId:c});
  }
  if(action==='test') return res.json({ok:true, msg:'server ok'});
  
  return res.json({ok:true, msg:'EKASH Server Running', rooms: Object.keys(rooms).length});
});

module.exports = app;
