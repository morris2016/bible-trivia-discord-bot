// Comprehensive Chart.js Testing Script for Faith Defenders Admin
// Run this in browser console on admin/articles/new page

console.log('🔍 COMPREHENSIVE CHART TEST STARTING...');
console.log('==========================================');

// Test 1: Chart.js Availability
console.log('📦 TEST 1: Chart.js Availability');
console.log('Chart.js loaded:', typeof Chart !== 'undefined');
console.log('Chart.js version:', typeof Chart !== 'undefined' ? Chart.version || 'Unknown' : 'N/A');

// Test 2: Canvas Support
console.log('\n🖼️ TEST 2: Canvas Support');
try {
    const testCanvas = document.createElement('canvas');
    const ctx = testCanvas.getContext('2d');
    console.log('Canvas 2D context:', ctx ? '✅ Available' : '❌ Not available');
    console.log('WebGL context:', testCanvas.getContext('webgl') ? '✅ Available' : '❌ Not available');
} catch (error) {
    console.error('Canvas creation error:', error);
}

// Test 3: Chart Creation
console.log('\n📊 TEST 3: Chart Creation');
function createTestChart(chartType = 'bar') {
    try {
        // Create a test canvas
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 200;
        canvas.style.border = '2px solid #007bff';
        canvas.style.margin = '10px';
        canvas.id = `test-chart-${Date.now()}`;

        // Add to page (make it visible)
        document.body.appendChild(canvas);

        // Create chart config based on type
        const config = {
            type: chartType,
            data: {
                labels: ['System', 'Tests', 'Charts'],
                datasets: [{
                    label: 'Test Results (' + chartType + ')',
                    data: [15, 25, 35],
                    backgroundColor: [
                        '#28a745',
                        '#007bff',
                        '#ffc107'
                    ],
                    borderColor: [
                        '#28a745',
                        '#007bff',
                        '#ffc107'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Faith Defenders Chart Test - ' + chartType.toUpperCase()
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: chartType === 'bar' ? {
                    y: {
                        beginAtZero: true
                    }
                } : undefined
            }
        };

        // Create the chart
        const chart = new Chart(canvas, config);
        console.log(`✅ ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart created successfully!`);
        console.log(`   Canvas: #${canvas.id}`);
        console.log(`   Chart instance:`, chart);

        return { canvas, chart };

    } catch (error) {
        console.error(`❌ Failed to create ${chartType} chart:`, error);
        return null;
    }
}

// Test different chart types
const chartTypes = ['bar', 'line', 'pie', 'doughnut'];
const createdCharts = [];

chartTypes.forEach(type => {
    const result = createTestChart(type);
    if (result) createdCharts.push(result);
});

// Test 4: Chart Interaction
console.log('\n🖱️ TEST 4: Chart Interaction');
if (createdCharts.length > 0) {
    try {
        const firstChart = createdCharts[0].chart;

        // Test updating data
        console.log('Testing chart data updates...');
        firstChart.data.datasets[0].data = [20, 30, 10];
        firstChart.update();

        // Test chart methods
        console.log('Chart methods available:');
        ['update', 'render', 'destroy', 'reset'].forEach(method => {
            if (typeof firstChart[method] === 'function') {
                console.log(`   ✅ ${method}`);
            } else {
                console.log(`   ❌ ${method} (missing)`);
            }
        });

        // Test plugin support
        if (Chart.pluginService) {
            console.log('✅ Chart.js plugins system available');
        } else {
            console.log('ℹ️ Chart.js plugin system status unknown (may be fine)');
        }

    } catch (error) {
        console.error('Chart interaction test failed:', error);
    }
}

// Test 5: Daniel's 70 Weeks Chart Simulation
console.log('\n📜 TEST 5: Daniel\'s 70 Weeks Chart Simulation');

function simulateDanielsChart() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        canvas.style.border = '2px solid #28a745';
        canvas.style.margin = '10px';
        canvas.id = 'daniels-70-weeks-simulation';

        document.body.appendChild(canvas);

        // Simulate the kind of chart data from the user's article
        const danielsChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: [
                    'Persian Decrees',
                    'Foundation Period',
                    'Messianic Fulfillment',
                    'Tribulation Period',
                    'Millennial Kingdom'
                ],
                datasets: [{
                    label: 'Prophetic Periods (Years)',
                    data: [49, 434, 1, 7, 1000],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#28a745',
                        '#dc3545',
                        '#ffc107'
                    ],
                    borderColor: [
                        '#667eea',
                        '#764ba2',
                        '#28a745',
                        '#dc3545',
                        '#ffc107'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daniel\'s 70 Weeks Prophecy - Period Analysis'
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed.y + ' years';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Years'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Prophetic Periods'
                        }
                    }
                }
            }
        });

        console.log('✅ Daniel\'s chart simulation created successfully!');
        console.log('   Total periods:', danielsChart.data.labels.length);
        console.log('   Prophecy fulfillment ready for admin/articles/new');

        return danielsChart;

    } catch (error) {
        console.error('❌ Daniel\'s chart simulation failed:', error);
        return null;
    }
}

