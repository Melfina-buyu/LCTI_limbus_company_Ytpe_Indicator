// 特质定义
const TRAITS = {
    1: { name: "暴食", unit: 1, color: "#ff6b6b" },
    10: { name: "暴怒", unit: 10, color: "#ffa726" },
    100: { name: "傲慢", unit: 100, color: "#ffd54f" },
    1000: { name: "欲望", unit: 1000, color: "#4ecdc4" },
    10000: { name: "忧郁", unit: 10000, color: "#6c63ff" },
    100000: { name: "嫉妒", unit: 100000, color: "#ff6b9d" }
};

// 全局状态
let questions = [];
let questionsLoaded = false;
let currentQuestion = 0;
let userAnswers = [];
let totalScore = 0;
let traitScores = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };
let normalizedTraitScores = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };

// 结果配置（从 result.json 加载）
let resultConfig = null;

// DOM 元素
const homePage = document.getElementById('home-page');
const quizPage = document.getElementById('quiz-page');
const resultPage = document.getElementById('result-page');
const progressBar = document.getElementById('progress-bar');
const currentQuestionSpan = document.getElementById('current-question');
const questionNumSpan = document.getElementById('question-num');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const totalScoreElement = document.getElementById('total-score');
const traitsGrid = document.getElementById('traits-grid');
const chartElement = document.getElementById('chart');
const personalityTypeElement = document.getElementById('personality-type');
const personalityDescriptionElement = document.getElementById('personality-description');
const personalityImage = document.getElementById('personality-image');
const imageContainer = document.getElementById('personality-image-container');

// ---------- 加载结果配置 ----------
async function loadResultConfig() {
    if (resultConfig) return resultConfig;
    const response = await fetch('result.json');
    if (!response.ok) throw new Error(`结果配置加载失败 (HTTP ${response.status})`);
    resultConfig = await response.json();
    return resultConfig;
}

// ---------- 页面导航 ----------
function backToHome() {
    quizPage.style.display = 'none';
    homePage.style.display = 'block';
    resultPage.style.display = 'none';
}

async function startTest() {
    resultPage.style.display = 'none';
    quizPage.style.display = 'block';
    homePage.style.display = 'none';
    
    if (!questionsLoaded) {
        questionText.textContent = '加载题目中，请稍候...';
        optionsContainer.innerHTML = '';
        try {
            const response = await fetch('questions.json');
            if (!response.ok) throw new Error('题目加载失败');
            questions = await response.json();
            questionsLoaded = true;
        } catch (error) {
            alert('题目加载失败，请刷新页面重试。');
            backToHome();
            return;
        }
    }
    
    currentQuestion = 0;
    userAnswers = new Array(questions.length).fill(null);
    totalScore = 0;
    traitScores = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };
    normalizedTraitScores = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };
    
    showQuestion(currentQuestion);
}

function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
    }
}

function nextQuestion() {
    if (userAnswers[currentQuestion] === null) {
        alert('请选择一个选项');
        return;
    }
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion(currentQuestion);
    }
}

async function showResult() {
    if (userAnswers[currentQuestion] === null) {
        alert('请选择一个选项');
        return;
    }
    calculateScores();
    await displayResult();
    quizPage.style.display = 'none';
    resultPage.style.display = 'block';
}

function restartTest() {
    quizPage.style.display = 'block';
    resultPage.style.display = 'none';
    homePage.style.display = 'none';
    currentQuestion = 0;
    userAnswers = new Array(questions.length).fill(null);
    totalScore = 0;
    traitScores = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };
    normalizedTraitScores = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };
    showQuestion(currentQuestion);
}

// ---------- 答题界面渲染 ----------
function showQuestion(index) {
    const q = questions[index];
    questionNumSpan.textContent = index + 1;
    currentQuestionSpan.textContent = index + 1;
    questionText.textContent = q.text;
    
    const progress = ((index + 1) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    optionsContainer.innerHTML = '';
    q.options.forEach((option, optIndex) => {
        const optDiv = document.createElement('div');
        optDiv.className = 'option' + (userAnswers[index] === optIndex ? ' selected' : '');
        optDiv.innerHTML = `
            <div class="option-radio"></div>
            <div class="option-text">${option.text}</div>
        `;
        optDiv.addEventListener('click', () => selectOption(index, optIndex));
        optionsContainer.appendChild(optDiv);
    });
    
    prevBtn.style.display = index === 0 ? 'none' : 'block';
    if (index === questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function selectOption(qIndex, optIndex) {
    userAnswers[qIndex] = optIndex;
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach((opt, idx) => {
        opt.classList.toggle('selected', idx === optIndex);
    });
}

// ---------- 分数计算 ----------
function calculateScores() {
    totalScore = 0;
    traitScores = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };
    normalizedTraitScores = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };
    
    const traitMaxValues = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };
    
    questions.forEach((q, idx) => {
        const ans = userAnswers[idx];
        if (ans === null) return;
        const val = q.options[ans].value;
        totalScore += val;
        
        Object.keys(traitScores).forEach(trait => {
            const tNum = parseInt(trait);
            if (val % (tNum * 10) >= tNum) {
                traitScores[tNum] += tNum;
                normalizedTraitScores[tNum] += 1;
            }
        });
        
        let maxForQ = { 1:0, 10:0, 100:0, 1000:0, 10000:0, 100000:0 };
        q.options.forEach(opt => {
            Object.keys(maxForQ).forEach(trait => {
                const tNum = parseInt(trait);
                if (opt.value % (tNum * 10) >= tNum) maxForQ[tNum] = 1;
            });
        });
        Object.keys(traitMaxValues).forEach(trait => {
            traitMaxValues[trait] += maxForQ[trait];
        });
    });
    
    const activeTraits = {};
    Object.keys(normalizedTraitScores).forEach(trait => {
        const tNum = parseInt(trait);
        activeTraits[tNum] = normalizedTraitScores[tNum] >= (traitMaxValues[tNum] / 3);
    });
    return activeTraits;
}

