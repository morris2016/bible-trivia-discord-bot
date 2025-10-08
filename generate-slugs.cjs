const { neon } = require('@neondatabase/serverless');

// Slug generation function (copied from database-neon.ts)
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Get database connection
function getDB() {
  const databaseUrl = process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgres://neondb_owner:npg_bCSE8mA2YjgT@ep-weathered-mode-adqdxv9w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

  return neon(databaseUrl);
}

// Generate unique slug by checking for conflicts
async function generateUniqueSlug(sql, title, table) {
  let slug = generateSlug(title);
  let counter = 1;
  let uniqueSlug = slug;

  while (true) {
    let existing;
    if (table === 'articles') {
      existing = await sql`
        SELECT id FROM articles
        WHERE slug = ${uniqueSlug}
        LIMIT 1
      `;
    } else {
      existing = await sql`
        SELECT id FROM resources
        WHERE slug = ${uniqueSlug}
        LIMIT 1
      `;
    }

    if (existing.length === 0) {
      break;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

async function generateSlugsForArticles() {
  const sql = getDB();
  console.log('Starting slug generation for articles...');

  try {
    // Get all articles without slugs
    const articlesWithoutSlugs = await sql`
      SELECT id, title FROM articles
      WHERE slug IS NULL OR slug = ''
      ORDER BY id
    `;

    console.log(`Found ${articlesWithoutSlugs.length} articles without slugs`);

    let updated = 0;
    for (const article of articlesWithoutSlugs) {
      const slug = await generateUniqueSlug(sql, article.title, 'articles');

      await sql`
        UPDATE articles
        SET slug = ${slug}, updated_at = NOW()
        WHERE id = ${article.id}
      `;

      console.log(`Updated article ${article.id}: "${article.title}" -> "${slug}"`);
      updated++;
    }

    console.log(`Successfully updated ${updated} articles with slugs`);
    return updated;
  } catch (error) {
    console.error('Error generating slugs for articles:', error);
    throw error;
  }
}

async function generateSlugsForResources() {
  const sql = getDB();
  console.log('Starting slug generation for resources...');

  try {
    // Get all resources without slugs
    const resourcesWithoutSlugs = await sql`
      SELECT id, title FROM resources
      WHERE slug IS NULL OR slug = ''
      ORDER BY id
    `;

    console.log(`Found ${resourcesWithoutSlugs.length} resources without slugs`);

    let updated = 0;
    for (const resource of resourcesWithoutSlugs) {
      const slug = await generateUniqueSlug(sql, resource.title, 'resources');

      await sql`
        UPDATE resources
        SET slug = ${slug}, updated_at = NOW()
        WHERE id = ${resource.id}
      `;

      console.log(`Updated resource ${resource.id}: "${resource.title}" -> "${slug}"`);
      updated++;
    }

    console.log(`Successfully updated ${updated} resources with slugs`);
    return updated;
  } catch (error) {
    console.error('Error generating slugs for resources:', error);
    throw error;
  }
}

async function main() {
  console.log('=== Slug Generation Script ===');
  console.log('This script will generate slugs for existing articles and resources that don\'t have them.');

  try {
    const articlesUpdated = await generateSlugsForArticles();
    const resourcesUpdated = await generateSlugsForResources();

    console.log('\n=== Summary ===');
    console.log(`Articles updated: ${articlesUpdated}`);
    console.log(`Resources updated: ${resourcesUpdated}`);
    console.log(`Total items updated: ${articlesUpdated + resourcesUpdated}`);

    if (articlesUpdated + resourcesUpdated > 0) {
      console.log('\n✅ Slug generation completed successfully!');
      console.log('Your articles and resources now have SEO-friendly URLs.');
    } else {
      console.log('\nℹ️  No items needed slug generation - all items already have slugs.');
    }

  } catch (error) {
    console.error('\n❌ Error during slug generation:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);