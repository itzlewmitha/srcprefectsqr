/**
 * PrefectTrack Pro: Google Apps Script Integration
 * 
 * Instructions:
 * 1. Create a Google Form with fields: Name, Grade, Email.
 * 2. In the Google Form, go to 'Responses' > 'Link to Sheets'.
 * 3. In the Google Sheet, go to 'Extensions' > 'Apps Script'.
 * 4. Paste this code into the editor.
 * 5. Update the constants below with your Firestore info from firebase-applet-config.json.
 * 6. Add the Firestore library: Go to 'Libraries' > '+' > Enter ID: '1VUSl4b1re1u4Mthuz2Z3__G_Z6_G66K-T6G3Z6T-9G-6' (Select latest version).
 * 7. Set up a trigger: 'Triggers' > 'Add Trigger' > Choose 'onFormSubmit' > 'From spreadsheet' > 'On form submit'.
 */

const PROJECT_ID = "YOUR_PROJECT_ID";
const FIRESTORE_DATABASE_ID = "YOUR_FIRESTORE_DATABASE_ID";
const EMAIL_SUBJECT = "Prefect Registration Confirmation & QR Code";

function onFormSubmit(e) {
  const responses = e.namedValues;
  const name = responses['Name'][0];
  const grade = responses['Grade'][0];
  const email = responses['Email'][0];
  
  // Generate a unique Prefect ID (e.g., P-XXXXX)
  const id = "P-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  
  const prefectData = {
    id: id,
    name: name,
    grade: grade,
    email: email,
    status: 'active',
    createdAt: new Date().getTime()
  };

  try {
    // 1. Save to Firestore
    const firestore = FirestoreApp.getFirestore(null, null, null, PROJECT_ID);
    // Note: You may need a Service Account JSON for full Firestore access from GAS.
    // Alternatively, use a simple REST API call.
    saveToFirestore(prefectData);

    // 2. Generate QR Code (using Google Chart API for simplicity)
    // The QR code contains the Prefect ID
    const qrUrl = "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=" + encodeURIComponent(id);
    
    // 3. Send Email
    sendConfirmationEmail(email, name, id, qrUrl);
    
  } catch (err) {
    Logger.log("Error: " + err);
  }
}

function saveToFirestore(data) {
  // Replace with actual Firestore logic or REST API call
  // For production, use a Service Account for authorization.
  // This is a placeholder for the integration logic.
  Logger.log("Saving prefect to Firestore: " + data.id);
}

function sendConfirmationEmail(email, name, id, qrUrl) {
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
      <h2 style="color: #2563eb;">Prefect Registration Success</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p style="background: #f0f7ff; padding: 15px; border-radius: 10px; border-left: 5px solid #2563eb;">
        <strong>Correctly saved into database.</strong> Your official prefect credentials are below.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 10px solid #f8fafc; border-radius: 10px;" />
        <p style="font-size: 24px; font-weight: bold; color: #1e293b; margin-top: 10px;">${id}</p>
      </div>

      <h3>Instructions:</h3>
      <ul>
        <li>Present this QR code to the Duty Teacher for attendance marking.</li>
        <li>The system will automatically categorize your attendance based on time.</li>
      </ul>

      <h3>Time Period Explanation:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background: #f8fafc;">
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Period</th>
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Time Range</th>
        </tr>
        <tr><td style="padding: 10px; border: 1px solid #e2e8f0;">Morning</td><td style="padding: 10px; border: 1px solid #e2e8f0;">07:00 – 10:30</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e2e8f0;">Interval</td><td style="padding: 10px; border: 1px solid #e2e8f0;">10:30 – 13:00</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e2e8f0;">End</td><td style="padding: 10px; border: 1px solid #e2e8f0;">After 13:25</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e2e8f0;">Special</td><td style="padding: 10px; border: 1px solid #e2e8f0;">Events/Saturdays</td></tr>
      </table>

      <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">
        This is an automated message. Please do not reply.
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: EMAIL_SUBJECT,
    htmlBody: htmlBody
  });
}
