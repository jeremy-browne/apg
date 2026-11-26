---
title: "How to Submit a VFR Flight Plan in Australia (NAIPS Step by Step)"
description: "A field-by-field guide to lodging a VFR flight notification in NAIPS, from when you need one to what goes in Item 10, Item 18 and the SARTIME."
summary: "Explains when an Australian VFR pilot needs a flight plan, SARTIME or flight note, and walks through every field of the NAIPS flight notification form for a typical light aircraft."
pubDate: 2026-11-26
updatedDate: 2026-11-26
authors:
  - "Jeremy Browne"
tags: ["vfr", "navigation", "flight-planning", "naips", "casa"]
image:
    src: /images/blog/how-to-submit-a-vfr-flight-plan.webp
    alt: "Looking down on Yarra Valley farmland and scattered cloud from under a high wing"
draft: false
canonical: true
category: operations
---

The first time you open the flight notification form in the National Aeronautical Information Processing System (NAIPS), it looks like a tax return written in code. SFRGZ. EB1. PBN/S1O2. N0110. Most student pilots learn it by copying whatever their instructor typed last time and hoping for the best.

This guide walks you through the whole process: when you need to submit something, how to set NAIPS up so it takes two minutes, and what every field on the form means for a typical VFR flight in a light aircraft.

The official reference is the Aeronautical Information Publication (AIP), **ENR 1.10 Appendix 2 (ATS Flight Notification User Guide)**. Keep it bookmarked. This article explains it in plain English, using a real example.

## Do you actually need to submit one?

In Australia there are three ways to tell someone about your flight:

- **A flight plan (ICAO flight notification):** your full flight details, lodged with Airservices Australia through NAIPS.
- **A SARTIME:** a time you nominate for search and rescue action to begin, lodged with Airservices.
- **A flight note:** your route and timings left with a responsible person who will raise the alarm if you are overdue.

For VFR flights, the rules look like this:

| Where and what you are flying | What you need |
| --- | --- |
| VFR in Class C or D airspace | A flight plan |
| VFR in Class E or G, normal private or training flying | Any of the three, or nothing at all |
| Over-water flights in designated remote areas, or night flights more than 120 NM from the departure aerodrome | A flight plan, a SARTIME or a flight note |

Even when you are not required to notify anyone, a flight note is the bare minimum you should leave. A SARTIME is better. If nobody knows you are missing, nobody comes looking.

## When to lodge it

Submit your flight plan **at least 30 minutes before your estimated off blocks time (EOBT)**. Details lodged later than that can still be accepted, but they get processed when the controller has time, and that can mean you sit at the holding point waiting.

You can lodge up to five days in advance.

## Before you start: set up an aircraft profile

If you fly the same aircraft regularly, this is the single biggest time saver in NAIPS.

Go to **Flight Notification > Aircraft Profile** and save the details that never change: aircraft ID, registration, type, speed, wake turbulence category, equipment and surveillance codes. When you start a new flight plan, click **Import Aircraft Profile** and half the form fills itself.

Do this once per aircraft, check the codes against the aircraft's documents, and you will never mistype SFRGZ again.

## Our example flight

To make this concrete, we'll plan a flight in a Piper Archer, VH-ABC:

- **Stage 1:** Lilydale (YLIL) via Dandenong (DSN) to Moorabbin (YMMB)
- **Stage 2:** Moorabbin via Avalon (APL) to Essendon (YMEN)
- **Stage 3:** Essendon via Warrandyte (WRD) back to Lilydale

Moorabbin and Essendon are both Class D, so this flight needs a flight plan.

## Step 1: Open a new flight notification

Log in to NAIPS, go to **Flight Notification > ICAO** and make sure **Domestic** is selected. Import your aircraft profile if you have one.

The form is split into a few sections. The labels on the AIP form use item numbers, so we'll use them too.

## Step 2: The aircraft (Items 7, 8 and 9)

**Aircraft ID (Item 7):** for a VH-registered aircraft on a domestic flight, enter only the three letters after VH. For VH-ABC, that's `ABC`.

**Practising?** NAIPS accepts `NOSEND` as the aircraft ID. The form validates normally but nothing gets sent to air traffic services (ATS). It's a great way for students to practise filling in the form without lodging a real plan.

**Flight rules (Item 8):** `V` for VFR. (Use `Z` if you start VFR and change to IFR, or `Y` for the reverse.)

**Flight type:** `G` for general aviation. This covers private and training flights.

**Number:** `1`, unless you are flying in formation.

**Aircraft type (Item 9):** the ICAO type designator. A Piper Archer is `P28A`. A Cessna 172 is `C172`. Your aircraft documents or the ICAO Doc 8643 lookup will have it.

**Wake:** `L` for light. Every training aircraft you are likely to fly is L.

## Step 3: Equipment and surveillance (Item 10)

This is the part that confuses everyone. Item 10 has two boxes: **Equipment** (radios and navigation) and **Surveillance** (transponder and ADS-B). The AIP lists dozens of codes, but a typical VFR GA aircraft only ever uses a handful.

### The golden rule

Only list equipment that is **serviceable** and that **you are qualified to use**. The AIP is explicit about this. If the aircraft has an ADF but you've never been trained on it, leave it off. If the VOR is placarded INOP today, leave it off.

### Equipment codes you'll actually see

| Code | Meaning | What it looks like in the cockpit |
| --- | --- | --- |
| `N` | No radio or nav equipment | Rare. Some vintage aircraft and gliders |
| `V` | VHF radio | Any aircraft with a VHF comm radio |
| `S` | Standard: VHF radio, VOR (VHF omnidirectional range) and ILS (instrument landing system) | A nav/com radio with a VOR/ILS indicator (CDI) |
| `O` | VOR | Use when you have a VOR but no ILS. If you have both, use `S` instead |
| `L` | ILS | Rarely used on its own. Covered by `S` |
| `D` | DME (distance measuring equipment) | A DME readout, usually on IFR-equipped aircraft |
| `F` | ADF (automatic direction finder) | An ADF receiver and needle |
| `G` | GNSS (global navigation satellite system, i.e. GPS) | A panel-mounted GPS (Garmin GNS 430, GTN 650/750, G1000 and similar) |
| `R` | PBN (performance-based navigation) approved | The GNSS is approved for PBN navigation. Requires PBN/ codes in Item 18 |
| `Z` | Other capability | Anything not covered above, described in Item 18 under NAV/, COM/ or DAT/ |

`S` already includes VHF, VOR and ILS, so you never need `V`, `O` or `L` alongside it. `SVO` is the same as `S`, just longer.

A few notes on GNSS:

- **G means installed, approved GNSS.** An iPad running OzRunways or AvPlan isn't `G`, however good the GPS is.
- **R only goes in if the aircraft is approved for PBN** and you put the matching codes in PBN/. A VFR-only GPS is `G` without `R`.
- **Z on GNSS aircraft** usually means RNP 2 (required navigation performance 2) capability. RNP 2 has no PBN code yet, so it goes in Item 18 as `NAV/RNP2`, and the `Z` tells ATS to look there.

### Typical equipment combinations

| Aircraft setup | Equipment entry |
| --- | --- |
| Basic trainer or LSA with a VHF radio only | `V` |
| VHF radio and a VFR GPS | `VG` |
| Nav/com with VOR/ILS, no GPS | `S` |
| Nav/com with VOR/ILS, ADF and a VFR GPS | `SFG` |
| IFR-equipped single with an IFR-approved GPS | `SDFGR` (add `Z` if RNP 2 capable) |
| Modern glass cockpit IFR trainer | `SDFGRZ` |

### Surveillance codes

The surveillance box describes your transponder. The codes split into two groups, depending on whether the transponder transmits ADS-B.

**Transponders without ADS-B.** Enter one code for the best capability you have:

| Code | Meaning | Typical example |
| --- | --- | --- |
| `N` | No transponder | Aircraft that stay outside transponder-required airspace |
| `A` | Mode A (squawk code only) | Very old transponders with no altitude encoder |
| `C` | Mode C (squawk code and pressure altitude) | The classic older GA transponder, e.g. a King KT 76A |
| `S` | Mode S with aircraft ID and pressure altitude | Mode S transponder not configured for ADS-B |

**Transponders with ADS-B Out.** ADS-B (automatic dependent surveillance-broadcast) transmits your GPS position to air traffic control (ATC). Enter one transponder code and one ADS-B code:

| Code | Meaning |
| --- | --- |
| `E` | Mode S with aircraft ID, pressure altitude and ADS-B Out |
| `L` | As for `E`, plus enhanced surveillance (sends extra aircraft data to ATC) |
| `B1` | ADS-B Out on 1090 MHz |
| `B2` | ADS-B Out and In on 1090 MHz |

Most GA aircraft fitted with a certified ADS-B transponder (a Garmin GTX 335, for example) will be `EB1`. If the transponder can also receive ADS-B traffic on 1090 MHz, like a GTX 345, it's `EB2`. Larger and more complex aircraft with enhanced surveillance will be `LB1` or `LB2`.

### What about portable ADS-B devices?

Portable and low-cost ADS-B units (traffic awareness beacon system (TABS) and electronic conspicuity (EC) devices like a SkyEcho) output a lower integrity level that ATC can't use for separation. The AIP says aircraft relying on these shouldn't enter an ADS-B code at all. Enter the code for the aircraft's transponder only, e.g. `C`.

### Typical surveillance combinations

| Aircraft setup | Surveillance entry |
| --- | --- |
| No transponder | `N` |
| Older Mode C transponder | `C` |
| Mode C transponder plus a portable EC device | `C` |
| Certified Mode S ADS-B Out transponder | `EB1` |
| Certified ADS-B Out with 1090 MHz ADS-B In | `EB2` |

If you're unsure, look at the transponder model in the aircraft's maintenance release or avionics paperwork, then check its capabilities. Many schools write the correct codes in the aircraft's flight manual supplement or quick reference guide.

Use the `...` button beside each field if you want a pick list instead of typing codes.

## Step 4: Departure, time and date (Item 13)

**Departure:** the four-letter ICAO code, e.g. `YLIL`.

**DOF (UTC):** the date of flight as YYMMDD, in Coordinated Universal Time (UTC).

**EOBT (UTC):** the time you expect to move off the blocks, as HHMM, **also in UTC**.

UTC catches people out all the time. Melbourne is UTC+10 in winter and UTC+11 during daylight saving. A 9:00 am departure in December is `2200` UTC *on the previous day*, so the DOF goes back a day too. Check both before you submit.

## Step 5: Speed, level and route (Item 15)

**Speed:** your planned cruise true airspeed (TAS) as `N` followed by four digits in knots. 110 knots is `N0110`. Enter your planned TAS from your nav log.

**Level:** your first planned cruising level as `A` followed by three digits in hundreds of feet. 4,500 ft is `A045`.

For VFR in Australia, remember the hemispherical rule above 3,000 ft above ground level (AGL):

- Magnetic track 000° to 179°: odd thousands plus 500 (`A035`, `A055`, `A075`)
- Magnetic track 180° to 359°: even thousands plus 500 (`A045`, `A065`, `A085`)

**Route:** each row has an Airway column and a Significant Point column. For VFR you will almost always use `DCT` (direct) in the airway column, then the waypoint. For our first stage:

| Airway | Significant Point |
| --- | --- |
| DCT | DSN |

You don't need to repeat the destination in the route. NAIPS adds the final leg from your last waypoint.

Only use waypoints that exist in the En Route Supplement Australia (ERSA) or on your charts. Made-up names and VFR reporting points with no code will be rejected.

## Step 6: Destination, time en route and alternate (Item 16)

**Destination:** e.g. `YMMB`.

**TEET:** total estimated elapsed time for this stage, as HHMM. A 25-minute leg is `0025`. Take it from your nav log, including any time spent on airwork along the way.

**Alternate:** only if your planning requires one.

## Step 7: Other information (Item 18)

Most fields in this section are optional for a simple VFR flight. The ones that matter:

- **REG/:** the full registration with no hyphen, e.g. `VHABC`. This is mandatory.
- **PBN/:** only if you entered `R` in Item 10. Common light aircraft codes are `O2` (RNP 1 using GNSS) and `S1` (RNP APCH). Enter them with no spaces: `S1O2`.
- **NAV/:** extra navigation capability. If you entered `Z` because the aircraft is RNP 2 capable, put `RNP2` here.
- **PER/:** aircraft performance category. Most training aircraft are `A`. It's required for IFR arrivals at controlled aerodromes, and harmless to include on a VFR plan.
- **RMK/:** plain-language remarks. Keep them short and useful, e.g. `RMK/TRAINING FLIGHT`.

### Adding a SARTIME

If you want a SARTIME on your flight plan, enter it in the SARTIME section (or in RMK/) with:

- **FOR ARR** (arrival) or **FOR DEP** (departure)
- the date and time in UTC as a six-figure group (DDHHMM)
- the location

Only one SARTIME can go on a flight notification. On a multi-stage flight, put the SARTIME on the stage that needs it and use `TBA` for later ones, then update it by radio or phone as you go.

Set a SARTIME that gives you enough time to land, tie down and get to a phone. Search action starts at the time you nominate.

## Step 8: Pilot and supplementary details (Item 19)

**Pilot name and phone:** mandatory. Use a mobile number you will actually have with you.

**Endurance:** your total fuel endurance on board in HHMM. If you load 150 litres and plan 36 litres per hour, that's about `0410`. Calculate it from the fuel you actually carry.

**Persons on board:** total including you.

**Survival equipment, radios, life jackets, dinghies:** tick what you have. Tick ELT if you carry one.

**Aircraft colour and markings:** e.g. `WHITE WITH BLUE STRIPES`. If search and rescue ever needs this field, they will be looking for your aircraft from the air.

Strictly, most of Item 19 is optional for VFR. Fill it in anyway. It's the information search and rescue will use first.

## Step 9: Adding more stages

Click **Add Stage**. NAIPS copies the aircraft details, equipment and Item 18 into the new stage and sets the departure to your previous destination. Then you fill in:

- EOBT for this stage
- Level and route
- Destination and TEET
- Endurance and persons on board if they change

Each stage needs its own EOBT. Leave realistic time on the ground between stages for taxi, shutdown, refuelling and the paperwork.

## Step 10: Check and submit

Before you hit Submit, run through this:

- Aircraft ID is the three-letter callsign and REG/ is the full registration
- DOF and EOBT are in **UTC**, and the date has rolled back if needed
- Levels obey the hemispherical rule for each track
- Every waypoint is a real published point
- Equipment codes only include gear that works and that you can use
- Endurance matches the fuel you are actually carrying
- SARTIME (if used) is realistic and in UTC

NAIPS checks the format of every field and tells you what's wrong. It can't check whether your times or levels are sensible. That part's on you.

## After you submit

Your plan appears under **Flight Notification > Active**.

If your departure time changes by more than 30 minutes, you must tell ATS. You can amend the plan in NAIPS or advise ATC by radio.

If you lodged a SARTIME, **cancel it as soon as you land**. Forgetting to cancel a SARTIME is how a perfectly good flight turns into a search and rescue callout. Make it part of your shutdown checklist.

## Common mistakes

- **Local time in the UTC fields.** The most common error by far.
- **Entering the full registration as the aircraft ID.** Domestic VH aircraft use the three letters only. The full registration goes in REG/.
- **Claiming equipment you can't use.** Don't put `F` in Item 10 because there's an ADF in the panel. It has to be serviceable and you have to be qualified on it.
- **PBN codes without R.** NAIPS will reject PBN/ entries if Item 10 doesn't include R.
- **Endurance copied from full tanks.** Endurance is what you actually have on board today.
- **Forgetting to cancel the SARTIME.**

## Quick reference: example Archer stage

| Field | Entry |
| --- | --- |
| Aircraft ID | `ABC` |
| Flight rules / type | `V` / `G` |
| Aircraft type / wake | `P28A` / `L` |
| Equipment | `SFRGZ` |
| Surveillance | `EB1` |
| Departure | `YLIL` |
| Speed / level | `N0110` / `A015` |
| Route | `DCT DSN` |
| Destination / TEET | `YMMB` / `0025` |
| REG/ | `VHABC` |
| PBN/ | `S1O2` |
| NAV/ | `RNP2` |
| PER/ | `A` |

Your aircraft's codes will be different. Always check its equipment against the aircraft documents before you copy anything from this table.

## Further reading

- AIP ENR 1.10, Flight Planning, and Appendix 2, ATS Flight Notification User Guide
- CASA Visual Flight Rules Guide: Pre-flight briefing and notification
- NAIPS Internet Service User Guide (Airservices Australia)