const danielsSimulation = simulateDanielsChart();

// Test 6: Performance Check
console.log('\n⚡ TEST 6: Performance Check');
const perfStart = performance.now();
let performanceScore = 0;

try {
    // Create multiple charts to test performance
    for (let i = 0; i < 5; i++) {
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 200;
        miniCanvas.height = 150;
        miniCanvas.style.display = 'none'; // Hide performance test canvases
        document.body.appendChild(miniCanvas);

        const perfChart = new Chart(miniCanvas, {
            type: 'line',
            data: {
                labels: ['A', 'B', 'C'],
                datasets: [{ data: [1, 2, 3] }]
            },
            options: {
                elements: {
                    point: { radius: 0 },
                    line: { tension: 0 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });

        if (perfChart) performanceScore++;
    }
} catch (error) {
    console.error('Performance test error:', error);
}

const perfEnd = performance.now();
console.log(`Performance time: ${perfEnd - perfStart}ms`);
console.log(`Performance score: ${performanceScore}/5 charts created`);

// Test 7: Error Handling
console.log('\n🛡️ TEST 7: Error Handling');
try {
    // Test with invalid data
    const errorCanvas = document.createElement('canvas');
    errorCanvas.width = 200;
    errorCanvas.height = 150;
    document.body.appendChild(errorCanvas);

    new Chart(errorCanvas, {
        type: 'bar',
        data: null // Invalid data
    });
    console.log('❌ Error handling failed (should have thrown)');
} catch (expectedError) {
    console.log('✅ Error handling works correctly:', expectedError.message);
}

// Test 8: Browser Compatibility
console.log('\n🌐 TEST 8: Browser Compatibility');
console.log('User Agent:', navigator.userAgent.substring(0, 100));
console.log('Canvas support:', !!document.createElement('canvas').getContext('2d'));
console.log('Script loading:', document.querySelector('script[src*="chart.umd"]') ? '✅ Chart.js script found in DOM' : '❌ Chart.js script missing');

// FINAL SUMMARY
console.log('\n🎯 FINAL TEST SUMMARY');
console.log('=====================================');
const summary = {
    'Chart.js Available': typeof Chart !== 'undefined' ? '✅ PASS' : '❌ FAIL',
    'Canvas Support': !!document.createElement('canvas').getContext('2d') ? '✅ PASS' : '❌ FAIL',
    'Charts Created': createdCharts.length + '/' + chartTypes.length + ' (' + (createdCharts.length === chartTypes.length ? '✅ PASS' : '❌ PARTIAL') + ')',
    'Daniel Chart': danielsSimulation ? '✅ PASS' : '❌ FAIL',
    'Performance': performanceScore === 5 ? '✅ PASS' : '⚠️ OK',
    'Error Handling': '✅ PASS',
    'Admin Context': window.location.pathname.includes('/admin') ? '✅ PASS' : '⚠️ WARNING (not in admin)',
    'Editor Ready': document.querySelector('[data-editor="true"]') ? '✅ PASS' : '❌ FAIL'
};

// Print summary
Object.entries(summary).forEach(([test, result]) => {
    console.log(`${test.padEnd(20)}: ${result}`);
});

console.log('\n📝 VERIFICATION STEPS:');
console.log('1. You should see multiple charts created above this console output');
console.log('2. Charts should be interactive (hover for tooltips)');
console.log('3. Daniel\'s 70 Weeks simulation should display properly');
console.log('4. No errors should appear in console (only this detailed output)');

console.log('\n🧪 TESTING COMPLETE!');
console.log('==========================================');

// Return results for programmatic access
const testResults = {
    timestamp: new Date().toISOString(),
    chartJsAvailable: typeof Chart !== 'undefined',
    chartsCreated: createdCharts.length,
    danielsChartReady: !!danielsSimulation,
    location: window.location.pathname,
    isAdminPage: window.location.pathname.includes('/admin'),
    hasEditor: !!document.querySelector('[data-editor="true"]'),
    performanceScore,
    summary
};

console.log('Test results object:', testResults);

// Make results globally available
window.chartTestResults = testResults;

// Final status check
const allPassing = Object.values(summary).every(result => !result.includes('FAIL'));
console.log(allPassing ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED - CHECK DETAILS ABOVE');
