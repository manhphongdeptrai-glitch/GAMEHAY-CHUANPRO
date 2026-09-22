import * as THREE from 'three';
import { CameraMode, TrackBiome, WeatherType, AICarState } from '../types';

/**
 * 3D Spatial Audio & Acoustic Camera Director
 * Calculates real-time 3D acoustics, distance attenuation, stereo panning,
 * Doppler frequency shift, camera foley (helicopter, drone, trackside, cockpit),
 * and dynamic biome environmental ambience.
 */

export interface SpatialAudioSource {
  id: string;
  name: string;
  driverName?: string;
  type?: 'hypercar' | 'muscle' | 'formula' | 'gt_racer' | 'cyber_coupe' | string;
  position: THREE.Vector3;
  speedKmh: number;
  rpm: number;
  throttle: number;
  isDrifting?: boolean;
  isNitro?: boolean;
  isBraking?: boolean;
}

export interface SpatialCameraListener {
  position: THREE.Vector3;
  forward: THREE.Vector3;
  mode: CameraMode | string;
  speedKmh?: number;
}

export interface ProcessedCarAcoustic {
  id: string;
  distance: number;
  pan: number;             // -1.0 (Hard Left) to +1.0 (Hard Right)
  volume: number;          // 0.0 to 1.0 (distance attenuation)
  filterCutoff: number;    // Hz (air absorption)
  dopplerFactor: number;   // 0.65 to 1.45 (pitch multiplier)
  engineFreq: number;      // Synthesized base pitch Hz
  throttle: number;
  isDrifting: boolean;
  isNitro: boolean;
  isBraking: boolean;
  type: string;
}

export type BiomeAmbienceType =
  | 'RAIN'             // Rain hiss + wet tire spray
  | 'THUNDERSTORM'    // Heavy rain + distant thunder rumblings
  | 'MOUNTAIN_WIND'   // High altitude howling cold wind
  | 'DESERT_SAND'     // Desert breeze & dust gusts
  | 'CITY_RUMBLE'     // Urban rumble & electrical neon hum
  | 'COASTAL_SURF'    // Ocean surf breeze
  | 'NIGHT_BREEZE'    // Night wind & subtle nature texture
  | 'STADIUM_CROWD';  // Grand Prix stadium cheers & airhorns

export interface CameraAcousticPerspective {
  isHelicopter: boolean;
  isDrone: boolean;
  isTrackside: boolean;
  isCockpitOrHood: boolean;
  isPackChase: boolean;
  windSpeedFactor: number;     // 0.0 to 1.0
  cabinMuffleFactor: number;   // 0.0 (open) to 1.0 (fully muffled inside cabin)
  helicopterRotorVol: number;  // 0.0 to 1.0
  droneMotorVol: number;       // 0.0 to 1.0
  flybySensitivity: number;    // Sensitivity for Doppler swooshes
}

export interface FlybyEvent {
  carId: string;
  driverName?: string;
  speedKmh: number;
  distance: number;
  panStart: number;
  panEnd: number;
  timestamp: number;
}

export class AudioSpatialDirector {
  // Speed of sound in dry air: 343 m/s = ~1235 km/h
  public static readonly SPEED_OF_SOUND_KMH = 1235.0;

  // Track previous car positions & distances for Doppler and Flyby detection
  private previousCarDistances: Map<string, { distance: number; time: number; pos: THREE.Vector3 }> = new Map();
  private lastFlybyTimes: Map<string, number> = new Map();

  // Temporary vectors to avoid allocations
  private _camRight = new THREE.Vector3();
  private _upVec = new THREE.Vector3(0, 1, 0);
  private _relPos = new THREE.Vector3();

