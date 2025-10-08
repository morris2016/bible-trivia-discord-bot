// Test script to check PDF viewer HTML on live gospelways.com deployment
import fetch from 'node-fetch';

const BASE_URL = 'https://gospelways.com';

async function testPDFViewerHTML() {
  console.log('🧪 Testing PDF viewer HTML on live gospelways.com deployment...');
  console.log(`📍 Base URL: ${BASE_URL}`);

  try {
    // Get the resource page HTML
    console.log('\n1️⃣ Getting resource page HTML...');
    const resourceResponse = await fetch(`${BASE_URL}/resources/33`);
    const htmlContent = await resourceResponse.text();

    console.log(`   HTML length: ${htmlContent.length} characters`);

    // Look for PDF viewer related content
    console.log('\n2️⃣ Checking for PDF viewer elements...');

    // Check for object tag
    const objectMatch = htmlContent.match(/<object[^>]*data="([^"]*)"[^>]*>/);
    if (objectMatch) {
      console.log(`   ✅ Object tag found:`);
      console.log(`      Data URL: ${objectMatch[1]}`);
    } else {
      console.log(`   ❌ Object tag not found`);
    }

    // Check for iframe tag
    const iframeMatch = htmlContent.match(/<iframe[^>]*src="([^"]*)"[^>]*>/);
    if (iframeMatch) {
      console.log(`   ✅ Iframe tag found:`);
      console.log(`      Src URL: ${iframeMatch[1]}`);
    } else {
      console.log(`   ❌ Iframe tag not found`);
    }

    // Check for PDF viewer container
    const pdfViewerMatch = htmlContent.match(/pdf-viewer[^>]*>([\s\S]*?)<\/div>/);
    if (pdfViewerMatch) {
      console.log(`   ✅ PDF viewer container found:`);
      console.log(`      Content length: ${pdfViewerMatch[1].length} characters`);
    } else {
      console.log(`   ❌ PDF viewer container not found`);
    }

    // Check for file path in HTML
    const filePathMatch = htmlContent.match(/file_path[^>]*>([\s\S]*?)<\/div>/);
    if (filePathMatch) {
      console.log(`   ✅ File path found in HTML:`);
      console.log(`      Content: ${filePathMatch[1].substring(0, 100)}...`);
    } else {
      console.log(`   ❌ File path not found in HTML`);
    }

    // Look for any /api/files/ URLs
    const apiFilesMatches = htmlContent.match(/\/api\/files\/[^"'\s]*/g);
    if (apiFilesMatches && apiFilesMatches.length > 0) {
      console.log(`   ✅ API files URLs found:`);
      apiFilesMatches.forEach((url, index) => {
        console.log(`      ${index + 1}. ${url}`);
      });
    } else {
      console.log(`   ❌ No API files URLs found`);
    }

    // Check for PDF-related content
    const pdfContent = htmlContent.match(/PDF document|application\/pdf|pdf-preview/gi);
    if (pdfContent) {
      console.log(`   ✅ PDF-related content found:`);
      pdfContent.forEach((match, index) => {
        console.log(`      ${index + 1}. ${match}`);
      });
    } else {
      console.log(`   ❌ No PDF-related content found`);
    }

    // Look for the resource data in the HTML
    const resourceDataMatch = htmlContent.match(/resource[^>]*=[\s\S]*?({[\s\S]*?})/);
    if (resourceDataMatch) {
      console.log(`   ✅ Resource data found in HTML`);
      try {
        const resourceData = JSON.parse(resourceDataMatch[1]);
        console.log(`      Resource ID: ${resourceData.id}`);
        console.log(`      Title: ${resourceData.title}`);
        console.log(`      File path: ${resourceData.file_path}`);
        console.log(`      Resource type: ${resourceData.resource_type}`);
      } catch (error) {
        console.log(`      Could not parse resource data`);
      }
    } else {
      console.log(`   ❌ Resource data not found in HTML`);
    }

    // Check if the HTML contains our optimized PDF viewer structure
    const optimizedViewer = htmlContent.includes('pdf-viewer-maximized') ||
                           htmlContent.includes('pdf-header-compact') ||
                           htmlContent.includes('object data=');
    console.log(`\n3️⃣ Optimized PDF viewer structure: ${optimizedViewer ? '✅' : '❌'}`);

    console.log('\n✅ PDF viewer HTML analysis completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testPDFViewerHTML();