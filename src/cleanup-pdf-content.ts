import { setGlobalEnv, getDB } from './database-neon';

export async function cleanupPDFContent(env: any) {
  try {
    // Set global environment for database access
    setGlobalEnv(env);

    const sql = getDB();

    // Find all resources that contain PDF.js references in extracted_content
    const resourcesWithPDFJS = await sql`
      SELECT id, title, extracted_content
      FROM resources
      WHERE extracted_content LIKE '%pdf.js%'
      OR extracted_content LIKE '%mozilla.github.io%'
      OR extracted_content LIKE '%pdf-viewer%'
      OR extracted_content LIKE '%PDF.js%'
    `;

    console.log(`Found ${resourcesWithPDFJS.length} resources with PDF.js references`);

    if (resourcesWithPDFJS.length === 0) {
      console.log('No resources found with PDF.js references');
      return { success: true, updated: 0 };
    }

    let updatedCount = 0;

    for (const resource of resourcesWithPDFJS) {
      console.log(`Updating resource: ${resource.title} (ID: ${resource.id})`);

      // Check if this is a PDF resource by looking for PDF-related content
      const isPDFResource = resource.extracted_content.includes('pdf-preview') ||
                           resource.extracted_content.includes('PDF document') ||
                           resource.extracted_content.includes('application/pdf');

      if (isPDFResource) {
        // For PDF resources, replace with simple text
        const newContent = 'PDF document uploaded successfully. Use the download button above to view the PDF.';
        await sql`
          UPDATE resources
          SET extracted_content = ${newContent}
          WHERE id = ${resource.id}
        `;
        updatedCount++;
        console.log(`  ✓ Updated PDF resource: ${resource.title}`);
      } else {
        // For non-PDF resources that somehow have PDF.js references, clean them up
        const cleanedContent = resource.extracted_content
          .replace(/<iframe[^>]*pdf\.js[^>]*>[\s\S]*?<\/iframe>/gi, '')
          .replace(/<div[^>]*pdf-viewer[^>]*>[\s\S]*?<\/div>/gi, '')
          .replace(/<script[^>]*pdf[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/PDF\.js|pdf\.js/gi, '')
          .replace(/mozilla\.github\.io/gi, '')
          .trim();

        if (cleanedContent !== resource.extracted_content) {
          await sql`
            UPDATE resources
            SET extracted_content = ${cleanedContent}
            WHERE id = ${resource.id}
          `;
          updatedCount++;
          console.log(`  ✓ Cleaned non-PDF resource: ${resource.title}`);
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} resources`);
    return { success: true, updated: updatedCount };

  } catch (error) {
    console.error('Error cleaning up PDF content:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Export for use in other files
export default cleanupPDFContent;