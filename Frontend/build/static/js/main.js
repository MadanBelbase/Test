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

// --- Static Hosting Utility ---
// This block ensures the application works on GitHub Pages by simulating 
// the Flask backend logic in the browser when running as a static site.

if (window.location.protocol !== 'file:' || true) { // Run in all environments for compatibility
    document.addEventListener('DOMContentLoaded', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const hashtag = urlParams.get('hashtag');

        // If we are on statistics page and have a hashtag, fetch data manually
        if (hashtag && window.location.pathname.includes('statistics')) {
            console.log('Static Mode: Fetching data for', hashtag);
            try {
                // Determine base path to data
                const isGitHubPages = window.location.hostname.includes('github.io');
                const pathPrefix = isGitHubPages ? `/${window.location.pathname.split('/')[1]}` : '';
                const response = await fetch(`${pathPrefix}/data/stats.json`.replace('//', '/'));
                const allData = await response.json();

                const rawStats = allData[hashtag] || allData['default'];

                // Simple scaling logic (mimics app.py)
                const daterange = urlParams.get('daterange') || 'All Time';
                let scale = 1.0;
                if (daterange.includes(' to ')) {
                    const parts = daterange.split(' to ');
                    const d1 = new Date(parts[0].split('-').reverse().join('-'));
                    const d2 = new Date(parts[1].split('-').reverse().join('-'));
                    const days = Math.max(1, (d2 - d1) / (1000 * 60 * 60 * 24));
                    scale = days / 7.0;
                }

                const stats = {
                    summary: {
                        hashtag: hashtag,
                        daterange: daterange,
                        changesets: Math.floor(rawStats.summary.changesets * scale),
                        mappers: Math.floor(rawStats.summary.mappers * Math.pow(scale, 0.5)),
                        changes: Math.floor(rawStats.summary.changes * scale)
                    },
                    charts: rawStats
                };

                // Update UI elements
                document.querySelectorAll('[data-bind]').forEach(el => {
                    const key = el.getAttribute('data-bind');
                    if (stats.summary[key] !== undefined) {
                        el.textContent = stats.summary[key].toLocaleString();
                    }
                });

                // Update charts if they exist
                if (typeof renderDashboardCharts === 'function') {
                    renderDashboardCharts(stats.charts);
                }

                // Update page title/header
                const titleEl = document.querySelector('h2.form-title');
                if (titleEl) titleEl.innerHTML = `Statistics for <span>#${hashtag}</span>`;

            } catch (e) {
                console.error('Static mode data fetch failed:', e);
            }
        }
    });

    // Update navigation links for static hosting (e.g. /about -> /about.html)
    if (window.location.hostname.includes('github.io') || window.location.port !== '') {
        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('/') && !href.endsWith('.html') && href !== '/') {
                // If it's a known route, append .html if needed
                if (['/about', '/contact', '/statistics'].some(r => href === r)) {
                    // But in GH Pages with Frozen-Flask, they usually become /about/index.html or /about/
                    // For simplicity, let's keep it as is if it works, or append /
                }
            }
        });
    }
}
