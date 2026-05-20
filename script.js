// 激活码配置（5个随机字符串）
const VALID_CODES = [
    'TDEE8X2',
    'FIT4K9M',
    'HEALTH5P',
    'ENERGY3Q',
    'CALC7W1'
];

// 食物热效应比例（固定10%）
const TEF_RATE = 0.10;

// DOM元素
const activationOverlay = document.getElementById('activation-overlay');
const activationInput = document.getElementById('activation-code');
const activateBtn = document.getElementById('activate-btn');
const activationError = document.getElementById('activation-error');
const mainContent = document.getElementById('main-content');
const tdeeForm = document.getElementById('tdee-form');
const resultSection = document.getElementById('result-section');
const tdeeResult = document.getElementById('tdee-result');
const processContent = document.getElementById('process-content');
const resetBtn = document.getElementById('reset-btn');

// 检查激活状态
function checkActivation() {
    const isActivated = localStorage.getItem('tdee_activated');
    if (isActivated === 'true') {
        showMainContent();
    }
}

// 激活码验证
function validateActivationCode(code) {
    const upperCode = code.toUpperCase().trim();
    return VALID_CODES.includes(upperCode);
}

// 显示主内容
function showMainContent() {
    activationOverlay.classList.add('hidden');
    mainContent.classList.remove('hidden');
}

// 激活按钮点击事件
activateBtn.addEventListener('click', function() {
    const code = activationInput.value;

    if (!code.trim()) {
        activationError.textContent = '请输入激活码';
        return;
    }

    if (validateActivationCode(code)) {
        localStorage.setItem('tdee_activated', 'true');
        activationError.textContent = '';
        showMainContent();
    } else {
        activationError.textContent = '激活码无效，请重新输入';
        activationInput.value = '';
    }
});

// 回车键激活
activationInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        activateBtn.click();
    }
});

// 计算BMR - Mifflin-St Jeor公式
function calculateBMRMifflin(weight, height, age, gender) {
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
}

// 计算BMR - Harris-Benedict公式
function calculateBMRHarris(weight, height, age, gender) {
    if (gender === 'male') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
}

// 获取活动水平描述
function getActivityDescription(factor) {
    const descriptions = {
        '1.2': '久坐（几乎不运动）',
        '1.375': '轻度活动（每周运动1-3次）',
        '1.55': '中度活动（每周运动3-5次）',
        '1.725': '高度活动（每周运动6-7次）',
        '1.9': '极高活动（体力劳动或每天高强度训练）'
    };
    return descriptions[factor] || '未知';
}

// 计算TDEE并展示结果
function calculateTDEE(event) {
    event.preventDefault();

    // 获取表单数据
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const activityFactor = parseFloat(document.getElementById('activity-level').value);
    const formula = document.getElementById('formula').value;

    // 验证输入
    if (!age || !gender || !height || !weight || !activityFactor || !formula) {
        alert('请填写所有信息');
        return;
    }

    // 计算BMR
    let bmr, formulaName, formulaDetail;

    if (formula === 'mifflin') {
        bmr = calculateBMRMifflin(weight, height, age, gender);
        formulaName = 'Mifflin-St Jeor 公式';
        if (gender === 'male') {
            formulaDetail = `BMR = (10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) + 5`;
        } else {
            formulaDetail = `BMR = (10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) - 161`;
        }
    } else {
        bmr = calculateBMRHarris(weight, height, age, gender);
        formulaName = 'Harris-Benedict 公式';
        if (gender === 'male') {
            formulaDetail = `BMR = 88.362 + (13.397 × ${weight}) + (4.799 × ${height}) - (5.677 × ${age})`;
        } else {
            formulaDetail = `BMR = 447.593 + (9.247 × ${weight}) + (3.098 × ${height}) - (4.330 × ${age})`;
        }
    }

    // 计算各部分能量
    // 活动能量消耗 = BMR × (活动系数 - 1)
    const activityEnergy = bmr * (activityFactor - 1);

    // 活动后的能量消耗
    const energyWithActivity = bmr * activityFactor;

    // 食物热效应 = (BMR + 活动消耗) × 10%
    const tef = energyWithActivity * TEF_RATE;

    // 每日总能量消耗 TDEE
    const tdee = energyWithActivity + tef;

    // 显示结果
    tdeeResult.textContent = Math.round(tdee);

    // 生成计算过程
    const genderText = gender === 'male' ? '男' : '女';
    const activityDesc = getActivityDescription(activityFactor.toString());

    processContent.innerHTML = `
        <div class="process-step">
            <div class="step-title">第一步：计算基础代谢率 (BMR)</div>
            <div>使用${formulaName}</div>
            <div class="step-formula">${formulaDetail}</div>
            <div class="step-result">BMR = ${Math.round(bmr)} 卡路里/天</div>
        </div>

        <div class="process-step">
            <div class="step-title">第二步：计算活动能量消耗</div>
            <div>活动水平：${activityDesc}（系数 ${activityFactor}）</div>
            <div class="step-formula">活动消耗 = BMR × (活动系数 - 1) = ${Math.round(bmr)} × (${activityFactor} - 1)</div>
            <div class="step-result">活动消耗 = ${Math.round(activityEnergy)} 卡路里/天</div>
        </div>

        <div class="process-step">
            <div class="step-title">第三步：计算食物热效应 (TEF)</div>
            <div>食物热效应占总能量消耗的10%</div>
            <div class="step-formula">TEF = (BMR + 活动消耗) × 10% = (${Math.round(bmr)} + ${Math.round(activityEnergy)}) × 0.1</div>
            <div class="step-result">TEF = ${Math.round(tef)} 卡路里/天</div>
        </div>

        <div class="process-step">
            <div class="step-title">第四步：计算每日总能量消耗 (TDEE)</div>
            <div class="step-formula">TDEE = BMR + 活动消耗 + TEF</div>
            <div class="step-formula">TDEE = ${Math.round(bmr)} + ${Math.round(activityEnergy)} + ${Math.round(tef)}</div>
            <div class="step-result">TDEE = ${Math.round(tdee)} 卡路里/天</div>
        </div>
    `;

    // 显示结果区域
    resultSection.classList.remove('hidden');

    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// 表单提交事件
tdeeForm.addEventListener('submit', calculateTDEE);

// 重置按钮点击事件
resetBtn.addEventListener('click', function() {
    tdeeForm.reset();
    resultSection.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 页面加载时检查激活状态
document.addEventListener('DOMContentLoaded', checkActivation);
