
ScoreMax = 5**4;
ScoreArray = Array.new(ScoreMax,30000);
EnemyScoreArray = Array.new(ScoreMax,30000);

LoopIndex = Array.new(4,0);
def loops(limit,pat,score,max,array)
	if limit < 0
		pat_index = 5*(5*(5*LoopIndex[0]+LoopIndex[1])+LoopIndex[2])+LoopIndex[3];
		array[pat_index] = (max << 16) + score;
		pat_index = 5*(5*(5*LoopIndex[3]+LoopIndex[2])+LoopIndex[1])+LoopIndex[0];
		array[pat_index] = (max << 16) + score;
		return;
	end
	if pat[limit] == "*"
		for i in 0..4
			LoopIndex[limit] = i;
			loops(limit-1,pat,score,max,array);
		end
	elsif pat[limit] == "e"
		LoopIndex[limit] = 2;
		loops(limit-1,pat,score,max,array);
		LoopIndex[limit] = 0;
		loops(limit-1,pat,score,max,array);
	elsif pat[limit] == "n"
		LoopIndex[limit] = 3;
		loops(limit-1,pat,score,max,array);
		LoopIndex[limit] = 4;
		loops(limit-1,pat,score,max,array);
	else
		LoopIndex[limit] = pat[limit].to_i;
		loops(limit-1,pat,score,max,array);
	end
end

open("score.txt") {|file|
	begin
		while line = file.readline
			line.strip!;
			if line[0..0] == "#"
				next;
			elsif line.size <= 0
				next;
			end
			arr = line.split(":");
			pat = arr[0];
			friend_flag = pat[3..3] == "1";
			pat = [pat[0..0],pat[1..1],pat[4..4],pat[5..5]];
			arr = arr[1].split(",");
			if arr[0]=="MAX"
				score = 60000;
			elsif arr[0]=="MIN"
				score = 0;
			else
				score = arr[0].to_i+30000;
			end
			if arr[1] == nil
				max = 0;
			else
				max = (arr[1].to_i)-1;
			end
			if friend_flag
				loops(3,pat,score,max,ScoreArray);
			else
				loops(3,pat,score,max,EnemyScoreArray);
			end
		end
	rescue EOFError => e
	end
}

print "SCORE_TABLE = ["
for i in 0..ScoreMax-1
	print ScoreArray[i].to_s+","
end
puts "];"

print "ENEMY_SCORE_TABLE = ["
for i in 0..ScoreMax-1
	print EnemyScoreArray[i].to_s+","
end
puts "];"
