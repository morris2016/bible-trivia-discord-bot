import { chromium } from 'playwright';

async function testMobileKeyboard() {
  console.log('🚀 Starting mobile keyboard test...');

  const browser = await chromium.launch({
    headless: false, // Set to false to see the browser
  });

  const context = await browser.newContext({
    viewport: { width: 720, height: 1600 }, // Tecno Camon 12 resolution (720x1600)
    userAgent: 'Mozilla/5.0 (Linux; Android 10; TECNO CD6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  try {
    console.log('📱 Navigating to gospelways.com login page...');
    await page.goto('https://gospelways.com/login');
    await page.waitForLoadState('networkidle');

    console.log('⌨️  Testing email input field...');

    // Wait for the sign-in email input to be visible
    const emailInput = page.locator('#signin-email');
    await emailInput.waitFor({ state: 'visible' });

    // Get initial viewport height
    const initialViewport = await page.viewportSize();
    console.log('Initial viewport:', initialViewport);

    // Touch/click on email input to trigger keyboard
    console.log('👆 Touching email input field...');
    await emailInput.click();
    await page.waitForTimeout(1000); // Wait for focus

    // MANUALLY SIMULATE KEYBOARD POPUP (like real mobile device)
    console.log('📱 Simulating keyboard popup by reducing viewport height...');
    await page.setViewportSize({ width: 720, height: 1200 }); // Simulate keyboard taking ~400px
    await page.waitForTimeout(500); // Wait for resize event

    // Check if keyboard detection triggered
    const keyboardAfterTouch = await page.evaluate(() => ({
      bodyClasses: document.body.className,
      viewportHeight: window.innerHeight,
      keyboardDetected: document.body.classList.contains('mobile-keyboard-active')
    }));
    console.log('After simulated keyboard popup:', keyboardAfterTouch);

    // Check for JavaScript errors
    const errors = [];
    page.on('pageerror', (error) => {
      console.log('❌ JavaScript Error:', error.message);
      errors.push(error.message);
    });

    // Simulate typing with virtual keyboard (character by character)
    console.log('⌨️  Simulating virtual keyboard typing...');
    await simulateVirtualKeyboardTyping(page, '#signin-email', 'siagmoo2018@gmail.com', 300);
    await page.waitForTimeout(500);

    // Check if input still has focus
    const isFocused = await emailInput.evaluate(el => document.activeElement === el);
    console.log('Email input still focused:', isFocused);

    // Test password field
    console.log('🔒 Testing password input field...');
    const passwordInput = page.locator('#signin-password');
    console.log('👆 Touching password input field...');
    await passwordInput.click();
    await page.waitForTimeout(1000); // Wait for focus

    // Simulate keyboard popup for password field
    console.log('📱 Simulating keyboard popup for password...');
    await page.setViewportSize({ width: 720, height: 1150 }); // Even smaller for password
    await page.waitForTimeout(500);

    // Check keyboard detection for password
    const passwordKeyboardState = await page.evaluate(() => ({
      bodyClasses: document.body.className,
      viewportHeight: window.innerHeight,
      keyboardDetected: document.body.classList.contains('mobile-keyboard-active')
    }));
    console.log('Password keyboard state:', passwordKeyboardState);

    // Simulate virtual keyboard typing for password
    await simulateVirtualKeyboardTyping(page, '#signin-password', 'Morris2016?', 250);
    await page.waitForTimeout(500);

    const passwordFocused = await passwordInput.evaluate(el => document.activeElement === el);
    console.log('Password input focused:', passwordFocused);

    // Check for mobile keyboard active class
    const bodyClasses = await page.locator('body').getAttribute('class');
    console.log('Body classes:', bodyClasses);

    // Check for any overlay elements that might interfere
    const overlays = await page.locator('.mobile-menu-overlay.active, .mobile-search-overlay.active').count();
    console.log('Active overlays:', overlays);

    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'mobile-keyboard-test.png', fullPage: true });
    console.log('📸 Screenshot saved as mobile-keyboard-test.png');

    // Log any errors found
    if (errors.length > 0) {
      console.log('❌ JavaScript errors detected:', errors);
    } else {
      console.log('✅ No JavaScript errors detected');
    }

    // Test results summary
    console.log('\n📊 Test Results:');
    console.log('- Email input focus:', isFocused ? '✅ Maintained' : '❌ Lost');
    console.log('- Password input focus:', passwordFocused ? '✅ Working' : '❌ Failed');
    console.log('- Keyboard detection class:', bodyClasses?.includes('mobile-keyboard-active') ? '✅ Detected' : '❌ Not detected');
    console.log('- Active overlays:', overlays > 0 ? '⚠️  May interfere' : '✅ None active');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 Test completed');
  }
}

