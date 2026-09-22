import * as THREE from 'three';
import { CameraMode } from '../types';
import { Car3DObject } from './vehiclePhysics';
import { safeGetPointAt } from './curveUtils';

export class CameraDirector {
  // Mặc định ban đầu luôn là góc truyền hình bao quát nhiều xe (Helicam / Multi-car pack)
  public currentMode: CameraMode = CameraMode.CHOPPER_HELI_CHASE;
  public camera: THREE.PerspectiveCamera;
  public isManualLocked: boolean = false;
  private currentTargetCarId: string = '';
  private dwellTimer: number = 0;
  private nextSwitchTime: number = 6.0; // 5.5 to 7.5 giây cho góc truyền hình bao quát
  private orbitAngle: number = 0;

  // =========================================================================
  // 1. DANH MỤC GÓC QUAY TRUYỀN HÌNH BAO QUÁT NHIỀU XE (BROADCAST MULTI-CAR COVERAGE)
  // CHIẾM 50% THỜI LƯỢNG - Chuẩn phát sóng Live Show F1 / Super GT quốc tế
  // =========================================================================
  public static readonly BROADCAST_MULTI_CAR_MODES: CameraMode[] = [
    CameraMode.MULTI_CAR_PACK_CHASE,        // 1. Bám đuôi đoàn xe 35-50m trên cao bao quát 5-15 xe đang so kè
    CameraMode.MULTI_CAR_OVERTAKE_WIDE,     // 2. Toàn cảnh góc rộng từ trên cao bắt trọn pha lách làn, vượt mặt
    CameraMode.CHOPPER_HELI_CHASE,          // 3. Trực thăng truyền hình (Helicam) lượn trên cao 35m bao quát trường đua
    CameraMode.MULTI_CAR_FRONT_FACING,      // 4. Đón đầu đoàn xe đua, quay trực diện cả tốp xe đang lao tới
    CameraMode.TRACKSIDE_TELEPHOTO,         // 5. Máy quay Telephoto 85mm ven đường lia theo đoàn xe vụt qua
    CameraMode.PANORAMIC,                   // 6. Toàn cảnh từ đài cao bao quát trọn vẹn khúc cua & toàn bộ đoàn xe
    CameraMode.SKY_DRONE_BROADCAST,         // 7. Racing Drone / Flycam bay lướt trên cao bao quát đoàn xe so kè
    CameraMode.SIDE_CHASE_MULTI,            // 8. Hông xa so kè nhiều xe đua song song
    CameraMode.LEADER_TRACKING,             // 9. Bám xe dẫn đầu cự ly xa bao quát các xe bám đuổi quyết liệt phía sau
    CameraMode.TRACKSIDE_APEX,              // 10. Trạm quay đỉnh góc cua Apex đón cả đoàn xe ôm cua
    CameraMode.VERTICAL_PORTRAIT_OPTIMIZED, // 11. Khung hình dọc 9:16 truyền hình bao quát đoàn đua
    CameraMode.SPECTATOR_TRACKSIDE,         // 12. Góc nhìn khán đài lia theo đoàn xe
    CameraMode.PIT_WALL_BROADCAST,          // 13. Vách kỹ thuật Pit Wall nhìn đoàn xe xé gió
  ];

  // =========================================================================
  // 2. DANH MỤC GÓC QUAY ĐIỆN ẢNH & CẬN CẢNH XE (CINEMATIC ACCENT SHOTS)
  // CHIẾM 50% THỜI LƯỢNG - Đột phá tốc độ, cản trước, buồng lái, sát mặt đường
  // =========================================================================
  public static readonly CINEMATIC_ACCENT_MODES: CameraMode[] = [
    CameraMode.LOW_GROUND,                  // Sát mặt đường (ở chính giữa vạch tim đường, lùi sau 10m xé gió êm ái)
    CameraMode.BEHIND,                      // Cận cảnh phía sau xe
    CameraMode.OVERTAKE_ACTION,             // Cận cảnh hành động vượt mặt
    CameraMode.COLLISION_DRIFT,             // Bắt khoảnh khắc trượt bánh, bốc khói và va chạm
    CameraMode.HOOD,                        // Nắp capo nhìn thẳng đường đua
    CameraMode.COCKPIT_FIRST_PERSON,        // Cabin buồng lái
    CameraMode.BUMPER_FIRST_PERSON,         // Cản trước xé gió siêu tốc
    CameraMode.CINEMATIC_ORBIT,             // Xoay 360 độ quanh xe
  ];

  // Trạm quay phim ven đường tĩnh (Trackside Static Station) cho cảm giác truyền hình F1 chân thực
  private tracksideStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasStationPos: boolean = false;
  private grandstandStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasGrandstandPos: boolean = false;
  private spectatorStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasSpectatorPos: boolean = false;
  private helipadStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasHelipadPos: boolean = false;

  // Smoothing buffers for cinematic movement (Gimbal chống rung quang học)
  private smoothedCamPos: THREE.Vector3 = new THREE.Vector3(0, 10, 20);
  private smoothedLookTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private isFirstFrame: boolean = true;

  // Gyro-stabilized broadcast tracking anchor: cách ly hoàn toàn rung giật va chạm
  private stabilizedAnchorPos: THREE.Vector3 = new THREE.Vector3();
  private stabilizedAnchorForward: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  private hasStabilizedAnchor: boolean = false;

  // Smooth heading tracking for zero-lag tight chase camera (loại bỏ hoàn toàn rung giật ở các góc cận cảnh)
  private smoothHeading: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  private hasSmoothHeading: boolean = false;

