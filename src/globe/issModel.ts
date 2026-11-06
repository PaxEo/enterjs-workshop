// Stilisiertes 3D-Modell der ISS aus three.js-Grundkörpern, ohne externe Modelldatei.
// Koordinaten wie im Objekt-Layer von globe.gl: +X = Osten, +Y = Norden (Flugrichtung bei Drehung 0), +Z = vom Erdmittelpunkt weg.
// Maßstab: Gitterträger (Truss) = 1 Einheit, die tatsächliche Größe setzt GlobeView per scale.
import * as THREE from 'three';

const metal = new THREE.MeshLambertMaterial({ color: '#b9bec8' });
const module = new THREE.MeshLambertMaterial({ color: '#eef0f3' });
const solar = new THREE.MeshLambertMaterial({ color: '#c08a2e', emissive: '#3a2508', side: THREE.DoubleSide });
const radiator = new THREE.MeshLambertMaterial({ color: '#f7f7f7', side: THREE.DoubleSide });

function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
}

/** Zylinder entlang der Y-Achse (Flugrichtung) oder, mit `alongX`, entlang des Trägers */
function cylinder(radius: number, length: number, x: number, y: number, z: number, alongX = false) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 16), module);
  mesh.position.set(x, y, z);
  if (alongX) mesh.rotation.z = Math.PI / 2;
  return mesh;
}

export function createIssModel(): THREE.Group {
  const iss = new THREE.Group();
  iss.name = 'ISS';

  // Integrierter Gitterträger quer zur Flugrichtung
  iss.add(box(1, 0.035, 0.035, metal));

  // Vier Solarflügelpaare an den Trägerenden, jeder Flügel ragt nach vorn bzw. hinten
  for (const x of [-0.46, -0.36, 0.36, 0.46]) {
    for (const side of [-1, 1]) {
      iss.add(box(0.075, 0.3, 0.004, solar, x, side * 0.19, 0));
    }
  }

  // Radiatoren nahe der Mitte
  for (const x of [-0.2, 0.2]) iss.add(box(0.05, 0.16, 0.004, radiator, x, 0, -0.03));

  // Druckmodule unterhalb des Trägers entlang der Flugrichtung (US-Segment vorn, russisches Segment hinten)
  const z = -0.06;
  iss.add(cylinder(0.028, 0.42, 0, 0, z));
  iss.add(cylinder(0.022, 0.2, 0, -0.3, z));
  // Querverbindung mit europäischem und japanischem Labor
  iss.add(cylinder(0.026, 0.28, 0, 0.14, z, true));
  // Verbindungsstrebe zwischen Träger und Modulen
  iss.add(box(0.02, 0.02, 0.06, metal, 0, 0, -0.03));

  // Astronaut beim Außenbordeinsatz, gesichert mit einer Leine am Träger
  const tetherAnchor = new THREE.Vector3(0.18, 0, 0.018);
  const { figure: astronaut, waveArm, leak } = createAstronaut();
  const evaBase = new THREE.Vector3(0.26, 0.05, 0.06);
  astronaut.position.copy(evaBase);
  iss.add(astronaut);
  const tetherGeometry = new THREE.BufferGeometry().setFromPoints([tetherAnchor, evaBase]);
  iss.add(new THREE.Line(tetherGeometry, new THREE.LineBasicMaterial({ color: '#f2c94c' })));

  // Gelbe Flüssigkeit tritt aus einem Leck im Anzug aus: Tropfen treiben im ISS-Bezugssystem davon
  const droplets = createDroplets();
  iss.add(droplets.group);
  const leakPoint = new THREE.Vector3();

  // Schweben, Winken und Leck: von GlobeView pro Frame aufgerufen
  iss.userData.animate = (timeMs: number) => {
    const t = timeMs / 1000;
    astronaut.position.set(evaBase.x + Math.sin(t * 0.7) * 0.006, evaBase.y + Math.sin(t * 0.5) * 0.008, evaBase.z + Math.sin(t * 0.9) * 0.004);
    astronaut.rotation.set(0.5 + Math.sin(t * 0.4) * 0.15, Math.sin(t * 0.3) * 0.2, 0.6 + Math.sin(t * 0.25) * 0.2);
    // Arm über dem Kopf hin und her schwenken
    waveArm.rotation.y = -2.5 + Math.sin(t * 6) * 0.45;

    const pos = tetherGeometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(1, astronaut.position.x, astronaut.position.y, astronaut.position.z);
    pos.needsUpdate = true;

    astronaut.updateMatrixWorld();
    leakPoint.copy(leak.getWorldPosition(new THREE.Vector3()));
    droplets.group.worldToLocal(leakPoint);
    droplets.update(t, leakPoint);
  };

  // Unsichtbare Trefferfläche, damit das filigrane Modell auch weit herausgezoomt anklickbar bleibt
  const hitArea = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 12, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hitArea.name = 'ISS-Trefferfläche';
  iss.add(hitArea);

  return iss;
}

