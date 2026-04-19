# API Response Contract

Dokumen ini mendefinisikan kontrak response API untuk backend `ngl_clone` pada base path `/api/v1`.

## 1) Envelope Standar

Semua endpoint mengembalikan envelope JSON berikut:

### Success

```json
{
  "success": true,
  "code": "SOME_SUCCESS_CODE",
  "message": "human-readable message",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "code": "SOME_ERROR_CODE",
  "message": "human-readable message",
  "error": "detail error"
}
```

Catatan:
- Field `data` hanya muncul untuk success response.
- Field `error` hanya muncul untuk error response.
- `code` adalah string yang stabil untuk logic di frontend.

## 2) Auth API

Prefix: `/auth`

### POST /api/v1/auth/login

Request body:

```json
{
  "username": "admin",
  "password": "secret"
}
```

Success `200`:
- `code`: `LOGIN_SUCCESS`

```json
{
  "success": true,
  "code": "LOGIN_SUCCESS",
  "message": "login berhasil",
  "data": {
    "access_token": "<jwt_access>",
    "refresh_token": "<jwt_refresh>"
  }
}
```

Error:
- `400` `VALIDATION_ERROR`
- `401` `INVALID_CREDENTIALS`
- `500` `LOGIN_FAILED`

### POST /api/v1/auth/register

Request body:

```json
{
  "username": "admin2",
  "password": "secret123",
  "role": "admin"
}
```

Success `201`:
- `code`: `REGISTER_SUCCESS`

Error:
- `400` `VALIDATION_ERROR`
- `400` `REGISTER_FAILED`

### POST /api/v1/auth/refresh

Request body:

```json
{
  "refresh_token": "<jwt_refresh>"
}
```

Success `200`:
- `code`: `REFRESH_SUCCESS`
- `data`: `access_token`, `refresh_token`

Error:
- `400` `VALIDATION_ERROR`
- `401` `INVALID_REFRESH_TOKEN`

### POST /api/v1/auth/logout

Request body:

```json
{
  "refresh_token": "<jwt_refresh>"
}
```

Success `200`:
- `code`: `LOGOUT_SUCCESS`
- `data`: tidak ada

Error:
- `400` `VALIDATION_ERROR`
- `401` `INVALID_REFRESH_TOKEN`

### GET /api/v1/auth/validate

Tujuan endpoint ini adalah untuk mengecek apakah `access_token` masih valid.
Direkomendasikan dipanggil dari middleware frontend saat aplikasi inisialisasi, route guard, atau sebelum hit endpoint penting.

Request header:

```http
Authorization: Bearer <jwt_access>
```

Success `200`:
- `code`: `ACCESS_TOKEN_VALID`

```json
{
  "success": true,
  "code": "ACCESS_TOKEN_VALID",
  "message": "access token valid",
  "data": {
    "valid": true,
    "user_id": 1,
    "role": "admin",
    "expires_at": 1776485680
  }
}
```

Error:
- `401` `UNAUTHORIZED` (token kosong, expired, malformed, atau signature tidak valid)

## 3) Aspiration API

Public endpoint:
- `POST /api/v1/aspiration`

Admin endpoint:
- `GET /api/v1/admin/aspiration`
- `GET /api/v1/admin/aspiration/:id`
- `GET /api/v1/admin/aspiration/media/:id`
- `PATCH /api/v1/admin/aspiration/:id`
- `DELETE /api/v1/admin/aspiration/:id`

### Entity (response `data`)

```json
{
  "id": 1,
  "name": "Anon",
  "message": "Pesan",
  "file_path": "internal/storage/private/aspiration/file.png",
  "created_at": "2026-04-18T12:34:56Z",
  "updated_at": "2026-04-18T12:34:56Z"
}
```

### POST /api/v1/aspiration

Content-Type: `multipart/form-data`

Fields:
- `message` (required)
- `name` (optional)
- `file` (optional, image/video, max 15MB)

Success `200`:
- `code`: `ASPIRATION_CREATE_SUCCESS`

```json
{
  "success": true,
  "code": "ASPIRATION_CREATE_SUCCESS",
  "message": "aspiration created",
  "data": {
    "message": "Aspiration created",
    "id": 12
  }
}
```

Error:
- `400` `VALIDATION_ERROR`
- `400` `UPLOAD_MEDIA_FAILED`
- `500` `ASPIRATION_CREATE_FAILED`

### GET /api/v1/admin/aspiration

Success `200`:
- `code`: `ASPIRATION_LIST_SUCCESS`
- `data.items`: array Aspiration
- `data.pagination`: `{ page, limit, total, total_pages }`

Error:
- `500` `ASPIRATION_LIST_FAILED`

### GET /api/v1/admin/aspiration/:id

Success `200`:
- `code`: `ASPIRATION_GET_SUCCESS`
- `data`: Aspiration

