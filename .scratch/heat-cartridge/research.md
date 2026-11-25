# Research: Heat: Pedal to the Metal (Days of Wonder)

**Primary Sources:**
- Days of Wonder Official Rulebook (*Heat: Pedal to the Metal*, designed by Asger Harding Granerud & Daniel Skjold Pedersen)
- Days of Wonder Legends & Advanced Modules Rulebook
- BoardGameArena Official Digital Adaptation Rules Reference

---

## 1. Tổng quan & Thành phần (Core Game Components)

- **Số người chơi**: 1–6 người chơi (hỗ trợ Bot tự động thông qua **Legends Module** để lấp đầy đủ 6 xe trên đường đua).
- **6 Xe đua (Race Cars), 6 Bảng điều khiển (Player Mats), 6 Cần số (Gear Pawns)** theo 6 màu: Đỏ (`Red`), Vàng (`Yellow`), Xanh lá (`Green`), Xanh dương (`Blue`), Đen (`Black`), Xám/Trắng (`Grey`).
- **4 Đường đua (Tracks)** trên 2 bàn cờ 2 mặt:
  1. **USA** (69 ô, 2 vòng / laps, 4 góc cua với giới hạn tốc độ: `7`, `3`, `3`, `2`, khởi đầu 6 Heat trong Engine + 3 Stress trong Deck).
  2. **Great Britain** (63 ô, 2 vòng / laps, 5 góc cua liên tiếp kỹ thuật, khởi đầu 6 Heat + 3 Stress).
  3. **France** (60 ô, 2 vòng / laps, 5 góc cua với giới hạn tốc độ: `5`, `2`, `4`, `3`, `4`, khởi đầu 6 Heat + 3 Stress).
  4. **Italy** (54 ô, 3 vòng / laps, 3 góc cua gắt với giới hạn tốc độ: `5`, `2`, `3`, khởi đầu 6 Heat + 3 Stress).
- **Bộ bài của mỗi tay đua (Starting Deck & Engine)**:
  - **12 lá Tốc độ cơ bản (Basic Speed Cards)**: 3 lá giá trị `1`, 3 lá giá trị `2`, 3 lá giá trị `3`, 3 lá giá trị `4` (tổng = 12 lá).
  - **3 lá Nâng cấp khởi đầu (Starting Upgrade Cards)**: 1 lá tốc độ `0`, 1 lá tốc độ `5`, và 1 lá `Heat` (nằm trong bộ bài rút ngay từ đầu ở chế độ cơ bản).
  - **Lá Áp lực (Stress Cards)**: Mặc định 3 lá (tùy đường đua) trộn vào Deck khởi đầu.
  - **Lá Nhiệt (Heat Cards)**: Mặc định 6 lá (tùy đường đua) đặt ở ô **Động cơ (Engine Spot)** trên bảng điều khiển của người chơi.
  - **Tổng bài rút khởi đầu (Draw Deck)**: `12 Speed + 3 Starting Upgrades + 3 Stress = 18 lá`. Rút **7 lá trên tay (Hand Size = 7)** khi bắt đầu cuộc đua; cần số đặt ở **Số 1 (1st Gear)**.

---

## 2. Cấu trúc Đường đua, Làn đua (Race Line) & Thứ tự xe

- Mỗi bước (Space) trên đường đua được chia làm **2 làn (2 Lanes)**:
  - **Làn đua chính (Race Line - làn có kẻ viền đậm ở mép đường)**: Luôn có độ ưu tiên cao hơn làn còn lại trên cùng một ô số.
  - **Thứ tự vị trí xe (Race Order)**: Xe ở ô phía trước đi trước; nếu 2 xe nằm trên cùng một ô (song song 2 làn), xe nằm ở **Race Line** đứng trước.
- **Quy tắc di chuyển & Xếp chỗ (Movement & Blocking)**:
  - Khi một xe di chuyển $N$ ô, ta đếm số ô tiến về phía trước (không tính chuyển làn ngang là tốn bước).
  - Khi dừng lại ở ô đích:
    - Nếu cả 2 làn của ô đích còn trống: xe tự động chiếm làn **Race Line**.
    - Nếu làn Race Line đã có xe khác: xe chiếm làn thứ 2 (làn ngoài) của ô đó.
    - Nếu **cả 2 làn của ô đích đều đã đầy (Blocked)**: xe không được vượt qua mà bị đẩy lùi về **ô trống gần nhất ngay phía sau** (ưu tiên làn Race Line nếu trống).

---

## 3. Quy trình 9 Bước mỗi Vòng (9-Step Round Structure)

