//ボードの配列だけは外へ出す。
var BoardArray = new Array(BOARD_ALL);
for(var i=0;i<BOARD_ALL;i++){
	BoardArray[i] = COLOR_NULL;
}
/*ゲーム進行管理クラス*/
var GameProcessor = function(player_mode){
	//クラス変数定義
	this.isExitFlag = false;
	this.MaxChainWhite = 0;
	this.MaxChainBlack = 0;
	this.NowTurn = -1;
	this.PlayerMode = player_mode;
	this.PlayerMaxChain = [];
	this.PlayerMaxChain[COLOR_WHITE] = 0;
	this.PlayerMaxChain[COLOR_BLACK] = 0;
	this.PushedButtonCnt = 0;
	this.ComEngine = [];
	this.MinX = INTEGER_MAX;
	this.MaxX = INTEGER_MIN;
	this.MinY = INTEGER_MAX;
	this.MaxY = INTEGER_MIN;

	/**********************************
	  * privateメソッド定義
	  *********************************/
	//押せるか否かのチェキ☆
	var canPush = function(x,y){
		var color = getBoardColor(x,y);
		if(color == COLOR_OK){
			return null;
		}
		if(getBoardColor(x,y) != COLOR_NULL){
			return "そこにはすでに置いてるじゃないですか。";
		}
		if(y <= 0){
			return null;
		}
		return "下にブロックの置いてある場所にしか置けません。";
	}
	//xy座標に対応するボードのインデックスを取得
	var getBoardIndex = function(x,y){
		if(x >= 0 && x < BOARD_X && y >= 0 && y < BOARD_Y){
			return (y * BOARD_X) + x;
		}else{
			return -1;
		}
	}
	//ボードの色を取得する。
	var getBoardColor = function(x,y){
		return BoardArray[getBoardIndex(x,y)];
	}
	//ボタンを押す。すでにチェックはされているのが前提
	this.pushBoard = function(x,y,color){
		//最大XY変更
		this.MaxX = Math.max(x,this.MaxX);
		this.MinX = Math.min(x,this.MinX);
		this.MaxY = Math.max(y,this.MaxY);
		this.MinY = Math.min(y,this.MinY);
		//表示・内部表現の変更
		BoardArray[getBoardIndex(x,y)] = color;
		setColorDisplay(x,y,color);
		if(y+1 < BOARD_Y){
			BoardArray[getBoardIndex(x,y+1)] = COLOR_OK;
			setColorDisplay(x,y+1,COLOR_OK);
		}
	}
	//ユーザの勝ち負けのチェック
	var checkBoard = function(x,y,color,max_chain,player_mode){
		var chain = 0;
		//全方向に検索
		chain = Math.max(chain,searchBoard(x,y,color, 0, 1) + searchBoard(x,y,color, 0,-1) + 1);
		chain = Math.max(chain,searchBoard(x,y,color, 1, 0) + searchBoard(x,y,color,-1, 0) + 1);
		chain = Math.max(chain,searchBoard(x,y,color, 1, 1) + searchBoard(x,y,color,-1,-1) + 1);
		chain = Math.max(chain,searchBoard(x,y,color, 1,-1) + searchBoard(x,y,color,-1, 1) + 1);
		//チェイン表示書き換え
		if(chain > max_chain[color]){
			max_chain[color] = chain;
			setMaxChain(color,chain);
		}
		if(chain >= 4){
			var msg;
			if(color == COLOR_WHITE){
				msg = COLOR_IMG_WHITE;
			}else if(color == COLOR_BLACK){
				msg = COLOR_IMG_BLACK;
			}else{
				return null;
			}
			if(player_mode == PLAYER_CODE_USER){
				msg += "人間"
			}else if(player_mode == PLAYER_CODE_COM){
				msg += "COM"
			}
			return msg+"　の勝利です。おめでとう。";
		}
		return null;
	}
	//検索
	var searchBoard = function(x,y,color,x_add,y_add){
		var chain = 0;
		while(x >= 0 && x < BOARD_X && y >= 0 && y < BOARD_Y){
			//追加処理
			x += x_add;
			y += y_add;
			if(getBoardColor(x,y) != color){
				break;
			}
			chain++;
		}
		return chain;
	}
	/**********************************
	  * publicメソッド定義
	  *********************************/

	//ゲームはすでに終了している？
	this.isExit = function(){
		return this.isExitFlag;
	}
	this.ExitGame = function(){
		this.isExitFlag = true;
	}

	//プレイヤは今押せる？
	this.canPlayerPush = function(){
		//すでに終わっているならクリックできない。
		if(this.isExit()){
			return "すでにゲームは終了しています。";
		}
		//今のターンはプレイヤ？
		if(this.PlayerMode[this.NowTurn] != PLAYER_CODE_USER){
			return "人間の番ではありません。";
		}
		return null;
	}
	//プレイヤが押す
	this.playerPush = function(x,y){
		var msg = this.canPlayerPush();
		if(msg != null){
			return msg;
		}
		//押す
		return this.PushBtn(x,y,PLAYER_CODE_USER);
	}
	//プレイヤ・CPU問わずに使うメソッド／ゲーム進行は主にここで行う。
	this.PushBtn = function(x,y,player_code){
		//資格があるのか？
		if(this.PlayerMode[this.NowTurn] != player_code){
			return "プレイヤのターンではありません。";
		}
		//すでに終わっているならクリックできない。
		if(this.isExit()){
			return null;
		}
		/* 押せるか否かのチェック */
		var msg = canPush(x,y);
		if(msg != null){
			return msg;
		}
		/* 実際に押す（配列を書き換え、盤面も書き換える） */
		msg = this.pushBoard(x,y,this.NowTurn);
		if(msg != null){
			return msg;
		}
		this.PushedButtonCnt++;
		if(this.PushedButtonCnt >= BOARD_ALL){
			//ゲーム終了フラグ
			this.isExitFlag = true;
			msg = "エリアがいっぱいです。もう置けません。";
			alert(msg);
			return msg;
		}
		/* ゲームクリアか否かをチェック */
		var plcode = this.PlayerMode[this.NowTurn];
		msg = checkBoard(x,y,this.NowTurn,this.PlayerMaxChain,plcode);
		if(msg != null){
			//ゲーム終了フラグ
			this.isExitFlag = true;
			var al_msg;
			if(this.NowTurn == COLOR_WHITE){
				al_msg = "先攻/";
			}else if(this.NowTurn == COLOR_BLACK){
				al_msg = "後攻/";
			}else{
				return null;
			}
			if(plcode == PLAYER_CODE_USER){
				al_msg += "プレイヤ"
			}else if(plcode == PLAYER_CODE_COM){
				al_msg += "COM"
			}
			alert(al_msg+"　の勝利です。おめでとう。");
			return msg;
		}
		if(this.isExitFlag){
			return null;
		}
		/* ターン変更 */
		this.NowTurn *= -1;//マイナスの関係になっている。
		//プレイヤの種類で処理を変える
		var next_turn = this.PlayerMode[this.NowTurn];
		if(next_turn == PLAYER_CODE_USER){
			setStatus("次のターンのプレイヤが押してください。");
			//あとはイベント駆動
		}else if(next_turn == PLAYER_CODE_COM){
			setStatus("次のターン　COM思考中");
			this.startCOM();
		}else{
			setStatus("無効なユーザです。エラー停止");
			this.isExitFlag = true;
			return null;
		}
		setTurnInfo(this.PlayerMode,this.NowTurn);
		return null;
	}
	//COM思考開始
	this.startCOM = function(){
		var engine = this.ComEngine[this.NowTurn];
		if(engine == null){
			this.ComEngine[this.NowTurn] = new GameCPU(this,this.NowTurn);
			engine = this.ComEngine[this.NowTurn];
		}
		//マルチスレッド対応
		Concurrent.Thread.create(function(engine,max_chain,min_x,min_y,max_x,max_y){
			engine.search(BoardArray,max_chain,min_x,min_y,max_x,max_y);
		},engine,this.PlayerMaxChain,this.MinX,this.MinY,this.MaxX,this.MaxY);
	}
	/**********************************
	  * コンストラクタ
	  *********************************/
	//ボードの（表示も含めた）リセット
	for(var x=0;x<BOARD_X;x++){
		var idx = getBoardIndex(x,0);
		if(BoardArray[idx] != COLOR_OK){
			BoardArray[idx] = COLOR_OK;
			setColorDisplay(x,0,COLOR_OK);
		}
	}
	//最下段以外はリセット
	for(var x=0;x<BOARD_X;x++){
		for(var y=1;y<BOARD_Y;y++){
			var idx = getBoardIndex(x,y);
			if(BoardArray[idx] != COLOR_NULL){
				BoardArray[idx] = COLOR_NULL;
				setColorDisplay(x,y,COLOR_NULL);
			}
		}
	}
	this.NowTurn = COLOR_WHITE;
	//ステータス表示
	setStatus("ゲームを開始しました。");
	setTurnInfo(this.PlayerMode,this.NowTurn);
	setMaxChain(COLOR_WHITE,0);
	setMaxChain(COLOR_BLACK,0);
	//COMの場合は早速開始
	var now_mode = this.PlayerMode[this.NowTurn];
	if(now_mode == PLAYER_CODE_COM){
		setStatus("COM思考開始");
		this.startCOM();
	}
}
