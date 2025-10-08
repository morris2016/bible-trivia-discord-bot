// Check for old game rooms in database using API endpoints
async function checkOldRooms() {
    try {
        console.log('🔍 Checking for old game rooms in database...');

        // First, let's check what games exist by calling the API
        const gamesResponse = await fetch('http://localhost:5173/api/bible-games');
        const gamesResult = await gamesResponse.json();

        if (!gamesResult.success) {
            console.error('❌ Failed to fetch games:', gamesResult.error);

            // Try to check database directly
            console.log('🔍 Trying to check database directly...');
            try {
                const directResponse = await fetch('http://localhost:5173/api/bible-games/cleanup-status?hoursOld=2');
                const directResult = await directResponse.json();
                console.log('Direct database check result:', directResult);
            } catch (directError) {
                console.error('❌ Direct database check also failed:', directError);
            }
            return;
        }

        console.log(`📊 Found ${gamesResult.games.length} total game rooms:`);
        console.log('========================================');

        const now = new Date();
        let oldRooms = [];

        gamesResult.games.forEach((game, index) => {
            const createdAt = new Date(game.created_at);
            const hoursOld = (now - createdAt) / (1000 * 60 * 60);

            console.log(`${index + 1}. Game ID: ${game.id}`);
            console.log(`   Name: ${game.name}`);
            console.log(`   Status: ${game.status}`);
            console.log(`   Created: ${game.created_at}`);
            console.log(`   Age: ${hoursOld.toFixed(1)} hours`);
            console.log(`   Created by: ${game.created_by_name || 'Unknown'}`);
            console.log('---');

            if (hoursOld > 2) {
                oldRooms.push({
                    id: game.id,
                    name: game.name,
                    hoursOld: hoursOld,
                    created_at: game.created_at
                });
            }
        });

        console.log(`\n🕐 Rooms older than 2 hours: ${oldRooms.length}`);
        if (oldRooms.length > 0) {
            console.log('These should be cleaned up:');
            oldRooms.forEach(room => {
                console.log(`- ${room.name} (${room.hoursOld.toFixed(1)} hours old)`);
            });
        }

        // Test the cleanup function via API
        console.log('\n🧹 Testing cleanup function via API...');
        const cleanupResponse = await fetch('http://localhost:5173/api/bible-games/cleanup-expired', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hoursOld: 2 })
        });

        const cleanupResult = await cleanupResponse.json();
        console.log('Cleanup result:', cleanupResult);

        if (cleanupResult.success) {
            console.log('✅ Cleanup completed successfully!');
        } else {
            console.error('❌ Cleanup failed:', cleanupResult.error);
        }

    } catch (error) {
        console.error('❌ Error checking old rooms:', error);
    }
}

checkOldRooms();