Mỗi vòng (Round) gồm **2 bước đồng thời (Simultaneous)** cho tất cả người chơi và **7 bước tuần tự (Sequential)** xử lý từng xe một theo thứ tự từ xe dẫn đầu đến xe cuối đoàn.

### Giai đoạn Đồng thời (All Players Simultaneously)

#### Bước 1: Sang số (Shift Gears)
- Cần số hiện tại ($G \in \{1, 2, 3, 4\}$) quyết định số lá bài phải đánh trong vòng này.
- Mỗi người chơi chọn:
  - **Giữ nguyên số hiện tại**: Miễn phí.
  - **Tăng 1 số hoặc Giảm 1 số ($\pm 1$ Gear)**: Miễn phí.
  - **Tăng 2 số hoặc Giảm 2 số ($\pm 2$ Gears)**: Phải trả **1 lá Heat** từ ô **Engine** sang chồng bài bỏ (**Discard Pile**). Không thể sang $\pm 2$ số nếu Engine không còn lá Heat nào.

#### Bước 2: Chọn bài úp (Play Cards)
- Mỗi người chơi chọn từ trên tay đúng **$G$ lá bài** (bằng số Gear vừa chọn ở Bước 1) và đặt úp xuống bàn.
- **Quy tắc bài trên tay**:
  - Được phép đánh: Basic Speed (`1`–`4`), Starting Upgrade (`0`, `5`), hoặc `Stress` (`+`).
  - **Cấm đánh lá `Heat`** từ trên tay (lá Heat trên tay làm kẹt tay bài, chỉ có thể đẩy về Engine thông qua **Cooldown**).
- **Trường hợp Kẹt tay bài (Cluttered Hand)**:
  - Nếu người chơi không có đủ $G$ lá bài hợp lệ trên tay để đánh ở Bước 2, họ buộc phải đánh tất cả các lá hợp lệ đang có, và ở Bước 3 sẽ bị xử lý theo luật Cluttered Hand (rút bù trực tiếp từ Draw Deck cho đủ $G$ lá; nếu vẫn không đủ hoặc bị lỗi thì xe về Số 1 và mất lượt).

---

### Giai đoạn Tuần tự (Sequential: Từ xe hạng 1 đến xe cuối cùng)

Với mỗi xe theo thứ tự trên đường đua, thực hiện lần lượt các bước 3 → 9:

#### Bước 3: Lật bài & Di chuyển (Reveal & Move)
- Lật ngửa $G$ lá bài đã chọn.
- **Giải quyết lá `Stress` (`+`)**: Với mỗi lá Stress được đánh ra, người chơi lật từng lá từ đỉnh **Draw Deck** cho đến khi lộ ra một lá **Basic Speed (`1`–`4`)**.
  - Lá Basic Speed đó thay thế cho lá Stress để cộng vào tốc độ.
  - Mọi lá khác bị lật ra trong quá trình tìm (Upgrade, Stress khác, Heat) đều bỏ thẳng vào **Discard Pile**.
- Tính tổng **Tốc độ cơ bản (Base Speed)** = tổng giá trị các lá trên bàn, rồi di chuyển xe tiến lên tương ứng số ô.

#### Bước 4: Adrenaline (Chỉ dành cho xe cuối đoàn)
- Kiểm tra xem xe hiện tại có phải là xe đứng cuối đoàn ở đầu lượt di chuyển của nó hay không:
  - Trong bàn **1–4 xe**: **1 xe đứng cuối cùng** nhận Adrenaline.
  - Trong bàn **5–6 xe**: **2 xe đứng cuối cùng** nhận Adrenaline.
- Quyền lợi Adrenaline (kích hoạt trong Bước 5 React):
  1. Được quyền đi thêm **+1 ô (tùy chọn)** (lưu ý: đi thêm +1 ô từ Adrenaline **vẫn làm tăng Speed** tính cho Corner Check!).
  2. Được cộng thêm **+1 Cooldown** miễn phí trong Bước 5.

#### Bước 5: Phản ứng (React)
Người chơi có thể thực hiện các biểu tượng khả dụng theo bất kỳ thứ tự nào:
- **Làm mát động cơ (Cooldown)**:
  - Nếu đang ở **Số 1 (1st Gear)**: Có sẵn **3 Cooldown**.
  - Nếu đang ở **Số 2 (2nd Gear)**: Có sẵn **1 Cooldown**.
  - Cộng thêm **+1 Cooldown** nếu có Adrenaline (hoặc từ thẻ Upgrade).
  - Mỗi điểm Cooldown cho phép cất **1 lá Heat từ trên tay (Hand)** quay trở lại ô **Engine**.
