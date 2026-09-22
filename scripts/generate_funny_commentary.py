import os
import urllib.request
import urllib.parse
import json
import subprocess
import time

OUTPUT_DIR = "public/audio/commentary"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Kịch bản 40 câu bình luận cực kỳ trẻ trâu, hài hước, bựa xen kẽ chuyện đời tư chế của 10 tay đua
SCRIPTS = [
    # LUỒNG 1: CRISTIANO RONALDO (Giọng BLV 1: Hào hứng, nhấn nhá kiểu Siuuu)
    {
        "id": "inst1_start",
        "instanceId": 1,
        "type": "START",
        "driver": "Cristiano Ronaldo",
        "pitchFactor": 1.05,
        "tempo": 1.08,
        "text": "Đèn xanh bật rồi anh em ơi! Hôm qua Ronaldo đi mua bánh mì mà quên mang ví bị chủ quán bắt rửa bát, hôm nay phải đạp lút ga kiếm tiền chuộc thân!"
    },
    {
        "id": "inst1_nitro",
        "instanceId": 1,
        "type": "NITRO",
        "driver": "Cristiano Ronaldo",
        "pitchFactor": 1.05,
        "tempo": 1.08,
        "text": "Ronaldo bấm nút Nitro Siuuu! Khói xịt mù mịt đằng sau, tốc độ này thì camera bắn tốc độ cũng phải cháy bugi!"
    },
    {
        "id": "inst1_overtake",
        "instanceId": 1,
        "type": "OVERTAKE",
        "driver": "Cristiano Ronaldo",
        "pitchFactor": 1.05,
        "tempo": 1.08,
        "text": "Pha vượt mặt quá khét của anh Bảy! Anh vừa ôm cua vừa soi gương vuốt lại tóc tai bóng lộn không lệch sợi nào!"
    },
    {
        "id": "inst1_finish",
        "instanceId": 1,
        "type": "FINISH",
        "driver": "Cristiano Ronaldo",
        "pitchFactor": 1.05,
        "tempo": 1.08,
        "text": "Siuuu! Về nhất rồi bà con ơi! Đủ tiền mua mười ổ bánh mì pate trứng rồi, không phải rửa bát nữa nhé!"
    },

    # LUỒNG 2: LIONEL MESSI (Giọng BLV 2: Hài hước, tếu táo, tone ấm hơn)
    {
        "id": "inst2_start",
        "instanceId": 2,
        "type": "START",
        "driver": "Lionel Messi",
        "pitchFactor": 0.94,
        "tempo": 1.12,
        "text": "Chào mừng anh em đến luồng hai! Messi hôm nay mang dép tổ ong đạp ga, anh đang vội về sớm vì vợ dặn trước sáu giờ phải phơi xong quần áo!"
    },
    {
        "id": "inst2_nitro",
        "instanceId": 2,
        "type": "NITRO",
        "driver": "Lionel Messi",
        "pitchFactor": 0.94,
        "tempo": 1.12,
        "text": "Messi vít ga như gắn tên lửa đẩy vệ tinh! Xe nhỏ mà chạy như ăn cướp, cua một phát trôi luôn ổ gà ven đường!"
    },
    {
        "id": "inst2_overtake",
        "instanceId": 2,
        "type": "OVERTAKE",
        "driver": "Lionel Messi",
        "pitchFactor": 0.94,
        "tempo": 1.12,
        "text": "Nghe đồn hôm qua Messi thách Ronaldo thi chạy bộ thua một chầu trà sữa, hôm nay lên xe đua tính sổ luôn cho nóng!"
    },
    {
        "id": "inst2_finish",
        "instanceId": 2,
        "type": "FINISH",
        "driver": "Lionel Messi",
        "pitchFactor": 0.94,
        "tempo": 1.12,
        "text": "Đúng là GOAT! Messi cán đích cờ ca rô rực rỡ, kịp giờ về nấu cơm cho vợ rồi anh em ơi!"
    },

    # LUỒNG 3: NEYMAR JR (Giọng BLV 3: Trẻ trâu, lầy lội, pitch cao vui nhộn)
    {
        "id": "inst3_start",
        "instanceId": 3,
        "type": "START",
        "driver": "Neymar Jr",
        "pitchFactor": 1.12,
        "tempo": 1.10,
        "text": "Luồng ba xuất phát! Neymar cam kết hôm nay không ngã lăn ra đường ăn vạ nữa, quyết tâm đua xe nghiêm túc kiếm tiền nạp game!"
    },
    {
        "id": "inst3_drift",
        "instanceId": 3,
        "type": "DRIFT",
        "driver": "Neymar Jr",
        "pitchFactor": 1.12,
        "tempo": 1.10,
        "text": "Neymar vừa ôm cua vừa biểu diễn múa samba trên vô lăng! Suýt nữa thì xoay mười tám vòng như trên sân cỏ rồi anh em!"
    },
    {
        "id": "inst3_overtake",
        "instanceId": 3,
        "type": "OVERTAKE",
        "driver": "Neymar Jr",
        "pitchFactor": 1.12,
        "tempo": 1.10,
        "text": "Hôm qua Neymar đi gội đầu dưỡng sinh ngủ quên mất chuyến bay, hôm nay lấy xe đua phóng bạt mạng sang Paris cho kịp giờ hẹn!"
    },
    {
        "id": "inst3_finish",
        "instanceId": 3,
        "type": "FINISH",
        "driver": "Neymar Jr",
        "pitchFactor": 1.12,
        "tempo": 1.10,
        "text": "Neymar về đích rồi! Tuyệt đối không ăn vạ phát nào, trao ngay cúp vô địch và một gói bim bim cho anh ấy!"
    },

    # LUỒNG 4: KYLIAN MBAPPE (Giọng BLV 4: Siêu nhanh, gấp gáp, hài hước)
    {
        "id": "inst4_start",
        "instanceId": 4,
        "type": "START",
        "driver": "Kylian Mbappe",
        "pitchFactor": 1.02,
        "tempo": 1.18,
        "text": "Luồng bốn! Ninja Rùa Mbappe đạp ga với tốc độ bàn thờ! Mẹ vừa gọi điện bảo về ăn cơm cá kho nên anh chạy bất chấp!"
    },
    {
        "id": "inst4_nitro",
        "instanceId": 4,
        "type": "NITRO",
        "driver": "Kylian Mbappe",
        "pitchFactor": 1.02,
        "tempo": 1.18,
        "text": "Tốc độ sáu trăm ki lô mét một giờ! Chạy nhanh hơn cả tốc độ người yêu cũ trở mặt, đố ai đuổi kịp Ninja Rùa!"
    },
    {
        "id": "inst4_overtake",
        "instanceId": 4,
        "type": "OVERTAKE",
        "driver": "Kylian Mbappe",
        "pitchFactor": 1.02,
        "tempo": 1.18,
        "text": "Mbappe lách nhẹ qua ba xe cùng lúc! Cảnh sát giao thông bên đường chỉ biết đứng nhìn và vẫy tay chào tạm biệt!"
    },
    {
        "id": "inst4_finish",
        "instanceId": 4,
        "type": "FINISH",
        "driver": "Kylian Mbappe",
        "pitchFactor": 1.02,
        "tempo": 1.18,
        "text": "Về đích ngoạn mục! Kịp giờ ăn cơm mẹ nấu rồi, Mbappe đỉnh nóc kịch trần bay phấp phới!"
    },

    # LUỒNG 5: DAVID BECKHAM (Giọng BLV 5: Giọng nam trầm quý phái giả vờ cà khịa)
    {
        "id": "inst5_start",
        "instanceId": 5,
        "type": "START",
        "driver": "David Beckham",
        "pitchFactor": 0.88,
        "tempo": 1.06,
        "text": "Luồng năm quý ông Beckham lên sàn! Trước khi đề nổ anh vừa xịt nửa lọ keo vuốt tóc, đẹp trai số một trường đua!"
    },
    {
        "id": "inst5_nitro",
        "instanceId": 5,
        "type": "NITRO",
        "driver": "David Beckham",
        "pitchFactor": 0.88,
        "tempo": 1.06,
        "text": "Hôm qua Beckham bị vợ bắt đi siêu thị xách mười túi đồ mỏi hết cả tay, hôm nay ra trường đua xả giận phóng bạt mạng!"
    },
    {
        "id": "inst5_drift",
        "instanceId": 5,
        "type": "DRIFT",
        "driver": "David Beckham",
        "pitchFactor": 0.88,
        "tempo": 1.06,
        "text": "Gió thổi bay kính râm nhưng nếp tóc bổ luống của Beckham vẫn bất tử! Cú ôm cua cong vút như đường chuyền bóng vàng!"
    },
    {
        "id": "inst5_finish",
        "instanceId": 5,
        "type": "FINISH",
        "driver": "David Beckham",
        "pitchFactor": 0.88,
        "tempo": 1.06,
        "text": "Thắng rồi! Vừa đẹp trai vừa lái xe lụa, camera xin hãy quay cận cảnh nụ cười làm tan chảy trái tim người hâm mộ!"
    },

    # LUỒNG 6: ELON MUSK (Giọng BLV 6: Công nghệ tếu táo, giễu cợt)
    {
        "id": "inst6_start",
        "instanceId": 6,
        "type": "START",
        "driver": "Elon Musk",
        "pitchFactor": 1.08,
        "tempo": 1.12,
        "text": "Luồng sáu đại gia Elon Musk! Nghe bảo Twitter hôm nay lại sập máy chủ nên Elon Musk đích thân lái xe tên lửa đi sửa mạng!"
    },
    {
        "id": "inst6_nitro",
        "instanceId": 6,
        "type": "NITRO",
        "driver": "Elon Musk",
        "pitchFactor": 1.08,
        "tempo": 1.12,
        "text": "Elon Musk kích hoạt chế độ lái tự động nhưng xe chạy bốc khói, màn hình hiện cảnh báo nhiệt độ một ngàn độ C luôn!"
    },
    {
        "id": "inst6_overtake",
        "instanceId": 6,
        "type": "OVERTAKE",
        "driver": "Elon Musk",
        "pitchFactor": 1.08,
        "tempo": 1.12,
        "text": "Vượt mặt không cần xi nhan! Đúng là phong cách tỷ phú công nghệ, chạy trước cho đỡ phải hít khói của người khác!"
    },
    {
        "id": "inst6_finish",
        "instanceId": 6,
        "type": "FINISH",
        "driver": "Elon Musk",
        "pitchFactor": 1.08,
        "tempo": 1.12,
        "text": "Về nhất rồi! Elon Musk tuyên bố tặng mỗi khán giả đang xem video này một chiếc xe điện bay thẳng lên sao Hỏa!"
    },

    # LUỒNG 7: MAX VERSTAPPEN (Giọng BLV 7: Gắt gao, lạnh lùng hài hước)
    {
        "id": "inst7_start",
        "instanceId": 7,
        "type": "START",
        "driver": "Max Verstappen",
        "pitchFactor": 0.96,
        "tempo": 1.14,
        "text": "Luồng bảy quái kiệt Max Verstappen! Anh vừa lái xe vừa cắm ống hút uống trà sữa trân châu đường đen cực chill!"
    },
    {
        "id": "inst7_nitro",
        "instanceId": 7,
        "type": "NITRO",
        "driver": "Max Verstappen",
        "pitchFactor": 0.96,
        "tempo": 1.14,
        "text": "Hôm qua Max chơi game đua xe cả đêm bị mẹ rút dây mạng, sáng nay cáu tiết ra trường đua thật đạp lút sàn nhà!"
    },
    {
        "id": "inst7_overtake",
        "instanceId": 7,
        "type": "OVERTAKE",
        "driver": "Max Verstappen",
        "pitchFactor": 0.96,
        "tempo": 1.14,
        "text": "Bứt tốc kinh hoàng! Đối thủ phía sau vừa chớp mắt một cái là Max đã mất hút sau rặng tre làng rồi!"
    },
    {
        "id": "inst7_finish",
        "instanceId": 7,
        "type": "FINISH",
        "driver": "Max Verstappen",
        "pitchFactor": 0.96,
        "tempo": 1.14,
        "text": "Lại là Max Verstappen chiến thắng! Đua dễ quá anh bảo lần sau cho anh vừa bịt mắt vừa lái xe cho có thử thách!"
    },

    # LUỒNG 8: LEWIS HAMILTON (Giọng BLV 8: Cà khịa phong cách thời trang F1)
    {
        "id": "inst8_start",
        "instanceId": 8,
        "type": "START",
        "driver": "Lewis Hamilton",
        "pitchFactor": 0.92,
        "tempo": 1.08,
        "text": "Luồng tám Sir Lewis Hamilton xuất phát! Sáng nay Hamilton mặc bộ đồ dạ hội bảy sắc cầu vồng đi đua xe thời trang nhất giải!"
    },
    {
        "id": "inst8_nitro",
        "instanceId": 8,
        "type": "NITRO",
        "driver": "Lewis Hamilton",
        "pitchFactor": 0.92,
        "tempo": 1.08,
        "text": "Hamilton vừa bật bộ đàm hỏi ban kỹ thuật xem ai ăn vụng bát mì tôm hai quả trứng của anh trong phòng thay đồ!"
    },
    {
        "id": "inst8_overtake",
        "instanceId": 8,
        "type": "OVERTAKE",
        "driver": "Lewis Hamilton",
        "pitchFactor": 0.92,
        "tempo": 1.08,
        "text": "Pha lạng lách kinh điển của nhà vô địch bảy lần thế giới! Vừa cua vừa né ổ gà điêu luyện như đường làng mùa mưa!"
    },
    {
        "id": "inst8_finish",
        "instanceId": 8,
        "type": "FINISH",
        "driver": "Lewis Hamilton",
        "pitchFactor": 0.92,
        "tempo": 1.08,
        "text": "Cờ ca rô vẫy chào Hamilton! Đẳng cấp tay lái vàng trong làng quái xế, mang cúp về cất tủ kính thôi!"
    },

    # LUỒNG 9: ERLING HAALAND (Giọng BLV 9: Mạnh mẽ, đô vật, hài hước)
    {
        "id": "inst9_start",
        "instanceId": 9,
        "type": "START",
        "driver": "Erling Haaland",
        "pitchFactor": 0.85,
        "tempo": 1.10,
        "text": "Luồng chín Ma Búp Bê Haaland! Sáng nay ăn liền năm tô phở bò tái gầu nhiều hành, giờ thừa năng lượng đạp cong cả bàn đạp ga!"
    },
    {
        "id": "inst9_nitro",
        "instanceId": 9,
        "type": "NITRO",
        "driver": "Erling Haaland",
        "pitchFactor": 0.85,
        "tempo": 1.10,
        "text": "Haaland to như hộ pháp ngồi chật cả khoang lái, xe đua gầm rú như máy cày chạy trên ruộng bậc thang!"
    },
    {
        "id": "inst9_overtake",
        "instanceId": 9,
        "type": "OVERTAKE",
        "driver": "Erling Haaland",
        "pitchFactor": 0.85,
        "tempo": 1.10,
        "text": "Cú húc Nitro của Haaland làm cả trường đua chao đảo! Xe bay như quả đại bác bắn thẳng về phía trước không ai dám cản!"
    },
    {
        "id": "inst9_finish",
        "instanceId": 9,
        "type": "FINISH",
        "driver": "Erling Haaland",
        "pitchFactor": 0.85,
        "tempo": 1.10,
        "text": "Haaland đè bẹp tất cả đối thủ! Về đích xong anh bảo phải nhảy xuống ăn thêm ba cái bánh mì nữa mới đỡ đói!"
    },

    # LUỒNG 10: TRÙM CUỐI VÔ DANH (Giọng BLV 10: Cực lầy, phong cách tổ lái đường phố)
    {
        "id": "inst10_start",
        "instanceId": 10,
        "type": "START",
        "driver": "Trùm Cuối Vô Danh",
        "pitchFactor": 1.15,
        "tempo": 1.14,
        "text": "Luồng mười trùm cuối xuất hiện! Hôm nay đi dép tông, xe không gương, đội mũ bảo hiểm con vịt vàng vào cua như thần!"
    },
    {
        "id": "inst10_nitro",
        "instanceId": 10,
        "type": "NITRO",
        "driver": "Trùm Cuối Vô Danh",
        "pitchFactor": 1.15,
        "tempo": 1.14,
        "text": "Nghe nói anh này hôm qua bị mẹ tịch thu xe máy, hôm nay mượn tạm siêu xe của hàng xóm ra đua ké kiếm tiền ăn sáng!"
    },
    {
        "id": "inst10_drift",
        "instanceId": 10,
        "type": "DRIFT",
        "driver": "Trùm Cuối Vô Danh",
        "pitchFactor": 1.15,
        "tempo": 1.14,
        "text": "Đánh lái hình chữ S, lướt trên mặt đường nhựa bốc khói khét lẹt, các tay đua chuyên nghiệp nhìn thấy cũng phải vái lạy!"
    },
    {
        "id": "inst10_finish",
        "instanceId": 10,
        "type": "FINISH",
        "driver": "Trùm Cuối Vô Danh",
        "pitchFactor": 1.15,
        "tempo": 1.14,
        "text": "Trùm cuối giật cúp vô địch luồng mười! Quá đẳng cấp, đúng là cao thủ ẩn danh của xóm chúng ta!"
    }
]

