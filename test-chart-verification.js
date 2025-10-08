// Test Chart.js functionality in admin environment
console.log('=== Chart.js Test in Admin Environment ===');

// Check if we're in admin context
const isAdminPage = window.location.pathname.startsWith('/admin') ||
                   typeof adminRenderer !== 'undefined';

console.log('Admin context:', isAdminPage);

// Check Chart.js availability
console.log('Chart.js object:', typeof Chart, window.Chart ? 'AVAILABLE' : 'MISSING');

// Check if Chart.js CDN is loaded
const chartLinks = document.querySelectorAll('script[src*="chart.js"]');
console.log('Chart.js CDN links found:', chartLinks.length);

chartLinks.forEach((link, i) => {
  console.log(`Chart CDN ${i+1}:`, link.src);
});

// Check if there's an admin content editor
const adminEditor = document.getElementById('admin-content-editor');
console.log('Admin content editor found:', adminEditor ? 'YES' : 'NO');

if (adminEditor && window.Chart) {
  console.log('✅ Prerequisites met - Charts should work!');

  // Test creating a chart programmatically
  const testCanvas = document.createElement('canvas');
  testCanvas.width = 400;
  testCanvas.height = 200;
  testCanvas.id = 'test-chart-verification';
  testCanvas.style.border = '1px solid #ccc';
  testCanvas.style.margin = '10px 0';

  // Add to test area
  const testArea = document.createElement('div');
  testArea.innerHTML = '<h4>Chart.js Test - Direct Creation</h4>';
  testArea.appendChild(testCanvas);

  // Insert after the admin editor if it exists
  if (adminEditor) {
    adminEditor.insertAdjacentElement('afterend', testArea);

    try {
      new Chart(testCanvas, {
        type: 'bar',
        data: {
          labels: ['Chart Works!', 'Test 1', 'Test 2'],
          datasets: [{
            label: 'Verification Test',
            data: [10, 15, 8],
            backgroundColor: ['#28a745', '#007bff', '#ffc107']
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      console.log('✅ Chart created successfully via direct instantiation!');
    } catch (error) {
      console.error('❌ Error creating chart:', error);
    }
  }

} else {
  console.log('❌ Prerequisites not met:', {
    editor: adminEditor ? 'EXISTS' : 'MISSING',
    chartJS: window.Chart ? 'LOADED' : 'NOT LOADED'
  });
}

// Test HTML to paste with charts
const sampleHTML = `<div style="border:2px solid #28a745; padding:10px; margin:10px 0;">
  <h3 style="color:#28a745;">Chart Test via HTML</h3>
  <canvas id="chartMyChart" width="400" height="200"></canvas>
</div>

<script>
try {
  console.log('Executing chart script from pasted HTML...');
  if (typeof Chart !== 'undefined' && document.getElementById('chartMyChart')) {
    console.log('Creating chart from pasted HTML...');
    new Chart(document.getElementById('chartMyChart'), {
      type: 'bar',
      data: {
        labels: ['HTML Chart', 'Works!', 'Success'],
        datasets: [{
          label: 'Pasted Chart Test',
          data: [7, 20, 12],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 205, 86, 0.5)'
          ]
        }]
      }
    });
    console.log('✅ Chart from pasted HTML created successfully!');
  } else {
    console.error('❌ Chart.js not available or canvas not found for pasted HTML');
    console.log('Chart.js type:', typeof Chart);
    console.log('Canvas found:', !!document.getElementById('chartMyChart'));
  }
} catch (error) {
  console.error('❌ Error in pasted chart script:', error);
}
</script>`;

// Make the HTML available globally for easy access
window.testHTMLWithCharts = sampleHTML;
console.log('Test HTML available at window.testHTMLWithCharts');

// Check if there are any existing charts in the document
setTimeout(() => {
  const canvases = document.querySelectorAll('canvas');
  console.log('Total canvases in document:', canvases.length);
  canvases.forEach((canvas, i) => {
    console.log(`Canvas ${i+1}:`, canvas.id || 'no-id', canvas.width + 'x' + canvas.height);
  });

  // Check if there are any Chart.js instances
  if (window.Chart && window.Chart.instances) {
    console.log('Chart.js instances:', Object.keys(window.Chart.instances).length);
  }

}, 2000);

// Instructions for manual testing
console.log('\n=== Testing Instructions ===');
console.log('1. Open browser console (F12 -> Console)');
console.log('2. Run this test file');
console.log('3. Check if Chart.js is loaded and working');
console.log('4. If using the editor, paste HTML from window.testHTMLWithCharts');
console.log('5. Refresh page to test the admin environment');

console.log('\n=== Quick Access ===');
console.log('- Chart.js object: window.Chart');
console.log('- Test HTML: window.testHTMLWithCharts');
console.log('- All canvases: document.querySelectorAll("canvas")');</content>