// Test comment input fields with keyboard simulation
async function testCommentInputs() {
  console.log('💬 Testing comment input fields with keyboard simulation...');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 720, height: 1600 }, // Tecno Camon 12 resolution
    userAgent: 'Mozilla/5.0 (Linux; Android 11; TECNO CD6 Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    // Force mobile behavior
    screen: { width: 720, height: 1600 },
    deviceScaleFactor: 2.0,
  });

  const page = await context.newPage();

  // Add keyboard detection monitoring
  await page.evaluate(() => {
    window.keyboardEvents = [];
    window.originalViewportHeight = window.innerHeight;

    // Monitor resize events (keyboard appearance/disappearance)
    window.addEventListener('resize', () => {
      const heightDifference = window.originalViewportHeight - window.innerHeight;
      window.keyboardEvents.push({
        type: 'resize',
        timestamp: Date.now(),
        originalHeight: window.originalViewportHeight,
        currentHeight: window.innerHeight,
        heightDifference: heightDifference,
        bodyClasses: document.body.className
      });
      console.log('Keyboard resize detected:', {
        heightDifference,
        currentHeight: window.innerHeight,
        bodyClasses: document.body.className
      });
    });

    // Monitor focus events
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        window.keyboardEvents.push({
          type: 'focus',
          timestamp: Date.now(),
          target: e.target.tagName,
          targetId: e.target.id,
          targetClass: e.target.className,
          bodyClasses: document.body.className
        });
        console.log('Input focus detected:', {
          target: e.target.tagName,
          id: e.target.id,
          bodyClasses: document.body.className
        });
      }
    });

    // Monitor body class changes
    let lastBodyClasses = document.body.className;
    setInterval(() => {
      const currentClasses = document.body.className;
      if (currentClasses !== lastBodyClasses) {
        window.keyboardEvents.push({
          type: 'bodyClassChange',
          timestamp: Date.now(),
          from: lastBodyClasses,
          to: currentClasses
        });
        console.log('Body class changed:', { from: lastBodyClasses, to: currentClasses });
        lastBodyClasses = currentClasses;
      }
    }, 100);
  });

  try {
    // First login to access comment functionality
    console.log('🔐 Logging in to gospelways.com...');
    await page.goto('https://gospelways.com/login');
    await page.waitForLoadState('networkidle');

    // Fill login form slowly
    await typeSlowly(page, '#signin-email', 'siagmoo2018@gmail.com', 150);
    await typeSlowly(page, '#signin-password', 'Morris2016?', 150);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for login to complete - check for redirect or dashboard elements
    console.log('⏳ Waiting for login to complete...');
    try {
      await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 10000 });
      console.log('✅ Login redirect detected');
    } catch (error) {
      console.log('⚠️  Login redirect not detected, checking for dashboard elements...');
      // Check if we're already on dashboard or if login succeeded in another way
      const dashboardElement = page.locator('.dashboard-content, .page-title').filter({ hasText: /Welcome|Dashboard/i });
      try {
        await dashboardElement.waitFor({ timeout: 5000 });
        console.log('✅ Dashboard elements found - login successful');
      } catch (dashboardError) {
        console.log('❌ Login may have failed, but continuing test...');
      }
    }

    // Navigate to gospelways.com articles page
    console.log('📄 Navigating to gospelways.com articles page...');
    await page.goto('https://gospelways.com/articles');
    await page.waitForLoadState('networkidle');

    // Find first article link and click it
    const firstArticleLink = page.locator('.article-title a').first();
    if (await firstArticleLink.count() > 0) {
      console.log('📖 Opening first article...');
      await firstArticleLink.click();
      await page.waitForLoadState('networkidle');

      // Wait for comment system to load
      await page.waitForTimeout(2000);

      // Check for comment input field
      const commentInput = page.locator('#comment-input, .comment-input, textarea[name="comment"]');
      if (await commentInput.count() > 0) {
        console.log('💬 Found comment input field');

        // FIRST COMMENT TEST
        console.log('📝 Testing first comment...');

        // Touch comment input to trigger keyboard
        console.log('👆 Touching first comment input field...');
        await commentInput.first().click();
        await page.waitForTimeout(1000); // Wait for focus

        // MANUALLY SIMULATE KEYBOARD POPUP for comment
        console.log('📱 Simulating keyboard popup for comment input...');
        await page.setViewportSize({ width: 720, height: 1100 }); // Simulate larger keyboard for textarea
        await page.waitForTimeout(500);

        // Check if keyboard detection triggered for comment
        const commentKeyboardState1 = await page.evaluate(() => ({
          bodyClasses: document.body.className,
          viewportHeight: window.innerHeight,
          keyboardDetected: document.body.classList.contains('mobile-keyboard-active')
        }));
        console.log('Comment keyboard state after popup:', commentKeyboardState1);

        // Check if input is focused
        const isFocused1 = await commentInput.first().evaluate(el => document.activeElement === el);
        console.log('First comment input focused:', isFocused1);

        // Simulate virtual keyboard typing for comment
        await simulateVirtualKeyboardTyping(page, '#comment-input, .comment-input, textarea[name="comment"]', 'First test comment from mobile keyboard test', 400);
        await page.waitForTimeout(500);

        // Check if text was entered
        const inputValue1 = await commentInput.first().inputValue();
        console.log('First comment text entered:', inputValue1 ? '✅ Success' : '❌ Failed');

        // Check for keyboard detection and events
        const keyboardData1 = await page.evaluate(() => ({
          bodyClasses: document.body.className,
          viewportHeight: window.innerHeight,
          keyboardEvents: window.keyboardEvents || [],
          activeElement: document.activeElement ? {
            tagName: document.activeElement.tagName,
            id: document.activeElement.id,
            className: document.activeElement.className
          } : null
        }));

        console.log('After first comment focus:', {
          bodyClasses: keyboardData1.bodyClasses,
          viewportHeight: keyboardData1.viewportHeight,
          keyboardEvents: keyboardData1.keyboardEvents.length,
          activeElement: keyboardData1.activeElement
        });

        // Simulate keyboard appearance by changing viewport height
        console.log('🔽 Simulating keyboard appearance (reducing viewport height)...');
        await page.setViewportSize({ width: 375, height: 450 }); // Simulate keyboard taking up space
        await page.waitForTimeout(500);

        // Check if keyboard detection triggered
        const keyboardDataAfterSim1 = await page.evaluate(() => ({
          bodyClasses: document.body.className,
          viewportHeight: window.innerHeight,
          keyboardEvents: window.keyboardEvents || []
        }));

        console.log('After keyboard simulation:', {
          bodyClasses: keyboardDataAfterSim1.bodyClasses,
          viewportHeight: keyboardDataAfterSim1.viewportHeight,
          newEvents: keyboardDataAfterSim1.keyboardEvents.length - keyboardData1.keyboardEvents.length
        });

        // Try to submit the comment
        const submitButton = page.locator('button[type="submit"], .submit-comment, .comment-submit');
        if (await submitButton.count() > 0) {
          console.log('🔘 Submitting first comment...');
          await submitButton.first().click();
          await page.waitForTimeout(2000); // Wait for comment to be posted

          // Check if comment appeared
          const commentCount = await page.locator('.comment, .comment-item, [class*="comment"]').count();
          console.log('Comments visible after submit:', commentCount);
        }

        // SECOND COMMENT TEST - Wait and try again
        console.log('⏳ Waiting 3 seconds before second comment test...');
        await page.waitForTimeout(3000);

        console.log('📝 Testing second comment...');

        // Touch comment input again to trigger keyboard
        console.log('👆 Touching second comment input field...');
        await commentInput.first().click();
        await page.waitForTimeout(1000); // Wait for focus

        // Simulate keyboard popup for second comment
        console.log('📱 Simulating keyboard popup for second comment...');
        await page.setViewportSize({ width: 720, height: 1050 }); // Even smaller for second test
        await page.waitForTimeout(500);

        // Check keyboard detection for second comment
        const commentKeyboardState2 = await page.evaluate(() => ({
          bodyClasses: document.body.className,
          viewportHeight: window.innerHeight,
          keyboardDetected: document.body.classList.contains('mobile-keyboard-active')
        }));
        console.log('Second comment keyboard state:', commentKeyboardState2);

        // Check if input is focused (second time)
        const isFocused2 = await commentInput.first().evaluate(el => document.activeElement === el);
        console.log('Second comment input focused:', isFocused2);

        // Clear and simulate virtual keyboard typing for second comment
        await commentInput.first().clear();
        await simulateVirtualKeyboardTyping(page, '#comment-input, .comment-input, textarea[name="comment"]', 'Second test comment - checking keyboard behavior', 350);
        await page.waitForTimeout(500);

        // Check if text was entered (second time)
        const inputValue2 = await commentInput.first().inputValue();
        console.log('Second comment text entered:', inputValue2 ? '✅ Success' : '❌ Failed');

        // Check for keyboard detection and events (second time)
        const keyboardData2 = await page.evaluate(() => ({
          bodyClasses: document.body.className,
          viewportHeight: window.innerHeight,
          keyboardEvents: window.keyboardEvents || [],
          activeElement: document.activeElement ? {
            tagName: document.activeElement.tagName,
            id: document.activeElement.id,
            className: document.activeElement.className
          } : null
        }));

        console.log('After second comment focus:', {
          bodyClasses: keyboardData2.bodyClasses,
          viewportHeight: keyboardData2.viewportHeight,
          totalEvents: keyboardData2.keyboardEvents.length,
          activeElement: keyboardData2.activeElement
        });

        // Simulate keyboard appearance again
        console.log('🔽 Simulating keyboard appearance again...');
        await page.setViewportSize({ width: 375, height: 400 }); // Even smaller to trigger detection
        await page.waitForTimeout(500);

        // Check if keyboard detection triggered (second time)
        const keyboardDataAfterSim2 = await page.evaluate(() => ({
          bodyClasses: document.body.className,
          viewportHeight: window.innerHeight,
          keyboardEvents: window.keyboardEvents || []
        }));

        console.log('After second keyboard simulation:', {
          bodyClasses: keyboardDataAfterSim2.bodyClasses,
          viewportHeight: keyboardDataAfterSim2.viewportHeight,
          newEvents: keyboardDataAfterSim2.keyboardEvents.length - keyboardData2.keyboardEvents.length
        });

        // Take screenshots for comparison
        await page.screenshot({ path: 'mobile-comment-test-1.png' });
        console.log('📸 Screenshot 1 saved as mobile-comment-test-1.png');

        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'mobile-comment-test-2.png' });
        console.log('📸 Screenshot 2 saved as mobile-comment-test-2.png');

        // Final comprehensive check
        const finalData = await page.evaluate(() => ({
          bodyClasses: document.body.className,
          viewportHeight: window.innerHeight,
          totalKeyboardEvents: window.keyboardEvents ? window.keyboardEvents.length : 0,
          allKeyboardEvents: window.keyboardEvents || [],
          activeElement: document.activeElement ? {
            tagName: document.activeElement.tagName,
            id: document.activeElement.id
          } : null
        }));

        console.log('🎯 FINAL TEST RESULTS:', {
          bodyClasses: finalData.bodyClasses,
          viewportHeight: finalData.viewportHeight,
          totalEvents: finalData.totalKeyboardEvents,
          activeElement: finalData.activeElement
        });

        // Show summary of all keyboard events
        if (finalData.allKeyboardEvents.length > 0) {
          console.log('📋 All Keyboard Events Summary:');
          finalData.allKeyboardEvents.forEach((event, index) => {
            console.log(`  ${index + 1}. ${event.type} - ${new Date(event.timestamp).toLocaleTimeString()}`);
            if (event.type === 'resize') {
              console.log(`     Height: ${event.currentHeight}px (${event.heightDifference > 0 ? '+' : ''}${event.heightDifference}px)`);
            }
            if (event.bodyClasses) {
              console.log(`     Body classes: "${event.bodyClasses}"`);
            }
          });
        } else {
          console.log('❌ No keyboard events detected at all');
        }

        // Check viewport changes
        const finalViewport = await page.viewportSize();
        console.log('Final viewport size:', finalViewport);

      } else {
        console.log('❌ No comment input field found');
      }

    } else {
      console.log('❌ No articles found to test comments');
    }

  } catch (error) {
    console.error('❌ Comment test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 Comment test completed');
  }
}