  /**
   * Phân loại môi trường âm thanh Biome & Weather
   */
  public resolveBiomeAmbience(biome?: TrackBiome | string, weather?: WeatherType | string): BiomeAmbienceType {
    const weatherStr = (typeof weather === 'string' ? weather : '').toLowerCase();
    const biomeStr = (typeof biome === 'string' ? biome : (biome?.id || biome?.theme || biome?.name || '')).toLowerCase();

    // 1. Kiểm tra thời tiết mưa bão
    if (weatherStr.includes('thunder') || weatherStr.includes('blizzard') && weatherStr.includes('storm')) {
      return 'THUNDERSTORM';
    }
    if (
      weatherStr.includes('rain') ||
      weatherStr.includes('monsoon') ||
      weatherStr.includes('drizzle') ||
      biomeStr.includes('rain')
    ) {
      return 'RAIN';
    }

    // 2. Núi cao / Tuyết / Đèo dốc
    if (
      biomeStr.includes('alpine') ||
      biomeStr.includes('snow') ||
      biomeStr.includes('ridge') ||
      biomeStr.includes('summit') ||
      weatherStr.includes('blizzard') ||
      weatherStr.includes('fog')
    ) {
      return 'MOUNTAIN_WIND';
    }

    // 3. Sa mạc / Canyon / Hẻm núi cát
    if (
      biomeStr.includes('desert') ||
      biomeStr.includes('canyon') ||
      biomeStr.includes('oasis') ||
      weatherStr.includes('sandstorm') ||
      weatherStr.includes('dust')
    ) {
      return 'DESERT_SAND';
    }

    // 4. Đô thị / Tokyo / Neon / Cyberpunk
    if (
      biomeStr.includes('metropolis') ||
      biomeStr.includes('tokyo') ||
      biomeStr.includes('cyber') ||
      biomeStr.includes('neon') ||
      weatherStr.includes('neon')
    ) {
      return 'CITY_RUMBLE';
    }

    // 5. Duyên hải / Vịnh biển / Hải cảng
    if (
      biomeStr.includes('coast') ||
      biomeStr.includes('coastal') ||
      biomeStr.includes('azure') ||
      biomeStr.includes('harbor') ||
      biomeStr.includes('california') ||
      weatherStr.includes('ocean')
    ) {
      return 'COASTAL_SURF';
    }

    // 6. Ban đêm / Trăng tròn / Thiên hà
    if (
      weatherStr.includes('night') ||
      weatherStr.includes('moon') ||
      weatherStr.includes('aurora') ||
      weatherStr.includes('galaxy')
    ) {
      return 'NIGHT_BREEZE';
    }

    // 7. Mặc định trường đua Grand Prix sôi động ban ngày
    return 'STADIUM_CROWD';
  }

  /**
   * Tính toán góc âm học camera (Camera Perspective Foley)
   */
  public getCameraPerspective(mode: CameraMode | string, cameraSpeedKmh: number = 250): CameraAcousticPerspective {
    const m = String(mode);

    // 1. Góc quay Trực thăng (Helicopter / Helipad / Chopper)
    const isHelicopter =
      m.includes('CHOPPER') ||
      m.includes('HELI') ||
      m.includes('HELIPAD') ||
      m === CameraMode.CHOPPER_HELI_CHASE;

    // 2. Góc quay Drone (Sky Drone / Flycam / FPV)
    const isDrone =
      m.includes('DRONE') ||
      m === CameraMode.SKY_DRONE_BROADCAST;

    // 3. Góc quay Buồng lái / Nắp Capo (Cockpit / Hood / Bumper)
    const isCockpitOrHood =
      m.includes('COCKPIT') ||
      m.includes('HOOD') ||
      m.includes('BUMPER') ||
      m === CameraMode.COCKPIT_FIRST_PERSON ||
      m === CameraMode.HOOD ||
      m === CameraMode.BUMPER_FIRST_PERSON;

    // 4. Góc quay Ven đường / Đài truyền hình (Trackside / Curbside / Apex / Spectator / Low Ground)
    const isTrackside =
      m.includes('TRACKSIDE') ||
      m.includes('SPECTATOR') ||
      m.includes('PIT_WALL') ||
      m.includes('PANORAMIC') ||
      m.includes('LOW_GROUND') ||
      m === CameraMode.TRACKSIDE_TELEPHOTO ||
      m === CameraMode.TRACKSIDE_APEX ||
      m === CameraMode.LOW_GROUND;

    // 5. Bám đuôi đoàn xe (Pack Chase / Overtake Wide / Behind)
    const isPackChase =
      m.includes('PACK') ||
      m.includes('CHASE') ||
      m.includes('BEHIND') ||
      m === CameraMode.MULTI_CAR_PACK_CHASE ||
      m === CameraMode.MULTI_CAR_OVERTAKE_WIDE;

    // Hệ số gió theo tốc độ
    const windSpeedFactor = Math.min(1.0, Math.max(0.1, cameraSpeedKmh / 500));

    return {
      isHelicopter,
      isDrone,
      isTrackside,
      isCockpitOrHood,
      isPackChase,
      windSpeedFactor,
      cabinMuffleFactor: isCockpitOrHood ? 0.75 : 0.0,
      helicopterRotorVol: isHelicopter ? 0.85 : 0.0,
      droneMotorVol: isDrone ? 0.90 : 0.0,
      flybySensitivity: isTrackside ? 1.0 : (isPackChase ? 0.6 : 0.25)
    };
  }

