COLOR_WHITE = 1;
COLOR_BLACK = -1;
COLOR_WALL = undefined;
COLOR_NULL = 3;
COLOR_OK = 2;//押せる場合

PLAYER_CODE_USER = 1;
PLAYER_CODE_COM = 2;

BOARD_X = 20;
BOARD_Y = 20;
BOARD_ALL = BOARD_X * BOARD_Y;
BOARD_MIN = Math.min(BOARD_X,BOARD_Y);

COLOR_IMG_WHITE = "先攻<img src=\"white.png\" alt=\"先攻\" />";
COLOR_IMG_BLACK = "後攻<img src=\"black.png\" alt=\"後攻\" />";

INTEGER_MAX = 30000;
INTEGER_MIN = -30000;

var Game = null;

function clickArea(x,y){
	if(Game == null){
		setStatus("現在は操作できません。ゲームを開始してください。");
		return;
	}
	var msg = Game.playerPush(x,y);
	if(msg != null){
		setStatus(msg);
	}
}

//ゲーム開始
function startGame(radio){
	//すでに試合を始めている場合
	if(Game != null && !Game.isExit()){
		if(!confirm("ゲームをリセットして再度開始しますか？")){
			return;
		}
		Game.ExitGame();
	}
	//JSONパース開始
	var mode = null;
	for(var i=0;i<radio.length;i++){
		if(radio[i].checked == true){
			mode = radio[i].value;
		}
	}
	if(mode == null){
		setStatus("無効なゲームモードです。");
		return false;
	}
	try{
		mode = eval("("+mode+")");
	}catch(e){
		setStatus("JSONパースエラー："+e);
	}
	//やっとこさセット
	var white = mode["white"].toLowerCase();
	var black = mode["black"].toLowerCase();
	if(white == "user"){
		white = PLAYER_CODE_USER;
	}else if(white == "com"){
		white = PLAYER_CODE_COM;
	}else{
		setStatus("無効なプレイヤーコードです。");
		return false;
	}
	if(black == "user"){
		black = PLAYER_CODE_USER;
	}else if(black == "com"){
		black = PLAYER_CODE_COM;
	}else{
		setStatus("無効なプレイヤーコードです。");
		return false;
	}
	//オブジェクト生成
	var players = [];
	players[COLOR_WHITE]=white;
	players[COLOR_BLACK]=black;
	Game = new GameProcessor(players);
}

//Getter/Setter系
function setStatus(text){
	document.getElementById("game_status").innerHTML = text;
}
function setTurnInfo(player_mode,now_turn){
	var text;
	if(now_turn == COLOR_WHITE){
		text=COLOR_IMG_WHITE;
	}else if(now_turn == COLOR_BLACK){
		text=COLOR_IMG_BLACK;
	}else{
		return;
	}
	var p = player_mode[now_turn];
	if(p == PLAYER_CODE_USER){
		text += "人間";
	}else if(p == PLAYER_CODE_COM){
		text += "COM";
	}
	document.getElementById("game_turn_info").innerHTML = text;
}

function setColorDisplay(x,y,color){
	var cel = "t"+x+"-"+y;
	var img_src = "null.png";
	if(color == COLOR_WHITE){
		img_src = "white.png";
	}else if(color == COLOR_BLACK){
		img_src = "black.png";
	}else if(color == COLOR_OK){
		img_src = "available.png";
	}
	document.getElementById(cel).innerHTML = "<img src=\""+img_src+"\" alt=\"\" />";
}

function setMaxChain(color,chain){
	if(color == COLOR_WHITE){
		document.getElementById("game_white_max_chain").value = chain;
	}else if(color == COLOR_BLACK){
		document.getElementById("game_black_max_chain").value = chain;
	}
}
