<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: *');
if($_SERVER['REQUEST_METHOD']=='OPTIONS') exit;

$roomsFile = __DIR__ . '/rooms.json';

// لو الملف مو موجود انشئه
if(!file_exists($roomsFile)){
  file_put_contents($roomsFile, '{}');
  chmod($roomsFile, 0777);
}

function loadRooms(){ global $roomsFile;
 $c=@file_get_contents($roomsFile);
 if(!$c) return [];
 $j=json_decode($c,true);
 return is_array($j)?$j:[];
}
function saveRooms($r){ global $roomsFile;
 $ok=file_put_contents($roomsFile, json_encode($r,JSON_UNESCAPED_UNICODE), LOCK_EX);
 if(!$ok){
   echo json_encode(['error'=>'cant_write','file'=>$roomsFile]);
   exit;
 }
}

$rooms=loadRooms();
$action=$_REQUEST['action']??'';

if($action=='test'){
 echo json_encode(['rooms'=>$rooms,'file_exists'=>file_exists($roomsFile),'writable'=>is_writable($roomsFile)]);
 exit;
}

if($action=='findRoom'){
 $pid=$_REQUEST['pid']??'test_'.rand();
 foreach($rooms as $id=>$rm){
   if($rm['status']=='waiting' && count($rm['players'])<2){
     if(!in_array($pid,$rm['players'])){
       $rooms[$id]['players'][]=$pid;
       $rooms[$id]['status']='ready';
     }
     saveRooms($rooms);
     echo json_encode(['status'=>'waiting','roomId'=>$id,'count'=>count($rooms[$id]['players'])],JSON_UNESCAPED_UNICODE); exit;
   }
 }
 $newId=substr(str_shuffle('ABCDEFG123456'),0,5);
 $rooms[$newId]=['created'=>time(),'players'=>[$pid],'status'=>'waiting'];
 saveRooms($rooms);
 echo json_encode(['status'=>'waiting','roomId'=>$newId,'count'=>1],JSON_UNESCAPED_UNICODE); exit;
}

if($action=='checkRoom'){
 $id=$_REQUEST['roomId']??''; $pid=$_REQUEST['pid']??'';
 if(!isset($rooms[$id])){ echo json_encode(['status'=>'waiting','count'=>1],JSON_UNESCAPED_UNICODE); exit; }
 $count=count($rooms[$id]['players']);
 if($count>=2){
   if(!isset($rooms[$id]['game'])){
     $rooms[$id]['seats']=[$rooms[$id]['players'][0], $rooms[$id]['players'][1], 'BOT_2','BOT_3'];
     $rooms[$id]['status']='playing';
     $rooms[$id]['game']=dealCardsPHP();
     saveRooms($rooms);
   }
   $mySeat=array_search($pid,$rooms[$id]['seats']); if($mySeat===false) $mySeat=0;
   echo json_encode(['status'=>'start','count'=>$count,'mySeat'=>$mySeat,'seats'=>$rooms[$id]['seats'],'game'=>$rooms[$id]['game']],JSON_UNESCAPED_UNICODE);
 }else{
   echo json_encode(['status'=>'waiting','count'=>$count],JSON_UNESCAPED_UNICODE);
 }
 exit;
}

function dealCardsPHP(){
 $types=['sha','dem','spd','cob']; $ranks=[1,2,3,4,5,6,7];
 $deck=[]; foreach($types as $ti=>$t){ foreach($ranks as $r){
   $power=8-$r; if($r==1)$power=7;
   $deck[]=['type'=>$t,'rank'=>$r,'power'=>$power,'id'=>$t.$r,'typeOrder'=>$ti];
 }}
 shuffle($deck);
 $players=[[],[],[],[]];
 for($i=0;$i<4;$i++) $players[$i]=array_slice($deck,$i*7,7);
 return ['players'=>$players,'turn'=>0];
}
?>