  /**
   * Tính toán âm học không gian (Distance, Pan, Doppler, Frequency) cho tất cả các xe
   * so với vị trí hiện tại của Camera
   */
  public processSpatialVehicles(
    cars: SpatialAudioSource[],
    camera: SpatialCameraListener,
    currentTimeSec: number
  ): {
    sortedCars: ProcessedCarAcoustic[];
    activeFlybys: FlybyEvent[];
    nearestCar: ProcessedCarAcoustic | null;
  } {
    // Vector hướng phải của Camera: Right = Forward x Up
    this._camRight.crossVectors(camera.forward, this._upVec).normalize();

    const processed: ProcessedCarAcoustic[] = [];
    const detectedFlybys: FlybyEvent[] = [];

    for (const car of cars) {
      // Vector vị trí tương đối của xe so với camera
      this._relPos.subVectors(car.position, camera.position);
      const distance = Math.max(0.5, this._relPos.length());

      // Stereo Pan (-1.0 cực trái -> +1.0 cực phải) dựa trên hình chiếu lên vector Right
      const rightDot = this._relPos.dot(this._camRight);
      const pan = Math.max(-1.0, Math.min(1.0, (rightDot / distance) * 1.5));

      // Độ suy giảm âm lượng theo khoảng cách (Inverse Distance Law với Minimum Threshold)
      // Cận cảnh (< 15m): 1.0 -> 0.7; Xa (50m): 0.35; Rất xa (> 150m): 0.08
      const volume = Math.max(0.04, 1.0 / (1.0 + (distance / 22.0) * 1.35));

      // Lọc thông thấp theo khoảng cách (Air Absorption: Tần số cao bị không khí hấp thụ nhanh hơn)
      // 5m: 6000Hz -> 100m: 1100Hz -> 300m: 450Hz
      const filterCutoff = Math.max(400, Math.min(7500, 7500 / (1.0 + distance / 35.0)));

      // Tính toán Doppler Shift
      let dopplerFactor = 1.0;
      const prevData = this.previousCarDistances.get(car.id);

      if (prevData && currentTimeSec > prevData.time) {
        const dt = Math.max(0.001, currentTimeSec - prevData.time);
        const distanceDelta = distance - prevData.distance; // Dương = đang chạy ra xa, Âm = đang áp sát
        const radialVelocityMps = distanceDelta / dt; // m/s
        const radialVelocityKmh = radialVelocityMps * 3.6;

        // Công thức Doppler: f' = f * (c / (c + v_radial))
        const c = AudioSpatialDirector.SPEED_OF_SOUND_KMH;
        dopplerFactor = Math.max(0.65, Math.min(1.48, c / (c + radialVelocityKmh)));

        // Phát hiện hiệu ứng xé gió Flyby vụt qua màn hình:
        // Xe áp sát cực gần (< 18m) với tốc độ cao (> 180 km/h) và vừa chuyển từ tiến tới -> lướt qua
        const lastFlyby = this.lastFlybyTimes.get(car.id) || 0;
        if (
          distance < 18.0 &&
          car.speedKmh > 180 &&
          prevData.distance > distance &&
          currentTimeSec - lastFlyby > 3.0 // Cooldown 3s mỗi xe
        ) {
          this.lastFlybyTimes.set(car.id, currentTimeSec);
          detectedFlybys.push({
            carId: car.id,
            driverName: car.driverName,
            speedKmh: Math.round(car.speedKmh),
            distance,
            panStart: -Math.sign(pan || 1) * 0.9,
            panEnd: Math.sign(pan || 1) * 0.95,
            timestamp: currentTimeSec
          });
        }
      }

      // Lưu lại dữ liệu vị trí frame trước
      this.previousCarDistances.set(car.id, {
        distance,
        time: currentTimeSec,
        pos: car.position.clone()
      });

      // Tần số động cơ đặc trưng theo loại xe (Hypercar, Muscle, Formula, GT, Cyber)
      let baseEngineHz = 65;
      const carType = car.type || 'hypercar';
      switch (carType) {
        case 'formula':
          // Tiếng thét F1 V10 vòng tua cao: 120Hz -> 420Hz
          baseEngineHz = 110 + (car.rpm / 12000) * 310;
          break;
        case 'muscle':
          // Tiếng gầm gừ uy lực V8 Mỹ: 45Hz -> 210Hz
          baseEngineHz = 42 + (car.rpm / 6800) * 168;
          break;
        case 'cyber_coupe':
          // Động cơ điện siêu âm & Inverter: 150Hz -> 520Hz
          baseEngineHz = 140 + (car.speedKmh / 500) * 380;
          break;
        case 'gt_racer':
          // GT3 V6 Twin-Turbo: 75Hz -> 310Hz
          baseEngineHz = 70 + (car.rpm / 8500) * 240;
          break;
        default:
          // Hypercar V12: 80Hz -> 360Hz
          baseEngineHz = 75 + (car.rpm / 9500) * 285;
          break;
      }

      const finalEngineFreq = baseEngineHz * dopplerFactor;

      processed.push({
        id: car.id,
        distance,
        pan,
        volume,
        filterCutoff,
        dopplerFactor,
        engineFreq: finalEngineFreq,
        throttle: car.throttle,
        isDrifting: Boolean(car.isDrifting),
        isNitro: Boolean(car.isNitro),
        isBraking: Boolean(car.isBraking),
        type: carType
      });
    }

    // Sắp xếp các xe theo độ gần camera nhất (gần nhất sẽ nghe rõ nhất và chi tiết nhất)
    processed.sort((a, b) => a.distance - b.distance);

    return {
      sortedCars: processed,
      activeFlybys: detectedFlybys,
      nearestCar: processed[0] || null
    };
  }
}

export const audioSpatialDirector = new AudioSpatialDirector();
