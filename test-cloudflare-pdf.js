// Test script to check PDF viewing on Cloudflare deployment
import fetch from 'node-fetch';

const BASE_URL = 'https://42fe6432.gospelways.pages.dev';

async function testCloudflarePDF() {
  console.log('🧪 Testing PDF viewing on Cloudflare deployment...');
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

    // Test 3: Check API health
    console.log('\n3️⃣ Testing API health...');
    const apiHealthResponse = await fetch(`${BASE_URL}/api/health`);
    console.log(`   Status: ${apiHealthResponse.status}`);
    if (apiHealthResponse.ok) {
      const healthData = await apiHealthResponse.json();
      console.log(`   Health check: ${JSON.stringify(healthData, null, 2)}`);
    }

    // Test 4: Check resources API
    console.log('\n4️⃣ Testing resources API...');
    const resourcesApiResponse = await fetch(`${BASE_URL}/api/resources`);
    console.log(`   Status: ${resourcesApiResponse.status}`);
    if (resourcesApiResponse.ok) {
      const resourcesData = await resourcesApiResponse.json();
      console.log(`   Resources count: ${resourcesData.resources?.length || 0}`);

      // Look for PDF resources
      const pdfResources = resourcesData.resources?.filter(r => r.resource_type === 'book' || r.file_path?.includes('.pdf')) || [];
      console.log(`   PDF resources found: ${pdfResources.length}`);

      if (pdfResources.length > 0) {
        const firstPdf = pdfResources[0];
        console.log(`   First PDF: ${firstPdf.title} (ID: ${firstPdf.id})`);

        // Test 5: Try to access the PDF view page
        console.log('\n5️⃣ Testing PDF view page...');
        const pdfViewUrl = `${BASE_URL}/resources/${firstPdf.id}/view`;
        console.log(`   PDF view URL: ${pdfViewUrl}`);

        const pdfViewResponse = await fetch(pdfViewUrl);
        console.log(`   Status: ${pdfViewResponse.status}`);
        console.log(`   Content-Type: ${pdfViewResponse.headers.get('content-type')}`);

        if (pdfViewResponse.ok) {
          const htmlContent = await pdfViewResponse.text();
          console.log(`   HTML length: ${htmlContent.length} characters`);

          // Check if PDF viewer is in the HTML
          const hasPdfViewer = htmlContent.includes('pdf-viewer') || htmlContent.includes('object data=') || htmlContent.includes('iframe');
          console.log(`   Contains PDF viewer: ${hasPdfViewer ? '✅' : '❌'}`);

          // Check for PDF file path
          if (firstPdf.file_path) {
            console.log('\n6️⃣ Testing PDF file serving...');
            const pdfFileUrl = `${BASE_URL}/api/files/${firstPdf.file_path}`;
            console.log(`   PDF file URL: ${pdfFileUrl}`);

            const pdfFileResponse = await fetch(pdfFileUrl, {
              method: 'HEAD' // Just check headers
            });
            console.log(`   Status: ${pdfFileResponse.status}`);
            console.log(`   Content-Type: ${pdfFileResponse.headers.get('content-type')}`);
            console.log(`   Content-Disposition: ${pdfFileResponse.headers.get('content-disposition')}`);
            console.log(`   Access-Control-Allow-Origin: ${pdfFileResponse.headers.get('access-control-allow-origin')}`);
          }
        }
      }
    }

    console.log('\n✅ Cloudflare PDF test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testCloudflarePDF();