// Function to simulate virtual keyboard typing (touchscreen behavior)
async function simulateVirtualKeyboardTyping(page, selector, text, delay = 300) {
  const element = await page.$(selector);
  if (!element) {
    console.log(`❌ Element ${selector} not found for virtual keyboard typing`);
    return;
  }

  console.log(`📱 Simulating virtual keyboard typing "${text}" (${delay}ms per key press)...`);

  // Clear the field first
  await element.fill('');

  // Simulate each key press on virtual keyboard
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    console.log(`   👆 Pressing virtual key: "${char}"`);

    // Use page.type() to simulate virtual keyboard input
    await page.type(selector, char, { delay: 50 }); // Small delay for key press simulation

    // Wait for keyboard detection to process
    await page.waitForTimeout(delay);

    // Check keyboard state after each key press
    const keyboardState = await page.evaluate(() => ({
      bodyClasses: document.body.className,
      viewportHeight: window.innerHeight,
      activeElement: document.activeElement ? document.activeElement.tagName : null
    }));

    console.log(`   📊 After "${char}": keyboard=${keyboardState.bodyClasses.includes('mobile-keyboard-active')}, height=${keyboardState.viewportHeight}px`);
  }

  console.log(`✅ Finished virtual keyboard typing: "${text}"`);
}

