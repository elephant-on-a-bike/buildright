<?php
// Endpoint to accept an uploaded PDF file and email it as an attachment.
// Preferred: PHPMailer via SMTP (more reliable). This script will attempt
// to use PHPMailer if available; otherwise it will fall back to mail().

header('Content-Type: application/json');

function respond($ok, $message) {
    echo json_encode(['ok' => $ok, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Only POST allowed');
}

$recipient = isset($_POST['recipient']) ? trim($_POST['recipient']) : '';
if (!$recipient || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Invalid recipient');
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    respond(false, 'No file uploaded or upload error');
}

$tmpPath = $_FILES['file']['tmp_name'];
$filename = basename($_FILES['file']['name'] ?: 'project-scope.pdf');
$fileData = file_get_contents($tmpPath);
if ($fileData === false) respond(false, 'Could not read uploaded file');

// ========== PHPMailer configuration (edit for your SMTP) ==============
// To use PHPMailer, install it via Composer in your project root:
//   composer require phpmailer/phpmailer
// Or drop the PHPMailer src/ files into a `PHPMailer/` folder and adjust the
// autoload below.

// Example config (fill these values):
$usePHPMailer = true; // set to false to skip trying PHPMailer
$smtpConfig = [
    'host' => 'smtp.example.com',
    'username' => 'smtp-user@example.com',
    'password' => 'smtp-password',
    'port' => 587,
    'secure' => 'tls', // 'tls' or 'ssl' or ''
    'from_email' => 'no-reply@example.com',
    'from_name' => 'Project Scope'
];
// =======================================================================

$sentVia = null;

if ($usePHPMailer) {
    // Try to autoload Composer first
    if (file_exists(__DIR__ . '/vendor/autoload.php')) {
        require_once __DIR__ . '/vendor/autoload.php';
    } else {
        // Try direct PHPMailer src files if shipped manually
        if (file_exists(__DIR__ . '/PHPMailer/src/PHPMailer.php')) {
            require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
            require_once __DIR__ . '/PHPMailer/src/SMTP.php';
            require_once __DIR__ . '/PHPMailer/src/Exception.php';
        }
    }

    if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        try {
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            // Use SMTP if host provided
            if (!empty($smtpConfig['host'])) {
                $mail->isSMTP();
                $mail->Host = $smtpConfig['host'];
                $mail->SMTPAuth = true;
                $mail->Username = $smtpConfig['username'];
                $mail->Password = $smtpConfig['password'];
                $mail->SMTPSecure = $smtpConfig['secure'] ?: '';
                $mail->Port = $smtpConfig['port'] ?: 587;
            }

            $from = $smtpConfig['from_email'] ?: 'no-reply@example.com';
            $fromName = $smtpConfig['from_name'] ?: 'Project Scope';
            $mail->setFrom($from, $fromName);
            $mail->addAddress($recipient);
            $mail->Subject = 'Project scope PDF';
            $mail->Body = 'Please find the attached project scope PDF.';
            $mail->addStringAttachment($fileData, $filename, 'base64', 'application/pdf');

            $mail->send();
            respond(true, 'Email sent via PHPMailer');
        } catch (Exception $ex) {
            // fall through to mail() fallback with debug message
            $pmErr = $ex->getMessage();
            // continue to fallback
        }
    } else {
        // PHPMailer not available
        $pmErr = 'PHPMailer class not found (install via Composer or add PHPMailer src)';
    }
}

// Fallback: basic mail() multipart email
$boundary = md5(time());
$subject = 'Project scope PDF';
$from = isset($smtpConfig['from_email']) ? $smtpConfig['from_email'] : 'no-reply@example.com';
$headers = "From: " . $from . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"" . $boundary . "\"\r\n";

$message = "--" . $boundary . "\r\n";
$message .= "Content-Type: text/plain; charset=ISO-8859-1\r\n";
$message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$message .= "Please find the attached project scope PDF.\r\n";

$attachment = chunk_split(base64_encode($fileData));
$message .= "\r\n--" . $boundary . "\r\n";
$message .= "Content-Type: application/pdf; name=\"" . $filename . "\"\r\n";
$message .= "Content-Transfer-Encoding: base64\r\n";
$message .= "Content-Disposition: attachment; filename=\"" . $filename . "\"\r\n\r\n";
$message .= $attachment . "\r\n";
$message .= "--" . $boundary . "--";

$sent = mail($recipient, $subject, $message, $headers);
if ($sent) respond(true, 'Email sent via mail() fallback');

$msg = 'mail() returned false — email not sent (check your server SMTP configuration)';
if (isset($pmErr)) $msg .= ' | PHPMailer error: ' . $pmErr;
respond(false, $msg);
