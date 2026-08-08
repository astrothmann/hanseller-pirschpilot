<?php
declare(strict_types=1);

/*
 * Jagdkarte API – Hanseller Pirschpilot
 *
 * Serves the hunting ground map data (boundary + markers + photos) for the
 * static Next.js frontend. Edit permissions are enforced HERE on the server.
 *
 * Endpoints (base path: /api/jagdmap.php):
 *   GET  ?action=data                    – public map data (boundary, markers)
 *   POST ?action=login      {password}   – returns bearer token
 *   POST ?action=save       {data}       – persist boundary + markers (auth)
 *   POST ?action=upload     (multipart)  – store a photo, returns URL (auth)
 *   POST ?action=delete-photo {url}      – remove a photo (auth)
 *   GET  ?action=backup                  – download full data.json (auth)
 *   POST ?action=restore    (multipart)  – replace data from a backup (auth)
 *
 * Runtime data lives in <webroot>/jagdmap/ (data.json, sessions.json, uploads/).
 */

const DATA_DIR = __DIR__ . '/../jagdmap';
const DATA_FILE = DATA_DIR . '/data.json';
const SESSIONS_FILE = DATA_DIR . '/sessions.json';
const UPLOADS_DIR = DATA_DIR . '/uploads';
const STATIC_BOUNDARY_FILE = DATA_DIR . '/boundary.json';
const TOKEN_TTL = 60 * 60 * 24;        // 24h
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_RESTORE_BYTES = 20 * 1024 * 1024;

const MARKER_TYPES = [
    'wildkamera',
    'salzlecke',
    'leitersitz',
    'jagdkanzel',
    'drueckjagdbock',
    'defekt',
];

const PHOTO_URL_RE = '#^/jagdmap/uploads/[A-Za-z0-9._-]+$#';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/* --------------------------------------------------------------------------
 * CORS – only needed during local development (Next on :3000, PHP on :8081).
 * In production the app is served same-origin from the same webspace.
 * ------------------------------------------------------------------------ */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isDevOrigin = in_array($origin, ['http://localhost:3000', 'http://127.0.0.1:3000'], true)
    || preg_match('#^http://(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):3000$#', $origin) === 1;
