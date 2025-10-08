const { createEmailVerification, verifyEmailOTP, getEmailVerification } = require('./src/database-neon.ts');
const { sendVerificationEmail } = require('./src/email-service.ts');

async function testAdminVerification() {
  console.log('🧪 Testing Admin Verification System...\n');

  try {
    // Test 1: Create admin role change verification
    console.log('1. Creating admin role change verification...');
    const verification = await createEmailVerification(
      1, // admin user ID
      'admin@faithdefenders.com',
      'admin_role_change',
      '127.0.0.1',
      'Test User Agent'
    );

    console.log('✅ Verification created:', {
      id: verification.id,
      otp_code: verification.otp_code,
      purpose: verification.purpose,
      expires_at: verification.expires_at
    });

    // Test 2: Send verification email
    console.log('\n2. Sending verification email...');
    const emailResult = await sendVerificationEmail(
      'admin@faithdefenders.com',
      'Admin User',
      verification.otp_code,
      { USE_ETHEREAL_EMAIL: 'true' }
    );

    if (emailResult.success) {
      console.log('✅ Email sent successfully');
      if (emailResult.previewUrl) {
        console.log('📧 Preview URL:', emailResult.previewUrl);
      }
    } else {
      console.log('❌ Email failed:', emailResult.error);
    }

    // Test 3: Verify the token
    console.log('\n3. Verifying admin role change token...');
    const verifyResult = await verifyEmailOTP(1, verification.otp_code, 'admin_role_change');

    if (verifyResult.success) {
      console.log('✅ Token verified successfully');
      console.log('📝 Verification details:', verifyResult.verification);
    } else {
      console.log('❌ Token verification failed:', verifyResult.message);
    }

    // Test 4: Try to get pending verification
    console.log('\n4. Getting pending admin verifications...');
    const pendingVerification = await getEmailVerification(1, 'admin_role_change');

    if (pendingVerification) {
      console.log('✅ Found pending verification:', {
        id: pendingVerification.id,
        purpose: pendingVerification.purpose,
        verified_at: pendingVerification.verified_at
      });
    } else {
      console.log('ℹ️  No pending verifications found (expected after verification)');
    }

    console.log('\n🎉 Admin verification system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAdminVerification().catch(console.error);