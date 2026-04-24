// OSMSG Main Frontend Logic
let fpInstance; // Global reference for flatpickr

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Date Picker (Flatpickr)
    const dateInput = document.getElementById('daterange');
    if (dateInput && typeof flatpickr !== 'undefined') {
        fpInstance = flatpickr("#daterange", {
            mode: "range",
            dateFormat: "d-m-Y"
        });
    }

    // 2. Initialize Charts (Chart.js)
    const chartsDataElement = document.getElementById('charts-data');
    if (chartsDataElement && typeof Chart !== 'undefined') {
        try {
            const charts = JSON.parse(chartsDataElement.textContent);
            renderDashboardCharts(charts);
        } catch (e) {
            console.error('Error parsing charts data:', e);
        }
    }
});

// Global helper for interval selection
function setIntervalRange(type) {
    if (!fpInstance) return;

    const today = new Date();
    let start = new Date();

    if (type === 'daily') {
        start.setDate(today.getDate() - 1);
    } else if (type === 'weekly') {
        start.setDate(today.getDate() - 7);
    } else if (type === 'monthly') {
        start.setMonth(today.getMonth() - 1);
    } else if (type === 'yearly') {
        start.setFullYear(today.getFullYear() - 1);
    }

    fpInstance.setDate([start, today]);
}

// Chart rendering engine
function renderDashboardCharts(charts) {
    const primaryColor = '#2b6f4b';
    const accentColors = ['#2b6f4b', '#4a9563', '#a0c2b5', '#d2e8df'];

    // Bar Chart
    const ctxBar = document.getElementById('barChart');
    if (ctxBar && charts.breakdown) {
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: charts.breakdown.labels,
                datasets: [{
                    label: 'Edits',
                    data: charts.breakdown.data,
                    backgroundColor: primaryColor,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
            }
        });
    }

    // Line Chart
    const ctxLine = document.getElementById('lineChart');
    if (ctxLine && charts.trend) {
        new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: charts.trend.labels,
                datasets: [{
                    label: 'Trend',
                    data: charts.trend.data,
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(43, 111, 75, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Pie Chart
    const ctxPie = document.getElementById('pieChart');
    if (ctxPie && charts.levels) {
        new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: charts.levels.labels,
                datasets: [{
                    data: charts.levels.data,
                    backgroundColor: accentColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}