- **Tăng tốc (Boost / `+` Symbol)** (tối đa **1 lần mỗi lượt**):
  - Trả **1 lá Heat từ Engine** vào Discard Pile.
  - Lật bài từ đỉnh Draw Deck cho đến khi gặp **1 lá Basic Speed (`1`–`4`)**.
  - Di chuyển xe tiến thêm số ô bằng lá Basic Speed đó, đồng thời **cộng giá trị này vào Speed của lượt** (ảnh hưởng trực tiếp tới kiểm tra góc cua ở Bước 7!).

#### Bước 6: Núp gió (Slipstream) *(Tùy chọn)*
- Nếu sau khi kết thúc di chuyển (và Boost/Adrenaline), xe của bạn dừng lại ở:
  - **Cùng một ô** (cạnh một xe khác), HOẶC
  - **Ô ngay phía sau** một ô có ít nhất 1 xe khác,
- Bạn được quyền chọn **Slipstream**: tiến thêm **+2 ô miễn phí**.
- **Đặc tính quan trọng của Slipstream**:
  - **KHÔNG cộng vào Speed** khi kiểm tra góc cua (nhưng nếu 2 ô Slipstream đẩy xe vượt qua một vạch góc cua mới, bạn vẫn phải kiểm tra góc cua đó với Speed hiện tại!).
  - Chỉ được Slipstream **1 lần mỗi lượt**.
  - **Không được Slipstream vượt qua Vạch Đích (Finish Line)** ở vòng cuối cùng, và không được dùng xe đã qua đích để Slipstream.

#### Bước 7: Kiểm tra Góc cua (Check Corner)
- Kiểm tra từng **Vạch Góc Cua (Corner Line)** mà xe đã đi qua trong lượt này (tính cả di chuyển chính, Adrenaline, Boost và Slipstream) theo đúng thứ tự đi qua:
- Với mỗi góc cua đã vượt qua:
  - So sánh **Tổng Tốc Độ (`Speed = Lá đã lật + Boost + Adrenaline (+1 nếu dùng)`)** với **Giới hạn tốc độ của góc cua (`Corner Speed Limit`)**. *(Lưu ý: 2 ô từ Slipstream không cộng vào Speed).*
  - Nếu `Speed > Corner Limit`:
    - Người chơi phải trả số lá **Heat từ Engine vào Discard Pile** bằng `Speed - Corner Limit`.
  - **Trượt bánh / Văng xe (Spin Out)**:
    - Nếu số Heat trong Engine **không đủ** để trả mức chênh lệch `Speed - Corner Limit`:
      1. Trả toàn bộ số lá Heat còn lại trong Engine vào Discard Pile.
      2. Đưa xe lùi về **ô trống đầu tiên ngay trước Vạch Góc Cua** gây ra tai nạn.
      3. Rút thêm lá phạt **Stress** từ nguồn chung bỏ thẳng vào **Hand (trên tay)**:
         - Nếu đang ở **Số 1 hoặc Số 2**: Nhận **1 lá Stress** lên tay.
         - Nếu đang ở **Số 3 hoặc Số 4**: Nhận **2 lá Stress** lên tay.
      4. Hạ cần số ngay lập tức về **Số 1 (1st Gear)**.
      5. Kết thúc việc kiểm tra các góc cua tiếp theo.

#### Bước 8: Bỏ bài tùy chọn (Discard)
- Người chơi có thể chọn bỏ bất kỳ số lượng lá bài nào trên tay vào Discard Pile, **NGOẠI TRỪ** các lá **Heat** và **Stress** trên tay (Heat và Stress trên tay không bao giờ được phép tự bỏ ở Bước 8!).

#### Bước 9: Rút bài đầy tay (Replenish Hand)
- Rút bài từ **Draw Deck** cho đến khi có đủ **7 lá trên tay**.
- Nếu Draw Deck hết bài giữa chừng: xáo lại toàn bộ **Discard Pile** để tạo Draw Deck mới rồi rút tiếp cho đủ 7 lá. *(Nếu tổng số bài cả trên tay + deck + discard ít hơn 7 do bị kẹt, rút hết mức có thể).*

---

## 4. Module Legends (Bot Tự Động)