def fetch_tts_audio(text: str, tmp_path: str):
    # Chia nhỏ nếu text quá dài (>180 chars)
    # Nhưng câu của chúng ta tầm 120-150 ký tự, rất vừa vặn
    url = "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=" + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        with open(tmp_path, "wb") as f:
            f.write(data)

def process_audio(raw_path: str, out_path: str, pitch_factor: float, tempo: float):
    # Dùng ffmpeg điều chỉnh sample rate và tempo để biến đổi pitch giọng thành các nhân vật hài hước khác nhau
    # Base rate = 24000 Hz
    new_rate = int(24000 * pitch_factor)
    # Filter: asetrate thay đổi tốc độ + cao độ, sau đó atempo bù lại tốc độ để khớp tempo mong muốn
    # net_tempo = tempo / pitch_factor
    net_tempo = max(0.5, min(2.0, tempo / pitch_factor))
    filter_str = f"asetrate={new_rate},atempo={net_tempo:.3f},aresample=44100"
    cmd = [
        "ffmpeg", "-y", "-i", raw_path,
        "-af", filter_str,
        "-c:a", "libmp3lame", "-q:a", "2",
        out_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def get_audio_duration(file_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", file_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
    try:
        return float(res.stdout.strip())
    except:
        return 5.5

def main():
    print(f"Bắt đầu sinh {len(SCRIPTS)} câu bình luận tiếng Việt siêu hài hước, trẻ trâu...")
    results = []

    for idx, item in enumerate(SCRIPTS):
        clip_id = item["id"]
        out_file = os.path.join(OUTPUT_DIR, f"{clip_id}.mp3")
        raw_tmp = f"/tmp/raw_{clip_id}.mp3"

        print(f"[{idx+1}/{len(SCRIPTS)}] Đang xử lý: Luồng {item['instanceId']} - {item['driver']} - {item['type']}...")
        try:
            fetch_tts_audio(item["text"], raw_tmp)
            process_audio(raw_tmp, out_file, item["pitchFactor"], item["tempo"])
            dur = get_audio_duration(out_file)
            if os.path.exists(raw_tmp):
                os.remove(raw_tmp)

            results.append({
                "id": clip_id,
                "instanceId": item["instanceId"],
                "type": item["type"],
                "driver": item["driver"],
                "text": item["text"],
                "path": f"/audio/commentary/{clip_id}.mp3",
                "duration": round(dur, 2)
            })
            time.sleep(0.15)
        except Exception as e:
            print(f"Lỗi với clip {clip_id}: {e}")

    # Ghi metadata index
    index_path = os.path.join(OUTPUT_DIR, "funny_index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"Đã hoàn thành! Đã tạo {len(results)} file âm thanh tại {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
