/**
 * KintsugiCracksOverlay
 *
 * SVG-based kintsugi crack overlay for the landing hero.
 * Three crack tiers (hairline / medium / large) with layered gold gradients,
 * a dark-brown shadow underpainting, centre glow, vignette, and a slow
 * shimmer sweep (disabled for prefers-reduced-motion via CSS).
 *
 * Tuning guide:
 *  - Gold intensity:  adjust `stopColor` values in #kg-gold-l / -m / -h
 *  - Crack opacity:   adjust the `opacity` prop on each crack <g>
 *  - Shimmer opacity: adjust rgba alpha on #kg-shimmer stops + .kintsugi-shimmer opacity in globals.css
 *  - Shimmer speed:   change animation-duration in .kintsugi-shimmer rule in globals.css
 */
export default function KintsugiCracksOverlay() {
  return (
    <>
      {/* ── SVG crack overlay ───────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            {/* ── Atmospheric gradients ─────────────────────────────────────── */}
            <radialGradient id="kg-light" cx="50%" cy="44%" r="60%">
              <stop offset="0%" stopColor="rgba(255,252,247,0.52)" />
              <stop offset="100%" stopColor="rgba(247,241,231,0)" />
            </radialGradient>

            <radialGradient id="kg-vignette" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(59,47,42,0)" />
              <stop offset="100%" stopColor="rgba(59,47,42,0.13)" />
            </radialGradient>

            {/* ── Gold crack gradients ──────────────────────────────────────── */}
            {/* Large: deep amber → pale gold → warm gold — diagonal TL→BR */}
            <linearGradient
              id="kg-gold-l"
              gradientUnits="userSpaceOnUse"
              x1="0" y1="0" x2="1440" y2="900"
            >
              <stop offset="0%"   stopColor="#7C541C" />
              <stop offset="20%"  stopColor="#BF8C35" />
              <stop offset="45%"  stopColor="#EAD9A0" />
              <stop offset="65%"  stopColor="#C9913A" />
              <stop offset="85%"  stopColor="#A87030" />
              <stop offset="100%" stopColor="#7C541C" />
            </linearGradient>

            {/* Medium: slightly cooler, diagonal TR→BL */}
            <linearGradient
              id="kg-gold-m"
              gradientUnits="userSpaceOnUse"
              x1="1440" y1="0" x2="0" y2="900"
            >
              <stop offset="0%"   stopColor="#6A4A16" />
              <stop offset="25%"  stopColor="#B8882A" />
              <stop offset="50%"  stopColor="#DEC894" />
              <stop offset="75%"  stopColor="#B8882A" />
              <stop offset="100%" stopColor="#6A4A16" />
            </linearGradient>

            {/* Hairline: most muted, diagonal BL→TR */}
            <linearGradient
              id="kg-gold-h"
              gradientUnits="userSpaceOnUse"
              x1="0" y1="900" x2="1440" y2="0"
            >
              <stop offset="0%"   stopColor="#634718" stopOpacity="0.72" />
              <stop offset="38%"  stopColor="#A47528" stopOpacity="0.88" />
              <stop offset="62%"  stopColor="#C8A868" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#634718" stopOpacity="0.72" />
            </linearGradient>
          </defs>

          {/* ── Centre warm glow ──────────────────────────────────────────────── */}
          <rect x="0" y="0" width="1440" height="900" fill="url(#kg-light)" />

          {/* ── Shadow underpainting (dark brown, low opacity) ────────────────── */}
          {/* Large crack shadows */}
          <g
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#3B2F2A"
            strokeWidth="1.8"
            opacity="0.13"
          >
            <path d="M 62,80 C 155,185 255,285 330,365 C 405,445 428,518 415,620 C 400,700 360,758 305,840" />
            <path d="M 330,365 C 382,372 438,382 476,376 C 498,372 514,362 520,352" />
            <path d="M 1420,95 C 1318,175 1212,240 1118,295 C 1022,350 942,390 878,448" />
            <path d="M 1118,295 C 1098,268 1082,242 1078,218" />
            <path d="M 120,895 C 200,820 285,740 360,655 C 435,570 490,495 530,432" />
            <path d="M 360,655 C 342,628 338,600 352,578" />
            <path d="M 1350,895 C 1265,815 1185,730 1108,648 C 1030,566 970,500 915,455" />
            <path d="M 1108,648 C 1090,618 1085,590 1098,568" />
            <path d="M 745,12 C 728,105 710,195 718,248" />
            <path d="M 728,652 C 720,700 718,755 725,820" />
            <path d="M 718,248 C 745,238 768,236 784,245" />
          </g>

          {/* Medium crack shadows */}
          <g
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#3B2F2A"
            strokeWidth="1.1"
            opacity="0.10"
          >
            <path d="M 248,38 C 278,110 298,178 308,248 C 320,316 325,368 308,415" />
            <path d="M 1218,28 C 1195,98 1178,165 1170,240 C 1162,308 1165,358 1178,408" />
            <path d="M 42,425 C 112,435 178,440 242,452 C 298,462 338,468 358,472" />
            <path d="M 1440,432 C 1372,438 1310,442 1258,456 C 1208,468 1170,478 1148,482" />
            <path d="M 425,62 C 458,135 472,205 478,278 C 484,342 478,388 462,428" />
            <path d="M 1035,48 C 1020,118 1012,188 1018,262 C 1024,325 1038,372 1028,418" />
            <path d="M 55,705 C 128,695 198,682 265,672 C 325,662 372,658 405,648" />
            <path d="M 1400,718 C 1328,710 1262,698 1202,682 C 1148,666 1108,650 1078,635" />
            <path d="M 508,895 C 518,832 522,768 514,705 C 508,648 495,602 498,558" />
            <path d="M 952,895 C 945,830 942,765 950,702 C 958,646 972,600 968,555" />
            <path d="M 158,268 C 198,302 232,338 258,376 C 283,411 298,445 282,478" />
            <path d="M 1298,285 C 1258,318 1225,352 1202,390 C 1180,425 1172,458 1188,490" />
          </g>

          {/* ── Gold kintsugi cracks ──────────────────────────────────────────── */}

          {/* Large cracks — richest gold, irregular curvature with micro-branches */}
          <g
            id="cracks-large"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="url(#kg-gold-l)"
          >
            {/* L1 – upper-left arc to lower-centre, branch at shoulder */}
            <path strokeWidth="2.2" d="M 62,80 C 155,185 255,285 330,365 C 405,445 428,518 415,620 C 400,700 360,758 305,840" />
            <path strokeWidth="1.1" d="M 330,365 C 382,372 438,382 476,376 C 498,372 514,362 520,352" />
            {/* L2 – upper-right arc to mid-left, hairline offshoot */}
            <path strokeWidth="2.2" d="M 1420,95 C 1318,175 1212,240 1118,295 C 1022,350 942,390 878,448" />
            <path strokeWidth="1.0" d="M 1118,295 C 1098,268 1082,242 1078,218" />
            {/* L3 – lower-left to centre */}
            <path strokeWidth="2.0" d="M 120,895 C 200,820 285,740 360,655 C 435,570 490,495 530,432" />
            <path strokeWidth="1.0" d="M 360,655 C 342,628 338,600 352,578" />
            {/* L4 – lower-right to centre */}
            <path strokeWidth="2.0" d="M 1350,895 C 1265,815 1185,730 1108,648 C 1030,566 970,500 915,455" />
            <path strokeWidth="1.0" d="M 1108,648 C 1090,618 1085,590 1098,568" />
            {/* L5 – vertical: top to just above text zone, resumes below */}
            <path strokeWidth="1.8" d="M 745,12 C 728,105 710,195 718,248" />
            <path strokeWidth="1.6" d="M 728,652 C 720,700 718,755 725,820" />
            <path strokeWidth="0.9" d="M 718,248 C 745,238 768,236 784,245" />
          </g>

          {/* Medium cracks — secondary network */}
          <g
            id="cracks-medium"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="url(#kg-gold-m)"
            opacity="0.88"
          >
            <path strokeWidth="1.4" d="M 248,38 C 278,110 298,178 308,248 C 320,316 325,368 308,415" />
            <path strokeWidth="1.4" d="M 1218,28 C 1195,98 1178,165 1170,240 C 1162,308 1165,358 1178,408" />
            <path strokeWidth="1.3" d="M 42,425 C 112,435 178,440 242,452 C 298,462 338,468 358,472" />
            <path strokeWidth="1.3" d="M 1440,432 C 1372,438 1310,442 1258,456 C 1208,468 1170,478 1148,482" />
            <path strokeWidth="1.2" d="M 425,62 C 458,135 472,205 478,278 C 484,342 478,388 462,428" />
            <path strokeWidth="1.2" d="M 1035,48 C 1020,118 1012,188 1018,262 C 1024,325 1038,372 1028,418" />
            <path strokeWidth="1.3" d="M 55,705 C 128,695 198,682 265,672 C 325,662 372,658 405,648" />
            <path strokeWidth="1.3" d="M 1400,718 C 1328,710 1262,698 1202,682 C 1148,666 1108,650 1078,635" />
            <path strokeWidth="1.1" d="M 508,895 C 518,832 522,768 514,705 C 508,648 495,602 498,558" />
            <path strokeWidth="1.1" d="M 952,895 C 945,830 942,765 950,702 C 958,646 972,600 968,555" />
            <path strokeWidth="1.1" d="M 158,268 C 198,302 232,338 258,376 C 283,411 298,445 282,478" />
            <path strokeWidth="1.1" d="M 1298,285 C 1258,318 1225,352 1202,390 C 1180,425 1172,458 1188,490" />
          </g>

          {/* Hairline cracks — thin, scattered, peripheral */}
          <g
            id="cracks-hairline"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="url(#kg-gold-h)"
            opacity="0.76"
          >
            <path strokeWidth="0.55" d="M 42,158 C 68,182 88,205 105,230 C 118,252 122,272 112,290" />
            <path strokeWidth="0.50" d="M 365,32 C 382,68 390,100 388,132 C 386,158 376,178 358,192" />
            <path strokeWidth="0.48" d="M 185,462 C 218,458 248,462 278,472 C 302,480 318,490 312,502" />
            <path strokeWidth="0.52" d="M 1342,162 C 1318,185 1298,208 1282,235 C 1268,260 1262,282 1272,302" />
            <path strokeWidth="0.50" d="M 1085,38 C 1072,72 1065,105 1068,138 C 1070,168 1080,190 1070,210" />
            <path strokeWidth="0.48" d="M 1262,468 C 1230,465 1200,468 1172,478 C 1148,487 1132,498 1140,512" />
            <path strokeWidth="0.45" d="M 125,618 C 158,608 188,602 218,600 C 242,598 262,598 272,588" />
            <path strokeWidth="0.45" d="M 1320,628 C 1290,622 1262,618 1235,620 C 1212,622 1192,625 1182,618" />
            <path strokeWidth="0.50" d="M 452,822 C 462,792 468,762 462,732 C 458,706 448,686 452,665" />
            <path strokeWidth="0.50" d="M 1008,832 C 1000,802 996,772 1002,742 C 1008,716 1018,696 1012,676" />
            <path strokeWidth="0.48" d="M 68,318 C 95,338 118,360 135,385 C 148,408 152,430 140,450" />
            <path strokeWidth="0.48" d="M 1385,328 C 1360,348 1338,370 1318,396 C 1300,420 1292,444 1305,465" />
            <path strokeWidth="0.45" d="M 312,682 C 338,670 362,660 384,655 C 402,650 418,648 428,638" />
            <path strokeWidth="0.45" d="M 1148,690 C 1122,680 1098,672 1078,668 C 1058,664 1042,662 1032,652" />
            <path strokeWidth="0.52" d="M 548,58 C 558,92 562,125 558,158 C 554,186 545,208 550,228" />
            <path strokeWidth="0.52" d="M 918,48 C 910,82 906,115 912,148 C 916,178 926,200 920,220" />
            <path strokeWidth="0.45" d="M 198,162 C 225,172 250,185 272,202 C 292,218 305,235 298,252" />
            <path strokeWidth="0.45" d="M 1258,175 C 1230,185 1206,198 1184,215 C 1164,230 1152,248 1158,265" />
            <path strokeWidth="0.42" d="M 32,538 C 65,528 96,522 125,520 C 150,518 172,518 182,508" />
            <path strokeWidth="0.42" d="M 1432,552 C 1400,542 1370,536 1342,534 C 1318,532 1298,532 1288,522" />
            <path strokeWidth="0.50" d="M 385,192 C 408,218 425,245 432,272 C 438,296 432,318 415,335" />
            <path strokeWidth="0.50" d="M 1068,202 C 1044,228 1026,255 1020,282 C 1014,308 1020,330 1038,348" />
            <path strokeWidth="0.42" d="M 242,545 C 265,535 288,528 308,522 C 325,518 340,515 348,505" />
            <path strokeWidth="0.42" d="M 1218,548 C 1195,538 1172,530 1152,524 C 1132,518 1116,515 1108,505" />
            <path strokeWidth="0.48" d="M 638,808 C 648,778 652,748 646,718 C 642,692 632,672 638,652" />
            <path strokeWidth="0.48" d="M 828,812 C 820,782 816,752 822,722 C 828,696 838,676 832,656" />
            <path strokeWidth="0.45" d="M 92,775 C 122,762 150,752 178,748 C 202,744 222,742 232,732" />
            <path strokeWidth="0.45" d="M 1370,788 C 1340,775 1312,765 1285,760 C 1260,756 1240,754 1230,744" />
            <path strokeWidth="0.42" d="M 445,558 C 462,548 478,540 492,534 C 505,528 516,524 518,514" />
            <path strokeWidth="0.42" d="M 958,562 C 942,552 926,544 912,538 C 900,532 888,528 890,518" />
            <path strokeWidth="0.45" d="M 155,375 C 175,388 193,402 208,418 C 221,432 228,448 218,462" />
            <path strokeWidth="0.45" d="M 1295,382 C 1275,395 1258,410 1244,428 C 1232,444 1225,462 1238,475" />
            <path strokeWidth="0.48" d="M 615,858 C 622,832 625,806 620,782 C 616,760 608,742 615,722" />
            <path strokeWidth="0.48" d="M 848,862 C 842,836 840,810 848,786 C 854,764 864,746 858,726" />
            <path strokeWidth="0.45" d="M 330,115 C 352,130 372,148 385,168 C 396,186 400,206 388,222" />
            <path strokeWidth="0.45" d="M 1118,125 C 1096,140 1076,158 1064,178 C 1052,198 1048,218 1058,232" />
            <path strokeWidth="0.42" d="M 178,702 C 205,690 230,680 255,675 C 278,670 298,668 308,658" />
            <path strokeWidth="0.42" d="M 1282,712 C 1255,700 1228,690 1202,684 C 1178,678 1158,676 1148,666" />
          </g>

          {/* ── Vignette ─────────────────────────────────────────────────────── */}
          <rect x="0" y="0" width="1440" height="900" fill="url(#kg-vignette)" />
        </svg>
      </div>

      {/* ── Shimmer sweep (HTML level — blends with SVG cracks below) ─────────
           Disabled via CSS under prefers-reduced-motion.
           Intensity: rgba alpha on the gradient stop (currently 0.18).
           Speed: animation-duration in globals.css .kintsugi-shimmer rule.   */}
      <div
        aria-hidden="true"
        className="kintsugi-shimmer absolute inset-0 pointer-events-none"
      />
    </>
  );
}
