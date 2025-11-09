// Interactive quiz with CSV download, random 4-question quiz, scoring and visual effects

// 預設題庫（可直接在此修改或改為載入外部檔案）
let questions = [
	{q: '台灣的首都是哪個城市？', choices: ['台北','台中','高雄','台南'], a:0, feedback:'台北是中華民國的首都（政府機關集中地）。'},
	{q: '水的沸點（攝氏）近似為？', choices: ['0','50','100','212'], a:2, feedback:'水在標準大氣壓下約在100°C沸騰。'},
	{q: '哪個行星被稱為紅色星球？', choices: ['金星','火星','木星','土星'], a:1, feedback:'火星因含氧化鐵表面呈紅色。'},
	{q: '光年是什麼單位？', choices: ['時間','長度','質量','亮度'], a:1, feedback:'光年是距離單位，光一年走過的距離。'},
	{q: '地球上最大的洋是？', choices: ['大西洋','印度洋','太平洋','北冰洋'], a:2, feedback:'太平洋是地球上最大、最深的洋。'},
	{q: '下列哪一項不是編程語言？', choices: ['Python','HTML','Java','C++'], a:1, feedback:'HTML 是標記語言，不算一般程式語言。'}
];

let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = 0;
let particles = [];

function setup(){
	createCanvas(windowWidth, windowHeight);
	// try to init UI listeners — DOM should be ready since script is after HTML, but ensure safety
	initUI();
}

function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
}

function draw(){
	// soft background for visual layer
	background(30, 110, 210, 40);

	// floating glows
	noStroke();
	fill(255,255,255,8);
	for(let i=0;i<3;i++) ellipse((frameCount*0.3 + i*200) % width, height*0.25 + sin(frameCount*0.02 + i)*40, 200 + i*80, 120 + i*40);

	// draw and update particles (confetti)
	for(let i = particles.length-1; i>=0; i--){
		particles[i].update();
		particles[i].draw();
		if(particles[i].life <= 0) particles.splice(i,1);
	}
}

function initUI(){
	const dl = document.getElementById('download-csv');
	const st = document.getElementById('start-quiz');
	const rs = document.getElementById('reset-quiz');
	if(dl) dl.onclick = downloadSampleCSV;
	if(st) st.onclick = startQuiz;
	if(rs) rs.onclick = resetQuiz;
}

function downloadSampleCSV(){
	let rows = ['question,choiceA,choiceB,choiceC,choiceD,answerIndex,feedback'];
	for(let it of questions){
		let c = it.choices.slice(0,4);
		while(c.length<4) c.push('');
		let line = [it.q, c[0], c[1], c[2], c[3], it.a, it.feedback].map(v=> '"'+String(v).replace(/"/g,'""')+'"').join(',');
		rows.push(line);
	}
	let csv = rows.join('\n');
	let blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
	let url = URL.createObjectURL(blob);
	let a = document.createElement('a');
	a.href = url; a.download = 'sample_questions.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function startQuiz(){
	if(!questions || questions.length === 0){
		alert('題庫為空，請先加入題目');
		return;
	}
	quizQuestions = shuffleArray(questions.slice()).slice(0,4);
	currentIndex = 0; score = 0; answered = 0;
	showQuestion(currentIndex);
}

function resetQuiz(){
	const area = document.getElementById('quiz-area');
	if(area) area.innerHTML = '';
	quizQuestions = []; currentIndex = 0; score = 0; answered = 0;
}

function showQuestion(idx){
	const area = document.getElementById('quiz-area');
	if(!area) return;
	area.innerHTML = '';
	if(!quizQuestions || idx >= quizQuestions.length){
		showResult(); return;
	}
	const q = quizQuestions[idx];
	const qDiv = document.createElement('div'); qDiv.className = 'question'; qDiv.textContent = `題目 ${idx+1}: ${q.q}`;
	area.appendChild(qDiv);

	const opts = document.createElement('div'); opts.className = 'options';
	for(let i=0;i<q.choices.length;i++){
		const b = document.createElement('button'); b.className = 'opt-btn'; b.textContent = q.choices[i] || '';
		b.onclick = ()=> handleAnswer(b, i, q.a, q.feedback);
		opts.appendChild(b);
	}
	area.appendChild(opts);

	const feedbackDiv = document.createElement('div'); feedbackDiv.className = 'feedback'; feedbackDiv.id = 'feedback'; area.appendChild(feedbackDiv);
}

function handleAnswer(btn, chosen, correct, feedbackText){
	const parent = btn.parentNode; const buttons = parent.querySelectorAll('button');
	buttons.forEach(b=> b.disabled = true);
	const fb = document.getElementById('feedback');
	if(chosen === correct){
		btn.classList.add('correct'); fb.textContent = '答對！ ' + (feedbackText || ''); score++; spawnParticles(mouseX, mouseY, true);
	} else {
		btn.classList.add('wrong'); fb.textContent = '答錯。' + (feedbackText || '') + `（正確：${buttons[correct] ? buttons[correct].textContent : ''}）`;
		if(buttons[correct]) buttons[correct].classList.add('correct'); spawnParticles(mouseX, mouseY, false);
	}
	answered++;
	setTimeout(()=>{ currentIndex++; showQuestion(currentIndex); }, 1100);
}

function showResult(){
	const area = document.getElementById('quiz-area'); if(!area) return;
	area.innerHTML = '';
	const box = document.createElement('div'); box.className = 'score-box'; box.innerHTML = `<div>你答對 ${score} / ${quizQuestions.length} 題</div>`;
	const msg = document.createElement('div'); let feedbackMsg = '';
	if(score === quizQuestions.length) feedbackMsg = '太棒了！全對！';
	else if(score >= 2) feedbackMsg = '不錯，還有進步空間！';
	else feedbackMsg = '加油，下次可再努力！';
	msg.textContent = feedbackMsg; box.appendChild(msg); area.appendChild(box);
	if(score >= 2){ for(let i=0;i<200;i++) spawnParticles(random(width), random(height/3), true); }
	else { for(let i=0;i<80;i++) spawnParticles(random(width), random(height/3), false); }
}

class Particle {
	constructor(x,y,good){ this.x = x; this.y = y; this.vx = random(-3,3); this.vy = random(-6,2); this.size = random(4,10); this.life = random(60,160); this.col = good ? color(random(80,200), random(160,255), random(80,200)) : color(random(200,255), random(90,140), random(90,140)); this.angle = random(TAU); }
	update(){ this.vy += 0.12; this.x += this.vx; this.y += this.vy; this.angle += 0.1; this.life -= 1; }
	draw(){ push(); translate(this.x, this.y); rotate(this.angle); noStroke(); fill(this.col); rectMode(CENTER); rect(0,0,this.size,this.size*0.6); pop(); }
}

function spawnParticles(x,y,good){ for(let i=0;i<12;i++) particles.push(new Particle(x + random(-8,8), y + random(-8,8), good)); }

function shuffleArray(arr){ for(let i = arr.length-1; i>0; i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

