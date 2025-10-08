// Simple test for comment textarea focus loss issue
import { chromium } from 'playwright';

async function testCommentFocusLoss() {
  console.log('🔍 Testing comment textarea focus loss issue...');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 720, height: 1600 },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; TECNO CD6 Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  try {
    console.log('📱 Navigating to gospelways.com...');
    await page.goto('https://gospelways.com');
    await page.waitForLoadState('networkidle');

    // Login first
    console.log('🔐 Logging in...');
    await page.goto('https://gospelways.com/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('#signin-email', 'siagmoo2018@gmail.com');
    await page.fill('#signin-password', 'Morris2016?');

    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to articles page
    console.log('📄 Going to articles page...');
    await page.goto('https://gospelways.com/articles');
    await page.waitForLoadState('networkidle');

    // Find and click on the first article link
    console.log('🖱️  Looking for first article link to click...');
    const firstArticleLink = page.locator('a[href*="/articles/"], a[href*="/article/"]').first();

    if (await firstArticleLink.count() > 0) {
      const linkHref = await firstArticleLink.getAttribute('href');
      const linkText = await firstArticleLink.textContent();
      console.log(`📖 Clicking on article link: "${linkText?.trim()}" -> ${linkHref}`);

      await firstArticleLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for article page to load completely

      const newUrl = page.url();
      console.log(`📍 New URL after click: ${newUrl}`);

      if (newUrl !== 'https://gospelways.com/articles') {
        console.log('✅ Successfully navigated to article page');
      } else {
        console.log('⚠️  URL did not change - might be client-side routing');
      }
    } else {
      console.log('❌ No article links found, trying direct navigation...');
      await page.goto('https://gospelways.com/articles/1', { waitUntil: 'networkidle', timeout: 5000 });
      await page.waitForTimeout(2000);
    }

    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    console.log('💬 Testing comment textarea focus behavior...');

    // First, scroll to the comments section if it exists
    console.log('📜 Scrolling to comments section...');
    const commentsSection = page.locator('.comments-section, #comments-list, [class*="comment"]').first();

    if (await commentsSection.count() > 0) {
      await commentsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      console.log('✅ Scrolled to comments section');
    } else {
      console.log('⚠️  No comments section found, scrolling to bottom of page...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    }

    // Check page structure after navigation - focus on article comments
    const articlePageContent = await page.evaluate(() => {
      const textareas = document.querySelectorAll('textarea');
      const commentForms = document.querySelectorAll('.comment-form, #main-comment-form, [class*="comment"]');
      const commentTextareas = document.querySelectorAll('.comment textarea, textarea.comment-input');
      const articleComments = document.querySelectorAll('.article .comment, .post .comment, [class*="article"] [class*="comment"]');
      const inputs = document.querySelectorAll('input');

      // Get more detailed page structure
      const allElements = document.querySelectorAll('*');
      const classes = [];
      const ids = [];

      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls && !classes.includes(cls)) classes.push(cls);
          });
        }
        if (el.id && !ids.includes(el.id)) ids.push(el.id);
      });

      return {
        textareasCount: textareas.length,
        commentFormsCount: commentForms.length,
        commentTextareasCount: commentTextareas.length,
        articleCommentsCount: articleComments.length,
        inputsCount: inputs.length,
        totalElements: allElements.length,
        classesWithComment: classes.filter(cls => cls.toLowerCase().includes('comment')),
        idsWithComment: ids.filter(id => id.toLowerCase().includes('comment')),
        url: window.location.href,
        title: document.title,
        pageHTML: document.body.innerHTML.substring(0, 2000) + '...'
      };
    });

    console.log('📄 Article page structure:', articlePageContent);

    // Find comment textarea with more specific selectors - focus on article comments
    const commentTextarea = page.locator('textarea.comment-input, .comment textarea, textarea[name="comment"], textarea[name="content"]').first();

    if (await commentTextarea.count() > 0) {
      console.log('📝 Found comment textarea, testing focus behavior...');

      // Test 1: Click and check if focus is maintained
      console.log('🖱️  Test 1: Clicking textarea...');
      await commentTextarea.click();
      await page.waitForTimeout(1000);

      let isFocused = await commentTextarea.evaluate(el => document.activeElement === el);
      console.log('Focus after click:', isFocused);

      // Test 2: Type a character and check focus
      if (isFocused) {
        console.log('⌨️  Test 2: Typing character...');
        await page.keyboard.type('T');
        await page.waitForTimeout(500);

        isFocused = await commentTextarea.evaluate(el => document.activeElement === el);
        console.log('Focus after typing:', isFocused);

        // Check if any DOM changes occurred
        const textareaValue = await commentTextarea.inputValue();
        console.log('Textarea value:', textareaValue);

        // Check for any JavaScript errors
        const errors = [];
        page.on('pageerror', (error) => {
          console.log('❌ JavaScript Error:', error.message);
          errors.push(error.message);
        });

        // Test 3: Check for DOM mutations that might cause focus loss
        console.log('🔄 Test 3: Monitoring DOM changes in comments section...');

        // Listen for DOM changes specifically in comments section
        await page.evaluate(() => {
          window.commentChanges = [];
          const observer = new MutationObserver((mutationList) => {
            mutationList.forEach((mutation) => {
              const change = {
                type: mutation.type,
                timestamp: Date.now(),
                target: mutation.target.className || mutation.target.id || mutation.target.tagName,
                addedNodes: mutation.addedNodes.length,
                removedNodes: mutation.removedNodes.length
              };
              window.commentChanges.push(change);
              console.log('💫 Comments DOM Change:', change);
            });
          });

          // Observe the comments section
          const commentsSection = document.querySelector('.comments-section, #comments-list, [class*="comment"]');
          if (commentsSection) {
            observer.observe(commentsSection, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['class', 'style']
            });
            console.log('👁️  Started monitoring comments section for changes');
          } else {
            console.log('⚠️  Comments section not found for monitoring');
          }
        });

        // Click textarea again and monitor
        await commentTextarea.click();
        await page.waitForTimeout(2000);

        isFocused = await commentTextarea.evaluate(el => document.activeElement === el);
        console.log('Focus after second click:', isFocused);

        // Check for any AJAX requests
        const requests = [];
        page.on('request', (request) => {
          if (request.url().includes('/api/comments') || request.url().includes('comment')) {
            console.log('📡 AJAX Request:', request.method(), request.url());
            requests.push(request.url());
          }
        });

        // Get comment changes data
        const commentChangesData = await page.evaluate(() => ({
          changes: window.commentChanges || [],
          totalChanges: (window.commentChanges || []).length
        }));

        // Final results
        console.log('\n📊 COMMENT FOCUS LOSS TEST RESULTS:');
        console.log('- Initial focus after click:', isFocused);
        console.log('- JavaScript errors:', errors.length);
        console.log('- AJAX requests during test:', requests.length);
        console.log('- Textarea value preserved:', textareaValue === 'T');
        console.log('- Comments DOM changes:', commentChangesData.totalChanges);

        if (commentChangesData.totalChanges > 0) {
          console.log('💫 Comments section changed during textarea click!');
          console.log('📋 Changes detected:', commentChangesData.changes);
        }

        if (!isFocused) {
          console.log('❌ FOCUS LOSS DETECTED - This could cause keyboard to close!');
          if (commentChangesData.totalChanges > 0) {
            console.log('🔗 LIKELY CAUSE: Comments section refresh triggered focus loss');
          }
        } else {
          console.log('✅ Focus maintained - keyboard should stay open');
        }

      } else {
        console.log('❌ Textarea never gained focus initially');
      }

    } else {
      console.log('❌ No comment textarea found');
    }

  } catch (error) {
    console.error('❌ Focus test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 Focus loss test completed');
  }
}

// Run focus loss test
testCommentFocusLoss().catch(console.error);