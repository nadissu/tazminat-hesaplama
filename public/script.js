// Kıdem ve İhbar Tazminatı Hesaplama JavaScript

// 2026 Kıdem Tazminatı Tavanı (1 Ocak - 30 Haziran 2026)
const SEVERANCE_CAP = 47804.40;

// İhbar süreleri (gün olarak)
const NOTICE_PERIODS = [
    { maxMonths: 6, days: 14 },      // 0-6 ay: 2 hafta
    { maxMonths: 18, days: 28 },     // 6-18 ay: 4 hafta
    { maxMonths: 36, days: 42 },     // 18-36 ay: 6 hafta
    { maxMonths: Infinity, days: 56 } // 36+ ay: 8 hafta
];

// Kıdem tazminatı hak eden nedenler
const SEVERANCE_ELIGIBLE_REASONS = [
    'employer_termination',
    'resignation_valid',
    'retirement',
    'military',
    'marriage_female',
    'health',
    'death'
];

// İhbar tazminatı hak eden nedenler
const NOTICE_ELIGIBLE_REASONS = [
    'employer_termination'
];

// DOM Elements
const form = document.getElementById('calculatorForm');
const resultsCard = document.getElementById('resultsCard');
const noticeGroup = document.getElementById('noticeGroup');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setDefaultDates();
    setupEventListeners();
});

// Set default dates
function setDefaultDates() {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    document.getElementById('endDate').value = formatDate(today);
    document.getElementById('startDate').value = formatDate(oneYearAgo);
}

// Setup event listeners
function setupEventListeners() {
    form.addEventListener('submit', handleSubmit);

    // Show/hide notice question based on termination reason
    document.getElementById('terminationReason').addEventListener('change', (e) => {
        const reason = e.target.value;
        if (NOTICE_ELIGIBLE_REASONS.includes(reason)) {
            noticeGroup.style.display = 'block';
        } else {
            noticeGroup.style.display = 'none';
        }
    });

    // Format salary input with thousand separators
    document.getElementById('grossSalary').addEventListener('input', (e) => {
        formatNumberInput(e.target);
    });

    document.getElementById('additionalIncome').addEventListener('input', (e) => {
        formatNumberInput(e.target);
    });

    // Toggle cap info box
    document.getElementById('capInfoToggle').addEventListener('click', () => {
        const infoBox = document.getElementById('capInfoBox');
        infoBox.classList.toggle('visible');
    });
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();

    // Get form values
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const grossSalary = parseFormattedNumber(document.getElementById('grossSalary').value);
    const additionalIncome = parseFormattedNumber(document.getElementById('additionalIncome').value);
    const terminationReason = document.getElementById('terminationReason').value;
    const noticeGiven = document.querySelector('input[name="noticeGiven"]:checked').value === 'yes';
    const applyCap = document.getElementById('applyCap').checked;

    // Validate
    if (!terminationReason) {
        alert('Lütfen işten ayrılma nedenini seçiniz.');
        return;
    }

    if (startDate >= endDate) {
        alert('İşe giriş tarihi, işten çıkış tarihinden önce olmalıdır.');
        return;
    }

    if (grossSalary <= 0) {
        alert('Lütfen geçerli bir brüt maaş giriniz.');
        return;
    }

    // Calculate
    const result = calculateSeverance({
        startDate,
        endDate,
        grossSalary,
        additionalIncome,
        terminationReason,
        noticeGiven,
        applyCap
    });

    // Display results
    displayResults(result);
}

