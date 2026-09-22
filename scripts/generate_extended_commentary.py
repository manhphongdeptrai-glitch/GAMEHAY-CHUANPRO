import os
import urllib.request
import urllib.parse
import json
import subprocess
import time

OUTPUT_DIR = "public/audio/commentary"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Cấu hình 10 chất giọng đặc trưng cho 10 luồng đua
VOICE_PROFILES = {
    1: {"pitch": 1.05, "tempo": 1.08, "driver": "Cristiano Ronaldo", "style": "Hào hứng Siuuu"},
    2: {"pitch": 0.94, "tempo": 1.12, "driver": "Lionel Messi", "style": "Hóm hỉnh tếu táo"},
    3: {"pitch": 1.12, "tempo": 1.10, "driver": "Neymar Jr", "style": "Lầy lội quẩy tung nóc"},
    4: {"pitch": 1.02, "tempo": 1.18, "driver": "Kylian Mbappe", "style": "Ninja rùa bắn rap"},
    5: {"pitch": 0.88, "tempo": 1.06, "driver": "David Beckham", "style": "Quý ông bổ luống"},
    6: {"pitch": 1.08, "tempo": 1.12, "driver": "Elon Musk", "style": "Đại gia sửa mạng"},
    7: {"pitch": 0.96, "tempo": 1.14, "driver": "Max Verstappen", "style": "Quái kiệt trà sữa"},
    8: {"pitch": 0.92, "tempo": 1.08, "driver": "Lewis Hamilton", "style": "Thời trang F1 mì tôm"},
    9: {"pitch": 0.85, "tempo": 1.10, "driver": "Erling Haaland", "style": "Ma búp bê 5 tô phở"},
    10: {"pitch": 1.15, "tempo": 1.14, "driver": "Trùm Cuối Vô Danh", "style": "Tổ lái dép tông"}
}

