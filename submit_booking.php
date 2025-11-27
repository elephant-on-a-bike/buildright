<?php
// Minimal endpoint to append booking JSON to archive/requests.jsonl
// Accepts JSON POST body. Saves base64 images as separate files if present.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

try {
    // Optional token protection for basic abuse prevention
    $expectedToken = getenv('BOOKING_TOKEN'); // set in environment or .htaccess; leave null to disable
    $token = $_SERVER['HTTP_X_BOOKING_TOKEN'] ?? null;
    if ($expectedToken && (!$token || !hash_equals($expectedToken, $token))) {
        throw new Exception('Unauthorized');
    }
    // Support multipart/form-data uploads with files and fields
    $data = [
        'trade' => $_POST['trade'] ?? null,
        'region' => $_POST['region'] ?? null,
        'description' => $_POST['description'] ?? null,
        'jobs' => isset($_POST['jobs']) ? (is_array($_POST['jobs']) ? $_POST['jobs'] : [$_POST['jobs']]) : [],
        'userId' => $_POST['userId'] ?? null,
    ];

    $dir = __DIR__ . DIRECTORY_SEPARATOR . 'archive';
    if (!is_dir($dir)) { mkdir($dir, 0775, true); }

    // Save uploaded files from $_FILES
    $saved = [];
    if (!empty($_FILES['photos'])) {
        $files = $_FILES['photos'];
        $count = is_array($files['name']) ? count($files['name']) : 0;
        for ($i = 0; $i < $count; $i++) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) { continue; }
            $tmp = $files['tmp_name'][$i];
            $name = $files['name'][$i];
            $ext = pathinfo($name, PATHINFO_EXTENSION);
            if (!$ext) { $ext = 'png'; }
            $fname = 'photo_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $dest = $dir . DIRECTORY_SEPARATOR . $fname;
            if (move_uploaded_file($tmp, $dest)) {
                $saved[] = 'archive/' . $fname;
            }
        }
    }
    if ($saved) { $data['photo_files'] = $saved; }

    $data['saved_at'] = date('c');
    $line = json_encode($data, JSON_UNESCAPED_SLASHES) . "\n";
    file_put_contents($dir . DIRECTORY_SEPARATOR . 'requests.jsonl', $line, FILE_APPEND);

    echo json_encode(['ok' => true, 'message' => 'Saved', 'path' => 'archive/requests.jsonl', 'photos' => $data['photo_files'] ?? []]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>