//�{�[�h�̔z�񂾂��͊O�֏o���B
var BoardArray = new Array(BOARD_ALL);
for(var i=0;i<BOARD_ALL;i++){
	BoardArray[i] = COLOR_NULL;
}
/*�Q�[���i�s�Ǘ��N���X*/
var GameProcessor = function(player_mode){
	//�N���X�ϐ���`
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
	  * private���\�b�h��`
	  *********************************/
	//�����邩�ۂ��̃`�F�L��
	var canPush = function(x,y){
		var color = getBoardColor(x,y);
		if(color == COLOR_OK){
			return null;
		}
		if(getBoardColor(x,y) != COLOR_NULL){
			return "�����ɂ͂��łɒu���Ă邶��Ȃ��ł����B";
		}
		if(y <= 0){
			return null;
		}
		return "���Ƀu���b�N�̒u���Ă���ꏊ�ɂ����u���܂���B";
	}
	//xy���W�ɑΉ�����{�[�h�̃C���f�b�N�X���擾
	var getBoardIndex = function(x,y){
		if(x >= 0 && x < BOARD_X && y >= 0 && y < BOARD_Y){
			return (y * BOARD_X) + x;
		}else{
			return -1;
		}
	}
	//�{�[�h�̐F���擾����B
	var getBoardColor = function(x,y){
		return BoardArray[getBoardIndex(x,y)];
	}
	//�{�^���������B���łɃ`�F�b�N�͂���Ă���̂��O��
	this.pushBoard = function(x,y,color){
		//�ő�XY�ύX
		this.MaxX = Math.max(x,this.MaxX);
		this.MinX = Math.min(x,this.MinX);
		this.MaxY = Math.max(y,this.MaxY);
		this.MinY = Math.min(y,this.MinY);
		//�\���E�����\���̕ύX
		BoardArray[getBoardIndex(x,y)] = color;
		setColorDisplay(x,y,color);
		if(y+1 < BOARD_Y){
			BoardArray[getBoardIndex(x,y+1)] = COLOR_OK;
			setColorDisplay(x,y+1,COLOR_OK);
		}
	}
	//���[�U�̏��������̃`�F�b�N
	var checkBoard = function(x,y,color,max_chain,player_mode){
		var chain = 0;
		//�S�����Ɍ���
		chain = Math.max(chain,searchBoard(x,y,color, 0, 1) + searchBoard(x,y,color, 0,-1) + 1);
		chain = Math.max(chain,searchBoard(x,y,color, 1, 0) + searchBoard(x,y,color,-1, 0) + 1);
		chain = Math.max(chain,searchBoard(x,y,color, 1, 1) + searchBoard(x,y,color,-1,-1) + 1);
		chain = Math.max(chain,searchBoard(x,y,color, 1,-1) + searchBoard(x,y,color,-1, 1) + 1);
		//�`�F�C���\����������
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
				msg += "�l��"
			}else if(player_mode == PLAYER_CODE_COM){
				msg += "COM"
			}
			return msg+"�@�̏����ł��B���߂łƂ��B";
		}
		return null;
	}
	//����
	var searchBoard = function(x,y,color,x_add,y_add){
		var chain = 0;
		while(x >= 0 && x < BOARD_X && y >= 0 && y < BOARD_Y){
			//�ǉ�����
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
	  * public���\�b�h��`
	  *********************************/

	//�Q�[���͂��łɏI�����Ă���H
	this.isExit = function(){
		return this.isExitFlag;
	}
	this.ExitGame = function(){
		this.isExitFlag = true;
	}

	//�v���C���͍�������H
	this.canPlayerPush = function(){
		//���łɏI����Ă���Ȃ�N���b�N�ł��Ȃ��B
		if(this.isExit()){
			return "���łɃQ�[���͏I�����Ă��܂��B";
		}
		//���̃^�[���̓v���C���H
		if(this.PlayerMode[this.NowTurn] != PLAYER_CODE_USER){
			return "�l�Ԃ̔Ԃł͂���܂���B";
		}
		return null;
	}
	//�v���C��������
	this.playerPush = function(x,y){
		var msg = this.canPlayerPush();
		if(msg != null){
			return msg;
		}
		//����
		return this.PushBtn(x,y,PLAYER_CODE_USER);
	}
	//�v���C���ECPU��킸�Ɏg�����\�b�h�^�Q�[���i�s�͎�ɂ����ōs���B
	this.PushBtn = function(x,y,player_code){
		//���i������̂��H
		if(this.PlayerMode[this.NowTurn] != player_code){
			return "�v���C���̃^�[���ł͂���܂���B";
		}
		//���łɏI����Ă���Ȃ�N���b�N�ł��Ȃ��B
		if(this.isExit()){
			return null;
		}
		/* �����邩�ۂ��̃`�F�b�N */
		var msg = canPush(x,y);
		if(msg != null){
			return msg;
		}
		/* ���ۂɉ����i�z������������A�Ֆʂ�����������j */
		msg = this.pushBoard(x,y,this.NowTurn);
		if(msg != null){
			return msg;
		}
		this.PushedButtonCnt++;
		if(this.PushedButtonCnt >= BOARD_ALL){
			//�Q�[���I���t���O
			this.isExitFlag = true;
			msg = "�G���A�������ς��ł��B�����u���܂���B";
			alert(msg);
			return msg;
		}
		/* �Q�[���N���A���ۂ����`�F�b�N */
		var plcode = this.PlayerMode[this.NowTurn];
		msg = checkBoard(x,y,this.NowTurn,this.PlayerMaxChain,plcode);
		if(msg != null){
			//�Q�[���I���t���O
			this.isExitFlag = true;
			var al_msg;
			if(this.NowTurn == COLOR_WHITE){
				al_msg = "��U/";
			}else if(this.NowTurn == COLOR_BLACK){
				al_msg = "��U/";
			}else{
				return null;
			}
			if(plcode == PLAYER_CODE_USER){
				al_msg += "�v���C��"
			}else if(plcode == PLAYER_CODE_COM){
				al_msg += "COM"
			}
			alert(al_msg+"�@�̏����ł��B���߂łƂ��B");
			return msg;
		}
		if(this.isExitFlag){
			return null;
		}
		/* �^�[���ύX */
		this.NowTurn *= -1;//�}�C�i�X�̊֌W�ɂȂ��Ă���B
		//�v���C���̎�ނŏ�����ς���
		var next_turn = this.PlayerMode[this.NowTurn];
		if(next_turn == PLAYER_CODE_USER){
			setStatus("���̃^�[���̃v���C���������Ă��������B");
			//���Ƃ̓C�x���g�쓮
		}else if(next_turn == PLAYER_CODE_COM){
			setStatus("���̃^�[���@COM�v�l��");
			this.startCOM();
		}else{
			setStatus("�����ȃ��[�U�ł��B�G���[��~");
			this.isExitFlag = true;
			return null;
		}
		setTurnInfo(this.PlayerMode,this.NowTurn);
		return null;
	}
	//COM�v�l�J�n
	this.startCOM = function(){
		var engine = this.ComEngine[this.NowTurn];
		if(engine == null){
			this.ComEngine[this.NowTurn] = new GameCPU(this,this.NowTurn);
			engine = this.ComEngine[this.NowTurn];
		}
		//�}���`�X���b�h�Ή�
		Concurrent.Thread.create(function(engine,max_chain,min_x,min_y,max_x,max_y){
			engine.search(BoardArray,max_chain,min_x,min_y,max_x,max_y);
		},engine,this.PlayerMaxChain,this.MinX,this.MinY,this.MaxX,this.MaxY);
	}
	/**********************************
	  * �R���X�g���N�^
	  *********************************/
	//�{�[�h�́i�\�����܂߂��j���Z�b�g
	for(var x=0;x<BOARD_X;x++){
		var idx = getBoardIndex(x,0);
		if(BoardArray[idx] != COLOR_OK){
			BoardArray[idx] = COLOR_OK;
			setColorDisplay(x,0,COLOR_OK);
		}
	}
	//�ŉ��i�ȊO�̓��Z�b�g
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
	//�X�e�[�^�X�\��
	setStatus("�Q�[�����J�n���܂����B");
	setTurnInfo(this.PlayerMode,this.NowTurn);
	setMaxChain(COLOR_WHITE,0);
	setMaxChain(COLOR_BLACK,0);
	//COM�̏ꍇ�͑����J�n
	var now_mode = this.PlayerMode[this.NowTurn];
	if(now_mode == PLAYER_CODE_COM){
		setStatus("COM�v�l�J�n");
		this.startCOM();
	}
}
