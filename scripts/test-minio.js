import { uploadToS3, getSignedS3Url } from "../lib/s3.js";

async function testMinio() {
    console.log("🚀 Testing MinIO Connectivity...");
    try {
        const testContent = "Hello MinIO! Test Date: " + new Date().toISOString();
        const testKey = "test/connectivity-check.txt";

        console.log("📤 Uploading test file...");
        await uploadToS3(Buffer.from(testContent), testKey, "text/plain");
        console.log("✅ Upload successful!");

        console.log("🔗 Generating signed URL...");
        const url = await getSignedS3Url(testKey, 60);
        console.log("✅ Signed URL generated:", url);

        return { success: true, url };
    } catch (error) {
        console.error("❌ MinIO Test Failed:", error);
        return { success: false, error: error.message };
    }
}

testMinio();
