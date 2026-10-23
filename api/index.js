const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({origin:'*'}));
app.use(express.json());

// نخلي الغرف في متغير عام يبقى أطول
if(!global.rooms) global.rooms = {};
let rooms = global.rooms;

function genRoomId(){ return Math.random().toString(36).substring(2,7).toUpperCase(); }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ let j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function createGameData(){
  const TYPES=['sha','dem','spd','cob'];
  const RANKS=[{id:1,power:7},{id:2,power:6},{id:3,power:5},{id:4,power:4},{id:5,power:3},{id:6,power:2},{id:7,power:1}];
  let deck=[]; for(let t of TYPES) for(let r of RANKS) deck.push({type:t, rank:r.id, power:r.power, id:t+r.id, typeOrder:TYPES.indexOf(t)});
  shuffle(deck);
  let players=[[],[],[],[]];
  for(let i=0;i<28;i++) players[i%4].push(deck[i]);
  return {players, turn:0};
}

app.all('*', (req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  const q = {...req.query, ...req.body};
  const action = q.action;
  const pid = q.pid;
  const id = q.roomId || q.code;

  // لمشاهدة الغرف
  if(action==='list'){ return res.json(rooms); }

  if(action==='findRoom'){
    if(!pid) return res.json({error:'no pid'});
    // نظف الغرف القديمة اكثر من 5 دقايق
    let now=Date.now();
    for(let rid in rooms){ if(now - rooms[rid].created > 300000) delete rooms[rid]; }

    for(let rid in rooms){
      if(rooms[rid].players.includes(pid)){
        return res.json({roomId: rid, count: rooms[rid].players.length, status: rooms[rid].status});
      }
    }
    for(let rid in rooms){
      if(rooms[rid].players.length===1 && rooms[rid].status==='waiting'){
        if(!rooms[rid].players.includes(pid)){
          rooms[rid].players.push(pid);
          rooms[rid].status='start';
          rooms[rid].game = createGameData();
          console.log("JOIN:", rid, rooms[rid].players);
          return res.json({roomId: rid, count: 2, status:'start'});
        }
      }
    }
    let newId = genRoomId();
    rooms[newId] = {players:[pid], status:'waiting', game:null, created: Date.now()};
    console.log("CREATE:", newId, pid);
    return res.json({roomId: newId, count:1, status:'waiting'});
  }

  if(action==='checkRoom'){
    let room = rooms[id];
    if(!room) return res.json({count:0, status:'notfound', allRooms: Object.keys(rooms)});
    if(room.players.length>=2 && !room.game){
      room.status='start'; room.game = createGameData();
    }
    let mySeat = room.players.indexOf(pid);
    return res.json({
      count: room.players.length,
      status: room.players.length>=2 ? 'start' : 'waiting',
      mySeat: mySeat>=0?mySeat:0,
      game: room.game,
      players: room.players
    });
  }

  if(action==='test') return res.json({ok:true, msg:'server ok', rooms: Object.keys(rooms).length});
  return res.json({ok:true, msg:'EKASH', rooms: Object.keys(rooms)});
});

module.exports = app;
