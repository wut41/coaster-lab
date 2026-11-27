# Build archive

Finished single-file builds, one per shipped version. **Never edit these files.** A new version gets a new file and a
new row here. Open any file in Safari or Chrome to play that version.

Imported 2026-11-27 from the owner's uploads. Each file's version was read from the `__coasterDebug.version` string
inside it, not from its upload name. Exact duplicates were stored once (noted below). Every file passed
`tools/ci/check-html-syntax.mjs` and `tools/ci/secret-scan.py` before it was committed.

## Coaster Lab 10.x

| File | Version | Size | SHA-256 | Uploaded as | Notes |
|---|---|---|---|---|---|
| `coaster_lab_v10_10_0.html` | 10.10.0 | 3,362,552 | `99db2253dac06c7f48840ca9c4e4e3a3194ad206c3b3790e6f5a15074644200e` | `coaster_lab_v10_10_0_2.bin` | **Latest — proposed canonical 10.10.0** (pending confirmation). Adds one fix over `-pre`: arm pivots are skipped when holiday hats are placed |
| `coaster_lab_v10_10_0-pre.html` | 10.10.0 | 3,362,424 | `138e879195c1e5c4aadfb351a364a03740c8a2386151b0b477770c20fb754c41` | `coaster_lab_v10_10_0.bin` | Earlier file with the same version string |
| `coaster_lab_v10_9_1.html` | 10.9.1 | 3,109,034 | `f9f398e55edd4f103bee71c3445a4dcb1b7441c531e9ac4d1b3c40953f8f0549` | `coaster_lab_v10_9_1.bin` (uploaded twice, identical) | |
| `coaster_lab_v10_9.html` | 10.9 | 3,089,950 | `091de825114e9ee78899dc19e9799dc28909f0e4d8f24e554e50febb7108b766` | `coaster_lab_v10_9.bin` | Fixes from the 10.9 developer report |
| `coaster_lab_v10_8.html` | 10.8 | 3,081,612 | `cd332bc54de4b629192250254c9a6e44ed2f722e3224efb26924435fbbbbb00f` | `coaster_lab_v10_8.bin`, `coaster_lab_v10_8_2.bin` (identical) | Holiday Mode, POV recorder. Baseline of the 10.9 report |
| `coaster_lab_v10_7.html` | 10.7 | 2,993,789 | `958ac10640257a9fdeba6840db7f415cec128399b443d4d1f608f2dacf374dc0` | `coaster_lab_v10_7_2.bin` | Later 10.7: adds review-squad import fixes |
| `coaster_lab_v10_7-pre.html` | 10.7 | 2,993,250 | `93b8434115653390c588dc7cdb8605032e7ab4d79329543a4825542759791e9f` | `coaster_lab_v10_7.bin` | Earlier 10.7 |
| `coaster_lab_v10_4.html` | 10.4 | 2,866,993 | `3075fc10825b6204f1e808a721d400d6f1f1a289504d186efdb7eb660f56de98` | `coaster_lab_v10_4.bin` | |
| `coaster_lab_v10_3.html` | 10.3 | 2,850,016 | `80cebd40064a6ae83a9f67762bf6a29f971ee75d9a14c4fe345bb00f764591a5` | `coaster_lab_v10_3.bin`, `coaster_lab_v10_3_2.bin` (identical) | |
| `coaster_lab_v10_3-alt.html` | 10.3 | 2,855,752 | `889673dadadf53689ad994eb9b8ee25b657ffedaacc8720a1199761af7422106` | `coaster-lab.html` | 10.3 plus lake-scene pine trees with uneven branch tiers. Possibly the file published to the live site — please confirm |
| `coaster_lab_v10_2.html` | 10.2 | 2,783,207 | `4abc70ea5980da1a8cdea08275b7fbabe7cf50fc201f9b63c261030c55f7479a` | `coaster_lab_v10_2.bin` | |

**Not in the archive (no file was supplied):** 10.5, 10.6, 10.9.2. Their changes are contained in later builds
(10.10.0 carries code marked 10.5, 10.6 and 10.9.2). Builds 8.5 → 10.1 stay at the top level of the repository
because `build.mjs` and `tests/` open them by those paths.

## Legacy and prototypes (before 8.5)

| File | Version | Size | SHA-256 | Uploaded as | Notes |
|---|---|---|---|---|---|
| `legacy/coaster_lab_v4_1.html` | 4.1 | 34,374 | `145cf3c58bb7b2a36bcbcefc992018396e70d46b1984bdde632fe62bb084abfe` | `coaster_lab_simulator_3.html` | Four rides: Looping Adventure, Canyon Rush, Sky Serpent, Mine Mountain |
| `legacy/coaster_lab_owners_edition.html` | Owner Edition | 91,442 | `eb726efbdd74644d9379ac2608a7222d200ee7a20dd3fb414a60b3a11bda44e3` | `coaster_lab_simulator_32.html`, `…_32_2.html` (identical) | 4.1 + local owner panel, telemetry, weather and lighting, JSON track workshop |
| `legacy/coaster_lab_velocity_v1_1.html` | VELOCITY 1.1 | 16,888 | `da59ee283d0538c37f54d5fc0b58aa98c720e3f65bdf6bb512eddb65d91949da` | `coaster_lab_velocity_fixed.html` | Separate 2D-canvas prototype ("COASTER LAB // VELOCITY"), not part of the main line |

## Verify a file

```bash
sha256sum builds/coaster_lab_v10_10_0.html
```