// Function to type text slowly character by character (for non-touch scenarios)
async function typeSlowly(page, selector, text, delay = 200) {
  const element = await page.$(selector);
  if (!element) {
    console.log(`❌ Element ${selector} not found for slow typing`);
    return;
  }

  console.log(`⌨️  Typing "${text}" slowly (${delay}ms per character)...`);

  // Clear the field first
  await element.fill('');

  // Type each character with delay
  for (let i = 0; i < text.length; i++) {
    await element.type(text[i]);
    await page.waitForTimeout(delay);
    console.log(`   Typed: "${text.substring(0, i + 1)}"`);
  }

  console.log(`✅ Finished typing: "${text}"`);
}

// Test for comment textarea focus loss issue
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

    // Check what's on the articles page first
    console.log('🔍 Checking articles page structure...');
    const pageContent = await page.evaluate(() => {
      const articles = document.querySelectorAll('.article-card, .article-link, [class*="article"]');
      const comments = document.querySelectorAll('.comments-section, #comments-list, [class*="comment"]');
      const forms = document.querySelectorAll('form, textarea, input');

      return {
        articlesCount: articles.length,
        commentsCount: comments.length,
        formsCount: forms.length,
        bodyHTML: document.body.innerHTML.substring(0, 1000) + '...'
      };
    });

    console.log('📊 Page structure:', pageContent);

    // Look for actual article links with href attributes
    console.log('🔍 Looking for article links with href...');
    const articleLinks = await page.locator('a[href*="/articles/"], a[href*="/article/"]').all();

    if (articleLinks.length > 0) {
      const firstLink = articleLinks[0];
      const articleHref = await firstLink.getAttribute('href');
      const articleText = await firstLink.textContent();
      console.log('📝 Found article link:', { href: articleHref, text: articleText?.substring(0, 50) });

      console.log('🖱️  Clicking article link...');
      await firstLink.click();

      // Wait for navigation
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
      } catch (e) {
        console.log('⚠️  Navigation timeout, might be dynamic content');
      }

      await page.waitForTimeout(3000); // Wait for dynamic content
    } else {
      console.log('❌ No article links found, trying direct navigation...');

      // Try navigating directly to a common article URL pattern
      const testUrls = [
        'https://gospelways.com/articles/1',
        'https://gospelways.com/article/1',
        'https://gospelways.com/articles/test-article'
      ];

      for (const testUrl of testUrls) {
        try {
          console.log(`🔗 Trying direct navigation to: ${testUrl}`);
          await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 5000 });
          await page.waitForTimeout(2000);

          const hasComments = await page.locator('.comments-section, #comments-list').count();
          if (hasComments > 0) {
            console.log('✅ Found comments on:', testUrl);
            break;
          } else {
            console.log('❌ No comments on:', testUrl);
          }
        } catch (e) {
          console.log('❌ Failed to navigate to:', testUrl);
        }
      }
    }

    // Continue with the rest of the test if we found an article page with comments
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    console.log('💬 Testing comment textarea focus behavior...');

    // Check page structure after navigation
    const articlePageContent = await page.evaluate(() => {
      const textareas = document.querySelectorAll('textarea');
      const commentForms = document.querySelectorAll('.comment-form, #main-comment-form, [class*="comment"]');
      const inputs = document.querySelectorAll('input');

      return {
        textareasCount: textareas.length,
        commentFormsCount: commentForms.length,
        inputsCount: inputs.length,
        url: window.location.href,
        title: document.title
      };
    });

    console.log('📄 Article page structure:', articlePageContent);

    // Find comment textarea with more specific selectors
    const commentTextarea = page.locator('textarea.comment-input, #main-comment-form textarea, textarea[name="content"]').first();

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
        console.log('🔄 Test 3: Monitoring DOM changes...');

        // Listen for DOM changes
        const mutations = [];
        await page.evaluate(() => {
          const observer = new MutationObserver((mutationList) => {
            mutationList.forEach((mutation) => {
              mutationList.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                  console.log('DOM Change: New elements added');
                }
                if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                  console.log('DOM Change: Elements removed');
                }
              });
            });

            // Observe the comments section
            const commentsSection = document.querySelector('.comments-section, #comments-list');
            if (commentsSection) {
              observer.observe(commentsSection, {
                childList: true,
                subtree: true
              });
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

        // Final results
        console.log('\n📊 FOCUS LOSS TEST RESULTS:');
        console.log('- Initial focus after click:', isFocused);
        console.log('- JavaScript errors:', errors.length);
        console.log('- AJAX requests during test:', requests.length);
        console.log('- Textarea value preserved:', textareaValue === 'T');

        if (!isFocused) {
          console.log('❌ FOCUS LOSS DETECTED - This could cause keyboard to close!');
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

  } catch (error) {
    console.error('❌ Focus test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 Focus loss test completed');
  }
}

// Run focus loss test
testCommentFocusLoss().catch(console.error);