/**
 * Astronaut im weißen Raumanzug, ca. 0,05 Einheiten groß (≈ 5 m, gegenüber der ISS etwa dreifach überhöht,
 * damit er beim Hereinzoomen erkennbar ist). Körperachse entlang +Z, Blick entlang +Y.
 * Liefert zusätzlich den Winkearm (Drehpunkt an der Schulter) und den Leckpunkt am Anzug.
 */
function createAstronaut() {
  const suit = new THREE.MeshLambertMaterial({ color: '#f4f4f2' });
  const visor = new THREE.MeshLambertMaterial({ color: '#d4a017', emissive: '#4a3505' });
  const pack = new THREE.MeshLambertMaterial({ color: '#d9d9d6' });
  const stripe = new THREE.MeshLambertMaterial({ color: '#c0392b' });

  const figure = new THREE.Group();
  figure.name = 'Astronaut';
  // Innen in Metern modellieren (1,8 m groß), außen auf 0,05 Einheiten skalieren
  const body = new THREE.Group();
  body.scale.setScalar(0.05 / 1.8);
  figure.add(body);

  const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  /** Gliedmaße, die vom Gelenk aus entlang -Z hängt */
  const limb = (parent: THREE.Object3D, r: number, len: number) => {
    const mesh = add(parent, new THREE.CylinderGeometry(r, r, len, 8), suit, 0, 0, -len / 2);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  };
  const joint = (x: number, y: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    body.add(g);
    return g;
  };

  // Rumpf mit Kennstreifen, Helm mit goldenem Visier, Lebenserhaltungsrucksack
  add(body, new THREE.BoxGeometry(0.5, 0.32, 0.62), suit, 0, 0, 0.9);
  add(body, new THREE.BoxGeometry(0.52, 0.33, 0.06), stripe, 0, 0, 1.12);
  add(body, new THREE.SphereGeometry(0.17, 16, 12), suit, 0, 0, 1.42);
  add(body, new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI), visor, 0, 0.07, 1.42).rotation.x = -Math.PI / 2;
  add(body, new THREE.BoxGeometry(0.46, 0.2, 0.6), pack, 0, -0.26, 0.98);

  // Linker Arm hängt leicht abgespreizt, rechter Arm winkt (Drehung um Y an der Schulter)
  const leftShoulder = joint(-0.3, 0, 1.15);
  leftShoulder.rotation.y = 0.35;
  limb(leftShoulder, 0.08, 0.6);
  const waveArm = joint(0.3, 0, 1.15);
  waveArm.rotation.y = -2.5;
  limb(waveArm, 0.08, 0.6);
  add(waveArm, new THREE.SphereGeometry(0.09, 10, 8), suit, 0, 0, -0.62);

  // Beine leicht gespreizt
  for (const side of [-1, 1]) {
    const hip = joint(side * 0.13, 0, 0.6);
    hip.rotation.y = -side * 0.12;
    limb(hip, 0.1, 0.75);
  }

  // Leck an der Hüfte vorn
  const leak = joint(0.12, 0.17, 0.66);

  return { figure, waveArm, leak };
}