# Kho 80 câu thoại đa dạng theo 10 Luồng (Mỗi luồng 8 câu: 2 START, 2 NITRO, 2 OVERTAKE, 2 FINISH)
# Kết hợp ma trận ngẫu nhiên dựa theo Seed video sẽ tạo ra hơn 10.000 biến thể kịch bản độc nhất!
EXTENDED_SCRIPTS = [
    # --- LUỒNG 1: RONALDO ---
    {"id": "inst1_start_1", "instanceId": 1, "type": "START", "variant": 1, "text": "Đèn xanh bật rồi anh em ơi! Hôm qua Ronaldo đi mua bánh mì mà quên mang ví bị chủ quán bắt rửa bát, hôm nay phải đạp lút ga kiếm tiền chuộc thân!"},
    {"id": "inst1_start_2", "instanceId": 1, "type": "START", "variant": 2, "text": "Xuất phát rồi! Ronaldo hôm nay đeo đồng hồ kim cương lấp lánh chói cả mắt đối thủ, anh bảo phải về nhất để khao cả đội bóng ăn lẩu cá kèo!"},
    {"id": "inst1_nitro_1", "instanceId": 1, "type": "NITRO", "variant": 1, "text": "Ronaldo bấm nút Nitro Siuuu! Khói xịt mù mịt đằng sau, tốc độ này thì camera bắn tốc độ cũng phải cháy bugi!"},
    {"id": "inst1_nitro_2", "instanceId": 1, "type": "NITRO", "variant": 2, "text": "Pha bứt tốc xé gió của anh Bảy! Động cơ V12 gầm rú rung chuyển cả mặt đường, gió thổi bay cả nón bảo hiểm đối thủ!"},
    {"id": "inst1_overtake_1", "instanceId": 1, "type": "OVERTAKE", "variant": 1, "text": "Pha vượt mặt quá khét của anh Bảy! Anh vừa ôm cua vừa soi gương vuốt lại tóc tai bóng lộn không lệch sợi nào!"},
    {"id": "inst1_overtake_2", "instanceId": 1, "type": "OVERTAKE", "variant": 2, "text": "Vượt xe trong chớp mắt! Ronaldo hạ kính xe ngoảnh lại giơ ngón tay cái chào tạm biệt các đối thủ đang hít khói!"},
    {"id": "inst1_finish_1", "instanceId": 1, "type": "FINISH", "variant": 1, "text": "Siuuu! Về nhất rồi bà con ơi! Đủ tiền mua mười ổ bánh mì pate trứng rồi, không phải rửa bát nữa nhé!"},
    {"id": "inst1_finish_2", "instanceId": 1, "type": "FINISH", "variant": 2, "text": "Vô địch rồi! Anh Bảy nhảy ra khỏi xe tạo dáng Siuuu kinh điển làm chấn động cả khán đài trường đua!"},

    # --- LUỒNG 2: MESSI ---
    {"id": "inst2_start_1", "instanceId": 2, "type": "START", "variant": 1, "text": "Chào mừng anh em đến luồng hai! Messi hôm nay mang dép tổ ong đạp ga, anh đang vội về sớm vì vợ dặn trước sáu giờ phải phơi xong quần áo!"},
    {"id": "inst2_start_2", "instanceId": 2, "type": "START", "variant": 2, "text": "Đèn xanh xuất phát! Messi vừa uống xong ngụm trà Mate nóng hổi, khởi động êm như nhung nhưng xe thì vọt như sao băng!"},
    {"id": "inst2_nitro_1", "instanceId": 2, "type": "NITRO", "variant": 1, "text": "Messi vít ga như gắn tên lửa đẩy vệ tinh! Xe nhỏ mà chạy như ăn cướp, cua một phát trôi luôn ổ gà ven đường!"},
    {"id": "inst2_nitro_2", "instanceId": 2, "type": "NITRO", "variant": 2, "text": "Bật Nitro như hack game! Messi lướt đi nhẹ nhàng không một tiếng động thừa, biến đường đua thành sân tập bóng của riêng mình!"},
    {"id": "inst2_overtake_1", "instanceId": 2, "type": "OVERTAKE", "variant": 1, "text": "Nghe đồn hôm qua Messi thách Ronaldo thi chạy bộ thua một chầu trà sữa, hôm nay lên xe đua tính sổ luôn cho nóng!"},
    {"id": "inst2_overtake_2", "instanceId": 2, "type": "OVERTAKE", "variant": 2, "text": "Pha luồn lách kinh điển kiểu M10! Đối thủ chỉ kịp nhìn thấy chiếc bóng áo số mười vút qua khe hẹp chưa đầy nửa mét!"},
    {"id": "inst2_finish_1", "instanceId": 2, "type": "FINISH", "variant": 1, "text": "Đúng là GOAT! Messi cán đích cờ ca rô rực rỡ, kịp giờ về nấu cơm cho vợ rồi anh em ơi!"},
    {"id": "inst2_finish_2", "instanceId": 2, "type": "FINISH", "variant": 2, "text": "Chiến thắng hoàn hảo! Messi vừa đỗ xe vừa rút điện thoại báo cáo vợ yêu là anh đã hoàn thành xuất sắc nhiệm vụ!"},

    # --- LUỒNG 3: NEYMAR JR ---
    {"id": "inst3_start_1", "instanceId": 3, "type": "START", "variant": 1, "text": "Luồng ba xuất phát! Neymar cam kết hôm nay không ngã lăn ra đường ăn vạ nữa, quyết tâm đua xe nghiêm túc kiếm tiền nạp game!"},
    {"id": "inst3_start_2", "instanceId": 3, "type": "START", "variant": 2, "text": "Đèn bật xanh! Neymar vừa nghe nhạc samba vừa đạp ga nhịp nhàng, hôm nay anh mang quả đầu nhuộm bảy sắc cầu vồng cực cháy!"},
    {"id": "inst3_nitro_1", "instanceId": 3, "type": "NITRO", "variant": 1, "text": "Neymar vừa ôm cua vừa biểu diễn múa samba trên vô lăng! Suýt nữa thì xoay mười tám vòng như trên sân cỏ rồi anh em!"},
    {"id": "inst3_nitro_2", "instanceId": 3, "type": "NITRO", "variant": 2, "text": "Kích hoạt Nitro màu hồng dạ quang! Xe lướt đi điệu đà nhưng tốc độ thì khiến các anh em trong xóm phải trầm trồ vỗ tay!"},
    {"id": "inst3_overtake_1", "instanceId": 3, "type": "OVERTAKE", "variant": 1, "text": "Hôm qua Neymar đi gội đầu dưỡng sinh ngủ quên mất chuyến bay, hôm nay lấy xe đua phóng bạt mạng sang Paris cho kịp giờ hẹn!"},
    {"id": "inst3_overtake_2", "instanceId": 3, "type": "OVERTAKE", "variant": 2, "text": "Cú drift lách qua khe hẹp quá đỉnh! Neymar đá lông nheo với máy quay, đúng là tay lái lụa có một không hai!"},
    {"id": "inst3_finish_1", "instanceId": 3, "type": "FINISH", "variant": 1, "text": "Neymar về đích rồi! Tuyệt đối không ăn vạ phát nào, trao ngay cúp vô địch và một gói bim bim cho anh ấy!"},
    {"id": "inst3_finish_2", "instanceId": 3, "type": "FINISH", "variant": 2, "text": "Về nhất xuất sắc! Neymar bật nhạc quẩy tưng bừng ngay trên mui xe, tối nay anh bao cả trường đua một chầu nước mía siêu to khổng lồ!"},

    # --- LUỒNG 4: KYLIAN MBAPPE ---
    {"id": "inst4_start_1", "instanceId": 4, "type": "START", "variant": 1, "text": "Luồng bốn! Ninja Rùa Mbappe đạp ga với tốc độ bàn thờ! Mẹ vừa gọi điện bảo về ăn cơm cá kho nên anh chạy bất chấp!"},
    {"id": "inst4_start_2", "instanceId": 4, "type": "START", "variant": 2, "text": "Xuất phát như tên lửa đạn đạo! Mbappe hôm nay quyết tâm chứng minh Ninja Rùa trên đường đua còn chạy nhanh hơn thỏ!"},
    {"id": "inst4_nitro_1", "instanceId": 4, "type": "NITRO", "variant": 1, "text": "Tốc độ sáu trăm ki lô mét một giờ! Chạy nhanh hơn cả tốc độ người yêu cũ trở mặt, đố ai đuổi kịp Ninja Rùa!"},
    {"id": "inst4_nitro_2", "instanceId": 4, "type": "NITRO", "variant": 2, "text": "Bật Nitro xé toang không khí! Động cơ gầm vang như động cơ máy bay phản lực sắp cất cánh thẳng lên trời cao!"},
    {"id": "inst4_overtake_1", "instanceId": 4, "type": "OVERTAKE", "variant": 1, "text": "Mbappe lách nhẹ qua ba xe cùng lúc! Cảnh sát giao thông bên đường chỉ biết đứng nhìn và vẫy tay chào tạm biệt!"},
    {"id": "inst4_overtake_2", "instanceId": 4, "type": "OVERTAKE", "variant": 2, "text": "Vượt xe mà nhanh như cơn gió thoảng! Các tay đua phía sau vừa kịp dụi mắt thì Mbappe đã mất hút sau đường chân trời!"},
    {"id": "inst4_finish_1", "instanceId": 4, "type": "FINISH", "variant": 1, "text": "Về đích ngoạn mục! Kịp giờ ăn cơm mẹ nấu rồi, Mbappe đỉnh nóc kịch trần bay phấp phới!"},
    {"id": "inst4_finish_2", "instanceId": 4, "type": "FINISH", "variant": 2, "text": "Cờ ca rô vẫy chào nhà vô địch tốc độ! Ninja Rùa khoanh tay ăn mừng ngạo nghễ, quá nhanh và quá nguy hiểm!"},

    # --- LUỒNG 5: DAVID BECKHAM ---
    {"id": "inst5_start_1", "instanceId": 5, "type": "START", "variant": 1, "text": "Luồng năm quý ông Beckham lên sàn! Trước khi đề nổ anh vừa xịt nửa lọ keo vuốt tóc, đẹp trai số một trường đua!"},
    {"id": "inst5_start_2", "instanceId": 5, "type": "START", "variant": 2, "text": "Đèn xanh bật! Beckham đeo kính râm đen bóng bẩy, phong thái lịch lãm như tài tử Hollywood đi dạo phố mùa thu!"},
    {"id": "inst5_nitro_1", "instanceId": 5, "type": "NITRO", "variant": 1, "text": "Hôm qua Beckham bị vợ bắt đi siêu thị xách mười túi đồ mỏi hết cả tay, hôm nay ra trường đua xả giận phóng bạt mạng!"},
    {"id": "inst5_nitro_2", "instanceId": 5, "type": "NITRO", "variant": 2, "text": "Nitro bốc khói màu hoàng hôn lãng mạn! Xe lao đi vun vút nhưng thần thái của quý ông thì vẫn điềm đạm lạ thường!"},
    {"id": "inst5_overtake_1", "instanceId": 5, "type": "OVERTAKE", "variant": 1, "text": "Gió thổi bay kính râm nhưng nếp tóc bổ luống của Beckham vẫn bất tử! Cú ôm cua cong vút như đường chuyền bóng vàng!"},
    {"id": "inst5_overtake_2", "instanceId": 5, "type": "OVERTAKE", "variant": 2, "text": "Pha vượt xe chuẩn mực quý tộc! Không va chạm, không tì đè, chỉ một cú lướt nhẹ nhàng khiến đối thủ cam tâm tình nguyện nhường đường!"},
    {"id": "inst5_finish_1", "instanceId": 5, "type": "FINISH", "variant": 1, "text": "Thắng rồi! Vừa đẹp trai vừa lái xe lụa, camera xin hãy quay cận cảnh nụ cười làm tan chảy trái tim người hâm mộ!"},
    {"id": "inst5_finish_2", "instanceId": 5, "type": "FINISH", "variant": 2, "text": "Beckham giật cúp vô địch! Anh bảo giải thưởng này xin dành tặng bà xã Victoria để xin phép tối nay đi đá bóng với bạn bè!"},

    # --- LUỒNG 6: ELON MUSK ---
    {"id": "inst6_start_1", "instanceId": 6, "type": "START", "variant": 1, "text": "Luồng sáu đại gia Elon Musk! Nghe bảo Twitter hôm nay lại sập máy chủ nên Elon Musk đích thân lái xe tên lửa đi sửa mạng!"},
    {"id": "inst6_start_2", "instanceId": 6, "type": "START", "variant": 2, "text": "Đèn xanh bật! Elon Musk khởi động bằng giọng nói AI, xe đua gắn chip điều khiển não bộ phản xạ nhanh bằng một phần triệu giây!"},
    {"id": "inst6_nitro_1", "instanceId": 6, "type": "NITRO", "variant": 1, "text": "Elon Musk kích hoạt chế độ lái tự động nhưng xe chạy bốc khói, màn hình hiện cảnh báo nhiệt độ một ngàn độ C luôn!"},
    {"id": "inst6_nitro_2", "instanceId": 6, "type": "NITRO", "variant": 2, "text": "Phụt lửa tên lửa đẩy Starship! Chiếc xe như muốn nhấc bổng khỏi mặt đường để bay thẳng lên quỹ đạo Trái Đất!"},
    {"id": "inst6_overtake_1", "instanceId": 6, "type": "OVERTAKE", "variant": 1, "text": "Vượt mặt không cần xi nhan! Đúng là phong cách tỷ phú công nghệ, chạy trước cho đỡ phải hít khói của người khác!"},
    {"id": "inst6_overtake_2", "instanceId": 6, "type": "OVERTAKE", "variant": 2, "text": "Thuật toán lái xe tự động tính toán góc cua chuẩn từng mi-li-mét! Đối thủ nhìn thấy chỉ biết ngước nhìn ngưỡng mộ!"},
    {"id": "inst6_finish_1", "instanceId": 6, "type": "FINISH", "variant": 1, "text": "Về nhất rồi! Elon Musk tuyên bố tặng mỗi khán giả đang xem video này một chiếc xe điện bay thẳng lên sao Hỏa!"},
    {"id": "inst6_finish_2", "instanceId": 6, "type": "FINISH", "variant": 2, "text": "Chiến thắng vang dội! Elon Musk rút điện thoại tweet ngay một dòng thông báo mình vừa vô địch giải đua xe nhanh nhất hành tinh!"},

    # --- LUỒNG 7: MAX VERSTAPPEN ---
    {"id": "inst7_start_1", "instanceId": 7, "type": "START", "variant": 1, "text": "Luồng bảy quái kiệt Max Verstappen! Anh vừa lái xe vừa cắm ống hút uống trà sữa trân châu đường đen cực chill!"},
    {"id": "inst7_start_2", "instanceId": 7, "type": "START", "variant": 2, "text": "Đèn xanh tắt và cuộc chiến bắt đầu! Max Verstappen vào số một cái là bánh sau nghiến nát mặt đường nhựa!"},
    {"id": "inst7_nitro_1", "instanceId": 7, "type": "NITRO", "variant": 1, "text": "Hôm qua Max chơi game đua xe cả đêm bị mẹ rút dây mạng, sáng nay cáu tiết ra trường đua thật đạp lút sàn nhà!"},
    {"id": "inst7_nitro_2", "instanceId": 7, "type": "NITRO", "variant": 2, "text": "Đạp ga lút cán! Max bảo lái thế này mới đã tay, chứ chạy chậm quá anh buồn ngủ không chịu được!"},
    {"id": "inst7_overtake_1", "instanceId": 7, "type": "OVERTAKE", "variant": 1, "text": "Bứt tốc kinh hoàng! Đối thủ phía sau vừa chớp mắt một cái là Max đã mất hút sau rặng tre làng rồi!"},
    {"id": "inst7_overtake_2", "instanceId": 7, "type": "OVERTAKE", "variant": 2, "text": "Cú phanh trễ cua tay áo táo bạo đến nghẹt thở! Chỉ có bản lĩnh của nhà vô địch thế giới mới dám ôm cua ở tốc độ này!"},
    {"id": "inst7_finish_1", "instanceId": 7, "type": "FINISH", "variant": 1, "text": "Lại là Max Verstappen chiến thắng! Đua dễ quá anh bảo lần sau cho anh vừa bịt mắt vừa lái xe cho có thử thách!"},
    {"id": "inst7_finish_2", "instanceId": 7, "type": "FINISH", "variant": 2, "text": "Về đích cô đơn một mình một cõi! Max đỗ xe gọi ngay một ly trà sữa full topping ăn mừng chiến thắng ngọt ngào!"},

    # --- LUỒNG 8: LEWIS HAMILTON ---
    {"id": "inst8_start_1", "instanceId": 8, "type": "START", "variant": 1, "text": "Luồng tám Sir Lewis Hamilton xuất phát! Sáng nay Hamilton mặc bộ đồ dạ hội bảy sắc cầu vồng đi đua xe thời trang nhất giải!"},
    {"id": "inst8_start_2", "instanceId": 8, "type": "START", "variant": 2, "text": "Đèn xanh xuất phát! Hamilton đeo vòng cổ kim cương lóng lánh, xe gầm rú nhưng vẫn toát lên vẻ thời thượng đẳng cấp!"},
    {"id": "inst8_nitro_1", "instanceId": 8, "type": "NITRO", "variant": 1, "text": "Hamilton vừa bật bộ đàm hỏi ban kỹ thuật xem ai ăn vụng bát mì tôm hai quả trứng của anh trong phòng thay đồ!"},
    {"id": "inst8_nitro_2", "instanceId": 8, "type": "NITRO", "variant": 2, "text": "Bật Nitro như bay trên mây! Hamilton điều khiển cỗ máy hàng triệu đô la chính xác như một nghệ sĩ dương cầm lướt phím!"},
    {"id": "inst8_overtake_1", "instanceId": 8, "type": "OVERTAKE", "variant": 1, "text": "Pha lạng lách kinh điển của nhà vô địch bảy lần thế giới! Vừa cua vừa né ổ gà điêu luyện như đường làng mùa mưa!"},
    {"id": "inst8_overtake_2", "instanceId": 8, "type": "OVERTAKE", "variant": 2, "text": "Kỹ thuật phòng thủ và phản công đỉnh cao! Hamilton không cho đối thủ bất kỳ một cơ hội nào để nhòm ngó gương chiếu hậu!"},
    {"id": "inst8_finish_1", "instanceId": 8, "type": "FINISH", "variant": 1, "text": "Cờ ca rô vẫy chào Hamilton! Đẳng cấp tay lái vàng trong làng quái xế, mang cúp về cất tủ kính thôi!"},
    {"id": "inst8_finish_2", "instanceId": 8, "type": "FINISH", "variant": 2, "text": "Về nhất vinh quang! Hamilton bước xuống xe tạo dáng thời trang cho các phóng viên bấm máy liên tục không ngớt!"},

    # --- LUỒNG 9: ERLING HAALAND ---
    {"id": "inst9_start_1", "instanceId": 9, "type": "START", "variant": 1, "text": "Luồng chín Ma Búp Bê Haaland! Sáng nay ăn liền năm tô phở bò tái gầu nhiều hành, giờ thừa năng lượng đạp cong cả bàn đạp ga!"},
    {"id": "inst9_start_2", "instanceId": 9, "type": "START", "variant": 2, "text": "Đèn xanh bật! Quái vật thể hình Haaland ngồi chật ních khoang lái, xe đua vừa nhả côn là chồm lên như hổ đói săn mồi!"},
    {"id": "inst9_nitro_1", "instanceId": 9, "type": "NITRO", "variant": 1, "text": "Haaland to như hộ pháp ngồi chật cả khoang lái, xe đua gầm rú như máy cày chạy trên ruộng bậc thang!"},
    {"id": "inst9_nitro_2", "instanceId": 9, "type": "NITRO", "variant": 2, "text": "Sức mạnh cơ bắp tuyệt đối! Haaland giẫm lút chân ga khiến ống pô phụt lửa đỏ rực cả một góc trời đua xe!"},
    {"id": "inst9_overtake_1", "instanceId": 9, "type": "OVERTAKE", "variant": 1, "text": "Cú húc Nitro của Haaland làm cả trường đua chao đảo! Xe bay như quả đại bác bắn thẳng về phía trước không ai dám cản!"},
    {"id": "inst9_overtake_2", "instanceId": 9, "type": "OVERTAKE", "variant": 2, "text": "Đè bẹp mọi chướng ngại vật! Đối thủ nhìn qua gương thấy Ma Búp Bê đang lao tới vội vàng dạt sang hai bên cho lành!"},
    {"id": "inst9_finish_1", "instanceId": 9, "type": "FINISH", "variant": 1, "text": "Haaland đè bẹp tất cả đối thủ! Về đích xong anh bảo phải nhảy xuống ăn thêm ba cái bánh mì nữa mới đỡ đói!"},
    {"id": "inst9_finish_2", "instanceId": 9, "type": "FINISH", "variant": 2, "text": "Cán đích rung chuyển mặt đất! Haaland giơ hai tay lên trời gầm vang ăn mừng, chiến thắng hoàn toàn xứng đáng!"},

    # --- LUỒNG 10: TRÙM CUỐI VÔ DANH ---
    {"id": "inst10_start_1", "instanceId": 10, "type": "START", "variant": 1, "text": "Luồng mười trùm cuối xuất hiện! Hôm nay đi dép tông, xe không gương, đội mũ bảo hiểm con vịt vàng vào cua như thần!"},
    {"id": "inst10_start_2", "instanceId": 10, "type": "START", "variant": 2, "text": "Đèn xanh xuất phát! Tay lái ẩn danh của xóm chúng ta vặn ga hết cỡ, tiếng pô độ nổ giòn tan cả khu phố rực rỡ!"},
    {"id": "inst10_nitro_1", "instanceId": 10, "type": "NITRO", "variant": 1, "text": "Nghe nói anh này hôm qua bị mẹ tịch thu xe máy, hôm nay mượn tạm siêu xe của hàng xóm ra đua ké kiếm tiền ăn sáng!"},
    {"id": "inst10_nitro_2", "instanceId": 10, "type": "NITRO", "variant": 2, "text": "Bấm nút tăng tốc bí mật! Xe phụt khói mù trời đất, kỹ năng tổ lái đường làng được phát huy tối đa công suất!"},
    {"id": "inst10_overtake_1", "instanceId": 10, "type": "OVERTAKE", "variant": 1, "text": "Đánh lái hình chữ S, lướt trên mặt đường nhựa bốc khói khét lẹt, các tay đua chuyên nghiệp nhìn thấy cũng phải vái lạy!"},
    {"id": "inst10_overtake_2", "instanceId": 10, "type": "OVERTAKE", "variant": 2, "text": "Pha tạt đầu đi vào huyền thoại! Trùm cuối vừa lách qua vừa vẫy tay chào thân ái, đối thủ chỉ biết tròn xoe mắt thán phục!"},
    {"id": "inst10_finish_1", "instanceId": 10, "type": "FINISH", "variant": 1, "text": "Trùm cuối giật cúp vô địch luồng mười! Quá đẳng cấp, đúng là cao thủ ẩn danh của xóm chúng ta!"},
    {"id": "inst10_finish_2", "instanceId": 10, "type": "FINISH", "variant": 2, "text": "Về nhất thuyết phục tuyệt đối! Giật cúp xong anh vội vàng phóng xe về nhà cất xe kẻo hàng xóm phát hiện mượn trộm xe đi đua!"}
]

