const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const nextBtn = document.getElementById('next-btn');
const installBtn = document.getElementById('install-btn');
const startScreen = document.getElementById('start-screen');
const questionScreen = document.getElementById('question-screen');
const resultScreen = document.getElementById('result-screen');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers');
const questionIndex = document.getElementById('question-index');
const scoreLabel = document.getElementById('score-label');
const resultSummary = document.getElementById('result-summary');
const questionCountSelect = document.getElementById('question-count');

let questions = [];
let currentIndex = 0;
let score = 0;
let selectedAnswer = null;
let deferredPrompt = null;

const operators = ['+', '-', '×', '÷'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildQuestion() {
  const a = randomInt(1, 12);
  const b = randomInt(1, 12);
  const op = operators[randomInt(0, operators.length - 1)];
  let question;
  let answer;

  switch (op) {
    case '+':
      question = `${a} + ${b}`;
      answer = a + b;
      break;
    case '-':
      question = `${Math.max(a, b)} - ${Math.min(a, b)}`;
      answer = Math.max(a, b) - Math.min(a, b);
      break;
    case '×':
      question = `${a} × ${b}`;
      answer = a * b;
      break;
    case '÷':
      const numerator = a * b;
      question = `${numerator} ÷ ${a}`;
      answer = b;
      break;
  }

  const choices = new Set([answer]);
  while (choices.size < 4) {
    const option = Math.max(0, answer + randomInt(-10, 10));
    choices.add(option);
  }

  const shuffled = Array.from(choices).sort(() => Math.random() - 0.5);
  return { question, answer, choices: shuffled };
}

function createQuestions(count) {
  return Array.from({ length: count }, () => buildQuestion());
}

function showPanel(panel) {
  [startScreen, questionScreen, resultScreen].forEach((el) => {
    el.classList.toggle('active', el === panel);
  });
}

function updateQuestion() {
  const current = questions[currentIndex];
  questionText.textContent = `What is ${current.question}?`;
  answersContainer.innerHTML = '';
  selectedAnswer = null;
  nextBtn.disabled = true;
  questionIndex.textContent = `${currentIndex + 1} / ${questions.length}`;
  scoreLabel.textContent = `Score: ${score}`;

  current.choices.forEach((choice) => {
    const button = document.createElement('button');
    button.className = 'answer-btn';
    button.textContent = choice;
    button.addEventListener('click', () => selectAnswer(button, choice));
    answersContainer.appendChild(button);
  });
}

function selectAnswer(button, choice) {
  if (selectedAnswer !== null) return;
  selectedAnswer = choice;

  Array.from(answersContainer.children).forEach((btn) => {
    btn.disabled = true;
    btn.classList.remove('selected');
  });

  button.classList.add('selected');
  nextBtn.disabled = false;
}

function revealAnswer() {
  const current = questions[currentIndex];
  const correctValue = current.answer;

  Array.from(answersContainer.children).forEach((btn) => {
    const value = Number(btn.textContent);
    btn.classList.remove('selected');
    if (value === correctValue) {
      btn.classList.add('correct');
    } else if (value === selectedAnswer) {
      btn.classList.add('wrong');
    }
  });

  if (selectedAnswer === correctValue) {
    score += 1;
  }

  scoreLabel.textContent = `Score: ${score}`;
}

function advanceQuestion() {
  revealAnswer();
  nextBtn.disabled = true;
  setTimeout(() => {
    currentIndex += 1;
    if (currentIndex >= questions.length) {
      showResults();
      return;
    }
    updateQuestion();
  }, 700);
}

function showResults() {
  resultSummary.textContent = `You scored ${score} out of ${questions.length}.`;
  showPanel(resultScreen);
}

function startQuiz() {
  const count = Number(questionCountSelect.value);
  questions = createQuestions(count);
  currentIndex = 0;
  score = 0;
  showPanel(questionScreen);
  updateQuestion();
}

startBtn.addEventListener('click', startQuiz);
retryBtn.addEventListener('click', () => showPanel(startScreen));
nextBtn.addEventListener('click', advanceQuestion);

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  if (result.outcome === 'accepted') {
    installBtn.classList.add('hidden');
  }
  deferredPrompt = null;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(console.error);
  });
}