if ($isDevOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Jagdmap-Token');
    header('Access-Control-Max-Age: 600');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/* --------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------ */

function json_response(int $status, $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function error_response(int $status, string $message): never
{
    json_response($status, ['error' => $message]);
}

function ensure_dirs(): void
{
    if (!is_dir(DATA_DIR)) @mkdir(DATA_DIR, 0775, true);
    if (!is_dir(UPLOADS_DIR)) @mkdir(UPLOADS_DIR, 0775, true);
}

function default_data(): array
{
    return ['version' => 1, 'boundary' => null, 'markers' => [], 'updatedAt' => null];
}

/**
 * The revier boundary is shipped as a static, versioned file (boundary.json)
 * and is always authoritative. It is merged on read and never written back,
 * so live marker edits in data.json are never clobbered by deploys.
 */
function read_static_boundary(): ?array
{
    if (!is_file(STATIC_BOUNDARY_FILE)) return null;
    $raw = @file_get_contents(STATIC_BOUNDARY_FILE);
    if ($raw === false) return null;
    $b = json_decode($raw, true);
    if (!is_array($b)) return null;
    return normalize_boundary($b);
}

function read_data(): array
{
    if (!is_file(DATA_FILE)) return default_data();
    $raw = @file_get_contents(DATA_FILE);
    if ($raw === false) return default_data();
    $d = json_decode($raw, true);
    $d = is_array($d) ? $d : default_data();
    $d['boundary'] = read_static_boundary() ?? ($d['boundary'] ?? null);
    return $d;
}

function write_data(array $d): bool
{
    ensure_dirs();
    $payload = json_encode(
        $d,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    if ($payload === false) return false;
    $tmp = DATA_FILE . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (@file_put_contents($tmp, $payload) === false) return false;
    @chmod($tmp, 0664);
    if (!@rename($tmp, DATA_FILE)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

/* Sessions / auth --------------------------------------------------------- */

function read_sessions(): array
{
    if (!is_file(SESSIONS_FILE)) return [];
    $raw = @file_get_contents(SESSIONS_FILE);
    if ($raw === false) return [];
    $s = json_decode($raw, true);
    return is_array($s) ? $s : [];
}

function write_sessions(array $s): bool
{
    ensure_dirs();
    $payload = json_encode($s);
    if ($payload === false) return false;
    return @file_put_contents(SESSIONS_FILE, $payload, LOCK_EX) !== false;
}

function prune_sessions(): array
{
    $s = read_sessions();
    $now = time();
    $changed = false;
    foreach ($s as $token => $expiry) {
        if (!is_int($expiry) || $expiry < $now) {
            unset($s[$token]);
            $changed = true;
        }
    }
    if ($changed) write_sessions($s);
    return $s;
}

function create_token(): string
{
    $s = prune_sessions();
    $token = bin2hex(random_bytes(32));
    $s[$token] = time() + TOKEN_TTL;
    write_sessions($s);
    return $token;
}

function token_valid(?string $token): bool
{
    if ($token === null || $token === '' || !preg_match('/^[a-f0-9]{64}$/', $token)) {
        return false;
    }
    $s = prune_sessions();
    return isset($s[$token]) && $s[$token] >= time();
}

function require_auth(): string
{
    $token = $_SERVER['HTTP_X_JAGDMAP_TOKEN'] ?? null;
    if (!token_valid($token)) {
        error_response(401, 'Nicht angemeldet oder Sitzung abgelaufen');
    }
    return (string) $token;
}

function login_success(): string
{
    $given = json_decode((string) file_get_contents('php://input'), true);
    $givenPassword = is_array($given) && isset($given['password']) ? (string) $given['password'] : '';

    $expected = getenv('JAGDMAP_PASSWORD');
    if ($expected === false || $expected === '') {
        $expected = 'pirsch123';
    }

    if (!hash_equals(hash('sha256', $expected), hash('sha256', $givenPassword))) {
        error_response(401, 'Falsches Passwort');
    }
    return create_token();
}

/* Validation -------------------------------------------------------------- */

function is_valid_lat_lng($lat, $lng): bool
{
    if (!is_numeric($lat) || !is_numeric($lng)) return false;
    $lat = (float) $lat;
    $lng = (float) $lng;
    return $lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180;
}

function normalize_boundary($b): ?array
{
    if ($b === null) return null;
    if (!is_array($b) || count($b) < 3) return null;
    $out = [];
    foreach ($b as $pt) {
        if (!is_array($pt) || count($pt) < 2) return null;
        $lat = $pt[0] ?? null;
        $lng = $pt[1] ?? null;
        if (!is_valid_lat_lng($lat, $lng)) return null;
        $out[] = [(float) $lat, (float) $lng];
    }
    return $out;
}

function normalize_marker($m): ?array
{
    if (!is_array($m)) return null;
    $id = $m['id'] ?? null;
    if (!is_string($id) || $id === '' || strlen($id) > 64) return null;

    $type = $m['type'] ?? null;
    if (!is_string($type) || !in_array($type, MARKER_TYPES, true)) return null;

    $lat = $m['lat'] ?? null;
    $lng = $m['lng'] ?? null;
    if (!is_valid_lat_lng($lat, $lng)) return null;

    $name = isset($m['name']) && is_string($m['name'])
        ? mb_substr($m['name'], 0, 120)
        : '';
    $note = isset($m['note']) && is_string($m['note'])
        ? mb_substr($m['note'], 0, 2000)
        : '';

    $photos = [];
    if (isset($m['photos']) && is_array($m['photos'])) {
        foreach (array_slice($m['photos'], 0, 30) as $p) {
            if (is_string($p) && preg_match(PHOTO_URL_RE, $p)) {
                $photos[] = $p;
            }
        }
    }

    $createdAt = isset($m['createdAt']) && is_string($m['createdAt']) ? $m['createdAt'] : null;
    $updatedAt = isset($m['updatedAt']) && is_string($m['updatedAt']) ? $m['updatedAt'] : null;

    return [
        'id' => $id,
        'type' => $type,
        'name' => $name,
        'note' => $note,
        'lat' => (float) $lat,
        'lng' => (float) $lng,
        'photos' => $photos,
        'createdAt' => $createdAt,
        'updatedAt' => $updatedAt,
    ];
}

function normalize_data(array $d): ?array
{
    $boundary = normalize_boundary($d['boundary'] ?? null);
    if (array_key_exists('boundary', $d) && $boundary === null && ($d['boundary'] ?? null) !== null) {
        return null;
    }

    $markers = [];
    if (isset($d['markers']) && is_array($d['markers'])) {
        foreach (array_slice($d['markers'], 0, 1000) as $m) {
            $nm = normalize_marker($m);
            if ($nm !== null) $markers[] = $nm;
        }
    }

    return [
        'version' => 1,
        'boundary' => $boundary,
        'markers' => $markers,
        'updatedAt' => $d['updatedAt'] ?? null,
    ];
}

/* Photo upload ------------------------------------------------------------ */

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif'];
const ALLOWED_MIME = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/gif',
];

function handle_upload(): array
{
    $f = $_FILES['photo'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK) {
        error_response(400, 'Keine Datei empfangen');
    }
    if ($f['size'] > MAX_UPLOAD_BYTES) {
        error_response(413, 'Datei ist zu groß (max. 12 MB)');
    }
    $ext = strtolower((string) pathinfo($f['name'] ?? '', PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXT, true)) {
        error_response(415, 'Nur Bilder (jpg, png, webp, heic, gif) erlaubt');
    }
    $mime = $f['type'] ?? '';
    if (function_exists('finfo_open')) {
        $fi = finfo_open(FILEINFO_MIME_TYPE);
        $detected = finfo_file($fi, $f['tmp_name']);
        if ($detected !== false) $mime = $detected;
    }
    if (!in_array($mime, ALLOWED_MIME, true)) {
        error_response(415, 'Ungültiges Dateiformat');
    }

    ensure_dirs();
    $name = bin2hex(random_bytes(12)) . '.' . $ext;
    $dest = UPLOADS_DIR . '/' . $name;
    if (!@move_uploaded_file($f['tmp_name'], $dest)) {
        error_response(500, 'Upload konnte nicht gespeichert werden');
    }
    @chmod($dest, 0664);
    return ['ok' => true, 'url' => '/jagdmap/uploads/' . $name];
}

function handle_delete_photo(): void
{
    require_auth();
    $body = json_decode((string) file_get_contents('php://input'), true);
    $url = is_array($body) && isset($body['url']) ? (string) $body['url'] : '';
    if (!preg_match(PHOTO_URL_RE, $url)) {
        error_response(400, 'Ungültiger Pfad');
    }
    $file = UPLOADS_DIR . '/' . basename($url);
    if (is_file($file)) @unlink($file);
    json_response(200, ['ok' => true]);
}

/* Router ------------------------------------------------------------------ */

$action = $_GET['action'] ?? 'data';

switch ($action) {
    case 'data':
        json_response(200, read_data());

    case 'login':
        $token = login_success();
        json_response(200, ['ok' => true, 'token' => $token]);

    case 'save':
        require_auth();
        $body = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($body)) {
            error_response(400, 'Ungültige Daten');
        }
        $data = normalize_data($body);
        if ($data === null) {
            error_response(400, 'Ungültige Kartendaten');
        }
        $data['updatedAt'] = gmdate('c');
        if (!write_data($data)) {
            error_response(500, 'Daten konnten nicht gespeichert werden');
        }
        json_response(200, ['ok' => true, 'updatedAt' => $data['updatedAt']]);

    case 'upload':
        require_auth();
        json_response(200, handle_upload());

    case 'delete-photo':
        handle_delete_photo();

    case 'backup':
        require_auth();
        header('Content-Disposition: attachment; filename="jagdkarte-backup-'
            . date('Ymd-His') . '.json"');
        echo json_encode(
            read_data(),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;

    case 'restore':
        require_auth();
        $f = $_FILES['file'] ?? null;
        if (!$f || $f['error'] !== UPLOAD_ERR_OK || $f['size'] > MAX_RESTORE_BYTES) {
            error_response(400, 'Keine Sicherungsdatei empfangen');
        }
        $raw = @file_get_contents($f['tmp_name']);
        $parsed = json_decode((string) $raw, true);
        if (!is_array($parsed)) {
            error_response(400, 'Ungültige Sicherungsdatei');
        }
        $data = normalize_data($parsed);
        if ($data === null) {
            error_response(400, 'Sicherung enthält ungültige Daten');
        }
        $data['updatedAt'] = gmdate('c');
        if (!write_data($data)) {
            error_response(500, 'Sicherung konnte nicht gespeichert werden');
        }
        json_response(200, ['ok' => true]);

    default:
        error_response(404, 'Unbekannte Aktion');
}
