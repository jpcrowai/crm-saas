from app.main import app
import json

routes = []
for route in app.routes:
    path = getattr(route, "path", "")
    methods = list(getattr(route, "methods", []))
    routes.append({"path": path, "methods": methods})

print(json.dumps(routes, indent=2))