Khi bàn đua có các xe Bot (**Legends**):
- Bot không dùng bộ bài cá nhân hay Heat/Gear mà sử dụng chung **Bộ bài Legends (10 lá)**.
- Mỗi vòng, lật **1 lá Legends** áp dụng cho tất cả xe Bot theo thứ tự lượt đi của chúng:
  - Trên đường đua, trước mỗi góc cua một khoảng có kẻ một **Vạch Legends (Legends Line)** và đánh số khoảng cách đếm ngược về góc cua (`0`, `1`, `2`, `3`...).
  - Trên mỗi lá bài Legends có hiển thị cho từng màu xe Bot 2 thông số:
    1. **Số trong Hình Thoi (Diamond Speed, từ `10` đến `19`)**: Tốc độ chạy đường thẳng kèm một con số nhỏ phía trên (`1`, `2`, hoặc `3`) là vị trí dừng trước cua.
    2. **Số trong Mũ Bảo Hiểm (Corner Modifier, từ `+0` đến `+3`)**: Độ vượt tốc qua cua.
- **Cách Bot di chuyển**:
  - **Trường hợp A — Bot bắt đầu lượt ở PHÍA SAU Vạch Legends** của góc cua sắp tới:
    - Bot cố gắng tiến số ô bằng **Diamond Speed**.
    - Nhưng Bot **không bao giờ được vượt qua Vạch Góc Cua** trong trường hợp này! Nếu Diamond Speed đủ lớn để chạm/vượt góc cua, Bot sẽ thắng lại và dừng ở ô có số khoảng cách trước góc cua bằng **con số nhỏ phía trên hình thoi** (hoặc ô trống gần nhất phía sau ô đó).
  - **Trường hợp B — Bot bắt đầu lượt ở PHÍA TRƯỚC (đã qua) Vạch Legends** của góc cua sắp tới:
    - Bot đang vào cua: tốc độ di chuyển của Bot bằng `Giới hạn tốc độ góc cua (Corner Speed Limit) + Số trong Mũ Bảo Hiểm (+0..+3)`.
    - Nếu bước di chuyển này vô tình chạm tới góc cua thứ 2 kế tiếp, Bot sẽ dừng ngay trước góc cua thứ 2 (tại ô `0` trước góc cua thứ 2).

---

## 5. Kết thúc Cuộc đua & Xếp hạng (Finish Line & Victory)

- Khi một xe đi qua **Vạch Đích (Finish Line)** sau khi hoàn thành đủ số vòng đua quy định (2 vòng cho USA/South Africa/Deutschland):
  - Trong vòng mà xe vượt vạch đích:
    - Xe **không được dùng Slipstream** để vượt qua vạch đích hoặc sau khi đã qua vạch đích.
    - Các góc cua nằm *sau* vạch đích không còn bị kiểm tra tốc độ cho xe đã hoàn thành cuộc đua.
  - Xe tiếp tục đi hết số bước của lượt đó để xác định **khoảng cách vượt qua vạch đích**.
  - Cuối vòng, tất cả các xe đã cán đích trong cùng vòng đó được xếp hạng theo:
    1. Xe đi **xa hơn qua vạch đích** xếp hạng cao hơn.
    2. Nếu bằng nhau (cùng một ô sau vạch đích): Xe nằm ở làn **Race Line** xếp hạng cao hơn.
  - Cuộc đua có thể kết thúc ngay sau vòng mà có xe đầu tiên cán đích (xếp hạng toàn bộ các xe theo vị trí hiện tại trên đường đua), hoặc chạy cho đến khi mọi xe đều cán đích.

---

## 6. Thông số chi tiết các Bản đồ Đường đua (Host Configurable Tracks)

Chủ phòng (Host) có thể chọn bản đồ đường đua trong phần Cấu hình phòng chơi:

### Bản đồ 1: USA (69 ô • 2 Vòng • 4 Góc cua • 6 Heat / 3 Stress)
- **Hướng chạy**: Theo chiều kim đồng hồ (xuất phát ở khúc cong trên bên phải, chạy sang phải xuống dưới).
- **Cấu trúc các chặng (`11 + 21 + 15 + 8 + 14 = 69 ô`)**:
  1. `Vạch Đích → Cua 1 (Giới hạn 7, góc dưới phải)`: **11 ô** (`10 → 0`).
  2. `Cua 1 (7) → Cua 2 (Giới hạn 3, góc dưới trái)`: **21 ô** (`20 → 0`).
  3. `Cua 2 (3) → Cua 3 (Giới hạn 3, đỉnh trên giữa)`: **15 ô** (`14 → 0`).
  4. `Cua 3 (3) → Cua 4 (Giới hạn 2, khúc cua chữ U hẻm núi)`: **8 ô** (`7 → 0`).
  5. `Cua 4 (2) → Vạch Đích`: **14 ô** (`24 → 11`).
- **Đặc trưng**: Đường thẳng dài, góc cua rộng, không có chướng ngại địa hình đặc biệt.

