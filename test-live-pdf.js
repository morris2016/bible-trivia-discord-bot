// Test script to check PDF viewing on live gospelways.com deployment
import fetch from 'node-fetch';

const BASE_URL = 'https://gospelways.com';

async function testLivePDF() {
  console.log('🧪 Testing PDF viewing on live gospelways.com deployment...');
  console.log(`📍 Base URL: ${BASE_URL}`);

  try {
    // Test 1: Check if the main page loads
    console.log('\n1️⃣ Testing main page...');
    const mainPageResponse = await fetch(BASE_URL);
    console.log(`   Status: ${mainPageResponse.status}`);
    console.log(`   Content-Type: ${mainPageResponse.headers.get('content-type')}`);

    // Test 2: Check resources page
    console.log('\n2️⃣ Testing resources page...');
    const resourcesResponse = await fetch(`${BASE_URL}/resources`);
    console.log(`   Status: ${resourcesResponse.status}`);
    console.log(`   Content-Type: ${resourcesResponse.headers.get('content-type')}`);

    // Test 3: Check specific resource page (ID 33)
    console.log('\n3️⃣ Testing specific resource page (ID 33)...');
    const resourceResponse = await fetch(`${BASE_URL}/resources/33`);
    console.log(`   Status: ${resourceResponse.status}`);
    console.log(`   Content-Type: ${resourceResponse.headers.get('content-type')}`);

    if (resourceResponse.ok) {
      const htmlContent = await resourceResponse.text();
      console.log(`   HTML length: ${htmlContent.length} characters`);

      // Check if PDF viewer is in the HTML
      const hasPdfViewer = htmlContent.includes('pdf-viewer') || htmlContent.includes('object data=') || htmlContent.includes('iframe');
      console.log(`   Contains PDF viewer: ${hasPdfViewer ? '✅' : '❌'}`);

      // Check for PDF file path
      const hasFilePath = htmlContent.includes('file_path') || htmlContent.includes('/api/files/');
      console.log(`   Contains file path: ${hasFilePath ? '✅' : '❌'}`);

      // Check for PDF-specific content
      const hasPdfContent = htmlContent.includes('PDF document') || htmlContent.includes('application/pdf');
      console.log(`   Contains PDF content: ${hasPdfContent ? '✅' : '❌'}`);

      // Look for the PDF viewer HTML structure
      const pdfViewerMatch = htmlContent.match(/<object[^>]*data="([^"]*api\/files\/[^"]*)"[^>]*>/);
      if (pdfViewerMatch) {
        console.log(`   PDF viewer URL found: ${pdfViewerMatch[1]}`);
      } else {
        console.log(`   PDF viewer URL: Not found`);
      }
    }

    // Test 4: Try to access the API health endpoint
    console.log('\n4️⃣ Testing API health...');
    const apiHealthResponse = await fetch(`${BASE_URL}/api/health`);
    console.log(`   Status: ${apiHealthResponse.status}`);
    if (apiHealthResponse.ok) {
      try {
        const healthData = await apiHealthResponse.json();
        console.log(`   Health check: ${JSON.stringify(healthData, null, 2)}`);
      } catch (error) {
        console.log(`   Health check: Failed to parse JSON`);
      }
    }

    // Test 5: Check resources API
    console.log('\n5️⃣ Testing resources API...');
    const resourcesApiResponse = await fetch(`${BASE_URL}/api/resources`);
    console.log(`   Status: ${resourcesApiResponse.status}`);
    if (resourcesApiResponse.ok) {
      try {
        const resourcesData = await resourcesApiResponse.json();
        console.log(`   Resources count: ${resourcesData.resources?.length || 0}`);

        // Look for resource ID 33
        const resource33 = resourcesData.resources?.find(r => r.id === 33);
        if (resource33) {
          console.log(`   Resource 33 found: ${resource33.title}`);
          console.log(`   Resource type: ${resource33.resource_type}`);
          console.log(`   Has file path: ${!!resource33.file_path}`);
          console.log(`   File path: ${resource33.file_path || 'None'}`);
        } else {
          console.log(`   Resource 33: Not found`);
        }
      } catch (error) {
        console.log(`   Resources API: Failed to parse JSON`);
      }
    }

    console.log('\n✅ Live gospelways.com PDF test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testLivePDF();