// Calculate severance and notice pay
function calculateSeverance({ startDate, endDate, grossSalary, additionalIncome, terminationReason, noticeGiven, applyCap }) {
    // Calculate work duration
    const workDuration = calculateWorkDuration(startDate, endDate);

    // Total monthly income (gross salary + additional income)
    const totalMonthlyIncome = grossSalary + additionalIncome;

    // Apply severance cap only if applyCap is true
    const cappedMonthlyIncome = applyCap ? Math.min(totalMonthlyIncome, SEVERANCE_CAP) : totalMonthlyIncome;
    const isCapApplied = applyCap && totalMonthlyIncome > SEVERANCE_CAP;

    // Daily wage (for ihbar, use capped if cap is applied)
    const dailyWage = cappedMonthlyIncome / 30;

    // Severance pay calculation
    let severancePay = 0;
    let severanceNote = '';
    let isSeveranceEligible = SEVERANCE_ELIGIBLE_REASONS.includes(terminationReason);

    if (isSeveranceEligible) {
        if (workDuration.totalDays >= 365) {
            // Calculate years worked (including partial years)
            const yearsWorked = workDuration.totalDays / 365;
            severancePay = yearsWorked * cappedMonthlyIncome;

            if (isCapApplied) {
                severanceNote = `⚖️ Yasal tavan uygulandı. Gerçek maaşınız: ${formatCurrency(totalMonthlyIncome)}`;
            } else if (!applyCap && totalMonthlyIncome > SEVERANCE_CAP) {
                severanceNote = `💡 Tavansız hesaplama. Yasal tavan: ${formatCurrency(SEVERANCE_CAP)}`;
            }
        } else {
            severanceNote = '1 yıldan az çalışma süresi - Kıdem tazminatı hakkı yoktur.';
        }
    } else {
        severanceNote = 'Bu ayrılma nedeni kıdem tazminatı hakkı doğurmaz.';
    }

    // Notice pay calculation
    let noticePay = 0;
    let noticeNote = '';
    let isNoticeEligible = NOTICE_ELIGIBLE_REASONS.includes(terminationReason);

    if (isNoticeEligible && !noticeGiven) {
        const noticeDays = getNoticePeriodDays(workDuration.totalMonths);
        noticePay = noticeDays * dailyWage;
        noticeNote = `${noticeDays} günlük ihbar süresi için`;
    } else if (noticeGiven) {
        noticeNote = 'İhbar süresi kullandırıldı.';
    } else if (!isNoticeEligible && terminationReason !== 'resignation_voluntary') {
        noticeNote = 'Bu durumda ihbar tazminatı uygulanmaz.';
    } else {
        noticeNote = 'Kendi isteğinizle ayrıldığınız için ihbar tazminatı yoktur.';
    }

    // Total
    const totalAmount = severancePay + noticePay;

    return {
        workDuration,
        dailyWage,
        severancePay,
        severanceNote,
        noticePay,
        noticeNote,
        totalAmount,
        cappedMonthlyIncome,
        isSeveranceEligible,
        isNoticeEligible
    };
}

// Calculate work duration
function calculateWorkDuration(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalMonths = totalDays / 30.44; // Average days per month

    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;

    let durationText = '';
    if (years > 0) durationText += `${years} yıl `;
    if (months > 0) durationText += `${months} ay `;
    if (days > 0) durationText += `${days} gün`;

    return {
        years,
        months,
        days,
        totalDays,
        totalMonths,
        text: durationText.trim() || '0 gün'
    };
}

// Get notice period in days
function getNoticePeriodDays(totalMonths) {
    for (const period of NOTICE_PERIODS) {
        if (totalMonths <= period.maxMonths) {
            return period.days;
        }
    }
    return 56; // Default to max
}

// Display results
function displayResults(result) {
    // Show results card
    resultsCard.style.display = 'block';

    // Scroll to results
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Update values
    document.getElementById('calculationDate').textContent = new Date().toLocaleDateString('tr-TR');
    document.getElementById('workDuration').textContent = result.workDuration.text;
    document.getElementById('dailyWage').textContent = formatCurrency(result.dailyWage);

    // Severance pay
    const severancePayEl = document.getElementById('severancePay');
    severancePayEl.textContent = formatCurrency(result.severancePay);
    if (!result.isSeveranceEligible || result.workDuration.totalDays < 365) {
        severancePayEl.style.color = 'var(--text-muted)';
    } else {
        severancePayEl.style.color = 'var(--primary-light)';
    }
    document.getElementById('severanceNote').textContent = result.severanceNote;

    // Notice pay
    const noticePayEl = document.getElementById('noticePay');
    noticePayEl.textContent = formatCurrency(result.noticePay);
    if (result.noticePay === 0) {
        noticePayEl.style.color = 'var(--text-muted)';
    } else {
        noticePayEl.style.color = 'var(--secondary-light)';
    }
    document.getElementById('noticeNote').textContent = result.noticeNote;

    // Total
    document.getElementById('totalAmount').textContent = formatCurrency(result.totalAmount);

    // Add animation
    resultsCard.style.animation = 'none';
    resultsCard.offsetHeight; // Trigger reflow
    resultsCard.style.animation = 'fadeInUp 0.4s ease';
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Format date for input
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Format number input with thousand separators (Turkish format: 33.000)
function formatNumberInput(input) {
    // Get cursor position
    const cursorPos = input.selectionStart;
    const oldLength = input.value.length;

    // Remove all non-numeric characters
    let value = input.value.replace(/[^0-9]/g, '');

    // Format with thousand separators (dots)
    if (value) {
        value = parseInt(value, 10).toLocaleString('tr-TR');
    }

    // Set the formatted value
    input.value = value;

    // Adjust cursor position
    const newLength = input.value.length;
    const diff = newLength - oldLength;
    const newPos = cursorPos + diff;

    // Set cursor position
    if (newPos >= 0) {
        input.setSelectionRange(newPos, newPos);
    }
}

// Parse formatted number (remove dots and convert to number)
function parseFormattedNumber(formattedValue) {
    if (!formattedValue) return 0;
    // Remove thousand separators (dots) and parse
    return parseFloat(formattedValue.replace(/\./g, '')) || 0;
}
