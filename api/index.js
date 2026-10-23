const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

let rooms = {};
app.get('/', (req,res)=> res.send('EKASH Server Running'));

app.all('/', (req,res)=>{
  const {action,code,name,move} = {...req.query, ...req.body};
  if(action==='create'){
    const c = Math.random().toString(36).substring(2,7).toUpperCase();
    rooms[c]={p1:name,p2:null,m1:null,m2:null,status:'waiting'};
    return res.json({ok:true,code:c});
  }
  if(action==='join'){
    if(!rooms[code]) return res.json({ok:false,msg:'no room'});
    rooms[code].p2=name;
    rooms[code].status='playing';
    return res.json({ok:true});
  }
  if(action==='move'){
    if(!rooms[code]) return res.json({ok:false});
    if(rooms[code].p1===name) rooms[code].m1=move; else rooms[code].m2=move;
    return res.json({ok:true});
  }
  if(action==='get'){ return res.json(rooms[code]||{ok:false}); }
  if(action==='test'){ return res.json({ok:true,msg:'server ok'}); }
  return res.json({ok:true,rooms:Object.keys(rooms).length});
});

module.exports = app;
