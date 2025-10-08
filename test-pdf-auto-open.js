// Test script to verify automatic PDF opening
import fetch from 'node-fetch';

async function testPDFAutoOpen() {
  console.log('Testing automatic PDF opening...');

  try {
    // Test 1: Check if clicking a PDF resource redirects to PDF viewer
    console.log('1. Testing PDF resource auto-redirect...');
    const pdfResourceResponse = await fetch('http://localhost:5174/resources/33', {
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log(`   PDF resource response: ${pdfResourceResponse.status}`);
    if (pdfResourceResponse.status === 302) {
      const location = pdfResourceResponse.headers.get('location');
      console.log(`   Redirect location: ${location}`);
      if (location && location.includes('/view')) {
        console.log('   ✅ PDF auto-redirect working correctly');
      } else {
        console.log('   ❌ PDF auto-redirect not working');
      }
    } else {
      console.log('   ❌ No redirect for PDF resource');
    }

    // Test 2: Check if non-PDF resources still go to normal page
    console.log('2. Testing non-PDF resource behavior...');
    // We'll assume resource ID 1 is not a PDF for this test
    const nonPdfResponse = await fetch('http://localhost:5174/resources/1', {
      redirect: 'manual'
    });
    console.log(`   Non-PDF resource response: ${nonPdfResponse.status}`);

    console.log('\n✅ PDF auto-open tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPDFAutoOpen();