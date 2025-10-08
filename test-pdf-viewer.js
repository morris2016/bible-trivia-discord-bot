// Test script to verify PDF viewer functionality
import fetch from 'node-fetch';

async function testPDFViewer() {
  console.log('Testing PDF viewer functionality...');

  try {
    // Test 1: Check if we can access the resources page
    console.log('1. Testing resources page access...');
    const resourcesResponse = await fetch('http://localhost:5174/resources');
    console.log(`   Resources page: ${resourcesResponse.status} ${resourcesResponse.statusText}`);

    // Test 2: Check if we can access a specific resource
    console.log('2. Testing individual resource access...');
    const resourceResponse = await fetch('http://localhost:5174/resources/33');
    console.log(`   Resource page: ${resourceResponse.status} ${resourceResponse.statusText}`);

    // Test 3: Check if PDF viewer route exists
    console.log('3. Testing PDF viewer route...');
    const pdfViewerResponse = await fetch('http://localhost:5174/resources/33/view');
    console.log(`   PDF viewer: ${pdfViewerResponse.status} ${pdfViewerResponse.statusText}`);

    // Test 4: Check file serving endpoint
    console.log('4. Testing file serving endpoint...');
    const fileResponse = await fetch('http://localhost:5174/api/files/uploads/1756544458934-uarpig2aybh-1756542673910-780vtqj3vxv-Review_of_Edmon_L_Gallagher_and_John_D_M.pdf');
    console.log(`   File serving: ${fileResponse.status} ${fileResponse.statusText}`);
    if (fileResponse.headers.get('content-type')) {
      console.log(`   Content-Type: ${fileResponse.headers.get('content-type')}`);
    }

    console.log('\n✅ PDF viewer tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPDFViewer();