const { Client } = require('pg');

async function checkAllVerseUsage() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 Connected to database - checking all verse usage data...\n');

    // Get all verse usage records
    const allVersesResult = await client.query(`
      SELECT verse_reference, frequency, last_used, created_at
      FROM verse_usage
      ORDER BY frequency DESC, last_used DESC
    `);

    console.log(`📊 TOTAL VERSE USAGE RECORDS: ${allVersesResult.rows.length}\n`);

    if (allVersesResult.rows.length === 0) {
      console.log('❌ No verse usage data found');
      return;
    }

    // Analyze frequency distribution
    const frequencyGroups = {};
    const bookGroups = {};
    let totalUsages = 0;

    allVersesResult.rows.forEach(row => {
      const freq = row.frequency;
      const book = row.verse_reference.split(' ')[0];

      // Group by frequency
      if (!frequencyGroups[freq]) frequencyGroups[freq] = [];
      frequencyGroups[freq].push(row);

      // Group by book
      if (!bookGroups[book]) bookGroups[book] = [];
      bookGroups[book].push(row);

      totalUsages += freq;
    });

    // Display frequency analysis
    console.log('📈 FREQUENCY ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.keys(frequencyGroups)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach(freq => {
        const count = frequencyGroups[freq].length;
        const percentage = ((count / allVersesResult.rows.length) * 100).toFixed(1);
        console.log(`  Frequency ${freq}: ${count} verses (${percentage}%)`);
      });

    console.log(`\n📚 TOTAL UNIQUE VERSES: ${allVersesResult.rows.length}`);
    console.log(`📊 TOTAL USAGES: ${totalUsages}`);
    console.log(`📊 AVERAGE FREQUENCY: ${(totalUsages / allVersesResult.rows.length).toFixed(2)}\n`);

    // Check for problematic frequencies
    console.log('⚠️  PROBLEMATIC FREQUENCIES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const highFreqVerses = Object.keys(frequencyGroups)
      .filter(freq => parseInt(freq) > 1)
      .sort((a, b) => parseInt(b) - parseInt(a));

    if (highFreqVerses.length > 0) {
      highFreqVerses.forEach(freq => {
        console.log(`\n  🔴 Verses with frequency ${freq}:`);
        frequencyGroups[freq].slice(0, 5).forEach((row, index) => {
          console.log(`    ${index + 1}. ${row.verse_reference} (last used: ${row.last_used})`);
        });
        if (frequencyGroups[freq].length > 5) {
          console.log(`    ... and ${frequencyGroups[freq].length - 5} more`);
        }
      });
    } else {
      console.log('  ✅ No verses found with frequency > 1');
    }

    // Book distribution analysis
    console.log('\n📚 BOOK DISTRIBUTION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.keys(bookGroups)
      .sort((a, b) => bookGroups[b].length - bookGroups[a].length)
      .slice(0, 10)
      .forEach(book => {
        const verses = bookGroups[book];
        const totalFreq = verses.reduce((sum, v) => sum + v.frequency, 0);
        console.log(`  ${book}: ${verses.length} verses, ${totalFreq} total usages`);
      });

    // Specific check for Matthew 27:51
    const matthewResult = await client.query(`
      SELECT verse_reference, frequency, last_used, created_at
      FROM verse_usage
      WHERE verse_reference = 'Matthew 27:51'
    `);

    if (matthewResult.rows.length > 0) {
      console.log('\n🎯 MATTHEW 27:51 SPECIFIC CHECK:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      matthewResult.rows.forEach((row, index) => {
        console.log(`  Record ${index + 1}:`);
        console.log(`    Frequency: ${row.frequency}`);
        console.log(`    Last Used: ${row.last_used}`);
        console.log(`    Created: ${row.created_at}`);
      });
    } else {
      console.log('\n❌ Matthew 27:51 not found in verse_usage table');
    }

    // Recent activity analysis
    console.log('\n🕐 RECENT ACTIVITY (Last 24 hours):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const recentResult = await client.query(`
      SELECT COUNT(*) as recent_count
      FROM verse_usage
      WHERE last_used > NOW() - INTERVAL '24 hours'
    `);

    console.log(`  Verses used in last 24h: ${recentResult.rows[0].recent_count}`);

    // Cleanup status
    console.log('\n🧹 CLEANUP STATUS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const oldRecordsResult = await client.query(`
      SELECT COUNT(*) as old_count
      FROM verse_usage
      WHERE created_at < NOW() - INTERVAL '3 days'
    `);

    console.log(`  Records older than 3 days: ${oldRecordsResult.rows[0].old_count}`);

  } catch (error) {
    console.error('❌ Error checking verse usage:', error);
  } finally {
    await client.end();
  }
}

checkAllVerseUsage();