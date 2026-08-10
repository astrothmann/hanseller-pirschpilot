<?php
declare(strict_types=1);

/*
 * Jagdkarte API – Hanseller Pirschpilot
 *
 * Serves the hunting ground map data (boundary + markers) for the static
 * Next.js frontend. Edit permissions are enforced HERE on the server.
 *
 * Endpoints (base path: /api/jagdmap.php):
 *   GET  ?action=data                    – map data; markers only with valid token
 *   POST ?action=login      {password}   – returns bearer token
 *   POST ?action=save       {data}       – persist boundary + markers (auth)
 *   GET  ?action=backup                  – download full data.json (auth)
 *   POST ?action=restore    (multipart)  – replace data from a backup (auth)
 *
 * The public ?action=data response always contains the boundary but only
 * includes markers when a valid admin token is supplied.
 *
 * Runtime data lives in <webroot>/jagdmap/ (data.json, sessions.json).
 */

const DATA_DIR = __DIR__ . '/../jagdmap';
const DATA_FILE = DATA_DIR . '/data.json';
const SESSIONS_FILE = DATA_DIR . '/sessions.json';
const STATIC_BOUNDARY_FILE = DATA_DIR . '/boundary.json';
const TOKEN_TTL = 60 * 60 * 24;        // 24h
const MAX_RESTORE_BYTES = 20 * 1024 * 1024;

const MARKER_TYPES = [
    'wildkamera',
    'salzlecke',
    'leitersitz',
    'jagdkanzel',
    'drueckjagdbock',
    'defekt',
];

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

    $createdAt = isset($m['createdAt']) && is_string($m['createdAt']) ? $m['createdAt'] : null;
    $updatedAt = isset($m['updatedAt']) && is_string($m['updatedAt']) ? $m['updatedAt'] : null;

    $abschuesse = [];
    if (isset($m['abschuesse']) && is_array($m['abschuesse'])) {
        foreach (array_slice($m['abschuesse'], 0, 500) as $a) {
            if (!is_array($a)) continue;
            $wildart = $a['wildart'] ?? null;
            $schuetze = $a['schuetze'] ?? null;
            $datum = $a['datum'] ?? null;
            if (!is_string($wildart) || $wildart === '' || mb_strlen($wildart) > 64) continue;
            if (!is_string($schuetze) || mb_strlen($schuetze) > 120) continue;
            if (!is_string($datum) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $datum)) continue;
            $abschuesse[] = [
                'wildart' => $wildart,
                'schuetze' => mb_substr($schuetze, 0, 120),
                'datum' => $datum,
            ];
        }
    }

    return [
        'id' => $id,
        'type' => $type,
        'name' => $name,
        'lat' => (float) $lat,
        'lng' => (float) $lng,
        'createdAt' => $createdAt,
        'updatedAt' => $updatedAt,
        'abschuesse' => $abschuesse,
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

/* Router ------------------------------------------------------------------ */

$action = $_GET['action'] ?? 'data';

switch ($action) {
    case 'data':
        $token = $_SERVER['HTTP_X_JAGDMAP_TOKEN'] ?? null;
        $data = read_data();
        if (!token_valid($token)) {
            $data['markers'] = [];
        }
        json_response(200, $data);

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
