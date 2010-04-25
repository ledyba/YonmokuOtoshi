/*CPUのクラス*/
MAX_DEPTH = 3;

PAT_WALL = 0;
PAT_MY = 1;
PAT_ENEMY = 2;
PAT_OK = 3;
PAT_NULL = 4;
var GameCPU = function(game,color){
	//色
	this.Color = color;
	//ゲームエンジン
	this.Game = game;
	//盤面配列
	this.Board = new Array(BOARD_ALL);
	//盤面管理システム
	this.UndoStack = new Array(MAX_DEPTH);
	this.MaxChain = [];
	this.ChainStack = new Array(MAX_DEPTH);
	this.MinX;
	this.MaxX;
	this.MinY;
	this.MaxY;
	this.MinXStack = new Array(MAX_DEPTH);
	this.MaxXStack = new Array(MAX_DEPTH);
	this.MinYStack = new Array(MAX_DEPTH);
	this.MaxYStack = new Array(MAX_DEPTH);
	for(var i=0;i<MAX_DEPTH;i++){
		this.UndoStack[i] = new Pos();
		this.ChainStack[i] = [];
	}
	this.StackIndex = -1;
	/**
	  * Privateメソッド
	  */
	//xy座標に対応するボードのインデックスを取得
	var getBoardIndex = function(x,y){
		if(x >= 0 && x < BOARD_X && y >= 0 && y < BOARD_Y){
			return (y * BOARD_X) + x;
		}else{
			return -1;
		}
	}
	/**
	  * Publicメソッド
	  */
	//盤面を戻す
	this.UndoBoard = function(){
		if(this.StackIndex < 0){
			return;
		}
		var sidx = this.StackIndex;
		/* Undoスタック */
		var pos = this.UndoStack[sidx];
		var x = pos.getX();
		var y = pos.getY();
		if(y+1 < BOARD_Y){
			var new_idx = getBoardIndex(x,y+1);
			this.Board[new_idx] = COLOR_NULL;
		}
		this.Board[pos.getIdx()] = COLOR_OK;
		/* MaxChainスタック */
		var chain_stack = this.ChainStack[sidx];
		this.MaxChain[COLOR_WHITE] = chain_stack[COLOR_WHITE];
		this.MaxChain[COLOR_BLACK] = chain_stack[COLOR_BLACK];
		/* XYサイズ */
		//変更なし。スタックを戻すだけ。
		/* スタックインデックス */
		this.StackIndex--;
	}
	//ボードを押す
	this.PushBoard = function(x,y,idx,color){
		//Index増加
		this.StackIndex++;
		var sidx = this.StackIndex;
		/* Undoスタック */
		this.UndoStack[sidx].setPos(x,y,idx);
		//上段の可押フラグをセット
		if(y+1 < BOARD_Y){
			var new_idx = getBoardIndex(x,y+1);
			this.Board[new_idx] = COLOR_OK;
		}
		//盤面書き換え
		this.Board[idx] = color;
		/* MaxChainスタック */
		//最大チェインの退避
		var chain_stack = this.ChainStack[sidx];
		chain_stack[COLOR_WHITE] = this.MaxChain[COLOR_WHITE];
		chain_stack[COLOR_BLACK] = this.MaxChain[COLOR_BLACK];
		//最大XYサイズ書き換え
		if(this.StackIndex > 0){
			this.MinXStack[sidx] = Math.min(x,this.MinXStack[sidx-1]);
			this.MaxXStack[sidx] = Math.max(x,this.MaxXStack[sidx-1]);
			this.MinYStack[sidx] = Math.min(y,this.MinYStack[sidx-1]);
			this.MaxYStack[sidx] = Math.max(y,this.MaxYStack[sidx-1]);
		}else{
			this.MaxXStack[0] = Math.max(x,this.MaxX);
			this.MinXStack[0] = Math.min(x,this.MinX);
			this.MaxYStack[0] = Math.max(y,this.MaxY);
			this.MinYStack[0] = Math.min(y,this.MinY);
		}
		//最大チェイン書き換え
		this.checkBoard(x,y,color,this.MaxChain);
	}
	//このメソッドを呼び出してほしい。
	this.search = function(board,max_chain,min_xp,min_yp,max_xp,max_yp){
		//盤面のコピー
		for(var i=0;i<BOARD_ALL;i++){
			this.Board[i] = BoardArray[i];
		}
		//Stackのリセット
		this.StackIndex = -1;
		this.MaxChain[COLOR_WHITE] = max_chain[COLOR_WHITE];
		this.MaxChain[COLOR_BLACK] = max_chain[COLOR_BLACK];
		//最大、最小のセット
		this.MaxX = max_xp;
		this.MinX = min_xp;
		this.MaxY = max_yp;
		this.MinY = min_yp;
		//開始
		var max_x;
		var max_y;
		var max_ev = INTEGER_MIN-1;
/*
		var x;
		var y;
		var ev;
		var idx;
		for(x=0;x < BOARD_X;x++){
			for(y=0;y < BOARD_Y;y++){
				idx = getBoardIndex(x,y);
				if(	this.Board[idx] == COLOR_OK &&
					(y > 0 || Math.abs(this.Board[idx-1]) == 1 || Math.abs(this.Board[idx+1]) == 1)
				){
					//ボタンを押す
					this.PushBoard(x,y,idx,this.Color);
					//評価値を取得
					ev = this.negascout(MAX_DEPTH - 1,INTEGER_MIN,INTEGER_MAX,this.Color);
					console.debug("x:"+x+" y:"+y+" eval:"+ev);
					if(ev > max_ev){
						max_ev = ev;
						max_x = x;
						max_y = y;
					}
					//戻す
					this.UndoBoard();
				}
			}
		}
*/
		var color = this.Color;
		var alpha = INTEGER_MIN-1;
		var beta = INTEGER_MAX+1;
		var a = alpha;
		var b = beta;
		var x;
		var y;
		var ev;
		var idx;
		var not_first = false;
		var new_depth = MAX_DEPTH-1;

		/* ちょっと怪しいスタック操作。デバッグ用。 */
		//this.MaxXStack[0] = this.MaxX;
		//this.MinXStack[0] = this.MinX;
		//this.MaxYStack[0] = this.MaxY;
		//this.MinYStack[0] = this.MinY;
		//this.StackIndex = 0;
		//console.debug("now:"+this.eval(-color));
		this.StackIndex = -1;

		for(x=0;x < BOARD_X;x++){
			for(y=0;y < BOARD_Y;y++){
				idx = getBoardIndex(x,y);
				if(	this.Board[idx] == COLOR_OK &&
					(y > 0 || Math.abs(this.Board[getBoardIndex(x-1,y)]) == 1 || Math.abs(this.Board[getBoardIndex(x+1,y)]) == 1)
				){
					this.PushBoard(x,y,idx,color);
					ev = -this.negascout(new_depth,-b,-a,-color);
					if(ev > a && not_first && MAX_DEPTH >= 2){
						//最探索
						a = -this.negascout(new_depth,-beta,-ev,-color);
					}
					this.UndoBoard();
					a = Math.max(a,ev)
					//console.debug("x:"+x+" y:"+y+" eval:"+a+"("+this.MinXStack[this.StackIndex+1]+","+this.MaxXStack[this.StackIndex+1]+")"+"("+this.MinYStack[this.StackIndex+1]+","+this.MaxYStack[this.StackIndex+1]+")");
					if(a > max_ev){
						max_ev = a;
						max_x = x;
						max_y = y;
						//どうせ勝てるんだからもうどうでもいいだろ
						if(max_ev == INTEGER_MAX){
							//ループを抜ける
							x = BOARD_X;
							y = BOARD_Y;
						}
					}
					//新しいnull windowの設定
					b = a+1;
					not_first = true;
				}
			}
		}
		//押すところがない（＝平坦）ので、ランダムに決定。
		if(max_x == null || max_y == null){
			running = true;
			//すべてが塞がっていることはありえないはず…。
			while(running){
				max_x = Math.round(Math.random() * BOARD_X);
				for(var max_y=0;max_y<BOARD_Y;max_y++){
					idx = getBoardIndex(max_x,max_y);
					if(this.Board[idx] == COLOR_OK){
						running = false;
						break;
					}
				}
			}
		}
		//console.debug("push x:"+max_x+" y:"+max_y);
		var msg = this.Game.PushBtn(max_x,max_y,PLAYER_CODE_COM);
		if(msg != null){
			setStatus(msg);
		}
	}
	//NegaScout用メソッド
	this.negascout = function(limit,alpha,beta,color){
		if(this.MaxChain[color] >= 4){
			return INTEGER_MAX;
		}
		if(this.MaxChain[-color] >= 4){
			return INTEGER_MIN;
		}
		var ev = this.eval(color);
		if(limit <= 0 || ev == INTEGER_MAX || ev == INTEGER_MIN){
			return ev;
		}
		var a = alpha;
		var b = beta;
		var x;
		var y;
		var ev;
		var idx;
		var not_first = false;
		var new_depth = limit-1;
		for(x=0;x < BOARD_X;x++){
			for(y=0;y < BOARD_Y;y++){
				idx = getBoardIndex(x,y);
				if(	this.Board[idx] == COLOR_OK &&
					(y > 0 || Math.abs(this.Board[getBoardIndex(x-1,y)]) == 1 || Math.abs(this.Board[getBoardIndex(x+1,y)]) == 1)
				){
					this.PushBoard(x,y,idx,color);
					ev = -this.negascout(new_depth,-b,-a,-color);
					if(ev > a && ev < beta && not_first && limit >= 2){
						//最探索
						a = -this.negascout(new_depth,-beta,-ev,-color);
					}
					this.UndoBoard();
					a = Math.max(a,ev);
					if(a >= beta){
						//β狩り
						return a;
					}
					//新しいnull windowの設定
					b = a+1;
					not_first = true;
				}
			}
		}
		return a;
	}
	/* 評価関数 */
	//注意：これから打つ、という前提。
	this.MinWinCnt = 0;
	this.MinLoseCnt = 0;
	this.eval = function(color){
		this.MinWinCnt = INTEGER_MAX;
		this.MinLoseCnt = INTEGER_MAX;
		var ev;
		var ret = 0;
		var sidx = this.StackIndex;
		var x_start = this.MinXStack[sidx];
		var y_start = this.MinYStack[sidx];
		var x_end = this.MaxXStack[sidx];
		var y_end = this.MaxYStack[sidx];
		var x_size = x_end - x_start + 1;
		var y_size = y_end - y_start + 1;
		var xy_min = Math.min(x_size,y_size);
		var _min;
		for(var i=0;i<y_size;i++){
			ev = this.col(x_start,y_start+i,color,1, 0,x_size);
			if(ev == INTEGER_MAX || ev == INTEGER_MIN){return ev;}else{ret+=ev;}
			ev = this.col(x_start,y_start+i,color,1,-1,i+1);
			if(ev == INTEGER_MAX || ev == INTEGER_MIN){return ev;}else{ret+=ev;}
			ev = this.col(x_end-1,i,color,-1,-1,i+1);
			if(ev == INTEGER_MAX || ev == INTEGER_MIN){return ev;}else{ret+=ev;}
		}
		//下のi=0の時だけここで行う。
		ev = this.col(x_start,y_start,color,0, 1,y_size);
		if(ev == INTEGER_MAX || ev == INTEGER_MIN){return ev}else{ret+=ev}
		for(var i=1;i<x_size;i++){
			ev = this.col(x_start+i,y_start,color,0, 1,y_size);
			if(ev == INTEGER_MAX || ev == INTEGER_MIN){return ev}else{ret+=ev}
			_min = Math.min(xy_min,x_size - i);
			ev = this.col(x_start+i,y_end-1,color,1,-1,_min);
			if(ev == INTEGER_MAX || ev == INTEGER_MIN){return ev;}else{ret+=ev;}
			ev = this.col(x_start-i,y_end-1,color,-1,-1,_min);
			if(ev == INTEGER_MAX || ev == INTEGER_MIN){return ev;}else{ret+=ev;}
		}
		if(this.MinWinCnt > this.MinLoseCnt){
			return INTEGER_MIN;
		}else if(this.MinWinCnt < this.MinLoseCnt){
			return INTEGER_MAX;
		}else{
			return ret;
		}
	
	}
	this.col = function(x,y,my_color,x_add,y_add,length){
		if(length < 2){
			return 0;
		}
		var color = new Array(length+4);
		var ret = 0;
		var pat;
		var tmp;
		var win_cnt;
		var lose_cnt;
		x -= x_add << 1;
		y -= y_add << 1;
		for(var i=0;i<length+4;i++){
			switch(tmp = this.Board[getBoardIndex(x,y)]){
				case my_color:
					color[i] = PAT_MY;
					break;
				case -my_color:
					color[i] = PAT_ENEMY;
					break;
				case COLOR_WALL:
					color[i] = PAT_WALL;
					break;
				default:
					color[i] = tmp+1;
					break;
			}
			//変数に追加
			x+=x_add;
			y+=y_add;
		}
		for(var i=3;i<length+2;i++){
			/*自分のスコア*/
			if(color[i] == PAT_MY && color[i-1] == PAT_MY && color[i+1] != PAT_MY){//連続の終了を発見
				pat = 5*(5*(5*color[i-3]+color[i-2])+color[i+1])+color[i+2];
				tmp = SCORE_TABLE[pat];
				if((win_cnt = (tmp >> 16)) != 0){
					this.MinWinCnt = Math.min(this.MinWinCnt,win_cnt);
				}else{
					tmp -= INTEGER_MAX;
					if(tmp == INTEGER_MAX){
						return INTEGER_MAX;
					}
					ret += tmp;
				}
			}else if(color[i] == PAT_ENEMY && color[i-1] == PAT_ENEMY && color[i+1] != PAT_ENEMY){
				pat = 5*(5*(5*color[i-3]+color[i-2])+color[i+1])+color[i+2];
				tmp = ENEMY_SCORE_TABLE[pat];
				if((lose_cnt = (tmp >> 16)) != 0){
					this.MinLoseCnt = Math.min(this.MinLoseCnt,lose_cnt);
				}else{
					tmp -= INTEGER_MAX;
					if(tmp == INTEGER_MIN){
						return INTEGER_MIN;
					}
					ret += tmp;
				}
			}
		}
		return ret;
	}
	/* チェイン数チェック */
	this.checkBoard = function(x,y,color,max_chain){
		var chain = 0;
		//全方向に検索
		chain = Math.max(chain,this.searchBoard(x,y,color, 0, 1) + this.searchBoard(x,y,color, 0,-1) + 1);
		chain = Math.max(chain,this.searchBoard(x,y,color, 1, 0) + this.searchBoard(x,y,color,-1, 0) + 1);
		chain = Math.max(chain,this.searchBoard(x,y,color, 1, 1) + this.searchBoard(x,y,color,-1,-1) + 1);
		chain = Math.max(chain,this.searchBoard(x,y,color, 1,-1) + this.searchBoard(x,y,color,-1, 1) + 1);
		//チェイン数更新
		if(chain > max_chain[color]){
			max_chain[color] = chain;
		}
		return chain;
	}
	/* チェイン数チェックのための検索 */
	this.searchBoard = function(x,y,color,x_add,y_add){
		var chain = 0;
		while(x >= 0 && x < BOARD_X && y >= 0 && y < BOARD_Y){
			//追加処理
			x += x_add;
			y += y_add;
			//チェック
			if(this.Board[getBoardIndex(x,y)] != color){
				break;
			}
			chain++;
		}
		return chain;
	}
	/**
	  * コンストラクタ
	  */
	//特にする事がなくね？
}