def fetch_tts_audio(text: str, tmp_path: str):
    url = "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=" + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        with open(tmp_path, "wb") as f:
            f.write(data)

def process_audio(raw_path: str, out_path: str, pitch_factor: float, tempo: float):
    new_rate = int(24000 * pitch_factor)
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
        return 6.5

def main():
    print(f"Bắt đầu mở rộng kho kịch bản lên {len(EXTENDED_SCRIPTS)} câu thoại đa biến thể...")
    results = []

    for idx, item in enumerate(EXTENDED_SCRIPTS):
        clip_id = item["id"]
        out_file = os.path.join(OUTPUT_DIR, f"{clip_id}.mp3")
        raw_tmp = f"/tmp/raw_ext_{clip_id}.mp3"
        profile = VOICE_PROFILES.get(item["instanceId"], {"pitch": 1.0, "tempo": 1.1, "driver": "Tay Đua"})

        # Nếu file đã tồn tại và hợp lệ, chỉ cần đọc duration để tăng tốc
        if os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
            dur = get_audio_duration(out_file)
            results.append({
                "id": clip_id,
                "instanceId": item["instanceId"],
                "type": item["type"],
                "variant": item.get("variant", 1),
                "driver": profile["driver"],
                "text": item["text"],
                "path": f"/audio/commentary/{clip_id}.mp3",
                "duration": round(dur, 2)
            })
            continue

        print(f"[{idx+1}/{len(EXTENDED_SCRIPTS)}] Sinh âm thanh: Luồng {item['instanceId']} - {profile['driver']} - {item['type']} #{item.get('variant', 1)}...")
        try:
            fetch_tts_audio(item["text"], raw_tmp)
            process_audio(raw_tmp, out_file, profile["pitch"], profile["tempo"])
            dur = get_audio_duration(out_file)
            if os.path.exists(raw_tmp):
                os.remove(raw_tmp)

            results.append({
                "id": clip_id,
                "instanceId": item["instanceId"],
                "type": item["type"],
                "variant": item.get("variant", 1),
                "driver": profile["driver"],
                "text": item["text"],
                "path": f"/audio/commentary/{clip_id}.mp3",
                "duration": round(dur, 2)
            })
            time.sleep(0.12)
        except Exception as e:
            print(f"Lỗi với clip {clip_id}: {e}")

    # Ghi metadata index
    index_path = os.path.join(OUTPUT_DIR, "extended_index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"Hoàn tất! Đã xuất kho {len(results)} câu thoại tại {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
