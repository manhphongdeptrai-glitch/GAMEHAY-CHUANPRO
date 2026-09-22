import * as THREE from 'three';

/**
 * Generates 3D control points for 36 high-speed racing circuit layouts with unique curves.
 * Scaled for long 32km - 45km racing tracks ensuring 2+ minutes of high-speed racing.
 * Guarantees absolute seamless closure between start and end points (zero gaps).
 */
export function generatePointsForLayout(layout: string, seed: number = 42): THREE.Vector3[] {
  let s = Math.abs(seed) || 42;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const points: THREE.Vector3[] = [];
  const scale = 1400;

  switch (layout) {
    // 1. Grand Prix Oval Siêu Tốc
    case 'GRAND_PRIX_OVAL': {
      const numPts = 28;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.85;
        const z = Math.sin(t) * scale * 1.05;
        const y = Math.sin(t * 2) * 5.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 2. Monza Temple of Speed
    case 'MONZA_TEMPLE_OF_SPEED': {
      const basePts = [
        new THREE.Vector3(-scale * 1.6, 5, -scale * 0.5),
        new THREE.Vector3(-scale * 0.7, 6, -scale * 0.55),
        new THREE.Vector3(0, 5, -scale * 0.5),
        new THREE.Vector3(scale * 0.8, 6, -scale * 0.4),
        new THREE.Vector3(scale * 1.4, 8, -scale * 0.1),
        new THREE.Vector3(scale * 1.7, 9, scale * 0.4),
        new THREE.Vector3(scale * 1.3, 7, scale * 0.9),
        new THREE.Vector3(scale * 0.6, 5, scale * 0.7),
        new THREE.Vector3(scale * 0.1, 8, scale * 0.95),
        new THREE.Vector3(-scale * 0.4, 6, scale * 0.75),
        new THREE.Vector3(-scale * 1.1, 5, scale * 0.6),
        new THREE.Vector3(-scale * 1.8, 8, scale * 0.1)
      ];
      basePts.forEach(p => points.push(p.clone()));
      points.push(basePts[0].clone());
      break;
    }

    // 3. Cầu Vượt Số 8 Figure-8
    case 'FIGURE_EIGHT_BRIDGE': {
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.6;
        const z = Math.sin(t * 2) * scale * 1.2;
        const y = (Math.sin(t) * 0.5 + 0.5) * 18.0 + 4.5;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 4. Đèo Núi Khúc Cua Chữ U (Touge)
    case 'MOUNTAIN_HAIRPIN_PASS': {
      const numPts = 42;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.1 + 0.5 * Math.sin(3 * t) + 0.28 * Math.sin(7 * t));
        const x = Math.cos(t) * r;
        const z = Math.sin(t) * r * 1.35;
        const y = Math.sin(t * 2) * 14.0 + Math.cos(t * 3) * 8.0 + 15.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 5. Sân Bay Quân Sự Runway Drag
    case 'AIRPORT_RUNWAY_DRAG': {
      const l = scale * 2.6;
      const w = scale * 0.45;
      const basePts = [
        new THREE.Vector3(-l, 5, -w),
        new THREE.Vector3(-l * 0.5, 6, -w),
        new THREE.Vector3(0, 7, -w),
        new THREE.Vector3(l * 0.5, 6, -w),
        new THREE.Vector3(l, 5, -w),
        new THREE.Vector3(l + 350, 9, 0),
        new THREE.Vector3(l, 6, w),
        new THREE.Vector3(l * 0.5, 5, w),
        new THREE.Vector3(0, 7, w),
        new THREE.Vector3(-l * 0.5, 6, w),
        new THREE.Vector3(-l, 5, w),
        new THREE.Vector3(-l - 350, 9, 0)
      ];
      basePts.forEach(p => points.push(p.clone()));
      points.push(basePts[0].clone());
      break;
    }

    // 6. Cao Tốc Vách Đá Ven Biển
    case 'COASTAL_CLIFF_HIGHWAY': {
      const numPts = 32;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.55 + Math.sin(t * 3) * (scale * 0.22);
        const z = Math.sin(t) * scale * 1.25 + Math.cos(t * 2) * (scale * 0.32);
        const y = Math.sin(t * 2) * 12.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 7. Vành Đai Tokyo Shuto
    case 'TOKYO_EXPRESSWAY_RING': {
      const numPts = 34;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.3 + 0.22 * Math.sin(t * 5));
        const x = Math.cos(t) * r;
        const z = Math.sin(t) * r * 1.18;
        const y = Math.sin(t * 4) * 9.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 8. Suzuka Kỹ Thuật Chữ S
    case 'SUZUKA_TECHNICAL_S': {
      const numPts = 38;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.45 + Math.sin(t * 4) * 260;
        const z = Math.cos(t) * scale * 1.15 + Math.cos(t * 3) * 220;
        const y = Math.sin(t * 2) * 8.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 9. Hẻm Núi Sa Mạc Cát Đỏ
    case 'DESERT_CANYON_DUNES': {
      const numPts = 30;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.35 + 0.32 * Math.sin(3 * t));
        const x = Math.sin(t) * r;
        const z = Math.cos(t) * r * 0.95;
        const y = Math.sin(t * 2) * 11.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 10. Nurburgring Tàu Lượn Siêu Tốc
    case 'NURBURGRING_ROLLER_COASTER': {
      const numPts = 44;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.25 + 0.38 * Math.sin(2 * t) + 0.22 * Math.cos(5 * t));
        const x = Math.cos(t) * r;
        const z = Math.sin(t) * r * 1.25;
        const y = Math.sin(t * 3) * 14.0 + Math.cos(t * 2) * 10.0 + 15.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 11. Ngã Tư Đô Thị Phồn Hoa
    case 'CITY_GRID_INTERSECTION': {
      const numPts = 32;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        // Vuông bo góc Superellipse (Lamé curve n=4)
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        const signX = Math.sign(cosT);
        const signZ = Math.sign(sinT);
        const x = signX * Math.pow(Math.abs(cosT), 0.65) * scale * 1.5;
        const z = signZ * Math.pow(Math.abs(sinT), 0.65) * scale * 1.2;
        const y = Math.sin(t * 4) * 6.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 12. Khúc Quanh Sông Rừng Xanh
    case 'FOREST_RIVER_MEANDER': {
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.2 + 0.4 * Math.sin(4 * t));
        const x = Math.sin(t) * r * 1.35;
        const z = Math.cos(t) * scale * 1.1 + Math.sin(t * 2) * 280;
        const y = Math.sin(t * 3) * 7.0 + 7.5;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 13. Cảng Biển Vận Tải Quốc Tế
    case 'HARBOR_DOCK_CIRCUIT': {
      const numPts = 30;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.7 + Math.sin(t * 3) * 160;
        const z = Math.sin(t * 2) * scale * 0.95;
        const y = Math.sin(t) * 4.0 + 6.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 14. Xoắn Ốc Đỉnh Núi Tuyết Alpine
    case 'ALPINE_SUMMIT_SPIRAL': {
      const numPts = 40;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.1 + 0.35 * Math.cos(3 * t));
        const x = Math.cos(t) * r;
        const z = Math.sin(t) * r * 1.2;
        // Độ cao dốc tuyết Alpine hùng vĩ lên tới 25m
        const y = Math.sin(t) * 18.0 + 12.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 15. Hyperloop Tương Lai 2099
    case 'FUTURISTIC_HYPERLOOP': {
      const numPts = 32;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.8;
        const z = Math.sin(t * 3) * scale * 0.85;
        const y = Math.sin(t * 2) * 10.0 + 12.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 16. Miệng Núi Lửa Magma Rực Lửa
    case 'VOLCANO_CALDERA_RIM': {
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.3 + 0.15 * Math.sin(t * 6));
        const x = Math.cos(t) * r;
        const z = Math.sin(t) * r;
        const y = (Math.cos(t * 3) * 0.5 + 0.5) * 15.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 17. Vòng Xoay Nhà Ga Máy Bay
    case 'AIRPORT_HANGAR_CHICANE': {
      const numPts = 34;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.6 + Math.cos(t * 5) * 140;
        const z = Math.cos(t) * scale * 1.05 + Math.sin(t * 4) * 120;
        const y = Math.sin(t * 2) * 5.0 + 6.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 18. Cầu Vượt Biển Nối Đảo Ngọc
    case 'ISLAND_BRIDGE_CROSSING': {
      const numPts = 32;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 2.2;
        const z = Math.sin(t) * scale * 0.65;
        const y = (Math.sin(t * 2) * 0.5 + 0.5) * 12.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 19. Đường Hầm Tàu Điện Ngầm Neon
    case 'NEON_TUNNEL_METRO': {
      const numPts = 32;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.5 + Math.sin(t * 2) * 200;
        const z = Math.sin(t) * scale * 1.35;
        const y = Math.sin(t * 3) * 6.0 + 7.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 20. Sân Vận Động Supercross
    case 'STADIUM_SUPERCROSS': {
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.15 + 0.25 * Math.sin(t * 4));
        const x = Math.sin(t) * r * 1.4;
        const z = Math.cos(t) * r * 1.1;
        const y = Math.sin(t * 4) * 8.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 21. Silverstone Maggotts & Becketts (Chuỗi cua chữ S tốc độ siêu cao)
    case 'SILVERSTONE_MAGGOTTS_BECKETTS': {
      const numPts = 40;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.7 + Math.sin(t * 5) * 280;
        const z = Math.cos(t) * scale * 1.1 + Math.sin(t * 3) * 190;
        const y = Math.sin(t * 2) * 6.0 + 7.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 22. Spa Eau Rouge & Raidillon (Dốc đứng đổ cua mù kịch tính)
    case 'SPA_EAU_ROUGE_RAIDILLON': {
      const numPts = 40;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.6 + Math.sin(t * 2) * 220;
        const z = Math.sin(t) * scale * 1.25;
        // Dốc Eau Rouge lên tới 24m rồi đổ xuống thung lũng
        const y = Math.sin(t) * 16.0 + Math.cos(t * 2) * 8.0 + 14.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 23. Monaco Casino & Fairmont Hairpin (Cua tay áo hẹp nhất hành tinh)
    case 'MONACO_CASINO_HAIRPIN': {
      const numPts = 44;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.1 + 0.45 * Math.sin(2 * t) + 0.3 * Math.sin(5 * t));
        const x = Math.cos(t) * r * 1.3;
        const z = Math.sin(t) * r;
        const y = Math.sin(t * 3) * 11.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 24. Le Mans Mulsanne Straight & Chicanes (Đại lộ 500 km/h ngắt bởi chicane)
    case 'LE_MANS_MULSANNE_CHICANES': {
      const l = scale * 2.8;
      const w = scale * 0.5;
      const basePts = [
        new THREE.Vector3(-l, 5, -w),
        new THREE.Vector3(-l * 0.5, 6, -w + 60),
        new THREE.Vector3(-l * 0.2, 7, -w - 60),
        new THREE.Vector3(0, 6, -w),
        new THREE.Vector3(l * 0.3, 7, -w + 70),
        new THREE.Vector3(l * 0.6, 6, -w - 70),
        new THREE.Vector3(l, 5, -w),
        new THREE.Vector3(l + 320, 8, 0),
        new THREE.Vector3(l, 6, w),
        new THREE.Vector3(l * 0.5, 6, w),
        new THREE.Vector3(0, 7, w),
        new THREE.Vector3(-l * 0.5, 6, w),
        new THREE.Vector3(-l, 5, w),
        new THREE.Vector3(-l - 320, 8, 0)
      ];
      basePts.forEach(p => points.push(p.clone()));
      points.push(basePts[0].clone());
      break;
    }

    // 25. Cyber Octagon Velodrome (Bát giác 8 cạnh tương lai)
    case 'CYBER_OCTAGON_VELODROME': {
      const numPts = 32;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * 1.35 * (1 + 0.12 * Math.cos(8 * t));
        const x = Math.cos(t) * r;
        const z = Math.sin(t) * r;
        const y = Math.sin(t * 4) * 7.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 26. Dragon Back Ridgeline (Sống lưng rồng đỉnh mây)
    case 'DRAGON_BACK_RIDGELINE': {
      const numPts = 38;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.6 + Math.sin(t * 3) * 200;
        const z = Math.sin(t) * scale * 1.15;
        // Dạng sóng nhấp nhô sống lưng rồng
        const y = Math.sin(t * 6) * 12.0 + Math.sin(t) * 8.0 + 14.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 27. Infinity Loop Express (Vòng lặp vô cực kép ∞)
    case 'INFINITY_LOOP_EXPRESS': {
      const numPts = 40;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        // Dạng Lemniscate of Bernoulli
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (scale * 1.8 * Math.cos(t)) / denom;
        const z = (scale * 1.8 * Math.sin(t) * Math.cos(t)) / denom;
        const y = (Math.sin(t) * 0.5 + 0.5) * 17.0 + 5.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 28. Delta Wing Triangle (Tam giác 3 đỉnh nhọn 60 độ)
    case 'DELTA_WING_TRIANGLE': {
      const numPts = 33;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.3 + 0.35 * Math.cos(3 * t));
        const x = Math.cos(t) * r * 1.25;
        const z = Math.sin(t) * r * 1.25;
        const y = Math.sin(t * 3) * 8.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 29. Cloverleaf Interchange (Nút giao hoa thị 4 cánh đa tầng)
    case 'CLOVERLEAF_INTERCHANGE': {
      const numPts = 40;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.1 + 0.45 * Math.abs(Math.sin(2 * t)));
        const x = Math.cos(t) * r * 1.2;
        const z = Math.sin(t) * r * 1.2;
        const y = Math.sin(t * 4) * 12.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 30. Crescent Moon Bay (Vịnh trăng khuyết bãi biển nhiệt đới)
    case 'CRESCENT_MOON_BAY': {
      const numPts = 32;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.6 + Math.sin(t * 2) * (scale * 0.3);
        const z = Math.sin(t) * scale * 0.85 + Math.cos(t * 2) * (scale * 0.4);
        const y = Math.sin(t) * 7.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 31. Viper Fang Chicane (Nanh rắn zic-zac tức thì)
    case 'VIPER_FANG_CHICANE': {
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.5 + Math.sin(t * 7) * 220;
        const z = Math.cos(t) * scale * 1.15;
        const y = Math.sin(t * 3) * 8.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 32. Labyrinth Metropolis (Mê cung cao ốc đô thị)
    case 'LABYRINTH_METROPOLIS': {
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.45 + Math.cos(t * 3) * 240;
        const z = Math.sin(t) * scale * 1.35 + Math.sin(t * 4) * 210;
        const y = Math.sin(t * 2) * 9.0 + 9.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 33. Tornado Vortex Funnel (Lốc xoáy dốc lòng chảo nghiêng)
    case 'TORNADO_VORTEX_FUNNEL': {
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.2 + 0.35 * Math.sin(t));
        const x = Math.cos(t) * r * 1.3;
        const z = Math.sin(t) * r * 1.1;
        // Lòng chảo lún sâu 14m ở một bên rồi vọt lên
        const y = Math.sin(t) * 14.0 + 14.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 34. Twin Summits Valley (Thung lũng 2 đỉnh đồi dốc đứng)
    case 'TWIN_SUMMITS_VALLEY': {
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.7;
        const z = Math.sin(t) * scale * 1.05 + Math.sin(t * 2) * 200;
        // 2 đỉnh đồi cao vút 22m với thung lũng sâu
        const y = Math.pow(Math.sin(t * 2), 2) * 18.0 + 5.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 35. Aurora Fjord Serpentine (Vịnh băng tuyết mềm mại)
    case 'AURORA_FJORD_SERPENTINE': {
      const numPts = 38;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.6 + Math.cos(t * 3) * 260;
        const z = Math.cos(t) * scale * 1.25 + Math.sin(t * 2) * 180;
        const y = Math.sin(t * 2) * 10.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 36. Neo Shanghai Skyway (Cầu cạn trên không lơ lửng)
    case 'NEO_SHANGHAI_SKYWAY':
    default: {
      const numPts = 34;
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const variation = 1.0 + (rand() * 0.16 - 0.08);
        const x = Math.cos(t) * scale * 1.75 * variation;
        const z = Math.sin(t) * scale * 1.15 * variation + Math.cos(t * 3) * 150;
        const y = Math.sin(t * 2) * 11.0 + 12.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }
  }

  // Seed perturbation with exact matching start/end points
  const startPerturbX = (rand() - 0.5) * 50;
  const startPerturbY = (rand() - 0.5) * 2;
  const startPerturbZ = (rand() - 0.5) * 50;

  points.forEach((p, idx) => {
    if (idx === 0 || idx === points.length - 1) {
      p.x += startPerturbX;
      p.y += startPerturbY;
      p.z += startPerturbZ;
    } else {
      const t = idx / (points.length - 1);
      const wave = Math.sin(t * Math.PI * 4);
      p.x += wave * 25 * (rand() - 0.5);
      p.y += (rand() - 0.5) * 1.2;
      p.z += wave * 25 * (rand() - 0.5);
    }
    p.y = Math.max(5.0, p.y);
  });

  // Force exact closure to guarantee zero gap between start and end
  points[points.length - 1].copy(points[0]);

  return points;
}
