import * as THREE from 'three';
import { commentarySoundManager, ScheduledCommentaryEvent } from './commentarySoundManager';
import {
  audioSpatialDirector,
  SpatialAudioSource,
  SpatialCameraListener,
  BiomeAmbienceType,
  CameraAcousticPerspective,
  FlybyEvent
} from './audioSpatialDirector';
import { CameraMode, TrackBiome, WeatherType } from '../types';

/**
 * Interface cho 1 Voice động cơ ô tô không gian (Stereo Spatial Car Voice)
 */
interface SpatialEngineVoice {
  oscSaw: OscillatorNode;
  oscSub: OscillatorNode;
  filter: BiquadFilterNode;
  panner: StereoPannerNode;
  gain: GainNode;
  activeCarId: string;
}

/**
 * High-End 3D Spatial Audio & Acoustic Camera Director Engine
 * Tích hợp:
 * 1. Engine âm thanh môi trường động theo Biome & Thời tiết (mưa rào, sấm sét, gió núi, sa mạc, đô thị, khán đài).
 * 2. Vị trí thính giả Camera-Centric (Camera ở đâu thì âm thanh được nghe tại đó).
 * 3. Foley góc máy: Trực thăng (cánh quạt đập phành phạch), Drone (mô-tơ rít cao tần),
 *    Ven đường (xe lao vèo vèo vụt qua), Buồng lái (cách âm cabin, máy rung đầm).
 * 4. Đa âm 15 xe đua cùng gầm rú với khoảng cách 3D, Pan trái/phải và hiệu ứng Doppler chân thực.
 * 5. Hiệu ứng xé gió (Flyby / Air-tear Whoosh) khi xe vụt qua camera ở tốc độ cao.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized: boolean = false;
  public isMuted: boolean = false;

  // Master bus
  private masterGain: GainNode | null = null;
  private commentaryGain: GainNode | null = null;
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  // Lọc cách âm buồng lái (Cockpit Isolation Filter)
  private cockpitFilter: BiquadFilterNode | null = null;

  // Ngân hàng Voice động cơ đa âm không gian (4 xe cận cảnh + 1 voice gom cụm đoàn xe)
  private carVoices: SpatialEngineVoice[] = [];
  private packSaw: OscillatorNode | null = null;
  private packSub: OscillatorNode | null = null;
  private packFilter: BiquadFilterNode | null = null;
  private packPanner: StereoPannerNode | null = null;
  private packGain: GainNode | null = null;

  // Rít lốp xe bám đường (Tire Skid / Screech)
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;
  private skidPanner: StereoPannerNode | null = null;
  private skidNoiseNode: AudioBufferSourceNode | null = null;

  // Âm thanh môi trường Biome & Thời tiết động (Ambient Environment)
  private currentAmbienceType: BiomeAmbienceType = 'STADIUM_CROWD';
  private ambienceGain: GainNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private thunderTimer: number = 0;

  // Foley Camera: Trực thăng (Helicopter Rotor), Drone (FPV Motor Whine), Gió xé qua camera
  private heliGain: GainNode | null = null;
  private heliOsc: OscillatorNode | null = null;
  private heliLfo: OscillatorNode | null = null;
  private heliLfoGain: GainNode | null = null;

  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;

  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;

  // Flyby Whoosh Audio Buffer (Tạo sẵn để phát tức thì khi có xe vụt qua)
  private flybyNoiseBuffer: AudioBuffer | null = null;

  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.52, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Kênh riêng cho bình luận viên tiếng Anh / Việt
      this.commentaryGain = this.ctx.createGain();
      this.commentaryGain.gain.setValueAtTime(0.95, this.ctx.currentTime);
      this.commentaryGain.connect(this.masterGain);

      // MediaStream Destination để xuất video kèm toàn bộ âm thanh không gian 3D
      try {
        this.mediaStreamDest = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.mediaStreamDest);
      } catch {
        // Ignore
      }

      // Lọc âm cách âm cabin (Cockpit Isolation Filter)
      this.cockpitFilter = this.ctx.createBiquadFilter();
      this.cockpitFilter.type = 'lowpass';
      this.cockpitFilter.frequency.setValueAtTime(14000, this.ctx.currentTime);
      this.cockpitFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      this.cockpitFilter.connect(this.masterGain);

      // Khởi tạo White/Pink Noise Buffer cho lốp, gió và môi trường
      const noiseBuffer = this.createNoiseBuffer(2.0);
      this.flybyNoiseBuffer = this.createNoiseBuffer(1.2);

      // =========================================================================
      // 1. KHỞI TẠO 4 VOICES ĐỘNG CƠ CẬN CẢNH KHÔNG GIAN (SPATIAL CAR VOICES)
      // =========================================================================
      this.carVoices = [];
      for (let i = 0; i < 4; i++) {
        const oscSaw = this.ctx.createOscillator();
        oscSaw.type = 'sawtooth';
        oscSaw.frequency.setValueAtTime(70 + i * 8, this.ctx.currentTime);

        const oscSub = this.ctx.createOscillator();
        oscSub.type = 'triangle';
        oscSub.frequency.setValueAtTime((70 + i * 8) * 0.5, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.8, this.ctx.currentTime);

        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(0, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(i === 0 ? 0.35 : 0.0, this.ctx.currentTime);

        oscSaw.connect(filter);
        oscSub.connect(filter);
        filter.connect(panner);
        panner.connect(gain);
        gain.connect(this.cockpitFilter);

        oscSaw.start();
        oscSub.start();

        this.carVoices.push({
          oscSaw,
          oscSub,
          filter,
          panner,
          gain,
          activeCarId: ''
        });
      }

      // =========================================================================
      // 2. KHỞI TẠO TIẾNG GẦM GỪ CỦA CẢ ĐOÀN 15 XE Ở PHÍA XA (PACK COLLECTIVE VOICE)
      // =========================================================================
      this.packSaw = this.ctx.createOscillator();
      this.packSaw.type = 'sawtooth';
      this.packSaw.frequency.setValueAtTime(62, this.ctx.currentTime);

      this.packSub = this.ctx.createOscillator();
      this.packSub.type = 'triangle';
      this.packSub.frequency.setValueAtTime(38, this.ctx.currentTime);

      this.packFilter = this.ctx.createBiquadFilter();
      this.packFilter.type = 'lowpass';
      this.packFilter.frequency.setValueAtTime(420, this.ctx.currentTime);

      this.packPanner = this.ctx.createStereoPanner();
      this.packGain = this.ctx.createGain();
      this.packGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.packSaw.connect(this.packFilter);
      this.packSub.connect(this.packFilter);
      this.packFilter.connect(this.packPanner);
      this.packPanner.connect(this.packGain);
      this.packGain.connect(this.cockpitFilter);

      this.packSaw.start();
      this.packSub.start();

      // =========================================================================
      // 3. TIẾNG RÍT LỐP BÁM ĐƯỜNG KHI VÀO CUA / DRIFT (TIRE SCREECH)
      // =========================================================================
      this.skidNoiseNode = this.ctx.createBufferSource();
      this.skidNoiseNode.buffer = noiseBuffer;
      this.skidNoiseNode.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.setValueAtTime(1450, this.ctx.currentTime);
      this.skidFilter.Q.setValueAtTime(3.8, this.ctx.currentTime);

      this.skidPanner = this.ctx.createStereoPanner();
      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.skidNoiseNode.connect(this.skidFilter);
      this.skidFilter.connect(this.skidPanner);
      this.skidPanner.connect(this.skidGain);
      this.skidGain.connect(this.cockpitFilter);

      this.skidNoiseNode.start();

      // =========================================================================
      // 4. ÂM THANH MÔI TRƯỜNG BIOME ĐỘNG (Mưa rơi, gió núi, sa mạc, khán đài)
      // =========================================================================
      this.ambienceSource = this.ctx.createBufferSource();
      this.ambienceSource.buffer = noiseBuffer;
      this.ambienceSource.loop = true;

      this.ambienceFilter = this.ctx.createBiquadFilter();
      this.ambienceFilter.type = 'bandpass';
      this.ambienceFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.ambienceFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.ambienceSource.connect(this.ambienceFilter);
      this.ambienceFilter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.masterGain);

      this.ambienceSource.start();

      // =========================================================================
      // 5. FOLEY CAMERA: TRỰC THĂNG (Helicopter Rotor Blade Pulser)
      // =========================================================================
      this.heliOsc = this.ctx.createOscillator();
      this.heliOsc.type = 'sawtooth';
      this.heliOsc.frequency.setValueAtTime(110, this.ctx.currentTime);

      this.heliLfo = this.ctx.createOscillator();
      this.heliLfo.type = 'square';
      this.heliLfo.frequency.setValueAtTime(18.5, this.ctx.currentTime); // 18.5 Hz cánh quạt đập

      this.heliLfoGain = this.ctx.createGain();
      this.heliLfoGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      const heliFilter = this.ctx.createBiquadFilter();
      heliFilter.type = 'lowpass';
      heliFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.heliGain = this.ctx.createGain();
      this.heliGain.gain.setValueAtTime(0, this.ctx.currentTime);

      const heliTremolo = this.ctx.createGain();
      heliTremolo.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.heliLfo.connect(heliTremolo.gain);

      this.heliOsc.connect(heliFilter);
      heliFilter.connect(heliTremolo);
      heliTremolo.connect(this.heliGain);
      this.heliGain.connect(this.masterGain);

      this.heliOsc.start();
      this.heliLfo.start();

      // =========================================================================
      // 6. FOLEY CAMERA: DRONE (FPV Racing Drone Motor Whine)
      // =========================================================================
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(560, this.ctx.currentTime);

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'sawtooth';
      this.droneOsc2.frequency.setValueAtTime(840, this.ctx.currentTime);

      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'bandpass';
      droneFilter.frequency.setValueAtTime(700, this.ctx.currentTime);
      droneFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.droneOsc1.connect(droneFilter);
      this.droneOsc2.connect(droneFilter);
      droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.droneOsc1.start();
      this.droneOsc2.start();

      // =========================================================================
      // 7. FOLEY CAMERA: GIÓ LƯỚT CAMERA (Camera Wind Slipstream)
      // =========================================================================
      this.windSource = this.ctx.createBufferSource();
      this.windSource.buffer = noiseBuffer;
      this.windSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(950, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.cockpitFilter);

      this.windSource.start();

      this.isInitialized = true;
    } catch (err) {
      console.warn('AudioEngine initialization error:', err);
    }
  }

  private createNoiseBuffer(durationSeconds: number): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const length = Math.floor(this.ctx.sampleRate * durationSeconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Pink-ish noise filter
      lastOut = (lastOut * 0.95) + (white * 0.05);
      data[i] = lastOut * 3.5 + white * 0.2;
    }
    return buffer;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.52, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  setDucking(isDucking: boolean) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      const targetGain = isDucking ? 0.24 : 0.52;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }
  }

  playCountdownBeep(isFinal: boolean = false) {
    if (this.isMuted || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isFinal ? 'square' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isFinal ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + (isFinal ? 0.65 : 0.3));
    } catch {
      // Ignore
    }
  }

  /**
   * Cập nhật môi trường âm thanh Biome & Thời tiết động
   */
  setBiomeAmbience(biome?: TrackBiome | string, weather?: WeatherType | string) {
    if (!this.ctx || !this.ambienceFilter || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    const resolvedType = audioSpatialDirector.resolveBiomeAmbience(biome, weather);
    this.currentAmbienceType = resolvedType;

    switch (resolvedType) {
      case 'RAIN':
      case 'THUNDERSTORM':
        // Tiếng rào rào của mưa rơi trên kính và mặt đường ướt sũng
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(2200, now, 0.2);
        this.ambienceFilter.Q.setTargetAtTime(1.8, now, 0.2);
        this.ambienceGain.gain.setTargetAtTime(0.18, now, 0.2);
        break;

      case 'MOUNTAIN_WIND':
        // Tiếng gió rít hú qua đỉnh núi tuyết cao vút
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(420, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(3.5, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.15, now, 0.3);
        break;

      case 'DESERT_SAND':
        // Gió cát sa mạc khô khốc lùa qua hẻm núi
        this.ambienceFilter.type = 'highpass';
        this.ambienceFilter.frequency.setTargetAtTime(1400, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(1.2, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.11, now, 0.3);
        break;

      case 'CITY_RUMBLE':
        // Rung động âm trầm của đô thị Tokyo / Cyberpunk và tiếng điện thế neon
        this.ambienceFilter.type = 'lowpass';
        this.ambienceFilter.frequency.setTargetAtTime(180, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(2.2, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.14, now, 0.3);
        break;

      case 'COASTAL_SURF':
        // Gió biển rì rào
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(650, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(2.0, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.12, now, 0.3);
        break;

      case 'NIGHT_BREEZE':
        // Gió đêm tĩnh lặng
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(950, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(1.5, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.06, now, 0.3);
        break;

      case 'STADIUM_CROWD':
      default:
        // Không khí cuồng nhiệt của khán đài trường đua F1
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(850, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(1.4, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.09, now, 0.3);
        break;
    }
  }

  /**
   * Phát hiệu ứng tiếng xé gió vụt qua camera (High-Speed Flyby Whoosh)
   */
  triggerFlyby(speedKmh: number = 450, panStart: number = -0.85, panEnd: number = 0.9) {
    if (!this.ctx || this.isMuted || !this.flybyNoiseBuffer) return;
    try {
      const now = this.ctx.currentTime;
      const flybySource = this.ctx.createBufferSource();
      flybySource.buffer = this.flybyNoiseBuffer;

      const flybyFilter = this.ctx.createBiquadFilter();
      flybyFilter.type = 'bandpass';
      // Tần số quét siêu tốc từ cao xuống thấp khi xe vụt qua: 3800Hz -> 480Hz
      flybyFilter.frequency.setValueAtTime(3600, now);
      flybyFilter.frequency.exponentialRampToValueAtTime(450, now + 0.38);
      flybyFilter.Q.setValueAtTime(4.2, now);

      const flybyPanner = this.ctx.createStereoPanner();
      flybyPanner.pan.setValueAtTime(panStart, now);
      flybyPanner.pan.linearRampToValueAtTime(panEnd, now + 0.38);

      const flybyGain = this.ctx.createGain();
      const intensity = Math.min(0.48, 0.2 + (speedKmh / 500) * 0.26);
      flybyGain.gain.setValueAtTime(0.001, now);
      flybyGain.gain.linearRampToValueAtTime(intensity, now + 0.12);
      flybyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      flybySource.connect(flybyFilter);
      flybyFilter.connect(flybyPanner);
      flybyPanner.connect(flybyGain);
      flybyGain.connect(this.masterGain || this.ctx.destination);

      flybySource.start(now);
      flybySource.stop(now + 0.45);
    } catch {
      // Ignore
    }
  }

  /**
   * Cập nhật toàn diện âm thanh không gian 3D theo vị trí Camera và toàn bộ đoàn xe (15 xe)
   */
  updateSpatial(
    cameraListener: SpatialCameraListener,
    cars: SpatialAudioSource[],
    biome?: TrackBiome | string,
    weather?: WeatherType | string
  ) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Cập nhật Biome & Thời tiết
      this.setBiomeAmbience(biome, weather);

      // 2. Tính toán âm học không gian cho tất cả các xe
      const { sortedCars, activeFlybys } = audioSpatialDirector.processSpatialVehicles(
        cars,
        cameraListener,
        now
      );

      // 3. Góc máy Camera Perspective (Helicopter, Drone, Trackside, Cockpit)
      const persp = audioSpatialDirector.getCameraPerspective(
        cameraListener.mode,
        cameraListener.speedKmh || 300
      );

      // Cập nhật âm thanh cánh quạt Trực thăng
      if (this.heliGain) {
        this.heliGain.gain.setTargetAtTime(persp.helicopterRotorVol * 0.32, now, 0.15);
      }

      // Cập nhật âm thanh mô-tơ Drone FPV
      if (this.droneGain) {
        this.droneGain.gain.setTargetAtTime(persp.droneMotorVol * 0.28, now, 0.15);
      }

      // Cập nhật gió lướt camera
      if (this.windGain) {
        const targetWind = 0.03 + persp.windSpeedFactor * 0.12;
        this.windGain.gain.setTargetAtTime(targetWind, now, 0.1);
      }

      // Cập nhật cách âm buồng lái (Cockpit Isolation Filter)
      if (this.cockpitFilter) {
        const targetCutoff = persp.isCockpitOrHood ? 950 : 16000;
        this.cockpitFilter.frequency.setTargetAtTime(targetCutoff, now, 0.1);
      }

      // 4. Kích hoạt hiệu ứng xé gió Flyby nếu có xe lướt qua camera ven đường
      for (const flyby of activeFlybys) {
        this.triggerFlyby(flyby.speedKmh, flyby.panStart, flyby.panEnd);
      }

      // 5. Cập nhật 4 Voices động cơ cận cảnh gần camera nhất
      for (let i = 0; i < this.carVoices.length; i++) {
        const voice = this.carVoices[i];
        const carData = sortedCars[i];

        if (carData) {
          voice.activeCarId = carData.id;

          // Tần số động cơ với Doppler Effect
          voice.oscSaw.frequency.setTargetAtTime(carData.engineFreq, now, 0.04);
          voice.oscSub.frequency.setTargetAtTime(carData.engineFreq * 0.505, now, 0.04);

          // Âm lượng theo khoảng cách 3D (xe gần to, xe xa nhỏ)
          const adjustedVol = carData.volume * (persp.isCockpitOrHood && i > 0 ? 0.45 : 1.0) * 0.38;
          voice.gain.gain.setTargetAtTime(adjustedVol, now, 0.05);

          // Panning Trái / Phải theo góc camera
          voice.panner.pan.setTargetAtTime(carData.pan, now, 0.04);

          // Lọc thông thấp theo độ mở bướm ga và suy giảm không khí
          voice.filter.frequency.setTargetAtTime(carData.filterCutoff, now, 0.05);
        } else {
          voice.gain.gain.setTargetAtTime(0, now, 0.06);
        }
      }

      // 6. Cập nhật tiếng gầm gừ tập thể của các xe còn lại trong đoàn 15 xe
      if (this.packGain && this.packPanner && this.packSaw && sortedCars.length > 4) {
        let avgPan = 0;
        let avgFreq = 0;
        const remainingCars = sortedCars.slice(4);

        for (const rc of remainingCars) {
          avgPan += rc.pan;
          avgFreq += rc.engineFreq;
        }
        avgPan /= remainingCars.length;
        avgFreq /= remainingCars.length;

        this.packPanner.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, avgPan)), now, 0.08);
        this.packSaw.frequency.setTargetAtTime(Math.max(50, Math.min(180, avgFreq * 0.65)), now, 0.08);
        this.packGain.gain.setTargetAtTime(0.18, now, 0.08);
      }

      // 7. Cập nhật rít lốp bám đường (Tire Skid / Drift)
      const driftingCar = sortedCars.find(c => c.isDrifting || c.isBraking);
      if (this.skidGain && this.skidPanner) {
        if (driftingCar) {
          const skidVol = Math.min(0.35, driftingCar.volume * 0.38);
          this.skidGain.gain.setTargetAtTime(skidVol, now, 0.05);
          this.skidPanner.pan.setTargetAtTime(driftingCar.pan, now, 0.05);
        } else {
          this.skidGain.gain.setTargetAtTime(0, now, 0.08);
        }
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Phương thức cập nhật truyền thống (tương thích ngược với các lệnh gọi đơn giản)
   */
  update(
    rpm: number = 3500,
    throttle: number = 0.8,
    isDrifting: boolean = false,
    isBraking: boolean = false,
    speed: number = 120
  ) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = THREE_MathUtils_lerp(50, 360, Math.min(1.0, Math.max(0.1, (rpm || 3000) / 9500)));

      if (this.carVoices[0]) {
        this.carVoices[0].oscSaw.frequency.setTargetAtTime(baseFreq, now, 0.04);
        this.carVoices[0].oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
        const filterCutoff = THREE_MathUtils_lerp(400, 2600, Math.min(1.0, (throttle * 0.6) + (speed / 500) * 0.5));
        this.carVoices[0].filter.frequency.setTargetAtTime(filterCutoff, now, 0.05);
        this.carVoices[0].gain.gain.setTargetAtTime(0.38, now, 0.05);
      }

      if (this.skidGain) {
        const targetSkidVol = (isDrifting || isBraking) ? Math.min(0.35, 0.15 + (speed / 500) * 0.2) : 0;
        this.skidGain.gain.setTargetAtTime(targetSkidVol, now, 0.06);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Lấy Audio Track của MediaStream để chèn trực tiếp vào MediaRecorder xuất video
   */
  getMediaStreamTrack(): MediaStreamTrack | null {
    this.init();
    if (!this.ctx || !this.masterGain) return null;
    try {
      if (!this.mediaStreamDest) {
        this.mediaStreamDest = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.mediaStreamDest);
      }
      const tracks = this.mediaStreamDest.stream.getAudioTracks();
      return tracks[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Phát trực tiếp đoạn âm thanh bình luận qua Web Audio API với Audio Ducking
   */
  playCommentaryBuffer(buffer: AudioBuffer, onEnd?: () => void): AudioBufferSourceNode | null {
    this.init();
    if (!this.ctx || !this.commentaryGain || this.isMuted) return null;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.commentaryGain);

      this.setDucking(true);
      source.onended = () => {
        this.setDucking(false);
        if (onEnd) onEnd();
      };

      source.start();
      return source;
    } catch (err) {
      console.warn('Lỗi khi phát commentary buffer:', err);
      this.setDucking(false);
      return null;
    }
  }

  /**
   * Tạo chuỗi dữ liệu âm thanh PCM Stereo chất lượng cao giả lập ĐA ÂM 15 XE ĐUA,
   * vị trí CAMERA thay đổi theo kịch bản truyền hình, góc quay Trực thăng, Drone, Ven đường,
   * tiếng xé gió Flyby vụt qua màn hình, môi trường Biome và giọng bình luận viên.
   */
  generateRacingAudioPCM(
    durationSeconds: number,
    sampleRate: number = 44100,
    instanceId: number = 1,
    seed: number = 632585,
    biome?: TrackBiome | string,
    weather?: WeatherType | string,
    carsCount: number = 15
  ): { left: Float32Array; right: Float32Array; totalSamples: number; timeline: ScheduledCommentaryEvent[] } {
    const totalSamples = Math.floor(durationSeconds * sampleRate);
    const left = new Float32Array(totalSamples);
    const right = new Float32Array(totalSamples);

    // Lấy kịch bản các đoạn bình luận
    const timeline = commentarySoundManager.getTimelineForInstance(instanceId, seed, durationSeconds);

    // Môi trường âm thanh Biome
    const ambienceType = audioSpatialDirector.resolveBiomeAmbience(biome, weather);

    // Giả lập 15 xe đua với pha lệch ngẫu nhiên, tốc độ và vòng tua riêng biệt
    const numCars = Math.max(6, Math.min(15, carsCount));
    const carPhases1 = new Float32Array(numCars);
    const carPhases2 = new Float32Array(numCars);
    const carSubPhases = new Float32Array(numCars);
    const carBaseFreqs = new Float32Array(numCars);
    const carOffsets = new Float32Array(numCars); // Vị trí trên vòng đua (0.0 -> 1.0)
    const carLanes = new Float32Array(numCars);   // Làn đường (-1.0 -> 1.0)

    for (let c = 0; c < numCars; c++) {
      carOffsets[c] = (c / numCars) * 0.18; // Đoàn xe xuất phát so kè bám đuôi
      carLanes[c] = ((c % 3) - 1.0) * 0.7;
      carBaseFreqs[c] = 72 + (c * 17) % 55; // Mỗi xe có âm sắc động cơ khác biệt
    }

    let filterStateL = 0;
    let filterStateR = 0;
    let ambienceFilterStateL = 0;
    let ambienceFilterStateR = 0;
    let heliPhase = 0;
    let dronePhase1 = 0;
    let dronePhase2 = 0;

    // Chu kỳ chuyển góc quay Camera theo thời gian (giả lập Camera Director 5.5s / góc)
    const cameraModesCycle = [
      'CHOPPER_HELI_CHASE',
      'TRACKSIDE_TELEPHOTO',
      'MULTI_CAR_PACK_CHASE',
      'COCKPIT_FIRST_PERSON',
      'SKY_DRONE_BROADCAST',
      'TRACKSIDE_APEX',
      'HOOD',
      'LOW_GROUND'
    ];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      // 1. Bình luận viên & Audio Ducking
      let activeCommentary: ScheduledCommentaryEvent | null = null;
      for (const evt of timeline) {
        if (t >= evt.startSec && t < evt.startSec + evt.durationSec) {
          activeCommentary = evt;
          break;
        }
      }
      const duckMultiplier = activeCommentary ? 0.45 : 1.0;

      // 2. Góc quay Camera hiện tại
      const camIdx = Math.floor(t / 5.5) % cameraModesCycle.length;
      const currentCamMode = cameraModesCycle[camIdx];
      const isHelicopter = currentCamMode.includes('CHOPPER');
      const isDrone = currentCamMode.includes('DRONE');
      const isTrackside = currentCamMode.includes('TRACKSIDE') || currentCamMode.includes('LOW_GROUND');
      const isCockpit = currentCamMode.includes('COCKPIT') || currentCamMode.includes('HOOD');

      // Vị trí camera giả định trên vòng đua (0.0 -> 1.0)
      const camTrackPos = isTrackside
        ? ((Math.floor(t / 5.5) * 0.23) % 1.0) // Trạm máy quay tĩnh ven đường
        : ((t * 0.028) % 1.0);                 // Camera di động bám theo đoàn đua

      let mixLeft = 0;
      let mixRight = 0;

      // 3. Tổng hợp âm thanh từ cả 15 xe đua (Polyphonic Multi-Car Simulation)
      for (let c = 0; c < numCars; c++) {
        // Tốc độ và chu kỳ sang số riêng biệt từng xe
        const carCycle = (t + c * 0.42) % 5.2;
        let rpmNorm = 0.55;
        let throttle = 0.95;

        if (carCycle < 0.28) {
          rpmNorm = 0.52 + (carCycle / 0.28) * 0.22;
        } else if (carCycle < 3.6) {
          rpmNorm = 0.65 + ((carCycle - 0.28) / 3.32) * 0.35;
        } else if (carCycle < 4.1) {
          rpmNorm = 1.0 - ((carCycle - 3.6) / 0.5) * 0.45;
          throttle = 0.4;
        } else {
          rpmNorm = 0.55 + ((carCycle - 4.1) / 1.1) * 0.25;
        }

        // Cập nhật khoảng cách tương đối giữa xe và camera
        const carDistTrack = Math.abs(((carOffsets[c] + t * 0.03 + (c === 0 ? 0.005 : 0)) % 1.0) - camTrackPos);
        const distMeters = Math.max(3.0, carDistTrack * 950.0);

        // Doppler shift: Khi xe áp sát camera ven đường
        let dopplerFactor = 1.0;
        let isFlybyInstant = false;
        if (isTrackside && distMeters < 35.0) {
          const approachRate = Math.cos(t * 1.5 + c) * 0.22;
          dopplerFactor = 1.0 + approachRate;
          if (distMeters < 15.0) isFlybyInstant = true;
        }

        // Tần số động cơ của xe này
        const engineHz = (carBaseFreqs[c] + rpmNorm * 260) * dopplerFactor;

        // Cập nhật pha dao động
        carPhases1[c] += (2 * Math.PI * engineHz) / sampleRate;
        carPhases2[c] += (2 * Math.PI * engineHz * 0.504) / sampleRate;
        carSubPhases[c] += (2 * Math.PI * 45) / sampleRate;

        if (carPhases1[c] > 2 * Math.PI) carPhases1[c] -= 2 * Math.PI;
        if (carPhases2[c] > 2 * Math.PI) carPhases2[c] -= 2 * Math.PI;
        if (carSubPhases[c] > 2 * Math.PI) carSubPhases[c] -= 2 * Math.PI;

        const saw = (carPhases1[c] / Math.PI) - 1.0;
        const tri = Math.abs((carPhases2[c] / Math.PI) - 1.0) * 2 - 1.0;
        const sub = Math.sin(carSubPhases[c]) * 0.25;

        // Âm lượng theo khoảng cách không gian
        const carVol = (1.0 / (1.0 + distMeters * 0.055)) * (c < 4 ? 0.42 : 0.15) * throttle;

        // Pan trái / phải
        const carPan = Math.max(-0.95, Math.min(0.95, carLanes[c] + Math.sin(t * 0.8 + c) * 0.3));
        const panL = 0.5 * (1 - carPan);
        const panR = 0.5 * (1 + carPan);

        const carSignal = (saw * 0.45 + tri * 0.35 + sub) * carVol;

        // Nếu xe bay vút qua màn hình ở khoảng cách gần (Flyby Swoosh)
        if (isFlybyInstant) {
          const whooshNoise = (Math.random() * 2 - 1) * 0.28 * Math.sin((t % 0.3) * Math.PI / 0.3);
          mixLeft += whooshNoise * panR * 1.5; // Xé gió quét từ phải qua trái
          mixRight += whooshNoise * panL * 1.5;
        }

        mixLeft += carSignal * panL;
        mixRight += carSignal * panR;
      }

      // 4. Foley Camera: Trực thăng (Helicopter Blade Slap)
      if (isHelicopter) {
        heliPhase += (2 * Math.PI * 18.5) / sampleRate; // 18.5 Hz nhịp cánh quạt
        if (heliPhase > 2 * Math.PI) heliPhase -= 2 * Math.PI;
        const bladePulse = Math.pow(Math.max(0, Math.sin(heliPhase)), 8) * 0.22;
        const rotorNoise = (Math.random() * 2 - 1) * 0.06;
        mixLeft += (bladePulse + rotorNoise) * 0.75;
        mixRight += (bladePulse + rotorNoise) * 0.75;
      }

      // 5. Foley Camera: Drone (FPV Rotor Whine)
      if (isDrone) {
        dronePhase1 += (2 * Math.PI * 580) / sampleRate;
        dronePhase2 += (2 * Math.PI * 870) / sampleRate;
        if (dronePhase1 > 2 * Math.PI) dronePhase1 -= 2 * Math.PI;
        if (dronePhase2 > 2 * Math.PI) dronePhase2 -= 2 * Math.PI;
        const droneWhine = (Math.sin(dronePhase1) * 0.04 + Math.sin(dronePhase2) * 0.02);
        mixLeft += droneWhine;
        mixRight += droneWhine;
      }

      // 6. Foley Camera: Buồng lái cách âm (Cockpit Muffle)
      if (isCockpit) {
        // Tăng cường rung động cabin & giảm treble
        const cabinRumble = Math.sin(t * 88) * 0.08;
        mixLeft = (mixLeft * 0.65) + cabinRumble;
        mixRight = (mixRight * 0.65) + cabinRumble;
      }

      // 7. Âm thanh môi trường Biome & Thời tiết
      let ambNoiseL = (Math.random() * 2 - 1) * 0.04;
      let ambNoiseR = (Math.random() * 2 - 1) * 0.04;

      if (ambienceType === 'RAIN' || ambienceType === 'THUNDERSTORM') {
        // Tiếng mưa rơi rào rào
        ambNoiseL = (Math.random() * 2 - 1) * 0.09;
        ambNoiseR = (Math.random() * 2 - 1) * 0.09;
        if (ambienceType === 'THUNDERSTORM' && (t % 14.0) < 1.8) {
          // Tiếng sấm rền vọng từ xa
          const thunderProgress = (t % 14.0) / 1.8;
          const thunder = Math.sin(thunderProgress * 32.0) * (1.0 - thunderProgress) * 0.22;
          ambNoiseL += thunder;
          ambNoiseR += thunder;
        }
      } else if (ambienceType === 'MOUNTAIN_WIND') {
        // Tiếng gió hú núi cao
        const windGust = Math.sin(t * 0.45) * 0.05 + 0.06;
        ambNoiseL = (Math.random() * 2 - 1) * windGust;
        ambNoiseR = (Math.random() * 2 - 1) * windGust;
      } else if (ambienceType === 'DESERT_SAND') {
        // Gió cát sa mạc
        ambNoiseL = (Math.random() * 2 - 1) * 0.05;
        ambNoiseR = (Math.random() * 2 - 1) * 0.05;
      } else if (ambienceType === 'STADIUM_CROWD') {
        // Tiếng reo hò khán đài
        const crowdCheer = (Math.sin(t * 3.2) * 0.02 + 0.04) * (Math.random() * 2 - 1);
        ambNoiseL = crowdCheer;
        ambNoiseR = crowdCheer;
      }

      ambienceFilterStateL += 0.12 * (ambNoiseL - ambienceFilterStateL);
      ambienceFilterStateR += 0.12 * (ambNoiseR - ambienceFilterStateR);

      mixLeft += ambienceFilterStateL;
      mixRight += ambienceFilterStateR;

      // Áp dụng Audio Ducking khi bình luận viên nói
      mixLeft *= duckMultiplier;
      mixRight *= duckMultiplier;

      // Low-pass filter thể thao
      filterStateL += 0.22 * (mixLeft - filterStateL);
      filterStateR += 0.22 * (mixRight - filterStateR);

      let finalLeft = filterStateL;
      let finalRight = filterStateR;

      // 8. Hòa trộn giọng đọc bình luận viên
      if (activeCommentary && activeCommentary.pcmLeft) {
        const voiceOffsetSec = t - activeCommentary.startSec;
        const voiceSampleIdx = Math.floor(voiceOffsetSec * (activeCommentary.sampleRate || sampleRate));
        if (voiceSampleIdx >= 0 && voiceSampleIdx < activeCommentary.pcmLeft.length) {
          const vL = activeCommentary.pcmLeft[voiceSampleIdx] * 1.5;
          const vR = (activeCommentary.pcmRight ? activeCommentary.pcmRight[voiceSampleIdx] : activeCommentary.pcmLeft[voiceSampleIdx]) * 1.5;
          finalLeft += vL;
          finalRight += vR;
        }
      }

      // Soft Limiter (tanh) chống vỡ tiếng clipping
      left[i] = Math.tanh(finalLeft * 1.25) * 0.85;
      right[i] = Math.tanh(finalRight * 1.25) * 0.85;
    }

    return { left, right, totalSamples, timeline };
  }
}

function THREE_MathUtils_lerp(x: number, y: number, t: number): number {
  return (1 - t) * x + t * y;
}

export const audioEngine = new AudioEngine();