// ---------- 渲染结果（完全依赖 result.json） ----------
async function displayResult() {
    const activeTraits = calculateScores();
    quizPage.style.display = 'none';
    
    totalScoreElement.textContent = totalScore;
    renderTraitsGrid(activeTraits);
    renderChart();
    
    const config = await loadResultConfig();
    
    // 获取活跃特质名称（按单位排序保证复合类型键的一致性）
    const activeNames = Object.keys(activeTraits)
        .filter(k => activeTraits[k])
        .map(k => TRAITS[k].name)
        .sort((a, b) => {
            const order = { "暴食":1, "暴怒":10, "傲慢":100, "欲望":1000, "忧郁":10000, "嫉妒":100000 };
            return order[a] - order[b];
        });
    
    // 1. 特殊条件优先（总分0等）
    const special = config.specialCases?.find(c => 
        c.condition && c.condition.totalScore === totalScore
    );
    
    let personalityType, description, imageUrl;
    
    if (special) {
        personalityType = special.type;
        description = special.description;
        imageUrl = special.image;
        personalityTypeElement.classList.add("special-type");
    } else {
        personalityTypeElement.classList.remove("special-type");
        
        if (activeNames.length === 0) {
            // 均衡型
            personalityType = config.default.type;
            description = config.default.description;
            imageUrl = config.default.image;
        } else if (activeNames.length === 1) {
            // 单一主导型
            const traitName = activeNames[0];
            personalityType = `${traitName}主导型`;
            description = config.singleTraitDescriptions[traitName] || 
                          `你具有明显的${traitName}特质。`;
            imageUrl = config.imageMapping[personalityType] || config.default.image;
        } else {
            // 复合型
            const compositeKey = activeNames.join('+');
            personalityType = `${compositeKey}复合型`;
            description = config.compositeDescriptions[compositeKey] || 
                          `你的人格是${activeNames.join('和')}的复合型。`;
            imageUrl = config.imageMapping[personalityType] || config.default.image;
        }
    }
    
    personalityTypeElement.textContent = personalityType;
    personalityDescriptionElement.textContent = description;
    
    if (imageUrl) {
        personalityImage.src = imageUrl;
        personalityImage.alt = `${personalityType} 人格类型图片`;
        imageContainer.style.display = 'block';
        personalityImage.onerror = () => { 
            personalityImage.src = config.default.image; 
        };
    } else {
        imageContainer.style.display = 'none';
    }
}

function renderTraitsGrid(activeTraits) {
    traitsGrid.innerHTML = '';
    Object.keys(TRAITS).forEach(traitKey => {
        const trait = TRAITS[traitKey];
        const tNum = parseInt(traitKey);
        const isActive = activeTraits[tNum];
        const normScore = normalizedTraitScores[tNum];
        
        const item = document.createElement('div');
        item.className = `trait-item ${isActive ? 'active' : ''}`;
        item.innerHTML = `
            <div class="trait-name">${trait.name}</div>
            <div class="trait-value">出现次数: ${normScore}</div>
            <div class="trait-normalized">原始得分: ${traitScores[tNum]}</div>
            <div>${isActive ? '✓ 显著' : '○ 不显著'}</div>
        `;
        traitsGrid.appendChild(item);
    });
}

function renderChart() {
    chartElement.innerHTML = '';
    const maxNorm = Math.max(...Object.values(normalizedTraitScores), 1);
    Object.keys(TRAITS).forEach(traitKey => {
        const trait = TRAITS[traitKey];
        const tNum = parseInt(traitKey);
        const score = normalizedTraitScores[tNum];
        const height = (score / maxNorm) * 220;
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${height}px`;
        bar.style.background = `linear-gradient(to top, ${trait.color}, ${trait.color}99)`;
        bar.innerHTML = `
            <div class="bar-value">${score}</div>
            <div class="bar-label">${trait.name}</div>
        `;
        chartElement.appendChild(bar);
    });
}

// 移除连接遮罩（若存在）
function removeConnectMask() {
    const mask = document.getElementById('connection-mask');
    if (mask) mask.remove();
}

function onAllResourcesLoaded(callback) {
    if (document.readyState === 'complete') {
        callback();
    } else {
        window.addEventListener('load', callback);
    }
}

onAllResourcesLoaded(removeConnectMask);