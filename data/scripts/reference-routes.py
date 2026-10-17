"""Independent reference router that follows the Java SeaRouting algorithm.

Java itself cannot run in every environment (it needs a JDK and Maven), so this script
re-implements what SeaRouting.java does, straight from the GeoPackage files and without
using the TypeScript converter or engine:
  - one graph edge per GeoPackage line, between the line's two end points, weighted by the
    full line length
  - nodes at lon 180 linked to the node at lon -180 with a zero-weight edge
  - origin and destination snapped to the nearest node by planar distance in degrees
  - Dijkstra, edges tagged with an avoided pass are impassable
  - total distance = origin leg + path + destination leg
The only difference from Java is the length formula: haversine on a 6371 km sphere here,
WGS84 geodesic in Java (agreement within about 0.5 percent).

Usage: python -I data/scripts/reference-routes.py
Writes data/reference/voyages.json, which real-network.test.ts compares the engine against.
"""
import heapq, json, math, os, sqlite3, struct

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GPKG = os.path.join(ROOT, "modules/core/src/main/resources/marnet/marnet_plus_{}km.gpkg")
R = 6371.0

# SeaRouting.getRoute(oLon, oLat, dLon, dLat) default: only these four are blocked.
JAVA_DEFAULT_AVOID = ["kiel", "corinth", "northwest", "northeast"]

VOYAGES = [
    ("Marseille to Shanghai, no Suez", (5.3, 43.3), (121.8, 31.2), JAVA_DEFAULT_AVOID + ["suez"]),
    ("Marseille to Shanghai, Suez open", (5.3, 43.3), (121.8, 31.2), JAVA_DEFAULT_AVOID),
    ("Rotterdam to Singapore", (4.4, 51.95), (103.85, 1.26), JAVA_DEFAULT_AVOID),
    ("Rotterdam to New York", (4.4, 51.95), (-74.0, 40.65), JAVA_DEFAULT_AVOID),
    ("Singapore to Los Angeles", (103.85, 1.26), (-118.25, 33.7), JAVA_DEFAULT_AVOID),
    ("Shanghai to Rotterdam", (121.8, 31.2), (4.4, 51.95), JAVA_DEFAULT_AVOID),
    ("Santos to Qingdao", (-46.3, -23.95), (120.3, 36.05), JAVA_DEFAULT_AVOID),
    ("Houston to Rotterdam", (-95.0, 29.7), (4.4, 51.95), JAVA_DEFAULT_AVOID),
    ("Colon to Arzew (Java test 2)", (-79.904864, 9.34731), (-0.259368, 35.810036), JAVA_DEFAULT_AVOID),
    ("Bontang to Safaga (Java test 1)", (117.470056, 0.101287), (32.380686, 29.635942), JAVA_DEFAULT_AVOID),
    ("Durban to Fremantle", (31.05, -29.87), (115.74, -32.05), JAVA_DEFAULT_AVOID),
    ("Dubai to Mumbai", (55.27, 25.27), (72.85, 18.95), JAVA_DEFAULT_AVOID),
    ("Hamburg to Yokohama, no Panama no Suez", (9.97, 53.54), (139.65, 35.45), JAVA_DEFAULT_AVOID + ["panama", "suez"]),
    ("Los Angeles to Rotterdam, no Panama", (-118.25, 33.7), (4.4, 51.95), JAVA_DEFAULT_AVOID + ["panama"]),
]


def hav(a, b):
    p = math.pi / 180
    dlat, dlon = (b[1] - a[1]) * p, (b[0] - a[0]) * p
    h = math.sin(dlat / 2) ** 2 + math.cos(a[1] * p) * math.cos(b[1] * p) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def parse(blob):
    flags = blob[3]
    off = 8 + [0, 32, 48, 48, 64][(flags >> 1) & 7]
    end = "<" if blob[off] == 1 else ">"
    n = struct.unpack_from(end + "I", blob, off + 5)[0]
    return [struct.unpack_from(end + "dd", blob, off + 9 + 16 * i) for i in range(n)]


def build(res):
    nodes, adj = {}, {}
    def node(pt):
        pt = (pt[0], pt[1])
        if pt not in nodes:
            nodes[pt] = len(nodes)
            adj[nodes[pt]] = []
        return nodes[pt]
    for blob, pas in sqlite3.connect(GPKG.format(res)).execute("select geometry, pass from type"):
        pts = parse(blob)
        length = sum(hav(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
        a, b = node(pts[0]), node(pts[-1])
        adj[a].append((b, length, pas))
        adj[b].append((a, length, pas))
    for (x, y), i in list(nodes.items()):
        if x == 180:
            j = nodes.get((-180.0, y))
            if j is None:
                j = min(nodes.items(), key=lambda kv: (kv[0][0] + 180) ** 2 + (kv[0][1] - y) ** 2)[1]
            adj[i].append((j, 0.0, None))
            adj[j].append((i, 0.0, None))
    return nodes, adj


def snap(nodes, c):
    best, bi = 1e18, None
    for pt, i in nodes.items():
        d = math.hypot(pt[0] - c[0], pt[1] - c[1])
        if d == 0:
            return i, pt
        if d < best:
            best, bi, bp = d, i, pt
    return bi, bp


def route(nodes, adj, o, d, avoid):
    si, sp = snap(nodes, o)
    di, dp = snap(nodes, d)
    dist, prev, heap = {si: 0.0}, {}, [(0.0, si)]
    while heap:
        cd, u = heapq.heappop(heap)
        if cd > dist.get(u, 1e18):
            continue
        if u == di:
            break
        for v, w, pas in adj[u]:
            if pas in avoid:
                continue
            nd = cd + w
            if nd < dist.get(v, 1e18):
                dist[v], prev[v] = nd, (u, pas)
                heapq.heappush(heap, (nd, v))
    if di not in dist:
        return None
    passes, cur = set(), di
    while cur != si:
        cur, pas = prev[cur]
        if pas:
            passes.add(pas)
    return {
        "distanceKm": round(hav(o, sp) + dist[di] + hav(d, dp), 1),
        "passes": sorted(passes),
        "originNode": list(sp),
        "destinationNode": list(dp),
    }


def main():
    out = {"generator": "data/scripts/reference-routes.py", "javaDefaultAvoid": JAVA_DEFAULT_AVOID, "resolutions": {}}
    for res in (20, 100):
        nodes, adj = build(res)
        entries = []
        for name, o, d, avoid in VOYAGES:
            r = route(nodes, adj, o, d, set(avoid))
            entries.append({"name": name, "origin": list(o), "destination": list(d), "avoid": sorted(avoid), **(r or {"distanceKm": None})})
            print(res, name, entries[-1]["distanceKm"], entries[-1].get("passes"))
        out["resolutions"][str(res)] = entries
    with open(os.path.join(ROOT, "data/reference/voyages.json"), "w") as f:
        json.dump(out, f, indent=2)


main()