var Pos = function(){
	this.X;
	this.Y;
	this.Idx;
	this.setPos = function(x,y,idx){
		this.X = x;
		this.Y = y;
		this.Idx = idx;
	}
	this.getX = function(){
		return this.X;
	}
	this.getY = function(){
		return this.Y;
	}
	this.getIdx = function(){
		return this.Idx;
	}
}

/* 辺のスコアテーブル */
SCORE_TABLE = [30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,60000,60000,60000,60000,60000,30000,30000,30000,30000,30000,60000,60000,60000,60000,60000,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,30020,30020,30020,30020,30020,60000,60000,60000,60000,60000,30020,30020,30020,30020,30020,30020,60000,30020,191072,30020,30010,30010,30010,30010,30010,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,191072,60000,60000,60000,60000,60000,60000,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,60000,60000,60000,60000,60000,30000,30000,30000,30000,30000,60000,60000,60000,60000,60000,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,30020,30020,30020,30020,30020,60000,60000,60000,60000,60000,30020,30020,30020,30020,30020,30020,60000,30020,191072,30020,30010,30010,30010,30010,30010,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,60000,60000,60000,60000,60000,30000,30000,30000,30000,30000,60000,60000,60000,60000,60000,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,30020,30020,30020,30020,30020,60000,60000,60000,60000,60000,30020,30020,30020,30020,30020,191072,191072,191072,191072,191072,30010,30010,30010,30010,30010,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,60000,60000,60000,60000,60000,30000,30000,30000,30000,30000,60000,60000,60000,60000,60000,30010,30010,30010,30010,30010,30000,30000,30000,30000,30000,30000,60000,30000,30000,30000,30000,30000,30000,30000,30000,30020,60000,30020,30020,30020,30010,30010,30010,30010,30010,30020,30020,30020,30020,30020,60000,60000,60000,60000,60000,30020,30020,30020,30020,30020,30020,60000,30020,191072,30020,30010,30010,30010,30010,30010,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,30010,60000,30010,30010,30010,30010,30010,30010,30010,30010,];
ENEMY_SCORE_TABLE = [30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,65536,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,65536,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,65536,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,65536,65536,65536,65536,65536,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,65536,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,65536,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,];
