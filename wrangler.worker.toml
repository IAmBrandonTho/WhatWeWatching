name = "whatwewatching-signal"
main = "src/worker/worker.js"
compatibility_date = "2026-02-15"
# If you use Durable Objects later, add them here.
# If you bind R2/D1/etc for signaling, configure bindings in this file.

[vars]
# Optional: allow your Pages origin to be treated as an allowed CORS origin.
ALLOWED_ORIGIN = "https://whatwewatching.pages.dev"

[[durable_objects.bindings]]
name = "ROOMS"
class_name = "Room"

[[migrations]]
tag = "v3"
new_sqlite_classes = ["Room"]