### Bản đồ 2: SOUTH AFRICA (71 ô • 2 Vòng • 7 Góc cua • 7 Heat / 3 Stress)
- **Hướng chạy**: Theo chiều kim đồng hồ (xuất phát ở đoạn thẳng đáy bản đồ, chạy sang trái).
- **Cơ chế đặc biệt — Sỏi đá (Gravel / Mặt đường nâu)**:
  - Nếu xe **kết thúc lượt di chuyển trên ô Sỏi đá (Gravel)**, người chơi phải **trả 1 lá Heat từ Engine vào Discard Pile** (nếu Engine còn ít nhất 1 Heat; nếu Engine đã hết Heat thì bỏ qua, không bị Spin Out). Bù lại tay đua khởi đầu với **7 lá Heat** trong Engine.
- **Cấu trúc các chặng (`7 + 7 + 8 + 11 + 13 + 10 + 9 + 6 = 71 ô`)**:
  1. `Vạch Đích → Cua 1 (Giới hạn 4, góc dưới trái)`: **7 ô** (`6 → 0`, có Gravel ở các ô `2, 1, 0`).
  2. `Cua 1 (4) → Cua 2 (Giới hạn 3, giữa trái)`: **7 ô** (`6 → 0`, có Gravel ở các ô `3, 2, 1, 0`).
  3. `Cua 2 (3) → Cua 3 (Giới hạn 2, cua gắt chữ U giữa dưới)`: **8 ô** (`7 → 0`, có Gravel ở `6, 5` và `2, 1, 0`).
  4. `Cua 3 (2) → Cua 4 (Giới hạn 6, vòng cung đỉnh trên)`: **11 ô** (`10 → 0`).
  5. `Cua 4 (6) → Cua 5 (Giới hạn 5, vòng cung giữa dưới)`: **13 ô** (`12 → 0`).
  6. `Cua 5 (5) → Cua 6 (Giới hạn 2, đỉnh trên phải)`: **10 ô** (`9 → 0`, có Gravel ở `9, 8` và `4, 3, 2, 1, 0`).
  7. `Cua 6 (2) → Cua 7 (Giới hạn 4, góc dưới phải)`: **9 ô** (`8 → 0`, có Gravel ở `8, 7`).
  8. `Cua 7 (4) → Vạch Đích`: **6 ô** (`12 → 7`).

### Bản đồ 3: DEUTSCHLAND (62 ô • 2 Vòng • 6 Góc cua • 5 Heat / 3 Stress)
- **Hướng chạy**: Theo chiều kim đồng hồ (xuất phát ở đoạn thẳng trung tâm, chạy sang trái lên góc trên trái).
- **Cơ chế đặc biệt — Chicane (Cua kép Gờ Xanh-Trắng `2` – `2`) & Động cơ 5 Heat**:
  - Người chơi chỉ khởi đầu với **5 lá Heat** trong Engine.
  - Ở đỉnh trên bản đồ có cụm **Chicane** gồm 2 vạch góc cua liên tiếp cùng giới hạn tốc độ **`2`** cách nhau đúng **2 ô** (viền gờ giảm tốc màu **Xanh dương - Trắng**). Mỗi vạch cua trong Chicane đều được kiểm tra tốc độ độc lập ở Bước 7; ô `0` trước Chicane có ký hiệu **Chevron (`>>`)** cho Bot Legends.
- **Cấu trúc các chặng (`10 + 12 + 2 + 16 + 7 + 7 + 8 = 62 ô`)**:
  1. `Vạch Đích → Cua 1 (Giới hạn 5, góc trên trái)`: **10 ô** (`9 → 0`).
  2. `Cua 1 (5) → Cua 2 (Chicane vào - Giới hạn 2, đỉnh trên giữa)`: **12 ô** (`11 → 0`, ô `0` có Chevron `>>`).
  3. `Cua 2 (2) → Cua 3 (Chicane ra - Giới hạn 2, đỉnh trên giữa)`: **2 ô** (`1 → 0`, viền gờ Xanh-Trắng).
  4. `Cua 3 (2) → Cua 4 (Giới hạn 6, góc dưới phải)`: **16 ô** (`15 → 0`, đoạn thẳng dài dọc bờ sông).
  5. `Cua 4 (6) → Cua 5 (Giới hạn 4, đáy giữa)`: **7 ô** (`6 → 0`).
  6. `Cua 5 (4) → Cua 6 (Giới hạn 4, cua chữ U trong sân vận động)`: **7 ô** (`6 → 0`).
  7. `Cua 6 (4) → Vạch Đích`: **8 ô** (`17 → 10`).