Error:
- `400` `INVALID_ID`
- `500` `ASPIRATION_GET_FAILED`

### PATCH /api/v1/admin/aspiration/:id

Request body (JSON):

```json
{
  "name": "Anon",
  "message": "Pesan terbaru",
  "file_path": "..."
}
```

Success `200`:
- `code`: `ASPIRATION_UPDATE_SUCCESS`

Error:
- `400` `INVALID_ID`
- `400` `VALIDATION_ERROR`
- `500` `ASPIRATION_UPDATE_FAILED`

### DELETE /api/v1/admin/aspiration/:id

Success `200`:
- `code`: `ASPIRATION_DELETE_SUCCESS`

Error:
- `400` `INVALID_ID`
- `500` `ASPIRATION_DELETE_FAILED`

## 4) Menfess API

Public endpoint:
- `POST /api/v1/menfess`

Admin endpoint (butuh token + role admin):
- `GET /api/v1/admin/menfess`
- `GET /api/v1/admin/menfess/:id`
- `PATCH /api/v1/admin/menfess/:id`
- `DELETE /api/v1/admin/menfess/:id`
- `GET /api/v1/admin/menfess/image/:id`

### Entity (response `data`)

```json
{
  "id": 1,
  "to": "A",
  "from": "B",
  "message": "Halo",
  "created_at": "2026-04-18T12:34:56Z",
  "updated_at": "2026-04-18T12:34:56Z"
}
```

### Response codes

- List: `MENFESS_LIST_SUCCESS` | `MENFESS_LIST_FAILED` (`data.items` + `data.pagination`)
- Get by ID: `MENFESS_GET_SUCCESS` | `INVALID_ID` | `MENFESS_GET_FAILED`
- Create: `MENFESS_CREATE_SUCCESS` | `VALIDATION_ERROR` | `MENFESS_CREATE_FAILED`
- Update: `MENFESS_UPDATE_SUCCESS` | `INVALID_ID` | `VALIDATION_ERROR` | `MENFESS_UPDATE_FAILED`
- Delete: `MENFESS_DELETE_SUCCESS` | `INVALID_ID` | `MENFESS_DELETE_FAILED`
- Generate image: `MENFESS_IMAGE_SUCCESS` | `INVALID_ID` | `MENFESS_IMAGE_FAILED`

Generate image success `200` (`GET /api/v1/admin/menfess/image/:id`):

```json
{
  "success": true,
  "code": "MENFESS_IMAGE_SUCCESS",
  "message": "gambar telah dibuat",
  "data": {
    "path": "storage/private/menfess/png/result.png"
  }
}
```

## 5) Songfess API

Public endpoint:
- `POST /api/v1/songfess`

Admin endpoint (butuh token + role admin):
- `GET /api/v1/admin/songfess`
- `GET /api/v1/admin/songfess/:id`
- `PATCH /api/v1/admin/songfess/:id`
- `DELETE /api/v1/admin/songfess/:id`
- `GET /api/v1/admin/songfess/image/:id`

### Entity (response `data`)

```json
{
  "id": 1,
  "to": "A",
  "from": "B",
  "message": "Halo",
  "song_name": "Best Song",
  "created_at": "2026-04-18T12:34:56Z",
  "updated_at": "2026-04-18T12:34:56Z"
}
```

### Response codes

- List: `SONGFESS_LIST_SUCCESS` | `SONGFESS_LIST_FAILED` (`data.items` + `data.pagination`)
- Get by ID: `SONGFESS_GET_SUCCESS` | `INVALID_ID` | `SONGFESS_GET_FAILED`
- Create: `SONGFESS_CREATE_SUCCESS` | `VALIDATION_ERROR` | `SONGFESS_CREATE_FAILED`
- Update: `SONGFESS_UPDATE_SUCCESS` | `INVALID_ID` | `VALIDATION_ERROR` | `SONGFESS_UPDATE_FAILED`
- Delete: `SONGFESS_DELETE_SUCCESS` | `INVALID_ID` | `SONGFESS_DELETE_FAILED`
- Generate image: `SONGFESS_IMAGE_SUCCESS` | `INVALID_ID` | `SONGFESS_IMAGE_FAILED`

## 6) Middleware/AuthZ Error Codes

Untuk endpoint admin yang memakai middleware auth/role, error tambahan:

- `401` `UNAUTHORIZED`
- `403` `FORBIDDEN`

Contoh:

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "forbidden",
  "error": "forbidden"
}
```

## 7) Ringkasan Integrasi Frontend

Frontend sebaiknya selalu membaca:
- `success` untuk branching umum
- `code` untuk logic spesifik
- `message` untuk notifikasi user
- `error` untuk detail/telemetri

Prioritaskan `code` sebagai acuan stabil daripada parsing `message`.
