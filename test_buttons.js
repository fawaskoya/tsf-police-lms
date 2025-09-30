// Comprehensive Button Testing Script for TSF Police LMS
// Tests all buttons across the entire site

const puppeteer = require('puppeteer');

async function testAllButtons() {
  console.log('🚀 Starting comprehensive button testing...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test login page buttons
    console.log('📝 TESTING LOGIN PAGE...');
    await testLoginPage(page);
    
    // Test admin dashboard buttons
    console.log('\n👨‍💼 TESTING ADMIN DASHBOARD...');
    await testAdminDashboard(page);
    
    // Test courses page buttons
    console.log('\n📚 TESTING COURSES PAGE...');
    await testCoursesPage(page);
    
    // Test users page buttons
    console.log('\n👥 TESTING USERS PAGE...');
    await testUsersPage(page);
    
    // Test exams page buttons
    console.log('\n📝 TESTING EXAMS PAGE...');
    await testExamsPage(page);
    
    // Test sessions page buttons
    console.log('\n🕐 TESTING SESSIONS PAGE...');
    await testSessionsPage(page);
    
    // Test certificates page buttons
    console.log('\n🏆 TESTING CERTIFICATES PAGE...');
    await testCertificatesPage(page);
    
    // Test reports page buttons
    console.log('\n📊 TESTING REPORTS PAGE...');
    await testReportsPage(page);
    
    // Test language switching
    console.log('\n🌐 TESTING LANGUAGE SWITCHING...');
    await testLanguageSwitching(page);
    
    // Test navigation buttons
    console.log('\n🧭 TESTING NAVIGATION...');
    await testNavigation(page);
    
    console.log('\n✅ ALL BUTTON TESTS COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

async function testLoginPage(page) {
  await page.goto('http://localhost:3000/ar/auth/login');
  await page.waitForSelector('button', { timeout: 10000 });
  
  // Test login form buttons
  const loginButton = await page.$('button[type="submit"]');
  if (loginButton) {
    console.log('  ✅ Login button found');
    
    // Fill form and test login
    await page.type('input[name="email"]', 'admin@kbn.local');
    await page.type('input[name="password"]', 'Passw0rd!');
    
    console.log('  🔄 Testing login button click...');
    await loginButton.click();
    await page.waitForNavigation({ timeout: 10000 });
    console.log('  ✅ Login successful');
  } else {
    console.log('  ❌ Login button not found');
  }
}

async function testAdminDashboard(page) {
  // Should be on admin dashboard after login
  await page.waitForSelector('[data-testid="dashboard-stats"]', { timeout: 10000 });
  
  // Test all dashboard cards and buttons
  const buttons = await page.$$('button');
  console.log(`  📊 Found ${buttons.length} buttons on dashboard`);
  
  // Test each button (clickable ones only)
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const isVisible = await button.isIntersectingViewport();
    const isEnabled = await button.isEnabled();
    
    if (isVisible && isEnabled) {
      const text = await button.textContent();
      console.log(`    ✅ Button ${i + 1}: "${text?.trim() || 'No text'}"`);
    }
  }
}

async function testCoursesPage(page) {
  await page.goto('http://localhost:3000/ar/admin/courses');
  await page.waitForSelector('table', { timeout: 10000 });
  
  // Test "New Course" button
  const newCourseBtn = await page.$('button:has-text("دورة جديدة")');
  if (newCourseBtn) {
    console.log('  ✅ New Course button found');
    console.log('  🔄 Testing New Course button...');
    await newCourseBtn.click();
    await page.waitForNavigation();
    console.log('  ✅ New Course page loaded');
    
    // Go back to courses list
    await page.goBack();
    await page.waitForSelector('table');
  }
  
  // Test course action buttons (dropdown menus)
  const actionButtons = await page.$$('[data-testid="course-actions"]');
  if (actionButtons.length > 0) {
    console.log(`  📋 Found ${actionButtons.length} course action buttons`);
    
    // Test first course's actions
    const firstAction = actionButtons[0];
    await firstAction.click();
    
    // Check dropdown items
    const dropdownItems = await page.$$('[role="menuitem"]');
    console.log(`    📋 Dropdown has ${dropdownItems.length} items`);
    
    // Click outside to close dropdown
    await page.click('body');
  }
}

async function testUsersPage(page) {
  await page.goto('http://localhost:3000/ar/admin/users');
  await page.waitForSelector('table', { timeout: 10000 });
  
  // Test "New User" button
  const newUserBtn = await page.$('button:has-text("مستخدم جديد")');
  if (newUserBtn) {
    console.log('  ✅ New User button found');
    console.log('  🔄 Testing New User button...');
    await newUserBtn.click();
    await page.waitForNavigation();
    console.log('  ✅ New User page loaded');
    
    // Go back
    await page.goBack();
    await page.waitForSelector('table');
  }
  
  // Test user action buttons
  const userActions = await page.$$('[data-testid="user-actions"]');
  if (userActions.length > 0) {
    console.log(`  👥 Found ${userActions.length} user action buttons`);
  }
}

async function testExamsPage(page) {
  await page.goto('http://localhost:3000/ar/admin/exams');
  await page.waitForSelector('table', { timeout: 10000 });
  
  // Test "New Exam" button
  const newExamBtn = await page.$('button:has-text("اختبار جديد")');
  if (newExamBtn) {
    console.log('  ✅ New Exam button found');
    console.log('  🔄 Testing New Exam button...');
    await newExamBtn.click();
    await page.waitForNavigation();
    console.log('  ✅ New Exam page loaded');
    
    // Go back
    await page.goBack();
    await page.waitForSelector('table');
  }
}

async function testSessionsPage(page) {
  await page.goto('http://localhost:3000/ar/admin/sessions');
  await page.waitForTimeout(3000); // Wait for page to load
  
  // Test "New Session" button
  const newSessionBtn = await page.$('button:has-text("جلسة جديدة")');
  if (newSessionBtn) {
    console.log('  ✅ New Session button found');
    console.log('  🔄 Testing New Session button...');
    await newSessionBtn.click();
    await page.waitForNavigation();
    console.log('  ✅ New Session page loaded');
    
    // Go back
    await page.goBack();
  } else {
    console.log('  ⚠️  New Session button not found (page might be empty)');
  }
}

async function testCertificatesPage(page) {
  await page.goto('http://localhost:3000/ar/admin/certificates');
  await page.waitForTimeout(3000);
  
  // Test certificate buttons
  const buttons = await page.$$('button');
  console.log(`  🏆 Found ${buttons.length} buttons on certificates page`);
}

async function testReportsPage(page) {
  await page.goto('http://localhost:3000/ar/admin/reports');
  await page.waitForTimeout(3000);
  
  // Test report buttons
  const buttons = await page.$$('button');
  console.log(`  📊 Found ${buttons.length} buttons on reports page`);
}

async function testLanguageSwitching(page) {
  // Test language switcher
  const langSwitcher = await page.$('[data-testid="language-switcher"]');
  if (langSwitcher) {
    console.log('  🌐 Language switcher found');
    
    // Test switching to English
    await langSwitcher.click();
    const englishOption = await page.$('text=English');
    if (englishOption) {
      await englishOption.click();
      await page.waitForNavigation();
      console.log('  ✅ Switched to English');
      
      // Test switching back to Arabic
      const langSwitcherEn = await page.$('[data-testid="language-switcher"]');
      if (langSwitcherEn) {
        await langSwitcherEn.click();
        const arabicOption = await page.$('text=العربية');
        if (arabicOption) {
          await arabicOption.click();
          await page.waitForNavigation();
          console.log('  ✅ Switched back to Arabic');
        }
      }
    }
  } else {
    console.log('  ⚠️  Language switcher not found');
  }
}

async function testNavigation(page) {
  // Test sidebar navigation
  const navItems = await page.$$('[data-testid="nav-item"]');
  console.log(`  🧭 Found ${navItems.length} navigation items`);
  
  // Test each navigation item
  for (let i = 0; i < navItems.length; i++) {
    const navItem = navItems[i];
    const text = await navItem.textContent();
    console.log(`    🔗 Navigation ${i + 1}: "${text?.trim() || 'No text'}"`);
    
    // Click navigation item
    try {
      await navItem.click();
      await page.waitForTimeout(1000);
      console.log(`    ✅ Navigation ${i + 1} clicked successfully`);
    } catch (error) {
      console.log(`    ❌ Navigation ${i + 1} click failed`);
    }
  }
}

// Run the tests
testAllButtons().catch(console.error);
