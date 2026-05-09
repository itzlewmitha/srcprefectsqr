/**
 * PrefectGate: Google Apps Script Integration
 * 
 * Instructions:
 * 1. Create a Google Form with fields: Name, Grade, Email.
 * 2. In the Google Form, go to 'Responses' > 'Link to Sheets'.
 * 3. In the Google Sheet, go to 'Extensions' > 'Apps Script'.
 * 4. Replace all code in 'Code.gs' with this content.
 * 5. Update the constants below with your Firestore info.
 * 6. Update the 'appsscript.json' (View > Show manifest file) with the scopes provided in the repo.
 * 7. Set up a trigger: 'Triggers' > 'Add Trigger' > Choose 'onFormSubmit' > 'From spreadsheet' > 'On form submit'.
 */

const PROJECT_ID = "rahulaweb-f4080";
const DATABASE_ID = "(default)";
const EMAIL_SUBJECT = "Prefect Registration Verified - Your ID Card";

/**
 * Main function triggered by form submission
 */
function onFormSubmit(e) {
  if (!e || !e.namedValues) {
    Logger.log("Error: This function must be triggered by a Form Submission, not run manually.");
    return;
  }
  const responses = e.namedValues;
  const name = responses['Name'][0];
  const grade = responses['Grade'][0];
  const email = responses['Email'][0];
  
  // Generate high-entropy identity
  const id = "PG-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  const token = Utilities.getUuid(); // Secure token for verification
  
  const prefectData = {
    id: id,
    name: name,
    grade: grade,
    email: email,
    status: 'active',
    token: token,
    createdAt: new Date().getTime()
  };

  try {
    // 1. Save to Firestore via REST API
    saveToFirestore(prefectData);

    // 2. Generate QR Code
    // Format: id|token (Teacher app will verify both)
    const qrPayload = `${id}|${token}`;
    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(qrPayload);
    
    // 3. Send Email
    sendConfirmationEmail(email, name, id, qrUrl);
    
  } catch (err) {
    Logger.log("Critical Error: " + err);
  }
}

/**
 * Saves data to Firestore using UrlFetchApp (No external library required)
 */
function saveToFirestore(data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/prefects/${data.id}`;
  
  // Map JS object to Firestore REST structure
  const payload = {
    fields: {
      id: { stringValue: data.id },
      name: { stringValue: data.name },
      grade: { stringValue: data.grade },
      email: { stringValue: data.email },
      status: { stringValue: data.status },
      token: { stringValue: data.token },
      createdAt: { integerValue: data.createdAt }
    }
  };

  const options = {
    method: "patch", // use patch to upsert
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`Firestore REST Error: ${JSON.stringify(result)}`);
  }
  
  Logger.log(`Successfully registered: ${data.id}`);
}

/**
 * Sends a clean, school-branded HTML email
 */
function sendConfirmationEmail(email, name, id, qrUrl) {
  const htmlBody = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 2px solid #e2e8f0; border-radius: 32px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #2563eb; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 30px; font-weight: bold; line-height: 60px;">P</div>
        <h2 style="color: #0f172a; margin-top: 15px; font-size: 24px; font-weight: 900; letter-spacing: -0.025em;">PREFECTGATE REGISTRATION</h2>
      </div>

      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
      <p style="background: #f0f9ff; padding: 20px; border-radius: 20px; border: 1px solid #bae6fd; color: #0369a1; font-weight: 600;">
        Your record has been successfully verified and saved to the school database.
      </p>
      
      <div style="text-align: center; margin: 40px 0; background: #f8fafc; padding: 40px; border-radius: 24px; border: 2px dashed #cbd5e1;">
        <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 15px;">Digital Identity Token</p>
        <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 8px solid white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />
        <p style="font-size: 32px; font-weight: 900; color: #0f172a; margin-top: 20px; letter-spacing: -0.05em;">${id}</p>
      </div>

      <div style="margin-top: 40px;">
        <h4 style="color: #0f172a; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Duty Instructions:</h4>
        <ul style="color: #475569; font-size: 14px; line-height: 1.8; padding-left: 20px;">
          <li>This QR code is required for all attendance scanning.</li>
          <li>Do not share this email or your token with others.</li>
          <li>Print this code or keep it accessible on your mobile device.</li>
        </ul>
      </div>

      <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 30px;">
        <h4 style="color: #0f172a; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Official Duty Periods:</h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
          <tr style="background: #f8fafc;">
            <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left; color: #64748b;">Category</th>
            <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left; color: #64748b;">Active Range</th>
          </tr>
          <tr><td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Morning Progress</td><td style="padding: 12px; border: 1px solid #e2e8f0;">07:00 – 10:30</td></tr>
          <tr><td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Interval Time</td><td style="padding: 12px; border: 1px solid #e2e8f0;">10:30 – 13:00</td></tr>
          <tr><td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">End of School</td><td style="padding: 12px; border: 1px solid #e2e8f0;">After 13:25</td></tr>
          <tr><td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Special Occasion</td><td style="padding: 12px; border: 1px solid #e2e8f0;">Events / Saturdays</td></tr>
        </table>
      </div>

      <p style="margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; font-weight: 600;">
        ENCRYPTED SYSTEM MESSAGE &bull; SCHOOL IDENTITY DIVISION
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: EMAIL_SUBJECT,
    htmlBody: htmlBody
  });
}