  // Thời gian mô phỏng đồng bộ tuyệt đối với delta (triệt tiêu 100% hiện tượng lệch nhịp rung chấn)
  private simulatedTime: number = 0;

  // Curve đường đua để cố định chuẩn xác vạch tim đường và độ cao mặt đường
  private trackCurve: THREE.Curve<THREE.Vector3> | null = null;
  private trackLength: number = 35000;

  setTrackCurve(curve: THREE.Curve<THREE.Vector3>, length: number) {
    this.trackCurve = curve;
    this.trackLength = Math.max(100, length);
  }

  // Tiêu cự quang học chuẩn thể thao: 68° góc rộng điện ảnh, mở rộng động lên 88° khi đạt 500 km/h
  private readonly BASE_FOV: number = 68;

  constructor(fov: number = 68, aspect: number = 16 / 9) {
    // Near plane 0.15m để camera góc sát mặt đường không bao giờ bị cắt rách hay khuyết mặt đường dưới đáy màn hình
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.15, 30000);
  }

  setCameraMode(mode: CameraMode, manualLock: boolean = true) {
    this.currentMode = mode;
    this.isManualLocked = manualLock;
    this.dwellTimer = 0;
    this.hasStationPos = false;
    this.hasGrandstandPos = false;
    this.hasSpectatorPos = false;
    this.hasHelipadPos = false;
    this.hasSmoothHeading = false;
    this.isFirstFrame = true; // Bắt tức thì vào vị trí góc quay mới, triệt tiêu việc bị cách xa hàng trăm mét
  }

  unlockAutoDirector() {
    this.isManualLocked = false;
    this.dwellTimer = 0;
    this.nextSwitchTime = 4.5 + Math.random() * 1.5;
  }

  resetFirstFrame() {
    this.isFirstFrame = true;
    this.hasStationPos = false;
    this.hasGrandstandPos = false;
    this.hasSpectatorPos = false;
    this.hasHelipadPos = false;
    this.hasStabilizedAnchor = false;
    this.hasSmoothHeading = false;
  }

  update(
    cars: Car3DObject[],
    delta: number,
    activeOvertakeCarId: string | null,
    collisionCarId: string | null,
    autoDirectorEnabled: boolean = true
  ): CameraMode {
    if (cars.length === 0) return this.currentMode;

    this.dwellTimer += delta;
    this.simulatedTime += delta;
    this.orbitAngle += delta * (this.currentMode === CameraMode.CINEMATIC_ORBIT ? 0.95 : 0.35);

    // Determine Leader (P1)
    const leaderCar = cars.find(c => c.state.rank === 1) || cars[0];

    // Priority event-driven director switches (Chuẩn đạo diễn truyền hình thể thao F1 Live Show)
    // CÂN BẰNG 50% - 50%: Kết hợp hài hòa giữa truyền hình bao quát nhiều xe và điện ảnh cận cảnh xe
    if (autoDirectorEnabled && !this.isManualLocked) {
      if (collisionCarId && this.dwellTimer >= 4.5) {
        // Sự kiện va chạm/drift: Cân bằng 50% góc toàn cảnh đỉnh cua và 50% cận cảnh drift bốc khói
        const collisionBroadModes = [
          CameraMode.TRACKSIDE_APEX,          // Trạm quay đỉnh góc cua Apex đón xe ôm cua
          CameraMode.MULTI_CAR_OVERTAKE_WIDE, // Toàn cảnh so kè nhiều xe từ trên cao
          CameraMode.CHOPPER_HELI_CHASE,      // Trực thăng trên cao bắt trọn va chạm
        ];
        const collisionAccentModes = [
          CameraMode.COLLISION_DRIFT,         // Điện ảnh: Cận cảnh drift & khói
          CameraMode.LOW_GROUND,              // Điện ảnh: Sát mặt đường giữa vạch tim đường
        ];
        // 50% góc truyền hình bao quát, 50% góc điện ảnh cận cảnh
        this.currentMode = Math.random() < 0.50
          ? collisionBroadModes[Math.floor(Math.random() * collisionBroadModes.length)]
          : collisionAccentModes[Math.floor(Math.random() * collisionAccentModes.length)];
        this.currentTargetCarId = collisionCarId;
        this.dwellTimer = 0;
        this.nextSwitchTime = 4.8 + Math.random() * 1.5;
        this.hasStationPos = false;
        this.hasSpectatorPos = false;
      } else if (activeOvertakeCarId && this.dwellTimer >= 4.5) {
        // Sự kiện vượt xe: Cân bằng 50% góc toàn cảnh so kè và 50% cận cảnh vượt mặt
        const overtakeBroadModes = [
          CameraMode.MULTI_CAR_OVERTAKE_WIDE, // Toàn cảnh so kè nhiều xe từ trên cao
          CameraMode.MULTI_CAR_PACK_CHASE,    // Bám đuôi đoàn xe 35-50m trên cao
          CameraMode.MULTI_CAR_FRONT_FACING,  // Đón đầu đoàn xe đua trực diện
          CameraMode.CHOPPER_HELI_CHASE,      // Trực thăng truyền hình trên cao
          CameraMode.SIDE_CHASE_MULTI,        // Hông xa so kè nhiều xe song song
          CameraMode.TRACKSIDE_TELEPHOTO,     // Telephoto 85mm ven đường lia theo đoàn xe
          CameraMode.PANORAMIC,               // Toàn cảnh trường đua từ đài cao
        ];
        const overtakeCinematicModes = [
          CameraMode.OVERTAKE_ACTION,         // Cận cảnh vượt mặt
          CameraMode.LOW_GROUND,              // Sát mặt đường giữa vạch lùi 10m
          CameraMode.BEHIND,                  // Phía sau xe
          CameraMode.BUMPER_FIRST_PERSON,     // Cản trước xé gió
        ];
        // 50% góc truyền hình bao quát nhiều xe, 50% cận cảnh hành động
        this.currentMode = Math.random() < 0.50
          ? overtakeBroadModes[Math.floor(Math.random() * overtakeBroadModes.length)]
          : overtakeCinematicModes[Math.floor(Math.random() * overtakeCinematicModes.length)];
        this.currentTargetCarId = activeOvertakeCarId;
        this.dwellTimer = 0;
        this.nextSwitchTime = 5.0 + Math.random() * 1.8;
        this.hasStationPos = false;
        this.hasSpectatorPos = false;
      } else if (this.dwellTimer >= this.nextSwitchTime) {
        // Chuyển góc quay tự động: Cân bằng 50% góc truyền hình bao quát và 50% góc điện ảnh cận cảnh
        this.cycleNextCinematicMode();
        this.dwellTimer = 0;
        this.hasStationPos = false;
        this.hasGrandstandPos = false;
      }
    }

    // Select target car based on mode
    let targetCar = cars.find(c => c.state.id === this.currentTargetCarId);
    if (!targetCar || this.currentMode === CameraMode.LEADER_TRACKING) {
      targetCar = leaderCar;
      this.currentTargetCarId = targetCar.state.id;
    }

    const idealPos = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();

    const carPos = targetCar.group.position;
    const carQuat = targetCar.group.quaternion;
    const rawForward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuat).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Phân loại các góc quay gắn liền trên xe (Mounted Cameras) - Tuyệt đối không có độ trễ tịnh tiến
    const isRigidMounted = (
      this.currentMode === CameraMode.HOOD ||
      this.currentMode === CameraMode.COCKPIT_FIRST_PERSON ||
      this.currentMode === CameraMode.BUMPER_FIRST_PERSON ||
      this.currentMode === CameraMode.FENDER_WHEEL_LOOK ||
      this.currentMode === CameraMode.WING_REAR_LOOK
    );

    // Phân loại các góc quay bám sát xe (Tight Chase Cameras) - Khoảng cách tới xe cố định tuyệt đối, không co giãn giật cục
    const isTightChase = (
      this.currentMode === CameraMode.BEHIND ||
      this.currentMode === CameraMode.LOW_GROUND ||
      this.currentMode === CameraMode.SIDE_PROFILE ||
      this.currentMode === CameraMode.OVERTAKE_ACTION ||
      this.currentMode === CameraMode.COLLISION_DRIFT ||
      this.currentMode === CameraMode.VERTICAL_PORTRAIT_OPTIMIZED ||
      this.currentMode === CameraMode.CINEMATIC_ORBIT
    );

    // Hướng xoay mượt mà khóa đường chân trời cho góc quay bám đuôi (Gimbal Horizon-Locked Yaw)
    const carForwardFlat = new THREE.Vector3(rawForward.x, 0, rawForward.z).normalize();
    // Bộ lọc chuyển hướng xoay êm ái tự nhiên chuẩn Live Show truyền hình thực tế (Broadcast Gyro-Damping):
    // TUYỆT ĐỐI KHÔNG xoay tức thì hay bẻ góc thô thiển theo khúc cua giống game.
    // Khi xe ôm cua, xe sẽ rẽ trước trong khung hình, camera chuyển động xoay êm đẹp với quán tính tự nhiên.
    const turnDampingSpeed = 2.4; // Tốc độ xoay đầm chắc chuẩn cần cẩu jib crane truyền hình F1
    const headingBlend = 1.0 - Math.exp(-turnDampingSpeed * delta);
    if (!this.hasSmoothHeading || this.isFirstFrame) {
      this.smoothHeading.copy(carForwardFlat);
      this.hasSmoothHeading = true;
    } else {
      this.smoothHeading.lerp(carForwardFlat, headingBlend).normalize();
    }
    const smoothRight = new THREE.Vector3().crossVectors(this.smoothHeading, up).normalize();

    // Hệ thống neo giảm chấn cho các góc quay từ xa trên không (Chopper / Sky Drone / Panoramic)
    if (!this.hasStabilizedAnchor || this.isFirstFrame) {
      this.stabilizedAnchorPos.copy(carPos);
      this.stabilizedAnchorForward.copy(rawForward);
      this.hasStabilizedAnchor = true;
    } else {
      const anchorSmoothSpeed = Math.min(1.0, delta * 20.0);
      this.stabilizedAnchorPos.lerp(carPos, anchorSmoothSpeed);
      this.stabilizedAnchorForward.lerp(rawForward, Math.min(1.0, delta * 14.0)).normalize();
    }

    const trackedPos = this.stabilizedAnchorPos;
    const forward = this.stabilizedAnchorForward;
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const currentSpeed = targetCar.state.speed || 0;

    // Tốc độ lerp máy quay (Smooth Damping factor)
    let camSmoothSpeed = 4.5;

    switch (this.currentMode) {
      // =========================================================================
      // GÓC QUAY TRỰC THĂNG TRUYỀN HÌNH TỪ XA (CHOPPER HELI CHASE)
      // Helicam bay lượn trên không ở cự ly vừa tầm, bắt trọn toàn bộ đoàn xe và khung cảnh trường đua
      // =========================================================================
      case CameraMode.CHOPPER_HELI_CHASE: {
        camSmoothSpeed = 16.0;
        const swayX = Math.sin(this.orbitAngle * 0.45) * 3.0;
        const swayY = Math.cos(this.orbitAngle * 0.35) * 1.5;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -20.0)
          .addScaledVector(right, 10.0 + swayX)
          .addScaledVector(up, 14.0 + swayY);
        lookTarget.copy(trackedPos).addScaledVector(forward, 10.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // GÓC QUAY DRONE BAY BÁM ĐUỔI TỪ XA (SKY DRONE BROADCAST / FLYCAM)
      // Drone FPV bay lướt gần hơn, chuyển động nhịp nhàng bám sát xe
      // =========================================================================
      case CameraMode.SKY_DRONE_BROADCAST: {
        camSmoothSpeed = 20.0;
        const droneWeave = Math.sin(this.orbitAngle * 0.75) * 2.5;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -12.0)
          .addScaledVector(right, droneWeave)
          .addScaledVector(up, 5.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 12.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // GÓC QUAY TOÀN CẢNH TỪ TRÊN CAO (PANORAMIC / GRANDSTAND)
      // =========================================================================
      case CameraMode.PANORAMIC: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -20.0)
          .addScaledVector(right, 16.0)
          .addScaledVector(up, 20.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, 10.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 1. MÁY QUAY TELEPHOTO VEN ĐƯỜNG LIA THEO XE (TRACKSIDE TELEPHOTO 85mm)
      // Máy quay ĐỨNG YÊN 100% Ở VEN ĐƯỜNG KHÔNG DI CHUYỂN, chỉ xoay ống kính lia theo đoàn xe đi qua
      // =========================================================================
      case CameraMode.TRACKSIDE_TELEPHOTO: {
        const distToStation = trackedPos.distanceTo(this.tracksideStationPos);
        if (!this.hasStationPos || distToStation > 160.0) {
          this.tracksideStationPos.copy(trackedPos)
            .addScaledVector(right, 14.5)
            .addScaledVector(forward, 55.0);
          this.tracksideStationPos.y = trackedPos.y + 2.8;
          this.hasStationPos = true;
        }
        idealPos.copy(this.tracksideStationPos); // Đứng yên tuyệt đối ở ven đường!
        lookTarget.copy(trackedPos).addScaledVector(up, 0.85); // Chỉ lia ống kính theo xe
        break;
      }

      // =========================================================================
      // 2. TOÀN CẢNH SO KÈ NHIỀU XE (MULTI_CAR_OVERTAKE_WIDE)
      // Góc quay chéo từ trên cao vừa phải, bắt trọn từng pha đảo làn và so kè tay đôi
      // =========================================================================
      case CameraMode.MULTI_CAR_OVERTAKE_WIDE: {
        camSmoothSpeed = 12.0;
        idealPos.copy(trackedPos)
          .addScaledVector(right, 24.0)
          .addScaledVector(forward, -22.0)
          .addScaledVector(up, 12.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 15.0).addScaledVector(up, 1.1);
        break;
      }

      // =========================================================================
      // 3. GÓC ĐÓN ĐẦU NHIỀU XE ĐUA (MULTI_CAR_FRONT_FACING)
      // Đón đầu đoàn xe, quay trực diện vào xe và nhóm xe phía sau đang lao tới
      // =========================================================================
      case CameraMode.MULTI_CAR_FRONT_FACING: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, 38.0)
          .addScaledVector(up, 5.5)
          .addScaledVector(right, -3.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, -4.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 4. TRẠM QUAY ĐỈNH GÓC CUA APEX (TRACKSIDE APEX)
      // Đặt ngay mép vỉa cua (apex curb), đón xe ôm cua rõ nét với độ ổn định cao
      // =========================================================================
      case CameraMode.TRACKSIDE_APEX: {
        camSmoothSpeed = 25.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, 6.0)
          .addScaledVector(right, -4.5)
          .addScaledVector(up, 1.2);
        idealPos.y = Math.max(idealPos.y, trackedPos.y + 0.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 0.0).addScaledVector(up, 0.85);
        break;
      }

      // =========================================================================
      // 5. BÁM ĐUÔI ĐOÀN XE NGHẸT THỞ (MULTI_CAR_PACK_CHASE)
      // Cách sau xe 35m, trên cao 9.5m bao quát cận cảnh các xe so kè và đảo làn bứt tốc
      // =========================================================================
      case CameraMode.MULTI_CAR_PACK_CHASE: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -35.0)
          .addScaledVector(up, 9.5)
          .addScaledVector(right, 3.2);
        lookTarget.copy(trackedPos).addScaledVector(forward, 25.0).addScaledVector(up, 1.2);
        break;
      }

      // =========================================================================
      // 6. VÁCH KỸ THUẬT PIT WALL (PIT WALL BROADCAST)
      // Góc nhìn từ tường chỉ đạo pit stop nhìn đoàn xe xé gió đoạn thẳng
      // =========================================================================
      case CameraMode.PIT_WALL_BROADCAST: {
        camSmoothSpeed = 7.5;
        idealPos.copy(trackedPos)
          .addScaledVector(right, -16.0)
          .addScaledVector(forward, 16.0)
          .addScaledVector(up, 3.2);
        lookTarget.copy(trackedPos).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 7. TRẠM QUAY TĨNH SÁT RÀO CHẮN XÉ GIÓ (PASSING STATIONARY)
      // Máy quay gắn sát rào chắn xé gió (Armco Barrier Rush), rào chắn và vạch sơn vút qua cực mượt mà
      // =========================================================================
      case CameraMode.PASSING_STATIONARY: {
        camSmoothSpeed = 10.0;
        idealPos.copy(trackedPos)
          .addScaledVector(right, 6.2)
          .addScaledVector(forward, -1.8)
          .addScaledVector(up, 1.25);
        lookTarget.copy(trackedPos)
          .addScaledVector(forward, 2.5)
          .addScaledVector(up, 0.75);
        break;
      }

      // =========================================================================
      // 9. KHUNG HÌNH DỌC 9:16 TRUYỀN HÌNH (VERTICAL PORTRAIT OPTIMIZED)
      // Cân chỉnh tỉ lệ vàng cho màn hình điện thoại (Shorts / Reels) - Khóa cự ly triệt tiêu rung giật
      // =========================================================================
      case CameraMode.VERTICAL_PORTRAIT_OPTIMIZED: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).addScaledVector(this.smoothHeading, -11.0).addScaledVector(up, 3.5);
        lookTarget.copy(carPos).addScaledVector(this.smoothHeading, 14.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 10. GÓC QUAY NGƯỜI ĐỨNG VEN ĐƯỜNG (SPECTATOR TRACKSIDE)
      // Camera ĐỨNG YÊN 100% Ở VEN ĐƯỜNG KHÔNG DI CHUYỂN, chỉ xoay hướng lia nhìn theo xe tốc độ cao đi qua
      // =========================================================================
      case CameraMode.SPECTATOR_TRACKSIDE: {
        const distToSpectator = trackedPos.distanceTo(this.spectatorStationPos);
        if (!this.hasSpectatorPos || distToSpectator > 160.0) {
          this.spectatorStationPos.copy(trackedPos)
            .addScaledVector(right, 14.0)
            .addScaledVector(forward, 50.0);
          this.spectatorStationPos.y = trackedPos.y + 1.65; // Tầm mắt khán giả đứng ven đường
          this.hasSpectatorPos = true;
        }
        idealPos.copy(this.spectatorStationPos); // Tuyệt đối đứng yên!
        lookTarget.copy(trackedPos).addScaledVector(up, 0.85); // Chỉ lia ống kính theo thân xe
        break;
      }

      // =========================================================================
      // 10. HÔNG XA SO KÈ NHIỀU XE ĐUA (SIDE_CHASE_MULTI)
      // Chạy song song cạnh đoàn xe cách 32m, bao quát các xe đua đang so kè bánh xe
      // =========================================================================
      case CameraMode.SIDE_CHASE_MULTI: {
        camSmoothSpeed = 14.0;
        idealPos.copy(trackedPos)
          .addScaledVector(right, -30.0)
          .addScaledVector(forward, 6.0)
          .addScaledVector(up, 6.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 8.0).addScaledVector(up, 1.2);
        break;
      }

      // =========================================================================
      // 13. CAMERA TRẦN HẦM HẤT XUỐNG SIÊU TỐC (TUNNEL_CEILING_FAST)
      // Gắn dọc trần hầm nhìn từ trên xuống cực kỳ kịch tính khi xe vút qua bên dưới
      // =========================================================================
      case CameraMode.TUNNEL_CEILING_FAST: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos).addScaledVector(forward, 15.0).addScaledVector(up, 6.2);
        lookTarget.copy(trackedPos).addScaledVector(forward, -2.0).addScaledVector(up, 0.5);
        break;
      }

      // =========================================================================
      // 14. CAMERA CHẮN BÙN NHÌN LỐP VÀ HÔNG XE (FENDER_WHEEL_LOOK)
      // Góc bám lốp xe trước bên hông, thấy rõ bánh xe quay tít mù khói và mặt đường trôi
      // =========================================================================
      case CameraMode.FENDER_WHEEL_LOOK: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(1.85, 0.75, 1.25).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0.8, 0.45, -1.8).applyQuaternion(carQuat));
        break;
      }

      // =========================================================================
      // 15. ĐUÔI GIÓ NHÌN NGƯỢC VỀ TRƯỚC (WING_REAR_LOOK)
      // Gắn trên cánh gió sau nhìn vượt qua nóc xe về phía trước, cảm nhận tốc độ cực hạn
      // =========================================================================
      case CameraMode.WING_REAR_LOOK: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(0, 1.6, -1.75).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0, 0.95, 15.0).applyQuaternion(carQuat));
        break;
      }

      // =========================================================================
      // 16. CAMERA ÂM VỈA GỜ GIẢM TỐC (KERB_CAM_GROUND)
      // Nâng cao góc quay lên 1 mét so với mặt đường
      // =========================================================================
      case CameraMode.KERB_CAM_GROUND: {
        camSmoothSpeed = 20.0;
        idealPos.copy(trackedPos).addScaledVector(right, 3.2).addScaledVector(forward, 4.0).addScaledVector(up, 1.45);
        idealPos.y = Math.max(idealPos.y, trackedPos.y + 1.35);
        lookTarget.copy(trackedPos).addScaledVector(up, 1.55);
        break;
      }

      // =========================================================================
      // 17. GÓC LÁI THỨ NHẤT TRONG CABIN (COCKPIT_FIRST_PERSON)
      // Trải nghiệm trực tiếp bên trong buồng lái xe đua tốc độ cực cao - Gắn cứng thân xe không rung giật
      // =========================================================================
      case CameraMode.COCKPIT_FIRST_PERSON: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(0, 1.05, 0.15).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0, 0.95, 35.0).applyQuaternion(carQuat));
        break;
      }

      // =========================================================================
      // 18. GÓC CẢN TRƯỚC SIÊU TỐC (BUMPER_FIRST_PERSON)
      // Góc cản trước xé gió siêu tốc - Gắn cứng thân xe không rung giật
      // =========================================================================
      case CameraMode.BUMPER_FIRST_PERSON: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(0, 0.55, 1.85).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0, 0.55, 40.0).applyQuaternion(carQuat));
        break;
      }

      // =========================================================================
      // === 10 GÓC QUAY CINEMATIC KINH ĐIỂN (CLASSIC CAMERAS) ===
      // =========================================================================

      // 1. Phía Sau Xe: Khóa cự ly 13m cố định, ôm cua mượt mà, triệt tiêu 100% hiện tượng co giãn giật hình
      case CameraMode.BEHIND: {
        camSmoothSpeed = 0;
        const dist = 13.0; 
        const height = 2.8; 
        idealPos.copy(carPos).addScaledVector(this.smoothHeading, -dist).addScaledVector(up, height);
        idealPos.y = Math.max(idealPos.y, carPos.y + 1.4);
        lookTarget.copy(carPos).addScaledVector(this.smoothHeading, 22.0).addScaledVector(up, 1.1);
        break;
      }

      // 2. Mui Xe / Cockpit: Gắn trực tiếp nắp capo, nhìn thẳng đường đua siêu nét
      case CameraMode.HOOD: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(0, 0.95, 1.1).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0, 0.90, 40.0).applyQuaternion(carQuat));
        break;
      }

      // 3. Sát Mặt Đường: Căn CHÍNH GIỮA VẠCH TIM ĐƯỜNG, lùi sau 10m, bám chuẩn độ cao mặt đường, nhìn rõ toàn bộ bề mặt đường & đoàn xe
      case CameraMode.LOW_GROUND: {
        camSmoothSpeed = 0;
        const dist = 10.0; // Lùi về sau 10m (thêm 5m) theo đúng yêu cầu
        const height = 1.18; // Cao 1.18m trên mặt đường - cực sát mặt đường, nhìn rõ vạch tim đường, gầm xe, lốp xe xé gió, không bao giờ bị chìm/cắt đứt mặt đường!

        if (this.trackCurve && targetCar && targetCar.state && typeof targetCar.state.lapProgress === 'number') {
          const progressDelta = dist / this.trackLength;
          let behindProgress = targetCar.state.lapProgress - progressDelta;
          if (behindProgress < 0) behindProgress += 1.0;
          if (behindProgress >= 1.0) behindProgress -= 1.0;

          // Lấy tọa độ CHÍNH TÂM VẠCH TIM ĐƯỜNG tại vị trí lùi sau 10m
          const roadCenterPt = new THREE.Vector3();
          safeGetPointAt(this.trackCurve, behindProgress, roadCenterPt);

          // Đặt camera chuẩn xác ở giữa tim đường và nâng đúng độ cao trên mặt đường (không bao giờ lệch sang bãi cát hay chìm dưới dốc)
          idealPos.copy(roadCenterPt).addScaledVector(up, height);

          // Điểm nhìn hướng dọc theo con đường về phía trước xe (28m phía trước), hơi chếch xuống đường để toàn bộ bề mặt đường xuất hiện từ mép đáy màn hình
          let aheadProgress = targetCar.state.lapProgress + (28.0 / this.trackLength);
          if (aheadProgress >= 1.0) aheadProgress -= 1.0;
          const aheadPt = new THREE.Vector3();
          safeGetPointAt(this.trackCurve, aheadProgress, aheadPt);

          lookTarget.copy(aheadPt).addScaledVector(up, 0.72);
        } else {
          // Fallback khi chưa có spline: bám theo carPos nhưng nâng cao an toàn
          const fwd = new THREE.Vector3(rawForward.x, 0, rawForward.z).normalize();
          idealPos.copy(carPos).addScaledVector(fwd, -dist).addScaledVector(up, height);
          lookTarget.copy(carPos).addScaledVector(fwd, 28.0).addScaledVector(up, 0.75);
        }
        break;
      }

      // 4. Bên Hông Xe: Quay ngang hông xe và các pha so kè bánh xe
      case CameraMode.SIDE_PROFILE: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).addScaledVector(smoothRight, -4.8).addScaledVector(this.smoothHeading, 0.2).addScaledVector(up, 1.4);
        lookTarget.copy(carPos).addScaledVector(this.smoothHeading, 5.0).addScaledVector(up, 0.85);
        break;
      }

      // 5. Bám Xe Dẫn Đầu & Đoàn Đua: Tự động bám theo xe dẫn đầu với cự ly 28m bao quát đoàn xe
      case CameraMode.LEADER_TRACKING: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos).addScaledVector(forward, -28.0).addScaledVector(up, 7.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 18.0).addScaledVector(up, 1.1);
        break;
      }

      // 8. Góc Vượt Mặt: Cận cảnh hành động khi xe lách qua đối thủ
      case CameraMode.OVERTAKE_ACTION: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos)
          .addScaledVector(smoothRight, -3.8)
          .addScaledVector(this.smoothHeading, -5.5)
          .addScaledVector(up, 2.0);
        lookTarget.copy(carPos).addScaledVector(this.smoothHeading, 12.0).addScaledVector(up, 0.95);
        break;
      }

      // 9. Va Chạm & Drift: Góc truyền hình cận cảnh theo dõi pha so kè, tuyệt đối không rung lắc
      case CameraMode.COLLISION_DRIFT: {
        camSmoothSpeed = 0;
        const driftOffset = (targetCar.state.isDrifting ? -1 : 1) * 3.5;
        idealPos.copy(carPos).addScaledVector(smoothRight, driftOffset).addScaledVector(this.smoothHeading, -6.5).addScaledVector(up, 2.0);
        lookTarget.copy(carPos).addScaledVector(this.smoothHeading, 6.0).addScaledVector(up, 0.9);
        break;
      }

      // 10. Xoay 360 Vòng: Quỹ đạo xoay mượt mà liên tục quanh xe theo hệ trục cục bộ
      case CameraMode.CINEMATIC_ORBIT: {
        camSmoothSpeed = 0;
        const orbitRadius = 7.5;
        const orbitHeight = 2.2 + Math.sin(this.orbitAngle * 0.8) * 0.35;
        const orbitX = Math.sin(this.orbitAngle) * orbitRadius;
        const orbitZ = Math.cos(this.orbitAngle) * orbitRadius;
        idealPos.copy(carPos)
          .addScaledVector(smoothRight, orbitX)
          .addScaledVector(this.smoothHeading, orbitZ)
          .addScaledVector(up, orbitHeight);
        lookTarget.copy(carPos).addScaledVector(up, 0.75);
        break;
      }

      // Fallback: Mặc định chuyển về máy quay Telephoto ven đường
      default: {
        camSmoothSpeed = 7.0;
        idealPos.copy(trackedPos).addScaledVector(forward, -10.0).addScaledVector(up, 3.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, 7.0).addScaledVector(up, 0.95);
        break;
      }
    }

    // Camera Smoothing Damping (Quán tính quang học mượt mà)
    if (this.isFirstFrame) {
      this.smoothedCamPos.copy(idealPos);
      this.smoothedLookTarget.copy(lookTarget);
      this.isFirstFrame = false;
    } else {
      const isStationaryTrackside = (
        this.currentMode === CameraMode.TRACKSIDE_TELEPHOTO ||
        this.currentMode === CameraMode.SPECTATOR_TRACKSIDE
      );

      if (isRigidMounted) {
        // CÁC GÓC GẮN TRỰC TIẾP TRÊN XE (HOOD, COCKPIT, BUMPER, FENDER, WING):
        // Khóa trực tiếp 100% vào thân xe
        this.smoothedCamPos.copy(idealPos);
        this.smoothedLookTarget.copy(lookTarget);
      } else if (isStationaryTrackside) {
        // Máy quay ven đường đứng yên hoàn toàn 100% không di chuyển, chỉ xoay ống kính lia theo xe
        this.smoothedCamPos.copy(idealPos);
        this.smoothedLookTarget.lerp(lookTarget, 1.0 - Math.exp(-5.5 * delta));
      } else if (isTightChase) {
        // CÁC GÓC BÁM ĐUÔI VÀ CẬN CẢNH (LOW_GROUND, BEHIND, VERTICAL_PORTRAIT, OVERTAKE_ACTION, COLLISION_DRIFT):
        // Khóa cự ly cố định tuyệt đối theo smoothHeading để triệt tiêu 100% rung giật/co giãn khoảng cách.
        // Hướng nhìn smoothedLookTarget có quán tính làm dịu êm ái, KHÔNG XOAY TỨC THÌ theo khúc cua:
        this.smoothedCamPos.copy(idealPos);
        const lookDampSpeed = 2.8; // Quán tính xoay ống kính êm ái chuẩn truyền hình thực tế
        this.smoothedLookTarget.lerp(lookTarget, 1.0 - Math.exp(-lookDampSpeed * delta));
      } else {
        // GÓC XA TRÊN KHÔNG (CHOPPER, DRONE, PANORAMIC, MULTI_CAR_PACK_CHASE, MULTI_CAR_OVERTAKE):
        // Bay lượn tự do đầm chắc trên cao, chuyển động cực kỳ êm mượt chuẩn truyền hình
        const organicSwayX = Math.sin(this.simulatedTime * 1.4) * 0.06;
        const organicSwayY = Math.cos(this.simulatedTime * 1.1) * 0.06;
        const targetPosWithSway = idealPos.clone().add(new THREE.Vector3(organicSwayX, organicSwayY, 0));

        const posSmooth = 1.0 - Math.exp(-6.5 * delta);
        const lookSmooth = 1.0 - Math.exp(-2.8 * delta);
        this.smoothedCamPos.lerp(targetPosWithSway, posSmooth);
        this.smoothedLookTarget.lerp(lookTarget, lookSmooth);
      }
    }

    // =========================================================================
    // DYNAMIC FOV & SPEED SENSATION:
    // Tiêu cự chuẩn từng thể loại: 85mm cho Telephoto ven đường, mở rộng xé gió cho Chase
    // =========================================================================
    const speedRatio = Math.min(1.0, currentSpeed / 610);
    let modeBaseFov = this.BASE_FOV;
    let speedFovBoost = Math.pow(speedRatio, 1.1) * 22.0;

    if (this.currentMode === CameraMode.CHOPPER_HELI_CHASE) {
      modeBaseFov = 52.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 10.0;
    } else if (this.currentMode === CameraMode.SKY_DRONE_BROADCAST) {
      modeBaseFov = 68.0; // Góc Drone FPV lướt sát
      speedFovBoost = Math.pow(speedRatio, 1.1) * 16.0;
    } else if (this.currentMode === CameraMode.PANORAMIC) {
      modeBaseFov = 48.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 8.0;
    } else if (this.currentMode === CameraMode.VERTICAL_PORTRAIT_OPTIMIZED) {
      modeBaseFov = 64.0; // Khung hình dọc 9:16 cảm nhận tốc độ lướt
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    } else if (this.currentMode === CameraMode.LOW_GROUND || this.currentMode === CameraMode.KERB_CAM_GROUND) {
      modeBaseFov = 66.0; // Sát mặt đường xé gió nhưng bao quát trọn con đường, hai bên lề đường và đoàn xe
      speedFovBoost = Math.pow(speedRatio, 1.1) * 16.0;
    } else if (this.currentMode === CameraMode.MULTI_CAR_OVERTAKE_WIDE) {
      modeBaseFov = 58.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 12.0;
    } else if (this.currentMode === CameraMode.MULTI_CAR_FRONT_FACING) {
      modeBaseFov = 66.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 14.0;
    } else if (this.currentMode === CameraMode.MULTI_CAR_PACK_CHASE) {
      modeBaseFov = 62.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 15.0;
    } else if (this.currentMode === CameraMode.SIDE_CHASE_MULTI) {
      modeBaseFov = 58.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 14.0;
    } else if (this.currentMode === CameraMode.SPECTATOR_TRACKSIDE) {
      const distToCam = this.smoothedCamPos.distanceTo(trackedPos);
      const zoomFactor = THREE.MathUtils.clamp((distToCam - 15.0) / 100.0, 0.0, 1.0);
      modeBaseFov = THREE.MathUtils.lerp(58.0, 22.0, zoomFactor);
      speedFovBoost = Math.pow(speedRatio, 1.2) * 6.0;
    } else if (this.currentMode === CameraMode.BEHIND) {
      // Góc phía sau xe: FOV 65 độ + tăng tới 24 độ khi 600km/h (tổng FOV gần 90 độ), tạo cảm giác warp-speed siêu xe
      modeBaseFov = 65.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 24.0;
    } else if (this.currentMode === CameraMode.COCKPIT_FIRST_PERSON) {
      modeBaseFov = 82.0; // Khoang lái góc rộng
      speedFovBoost = Math.pow(speedRatio, 1.1) * 25.0;
    } else if (this.currentMode === CameraMode.BUMPER_FIRST_PERSON) {
      modeBaseFov = 90.0; // Góc cản trước xé gió siêu tốc
      speedFovBoost = Math.pow(speedRatio, 1.1) * 28.0;
    } else if (this.currentMode === CameraMode.TRACKSIDE_TELEPHOTO) {
      modeBaseFov = 32.0; 
      speedFovBoost = Math.pow(speedRatio, 1.2) * 6.0;
    } else if (this.currentMode === CameraMode.TRACKSIDE_APEX) {
      modeBaseFov = 68.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    } else if (this.currentMode === CameraMode.CINEMATIC_ORBIT) {
      modeBaseFov = 68.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 14.0;
    } else if (this.currentMode === CameraMode.PASSING_STATIONARY) {
      modeBaseFov = 78.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 22.0;
    } else if (this.currentMode === CameraMode.TUNNEL_CEILING_FAST) {
      modeBaseFov = 78.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    } else if (this.currentMode === CameraMode.FENDER_WHEEL_LOOK || this.currentMode === CameraMode.WING_REAR_LOOK) {
      modeBaseFov = 76.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    }

    const targetFov = modeBaseFov + speedFovBoost;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1.0, delta * 6.0));
    this.camera.updateProjectionMatrix();

    // Rung máy quay vi chấn khí động học tốc độ cao (Speed Aerodynamic Vibration):
    // CHỈ áp dụng cho các góc quay từ xa trên không (Chopper/Drone) hoặc ven đường.
    // TUYỆT ĐỐI KHÔNG rung ở góc cận cảnh và góc gắn trên xe để xe luôn đứng yên vững như bàn thạch!
    let finalCamPos = this.smoothedCamPos.clone();
    if (!isRigidMounted && !isTightChase && currentSpeed > 380) {
      const shakeIntensity = Math.pow((currentSpeed - 380) / 270, 1.5) * 0.035;
      const shakeTime = this.simulatedTime * 35.0;
      const shakeX = (Math.sin(shakeTime * 1.3) + Math.sin(shakeTime * 2.1)) * shakeIntensity;
      const shakeY = (Math.cos(shakeTime * 1.7) + Math.cos(shakeTime * 2.7)) * shakeIntensity * 0.5;
      finalCamPos.addScaledVector(right, shakeX).addScaledVector(up, shakeY);
    }

    // Ổn định đường chân trời Gimbal F1 tuyệt đối: camera.up luôn là [0, 1, 0] không bị nghiêng lộn
    this.camera.up.set(0, 1, 0);
    this.camera.position.copy(finalCamPos);
    this.camera.lookAt(this.smoothedLookTarget);

    return this.currentMode;
  }

  /**
   * Chuyển đổi góc quay tự động theo chuẩn đạo diễn thể thao F1 Live Show:
   * CÂN BẰNG TỶ LỆ 50% - 50%:
   * 50% Thời lượng – Góc Truyền hình Bao quát Nhiều Xe (Broadcast Multi-Car)
   * 50% Thời lượng – Góc Điện ảnh & Cận cảnh Xe (Cinematic Accents)
   */
  private cycleNextCinematicMode() {
    let chosenPool: CameraMode[];
    let nextDuration: number;

    // Cân bằng chính xác 50% góc truyền hình bao quát nhiều xe và 50% góc điện ảnh cận cảnh xe
    if (Math.random() < 0.50) {
      chosenPool = CameraDirector.BROADCAST_MULTI_CAR_MODES;
      // Góc truyền hình bao quát nhiều xe: giữ 5.0 đến 6.8 giây để theo dõi trọn vẹn đoàn đua
      nextDuration = 5.0 + Math.random() * 1.8;
    } else {
      chosenPool = CameraDirector.CINEMATIC_ACCENT_MODES;
      // Góc điện ảnh cận cảnh xe: giữ 4.5 đến 6.0 giây để chiêm ngưỡng buồng lái, nắp capo, sát mặt đường
      nextDuration = 4.5 + Math.random() * 1.5;
    }

    const available = chosenPool.filter(m => m !== this.currentMode);
    if (available.length > 0) {
      this.currentMode = available[Math.floor(Math.random() * available.length)];
    } else {
      this.currentMode = CameraDirector.BROADCAST_MULTI_CAR_MODES[
        Math.floor(Math.random() * CameraDirector.BROADCAST_MULTI_CAR_MODES.length)
      ];
    }
    this.nextSwitchTime = nextDuration;
  }
}