/** Austrittsrate der Flüssigkeit in Tropfen pro Sekunde */
const DROPLET_RATE = 5;
/** Nach dieser Zeit gefriert ein Tropfen zu einem Eiswürfel */
const FREEZE_AFTER_S = 3;
/** Nach dieser Zeit verschwindet ein Eiswürfel; davor schrumpft er kurz */
const DROPLET_LIFETIME_S = 60;
const FADE_OUT_S = 2;
const DROPLET_COUNT = DROPLET_RATE * DROPLET_LIFETIME_S;
const DROP_RADIUS = 0.0022;
const ICE_EDGE = 0.0042;

/**
 * Gelbe Tropfen, die vom Leckpunkt aus gleichmäßig nachströmen und davontreiben.
 * Nach FREEZE_AFTER_S werden sie zu taumelnden gelben Eiswürfeln, nach DROPLET_LIFETIME_S verschwinden sie.
 * Zwei InstancedMeshes (Tropfen, Würfel), damit 300 Teilchen nur zwei Draw-Calls kosten.
 */
function createDroplets() {
  const group = new THREE.Group();
  group.name = 'Leck';
  const liquid = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshLambertMaterial({ color: '#f5d90a', emissive: '#5a4a00' }),
    DROPLET_COUNT,
  );
  const ice = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: '#ffe766', emissive: '#4a3d00', transparent: true, opacity: 0.85 }),
    DROPLET_COUNT,
  );
  // Teilchen bewegen sich weit vom Ursprung weg; Culling über die Bounding-Sphere der Geometrie wäre falsch
  liquid.frustumCulled = false;
  ice.frustumCulled = false;
  group.add(liquid, ice);

  // Feste, zufällige Werte je Teilchen: Richtung grob vom Astronauten weg (+X, +Y) und etwas nach oben, Taumelachse
  const drops = Array.from({ length: DROPLET_COUNT }, (_, i) => ({
    dir: new THREE.Vector3(0.6 + Math.random() * 0.5, 0.5 + Math.random() * 0.6, 0.2 + Math.random() * 0.5)
      .normalize()
      .multiplyScalar(0.012 + Math.random() * 0.008),
    spinAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
    spinSpeed: 0.5 + Math.random() * 1.5,
    offset: (i / DROPLET_COUNT) * DROPLET_LIFETIME_S,
    origin: new THREE.Vector3(),
    lastAge: Infinity,
  }));

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const noRotation = new THREE.Quaternion();
  let startT: number | null = null;

  const update = (t: number, leakPoint: THREE.Vector3) => {
    startT ??= t;
    let liquidCount = 0;
    let iceCount = 0;
    for (const d of drops) {
      const age = (t + d.offset) % DROPLET_LIFETIME_S;
      // Neu ausgetreten: am aktuellen Leckpunkt starten
      if (age < d.lastAge) d.origin.copy(leakPoint);
      d.lastAge = age;
      // Teilchen, die vor dem Start der Animation ausgetreten wären, noch nicht zeigen
      if (t - age < startT) continue;

      position.copy(d.origin).addScaledVector(d.dir, age);
      if (age < FREEZE_AFTER_S) {
        matrix.compose(position, noRotation, scale.setScalar(DROP_RADIUS));
        liquid.setMatrixAt(liquidCount++, matrix);
      } else {
        const fade = Math.min(1, (DROPLET_LIFETIME_S - age) / FADE_OUT_S);
        rotation.setFromAxisAngle(d.spinAxis, (age - FREEZE_AFTER_S) * d.spinSpeed);
        matrix.compose(position, rotation, scale.setScalar(ICE_EDGE * fade));
        ice.setMatrixAt(iceCount++, matrix);
      }
    }
    liquid.count = liquidCount;
    ice.count = iceCount;
    liquid.instanceMatrix.needsUpdate = true;
    ice.instanceMatrix.needsUpdate = true;
  };

  return { group, update };
}

/** Kurs in Grad (0 = Norden, 90 = Osten) von Punkt a nach Punkt b auf der Kugel */
export function bearingDeg(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const φ1 = a.lat * rad;
  const φ2 = b.lat * rad;
  const Δλ = (b.lon - a.lon) * rad;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) / rad) + 360) % 360;
}
