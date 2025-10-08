const questions = [
    {
        question: "Who was the first man created by God?",
        options: ["Adam", "Noah", "Abraham", "Moses"],
        correct: "A",
        explanation: "According to Genesis 1:27, God created man in His own image, and the first man was Adam."
    },
    {
        question: "How many days did God take to create the world?",
        options: ["5", "6", "7", "8"],
        correct: "C",
        explanation: "Genesis 1 describes the creation in 6 days, and God rested on the 7th day."
    },
    {
        question: "Who built the ark to survive the flood?",
        options: ["Abraham", "Noah", "David", "Solomon"],
        correct: "B",
        explanation: "Noah was instructed by God to build the ark in Genesis 6-9."
    },
    {
        question: "What is the first book of the Bible?",
        options: ["Exodus", "Genesis", "Leviticus", "Numbers"],
        correct: "B",
        explanation: "Genesis is the first book of the Bible, detailing creation and early history."
    },
    {
        question: "Who led the Israelites out of Egypt?",
        options: ["Joshua", "David", "Moses", "Aaron"],
        correct: "C",
        explanation: "Moses, with God's help, led the Israelites out of Egypt in the book of Exodus."
    }
];

let currentQuestionIndex = 0;
let score = 0;

const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const resultContainer = document.getElementById('result-container');
const resultEl = document.getElementById('result');
const explanationEl = document.getElementById('explanation');
const nextBtn = document.getElementById('next-btn');
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const restartBtn = document.getElementById('restart-btn');
const questionContainer = document.getElementById('question-container');

function loadQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    questionEl.textContent = currentQuestion.question;
    const optionBtns = optionsEl.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, index) => {
        btn.textContent = currentQuestion.options[index];
        btn.dataset.option = String.fromCharCode(65 + index); // A, B, C, D
    });
    resultContainer.style.display = 'none';
    questionContainer.style.display = 'block';
}

function showResult(isCorrect, explanation) {
    questionContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    resultEl.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
    resultEl.style.color = isCorrect ? 'green' : 'red';
    explanationEl.textContent = explanation;
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showFinalScore();
    }
}

function showFinalScore() {
    questionContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    resultEl.textContent = `Quiz Complete! Your score: ${score}/${questions.length}`;
    explanationEl.textContent = '';
    nextBtn.style.display = 'none';
    restartBtn.style.display = 'block';
}

function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    scoreEl.textContent = score;
    totalEl.textContent = questions.length;
    nextBtn.style.display = 'block';
    restartBtn.style.display = 'none';
    loadQuestion();
}

optionsEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('option-btn')) {
        const selectedOption = e.target.dataset.option;
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedOption === currentQuestion.correct;
        if (isCorrect) {
            score++;
            scoreEl.textContent = score;
        }
        showResult(isCorrect, currentQuestion.explanation);
    }
});

nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartQuiz);

// Initialize
totalEl.textContent = questions.length;
loadQuestion();